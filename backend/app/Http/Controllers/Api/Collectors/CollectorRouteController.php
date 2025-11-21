<?php

namespace App\Http\Controllers\Api\Collectors;

use App\Http\Controllers\Controller;
use App\Models\Route;
use App\Models\RouteAssignment;
use App\Models\RouteStop;
use App\Models\WasteBin;
use App\Models\QrCollection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;

class CollectorRouteController extends Controller
{
    /**
     * Get today's assigned routes for the authenticated collector
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getTodayAssignments()
    {
        try {
            $collectorId = Auth::guard('collector')->id();
            
            if (!$collectorId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            $today = Carbon::today();

            $assignments = RouteAssignment::with('route:id,route_name,barangay,total_stops,estimated_duration')
                ->where('collector_id', $collectorId)
                ->whereDate('assignment_date', $today)
                ->whereHas('route')
                ->orderBy('assignment_date', 'desc')
                ->get()
                ->map(function ($assignment) {
                    return [
                        'id' => $assignment->id,
                        'assignment_date' => $assignment->assignment_date->format('Y-m-d'),
                        'status' => $assignment->status,
                        'route' => [
                            'id' => $assignment->route->id,
                            'name' => $assignment->route->route_name,
                            'route_name' => $assignment->route->route_name,
                            'barangay' => $assignment->route->barangay,
                            'total_stops' => $assignment->route->total_stops ?? 0,
                            'estimated_duration' => $assignment->route->estimated_duration,
                        ],
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Today\'s assignments retrieved successfully',
                'data' => $assignments
            ], 200);

        } catch (\Exception $e) {
            Log::error('getTodayAssignments error: ' . $e->getMessage(), [
                'collector_id' => $collectorId ?? null,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve assignments',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Get detailed information about a specific route assignment
     * 
     * @param int $assignmentId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getRouteDetails($assignmentId)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            if (!$collectorId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            $assignment = RouteAssignment::with([
                'route.stops' => function ($query) {
                    $query->with(['bin.resident'])
                        ->orderBy('stop_order', 'asc');
                },
                'schedule',
                'qrCollections' => function ($query) {
                    $query->whereIn('collection_status', ['collected', 'completed', 'manual', 'successful']);
                }
            ])
            ->where('id', $assignmentId)
            ->where('collector_id', $collectorId)
            ->first();

            if (!$assignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Route assignment not found'
                ], 404);
            }

            if (!$assignment->route) {
                return response()->json([
                    'success' => false,
                    'message' => 'Route not found for this assignment'
                ], 404);
            }

            // Get all successful collections for this assignment
            $collections = $assignment->qrCollections()
                ->whereIn('collection_status', ['collected', 'completed', 'manual', 'successful'])
                ->get();

            // Create a map of bin_id => collection for quick lookup
            $collectionsByBinId = $collections->keyBy('bin_id');
            
            // Get all collected bin IDs
            $collectedBinIds = $collections->pluck('bin_id')->filter()->unique()->values()->all();

            // Map stops and determine completion
            $routeStops = $assignment->route->stops ?? collect([]);

            $stops = $routeStops->map(function ($stop) use ($collectedBinIds, $collectionsByBinId) {
                // Get bin_id from stop
                $stopBinId = $stop->bin_id;
                
                // Check if this stop's bin has been collected
                $isCompleted = $stopBinId && in_array($stopBinId, $collectedBinIds);
                
                // Get the collection record if completed
                $collection = $isCompleted && $stopBinId 
                    ? $collectionsByBinId->get($stopBinId) 
                    : null;
                
                // Get bin and resident info
                $bin = $stop->bin;
                $resident = $bin?->resident;
                
                // If no bin relationship loaded but we have bin_id, try to load it
                if ($stopBinId && !$bin) {
                    $bin = WasteBin::with('resident')->find($stopBinId);
                    $resident = $bin?->resident;
                }
                
                // Format resident name - Resident model uses 'name' field
                $residentName = null;
                if ($resident) {
                    $residentName = $resident->name ?? null;
                }
                
                return [
                    'id' => $stop->id,
                    'stop_order' => $stop->stop_order,
                    'address' => $stop->stop_address,
                    'latitude' => $stop->latitude ? (string) $stop->latitude : null,
                    'longitude' => $stop->longitude ? (string) $stop->longitude : null,
                    'estimated_time' => $stop->estimated_time,
                    'notes' => $stop->notes,
                    'is_completed' => $isCompleted,
                    'bin_id' => $stopBinId,
                    'qr_code' => $bin?->qr_code,
                    'bin_type' => $bin?->bin_type,
                    'bin_owner_name' => $residentName,
                    'bin_owner_contact' => $resident?->phone_number ?? null,
                    'bin_owner_address' => $resident?->full_address ?? $resident?->address ?? null,
                    'last_collected_at' => $collection?->collection_timestamp?->format('Y-m-d H:i:s') 
                        ?? $bin?->last_collected?->format('Y-m-d H:i:s'),
                ];
            });

            $completedCount = $stops->where('is_completed', true)->count();

            return response()->json([
                'success' => true,
                'message' => 'Route details retrieved successfully',
                'data' => [
                    'id' => $assignment->id,
                    'assignment_date' => $assignment->assignment_date->format('Y-m-d'),
                    'status' => $assignment->status,
                    'start_time' => $assignment->start_time?->format('Y-m-d H:i:s'),
                    'end_time' => $assignment->end_time?->format('Y-m-d H:i:s'),
                    'route' => [
                        'id' => $assignment->route->id,
                        'name' => $assignment->route->route_name,
                        'route_name' => $assignment->route->route_name,
                        'barangay' => $assignment->route->barangay,
                        'total_stops' => $assignment->route->total_stops,
                        'estimated_duration' => $assignment->route->estimated_duration,
                    ],
                    'schedule' => $assignment->schedule ? [
                        'collection_day' => $assignment->schedule->collection_day,
                        'collection_time' => $assignment->schedule->collection_time,
                        'frequency' => $assignment->schedule->frequency,
                    ] : null,
                    'stops' => $stops->values()->all(),
                    'progress' => [
                        'completed' => $completedCount,
                        'total' => $stops->count(),
                        'percentage' => $stops->count() > 0 ? round(($completedCount / $stops->count()) * 100) : 0,
                    ],
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('getRouteDetails error: ' . $e->getMessage(), [
                'assignment_id' => $assignmentId,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve route details',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    // ... rest of the methods remain the same ...
    
    /**
     * Get all assignments with optional filters
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAllAssignments(Request $request)
    {
        try {
            $collectorId = Auth::guard('collector')->id();
            
            if (!$collectorId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }
            
            $query = RouteAssignment::with('route:id,route_name,barangay,total_stops,estimated_duration')
                ->where('collector_id', $collectorId)
                ->whereHas('route');

            // Apply filters
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }
            if ($request->has('start_date')) {
                $query->whereDate('assignment_date', '>=', $request->start_date);
            }
            if ($request->has('end_date')) {
                $query->whereDate('assignment_date', '<=', $request->end_date);
            }
            if ($request->has('barangay')) {
                $query->whereHas('route', function ($q) use ($request) {
                    $q->where('barangay', $request->barangay);
                });
            }

            $perPage = $request->get('per_page', 50);
            $assignments = $query->orderBy('assignment_date', 'desc')->paginate($perPage);

            // Transform data
            $transformedData = $assignments->getCollection()->map(function ($assignment) {
                return [
                    'id' => $assignment->id,
                    'assignment_date' => $assignment->assignment_date->format('Y-m-d'),
                    'status' => $assignment->status,
                    'route' => [
                        'id' => $assignment->route->id,
                        'name' => $assignment->route->route_name,
                        'route_name' => $assignment->route->route_name,
                        'barangay' => $assignment->route->barangay,
                        'total_stops' => $assignment->route->total_stops ?? 0,
                        'estimated_duration' => $assignment->route->estimated_duration,
                    ],
                ];
            })->values();

            // Return paginated response
            $responseData = [
                'data' => $transformedData,
                'current_page' => $assignments->currentPage(),
                'last_page' => $assignments->lastPage(),
                'per_page' => $assignments->perPage(),
                'total' => $assignments->total(),
                'from' => $assignments->firstItem(),
                'to' => $assignments->lastItem(),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Assignments retrieved successfully',
                'data' => $responseData
            ], 200);

        } catch (\Exception $e) {
            Log::error('getAllAssignments error: ' . $e->getMessage(), [
                'collector_id' => $collectorId ?? null,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve assignments',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }
}
