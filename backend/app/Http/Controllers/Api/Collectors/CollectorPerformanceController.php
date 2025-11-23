<?php

namespace App\Http\Controllers\Api\Collectors;

use App\Http\Controllers\Controller;
use App\Models\QrCollection;
use App\Models\RouteStop;
use App\Models\RouteAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CollectorPerformanceController extends Controller
{
    /**
     * Get performance summary/overview
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPerformanceSummary()
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            // Collections today
            $todayCollections = QrCollection::where('collector_id', $collectorId)
                ->whereIn('collection_status', ['collected', 'completed'])
                ->whereDate('collection_timestamp', Carbon::today())
                ->count();

            // Collections this week
            $thisWeekCollections = QrCollection::where('collector_id', $collectorId)
                ->whereIn('collection_status', ['collected', 'completed'])
                ->whereBetween('collection_timestamp', [
                    Carbon::now()->startOfWeek(),
                    Carbon::now()->endOfWeek()
                ])
                ->count();

            // Collections this month
            $thisMonthCollections = QrCollection::where('collector_id', $collectorId)
                ->whereIn('collection_status', ['collected', 'completed'])
                ->whereMonth('collection_timestamp', Carbon::now()->month)
                ->whereYear('collection_timestamp', Carbon::now()->year)
                ->count();

            return response()->json([
                'success' => true,
                'message' => 'Performance summary retrieved successfully',
                'data' => [
                    'recent_activity' => [
                        'today' => $todayCollections,
                        'this_week' => $thisWeekCollections,
                        'this_month' => $thisMonthCollections,
                    ],
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve performance summary',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Get completed route stops history with collection details
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCollectionHistory(Request $request)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            if (!$collectorId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            // Query route stops that have been collected by this collector
            // Get all route stops that:
            // 1. Belong to routes assigned to this collector
            // 2. Have bins that were collected by this collector
            $query = RouteStop::with([
                'route',
                'bin.resident'
            ])
            ->whereHas('route.assignments', function ($q) use ($collectorId) {
                $q->where('collector_id', $collectorId);
            })
            ->whereNotNull('bin_id')
            ->whereHas('bin.qrCollections', function ($q) use ($collectorId) {
                $q->where('collector_id', $collectorId)
                  ->whereIn('collection_status', ['collected', 'completed', 'manual', 'successful']);
            });

            // Filter by assignment status
            if ($request->has('status') && $request->status !== 'all') {
                if ($request->status === 'completed') {
                    // Show stops from completed assignments
                    $query->whereHas('route.assignments', function ($q) use ($collectorId) {
                        $q->where('collector_id', $collectorId)
                          ->where('status', 'completed');
                    });
                }
            }

            // Search functionality
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('stop_address', 'like', "%{$search}%")
                      ->orWhereHas('bin', function ($q) use ($search) {
                          $q->where('name', 'like', "%{$search}%")
                            ->orWhere('qr_code', 'like', "%{$search}%");
                      })
                      ->orWhereHas('route', function ($q) use ($search) {
                          $q->where('route_name', 'like', "%{$search}%");
                      })
                      ->orWhereHas('bin.resident', function ($q) use ($search) {
                          $q->where('name', 'like', "%{$search}%");
                      });
                });
            }

            // Filter by date range (based on collection timestamp)
            if ($request->has('start_date') || $request->has('end_date')) {
                $query->whereHas('bin.qrCollections', function ($q) use ($collectorId, $request) {
                    $q->where('collector_id', $collectorId)
                      ->whereIn('collection_status', ['collected', 'completed', 'manual', 'successful']);
                    
                    if ($request->has('start_date')) {
                        $q->whereDate('collection_timestamp', '>=', $request->start_date);
                    }
                    if ($request->has('end_date')) {
                        $q->whereDate('collection_timestamp', '<=', $request->end_date);
                    }
                });
            }

            $routeStops = $query->orderBy('created_at', 'desc')
                ->paginate($request->input('per_page', 100));

            $routeStops->getCollection()->transform(function ($routeStop) use ($collectorId) {
                $route = $routeStop->route;
                $bin = $routeStop->bin;
                $resident = $bin?->resident;

                // Get the collection record for this stop
                $collection = null;
                if ($bin) {
                    $collection = QrCollection::where('bin_id', $bin->id)
                        ->where('collector_id', $collectorId)
                        ->whereIn('collection_status', ['collected', 'completed', 'manual', 'successful'])
                        ->orderBy('collection_timestamp', 'desc')
                        ->first();
                }

                // Get assignment for this route stop
                $assignment = null;
                if ($route && $collection) {
                    $assignment = RouteAssignment::where('route_id', $route->id)
                        ->where('collector_id', $collectorId)
                        ->where('id', $collection->assignment_id)
                        ->first();
                }

                return [
                    // Route Stop Details (Primary)
                    'id' => $routeStop->id,
                    'stop_order' => $routeStop->stop_order,
                    'stop_address' => $routeStop->stop_address,
                    'latitude' => $routeStop->latitude,
                    'longitude' => $routeStop->longitude,
                    'estimated_time' => $routeStop->estimated_time?->format('H:i'),
                    'notes' => $routeStop->notes,
                    // Route Details
                    'route' => $route ? [
                        'id' => $route->id,
                        'route_name' => $route->route_name,
                        'barangay' => $route->barangay,
                        'total_stops' => $route->total_stops,
                        'estimated_duration' => $route->estimated_duration,
                    ] : null,
                    // Bin Details
                    'bin' => $bin ? [
                        'id' => $bin->id,
                        'name' => $bin->name,
                        'qr_code' => $bin->qr_code,
                        'bin_type' => $bin->bin_type,
                        'status' => $bin->status,
                    ] : null,
                    // Resident Details
                    'resident' => $resident ? [
                        'id' => $resident->id,
                        'name' => $resident->name,
                        'address' => $resident->full_address ?? $resident->address,
                        'phone' => $resident->phone,
                    ] : null,
                    // Collection Details
                    'collection' => $collection ? [
                        'id' => $collection->id,
                        'qr_code' => $collection->qr_code,
                        'collection_timestamp' => $collection->collection_timestamp->format('Y-m-d H:i:s'),
                        'collection_date' => $collection->collection_timestamp->format('M d, Y'),
                        'collection_time' => $collection->collection_timestamp->format('h:i A'),
                        'waste_weight' => (float) $collection->waste_weight,
                        'waste_type' => $collection->waste_type ?? 'mixed',
                        'collection_status' => $collection->collection_status,
                        'is_verified' => $collection->is_verified ?? false,
                        'notes' => $collection->notes,
                        'latitude' => $collection->latitude,
                        'longitude' => $collection->longitude,
                    ] : null,
                    // Assignment Details
                    'assignment' => $assignment ? [
                        'id' => $assignment->id,
                        'assignment_date' => $assignment->assignment_date->format('Y-m-d'),
                        'status' => $assignment->status,
                        'start_time' => $assignment->start_time?->format('Y-m-d H:i:s'),
                        'end_time' => $assignment->end_time?->format('Y-m-d H:i:s'),
                    ] : null,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Route stops history retrieved successfully',
                'data' => $routeStops
            ], 200);

        } catch (\Exception $e) {
            Log::error('getCollectionHistory error: ' . $e->getMessage(), [
                'collector_id' => $collectorId ?? null,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve route stops history',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }
}
