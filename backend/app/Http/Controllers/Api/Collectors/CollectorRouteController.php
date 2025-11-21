<?php

namespace App\Http\Controllers\Api\Collectors;

use App\Http\Controllers\Controller;
use App\Models\Route;
use App\Models\RouteAssignment;
use App\Models\RouteStop;
use App\Models\WasteBin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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

            $assignments = RouteAssignment::with([
                'route:id,route_name,barangay,start_location,end_location,total_stops,estimated_duration',
                'schedule:id,collection_day,collection_time,frequency'
            ])
            ->where('collector_id', $collectorId)
            ->whereDate('assignment_date', $today)
            ->orderBy('assignment_date', 'desc')
            ->get()
            ->filter(function ($assignment) {
                return $assignment->route !== null;
            })
            ->map(function ($assignment) {
                // Get unique bin IDs that have been collected for this assignment
                $collectedBinIds = $assignment->qrCollections()
                    ->whereIn('collection_status', ['collected', 'completed', 'manual', 'successful'])
                    ->pluck('bin_id')
                    ->filter()
                    ->unique()
                    ->values()
                    ->all();
                
                $completedStops = count($collectedBinIds);
                
                return [
                    'id' => $assignment->id,
                    'assignment_date' => $assignment->assignment_date->format('Y-m-d'),
                    'status' => $assignment->status,
                    'start_time' => $assignment->start_time?->format('Y-m-d H:i:s'),
                    'end_time' => $assignment->end_time?->format('Y-m-d H:i:s'),
                    'notes' => $assignment->notes,
                    'route' => [
                        'id' => $assignment->route->id,
                        'name' => $assignment->route->route_name,
                        'route_name' => $assignment->route->route_name,
                        'barangay' => $assignment->route->barangay,
                        'start_location' => $assignment->route->start_location,
                        'end_location' => $assignment->route->end_location,
                        'total_stops' => $assignment->route->total_stops ?? 0,
                        'estimated_duration' => $assignment->route->estimated_duration,
                    ],
                    'schedule' => $assignment->schedule ? [
                        'collection_day' => $assignment->schedule->collection_day,
                        'collection_time' => $assignment->schedule->collection_time,
                        'frequency' => $assignment->schedule->frequency,
                    ] : null,
                    'completed_stops' => $completedStops,
                    'total_stops' => $assignment->route->total_stops ?? 0,
                ];
            })
            ->values();

            return response()->json([
                'success' => true,
                'message' => 'Today\'s assignments retrieved successfully',
                'data' => $assignments
            ], 200);

        } catch (\Exception $e) {
            \Log::error('getTodayAssignments error: ' . $e->getMessage(), [
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
            \Log::error('getRouteDetails error: ' . $e->getMessage(), [
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
            
            $query = RouteAssignment::with([
                'route:id,route_name,barangay,start_location,end_location,total_stops',
                'schedule:id,collection_day,collection_time,frequency'
            ])
            ->where('collector_id', $collectorId);

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
            $assignments = $query->orderBy('assignment_date', 'desc')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Assignments retrieved successfully',
                'data' => $assignments
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve assignments',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get assignment summary statistics
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAssignmentSummary()
    {
        try {
            $collectorId = Auth::guard('collector')->id();
            $today = Carbon::today();

            $summary = [
                'today' => [
                    'total' => RouteAssignment::where('collector_id', $collectorId)
                        ->whereDate('assignment_date', $today)
                        ->count(),
                    'completed' => RouteAssignment::where('collector_id', $collectorId)
                        ->whereDate('assignment_date', $today)
                        ->where('status', 'completed')
                        ->count(),
                    'in_progress' => RouteAssignment::where('collector_id', $collectorId)
                        ->whereDate('assignment_date', $today)
                        ->where('status', 'in-progress')
                        ->count(),
                ],
                'upcoming' => RouteAssignment::where('collector_id', $collectorId)
                    ->whereDate('assignment_date', '>', $today)
                    ->count(),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Assignment summary retrieved successfully',
                'data' => $summary
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve assignment summary',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get upcoming assignments (next 7 days)
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUpcomingAssignments()
    {
        try {
            $collectorId = Auth::guard('collector')->id();
            $today = Carbon::today();
            $nextWeek = Carbon::today()->addDays(7);

            $assignments = RouteAssignment::with([
                'route:id,route_name,barangay,start_location,end_location,total_stops',
                'schedule:id,collection_day,collection_time,frequency'
            ])
            ->where('collector_id', $collectorId)
            ->whereBetween('assignment_date', [$today, $nextWeek])
            ->orderBy('assignment_date', 'asc')
            ->get()
            ->map(function ($assignment) {
                return [
                    'id' => $assignment->id,
                    'assignment_date' => $assignment->assignment_date->format('Y-m-d'),
                    'status' => $assignment->status,
                    'route' => [
                        'id' => $assignment->route->id,
                        'name' => $assignment->route->route_name,
                        'barangay' => $assignment->route->barangay,
                        'total_stops' => $assignment->route->total_stops,
                    ],
                    'schedule' => $assignment->schedule ? [
                        'collection_day' => $assignment->schedule->collection_day,
                        'collection_time' => $assignment->schedule->collection_time,
                    ] : null,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Upcoming assignments retrieved successfully',
                'data' => $assignments
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve upcoming assignments',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all stops for a specific route
     * 
     * @param int $routeId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getRouteStops($routeId)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $route = Route::with(['stops.bin.resident'])
                ->where('id', $routeId)
                ->first();

            if (!$route) {
                return response()->json([
                    'success' => false,
                    'message' => 'Route not found'
                ], 404);
            }

            $stops = $route->stops->map(function ($stop) {
                return [
                    'id' => $stop->id,
                    'stop_order' => $stop->stop_order,
                    'address' => $stop->stop_address,
                    'latitude' => $stop->latitude,
                    'longitude' => $stop->longitude,
                    'bin_id' => $stop->bin_id,
                    'bin' => $stop->bin ? [
                        'id' => $stop->bin->id,
                        'qr_code' => $stop->bin->qr_code,
                        'bin_type' => $stop->bin->bin_type,
                    ] : null,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Route stops retrieved successfully',
                'data' => $stops
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve route stops',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get navigation details for route
     * 
     * @param int $assignmentId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getRouteNavigation($assignmentId)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $assignment = RouteAssignment::with('route.stops')
                ->where('id', $assignmentId)
                ->where('collector_id', $collectorId)
                ->first();

            if (!$assignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Route assignment not found'
                ], 404);
            }

            $stops = $assignment->route->stops
                ->sortBy('stop_order')
                ->map(function ($stop) {
                    return [
                        'id' => $stop->id,
                        'stop_order' => $stop->stop_order,
                        'address' => $stop->stop_address,
                        'latitude' => $stop->latitude,
                        'longitude' => $stop->longitude,
                    ];
                })
                ->values();

            return response()->json([
                'success' => true,
                'message' => 'Navigation details retrieved successfully',
                'data' => [
                    'route_id' => $assignment->route->id,
                    'route_name' => $assignment->route->route_name,
                    'stops' => $stops,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve navigation details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Start route collection (mark as in-progress)
     * 
     * @param int $assignmentId
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function startRoute($assignmentId, Request $request)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $assignment = RouteAssignment::where('id', $assignmentId)
                ->where('collector_id', $collectorId)
                ->first();

            if (!$assignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Route assignment not found'
                ], 404);
            }

            if ($assignment->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Route must be pending before it can be started'
                ], 400);
            }

            $assignment->update([
                'status' => 'in-progress',
                'start_time' => Carbon::now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Route started successfully',
                'data' => [
                    'id' => $assignment->id,
                    'status' => $assignment->status,
                    'start_time' => $assignment->start_time->format('Y-m-d H:i:s'),
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to start route',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Pause route (for breaks)
     * 
     * @param int $assignmentId
     * @return \Illuminate\Http\JsonResponse
     */
    public function pauseRoute($assignmentId)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $assignment = RouteAssignment::where('id', $assignmentId)
                ->where('collector_id', $collectorId)
                ->first();

            if (!$assignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Route assignment not found'
                ], 404);
            }

            if ($assignment->status !== 'in-progress') {
                return response()->json([
                    'success' => false,
                    'message' => 'Route must be in progress before it can be paused'
                ], 400);
            }

            $assignment->update([
                'status' => 'paused',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Route paused successfully',
                'data' => [
                    'id' => $assignment->id,
                    'status' => $assignment->status,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to pause route',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resume paused route
     * 
     * @param int $assignmentId
     * @return \Illuminate\Http\JsonResponse
     */
    public function resumeRoute($assignmentId)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $assignment = RouteAssignment::where('id', $assignmentId)
                ->where('collector_id', $collectorId)
                ->first();

            if (!$assignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Route assignment not found'
                ], 404);
            }

            if ($assignment->status !== 'paused') {
                return response()->json([
                    'success' => false,
                    'message' => 'Route must be paused before it can be resumed'
                ], 400);
            }

            $assignment->update([
                'status' => 'in-progress',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Route resumed successfully',
                'data' => [
                    'id' => $assignment->id,
                    'status' => $assignment->status,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to resume route',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark route assignment as completed
     * 
     * @param int $assignmentId
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function completeRoute($assignmentId, Request $request)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $assignment = RouteAssignment::with('route')
                ->where('id', $assignmentId)
                ->where('collector_id', $collectorId)
                ->first();

            if (!$assignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Route assignment not found'
                ], 404);
            }

            // Check if route is in progress
            if ($assignment->status !== 'in-progress') {
                return response()->json([
                    'success' => false,
                    'message' => 'Route must be in progress before it can be completed'
                ], 400);
            }

            // Optional: Validate if all stops are completed
            $completedStops = $assignment->qrCollections()
                ->whereIn('collection_status', ['collected', 'completed', 'manual', 'successful'])
                ->count();
            
            $totalStops = $assignment->route->total_stops;

            $assignment->update([
                'status' => 'completed',
                'end_time' => Carbon::now(),
                'notes' => $request->input('notes', $assignment->notes),
            ]);

            // Calculate duration
            $duration = null;
            if ($assignment->start_time && $assignment->end_time) {
                $duration = $assignment->start_time->diffInMinutes($assignment->end_time);
            }

            return response()->json([
                'success' => true,
                'message' => 'Route completed successfully',
                'data' => [
                    'id' => $assignment->id,
                    'status' => $assignment->status,
                    'start_time' => $assignment->start_time?->format('Y-m-d H:i:s'),
                    'end_time' => $assignment->end_time->format('Y-m-d H:i:s'),
                    'duration_minutes' => $duration,
                    'completed_stops' => $completedStops,
                    'total_stops' => $totalStops,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to complete route',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Report issue during route (vehicle breakdown, road closure, etc.)
     * 
     * @param int $assignmentId
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function reportIssue($assignmentId, Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'issue_type' => 'required|string|in:vehicle_breakdown,road_closure,weather,other',
                'description' => 'required|string|max:500',
                'latitude' => 'nullable|numeric|between:-90,90',
                'longitude' => 'nullable|numeric|between:-180,180',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $collectorId = Auth::guard('collector')->id();

            $assignment = RouteAssignment::where('id', $assignmentId)
                ->where('collector_id', $collectorId)
                ->first();

            if (!$assignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Route assignment not found'
                ], 404);
            }

            // Update assignment notes with issue report
            $issueNote = sprintf(
                "[ISSUE REPORT - %s] %s: %s",
                Carbon::now()->format('Y-m-d H:i:s'),
                $request->issue_type,
                $request->description
            );

            $existingNotes = $assignment->notes ?? '';
            $assignment->update([
                'notes' => $existingNotes ? $existingNotes . "\n\n" . $issueNote : $issueNote,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Issue reported successfully',
                'data' => [
                    'id' => $assignment->id,
                    'issue_type' => $request->issue_type,
                    'reported_at' => Carbon::now()->format('Y-m-d H:i:s'),
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to report issue',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
