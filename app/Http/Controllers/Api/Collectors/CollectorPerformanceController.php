<?php

namespace App\Http\Controllers\Api\Collectors;

use App\Http\Controllers\Controller;
use App\Models\QrCollection;
use App\Models\RouteAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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

            // Total collections
            $totalCollections = QrCollection::where('collector_id', $collectorId)
                ->whereIn('collection_status', ['collected', 'completed'])
                ->count();

            // Total weight collected
            $totalWeight = QrCollection::where('collector_id', $collectorId)
                ->whereIn('collection_status', ['collected', 'completed'])
                ->sum('waste_weight');

            // Total routes completed
            $completedRoutes = RouteAssignment::where('collector_id', $collectorId)
                ->where('status', 'completed')
                ->count();

            // Collections this month
            $thisMonthCollections = QrCollection::where('collector_id', $collectorId)
                ->whereIn('collection_status', ['collected', 'completed'])
                ->whereMonth('collection_timestamp', Carbon::now()->month)
                ->whereYear('collection_timestamp', Carbon::now()->year)
                ->count();

            // Collections this week
            $thisWeekCollections = QrCollection::where('collector_id', $collectorId)
                ->whereIn('collection_status', ['collected', 'completed'])
                ->whereBetween('collection_timestamp', [
                    Carbon::now()->startOfWeek(),
                    Carbon::now()->endOfWeek()
                ])
                ->count();

            // Collections today
            $todayCollections = QrCollection::where('collector_id', $collectorId)
                ->whereIn('collection_status', ['collected', 'completed'])
                ->whereDate('collection_timestamp', Carbon::today())
                ->count();

            // Average collections per route
            $avgCollectionsPerRoute = $completedRoutes > 0 
                ? round($totalCollections / $completedRoutes, 2) 
                : 0;

            // Completion rate (completed vs total assigned routes)
            $totalAssignments = RouteAssignment::where('collector_id', $collectorId)->count();
            $completionRate = $totalAssignments > 0 
                ? round(($completedRoutes / $totalAssignments) * 100, 2) 
                : 0;

            // Skip rate
            $totalSkipped = QrCollection::where('collector_id', $collectorId)
                ->where('collection_status', 'skipped')
                ->count();
            $totalAttempts = $totalCollections + $totalSkipped;
            $skipRate = $totalAttempts > 0 
                ? round(($totalSkipped / $totalAttempts) * 100, 2) 
                : 0;

            // Verification rate
            $verifiedCollections = QrCollection::where('collector_id', $collectorId)
                ->whereIn('collection_status', ['collected', 'completed'])
                ->where('is_verified', true)
                ->count();
            $verificationRate = $totalCollections > 0 
                ? round(($verifiedCollections / $totalCollections) * 100, 2) 
                : 0;

            // Average weight per collection
            $avgWeightPerCollection = $totalCollections > 0 
                ? round($totalWeight / $totalCollections, 2) 
                : 0;

            return response()->json([
                'success' => true,
                'message' => 'Performance summary retrieved successfully',
                'data' => [
                    'overview' => [
                        'total_collections' => $totalCollections,
                        'total_weight_kg' => (float) $totalWeight,
                        'completed_routes' => $completedRoutes,
                        'total_assignments' => $totalAssignments,
                    ],
                    'recent_activity' => [
                        'today' => $todayCollections,
                        'this_week' => $thisWeekCollections,
                        'this_month' => $thisMonthCollections,
                    ],
                    'performance_metrics' => [
                        'avg_collections_per_route' => $avgCollectionsPerRoute,
                        'completion_rate' => $completionRate,
                        'skip_rate' => $skipRate,
                        'verification_rate' => $verificationRate,
                        'avg_weight_per_collection_kg' => $avgWeightPerCollection,
                    ],
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve performance summary',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get collection history with filters
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCollectionHistory(Request $request)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $query = QrCollection::with([
                'wasteBin:id,qr_code,bin_type',
                'wasteBin.resident:id,name,house_no,street,barangay',
                'assignment.route:id,route_name,barangay'
            ])
            ->where('collector_id', $collectorId);

            // Filter by status
            if ($request->has('status')) {
                $query->where('collection_status', $request->status);
            } else {
                // Default: show completed and collected
                $query->whereIn('collection_status', ['collected', 'completed']);
            }

            // Filter by waste type
            if ($request->has('waste_type')) {
                $query->where('waste_type', $request->waste_type);
            }

            // Filter by date range
            if ($request->has('start_date')) {
                $query->whereDate('collection_timestamp', '>=', $request->start_date);
            }
            if ($request->has('end_date')) {
                $query->whereDate('collection_timestamp', '<=', $request->end_date);
            }

            // Filter by month/year
            if ($request->has('month') && $request->has('year')) {
                $query->whereMonth('collection_timestamp', $request->month)
                      ->whereYear('collection_timestamp', $request->year);
            }

            // Search by QR code or address
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('qr_code', 'like', "%{$search}%")
                      ->orWhereHas('wasteBin.resident', function ($q2) use ($search) {
                          $q2->where('name', 'like', "%{$search}%")
                             ->orWhere('street', 'like', "%{$search}%")
                             ->orWhere('barangay', 'like', "%{$search}%");
                      });
                });
            }

            $collections = $query->orderBy('collection_timestamp', 'desc')
                ->paginate($request->input('per_page', 20));

            $collections->getCollection()->transform(function ($collection) {
                return [
                    'id' => $collection->id,
                    'qr_code' => $collection->qr_code,
                    'collection_timestamp' => $collection->collection_timestamp->format('Y-m-d H:i:s'),
                    'collection_date' => $collection->collection_timestamp->format('M d, Y'),
                    'collection_time' => $collection->collection_timestamp->format('h:i A'),
                    'waste_weight' => (float) $collection->waste_weight,
                    'waste_type' => $collection->waste_type,
                    'collection_status' => $collection->collection_status,
                    'is_verified' => $collection->is_verified,
                    'has_photo' => !is_null($collection->photo_url),
                    'route' => [
                        'name' => $collection->assignment->route->route_name,
                        'barangay' => $collection->assignment->route->barangay,
                    ],
                    'resident' => [
                        'name' => $collection->wasteBin->resident->name,
                        'address' => $collection->wasteBin->resident->house_no . ' ' . 
                                   $collection->wasteBin->resident->street . ', ' . 
                                   $collection->wasteBin->resident->barangay,
                    ],
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Collection history retrieved successfully',
                'data' => $collections
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve collection history',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get completed routes history
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCompletedRoutes(Request $request)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $query = RouteAssignment::with([
                'route:id,route_name,barangay,total_stops',
                'qrCollections'
            ])
            ->where('collector_id', $collectorId)
            ->where('status', 'completed');

            // Filter by date range
            if ($request->has('start_date')) {
                $query->whereDate('assignment_date', '>=', $request->start_date);
            }
            if ($request->has('end_date')) {
                $query->whereDate('assignment_date', '<=', $request->end_date);
            }

            // Filter by month/year
            if ($request->has('month') && $request->has('year')) {
                $query->whereMonth('assignment_date', $request->month)
                      ->whereYear('assignment_date', $request->year);
            }

            // Filter by barangay
            if ($request->has('barangay')) {
                $query->whereHas('route', function ($q) use ($request) {
                    $q->where('barangay', $request->barangay);
                });
            }

            $routes = $query->orderBy('assignment_date', 'desc')
                ->paginate($request->input('per_page', 15));

            $routes->getCollection()->transform(function ($assignment) {
                $completedCollections = $assignment->qrCollections()
                    ->whereIn('collection_status', ['collected', 'completed'])
                    ->count();
                
                $totalWeight = $assignment->qrCollections()
                    ->whereIn('collection_status', ['collected', 'completed'])
                    ->sum('waste_weight');

                $duration = $assignment->start_time && $assignment->end_time
                    ? $assignment->start_time->diffInMinutes($assignment->end_time)
                    : null;

                return [
                    'id' => $assignment->id,
                    'assignment_date' => $assignment->assignment_date->format('Y-m-d'),
                    'route_name' => $assignment->route->route_name,
                    'barangay' => $assignment->route->barangay,
                    'start_time' => $assignment->start_time?->format('h:i A'),
                    'end_time' => $assignment->end_time?->format('h:i A'),
                    'duration_minutes' => $duration,
                    'total_stops' => $assignment->route->total_stops,
                    'completed_stops' => $completedCollections,
                    'completion_rate' => $assignment->route->total_stops > 0
                        ? round(($completedCollections / $assignment->route->total_stops) * 100, 2)
                        : 0,
                    'total_weight_kg' => (float) $totalWeight,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Completed routes retrieved successfully',
                'data' => $routes
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve completed routes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get collection statistics
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCollectionStats()
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            // Total stats
            $totalCollections = QrCollection::where('collector_id', $collectorId)
                ->whereIn('collection_status', ['collected', 'completed'])
                ->count();

            $totalWeight = QrCollection::where('collector_id', $collectorId)
                ->whereIn('collection_status', ['collected', 'completed'])
                ->sum('waste_weight');

            $totalSkipped = QrCollection::where('collector_id', $collectorId)
                ->where('collection_status', 'skipped')
                ->count();

            // Collections by waste type
            $byWasteType = QrCollection::where('collector_id', $collectorId)
                ->whereIn('collection_status', ['collected', 'completed'])
                ->select('waste_type', DB::raw('COUNT(*) as count'), DB::raw('SUM(waste_weight) as total_weight'))
                ->groupBy('waste_type')
                ->get()
                ->mapWithKeys(function ($item) {
                    return [
                        $item->waste_type => [
                            'count' => $item->count,
                            'weight_kg' => (float) $item->total_weight,
                        ]
                    ];
                });

            // Collections by barangay
            $byBarangay = QrCollection::where('collector_id', $collectorId)
                ->whereIn('collection_status', ['collected', 'completed'])
                ->join('route_assignments', 'qr_collections.assignment_id', '=', 'route_assignments.id')
                ->join('routes', 'route_assignments.route_id', '=', 'routes.id')
                ->select('routes.barangay', DB::raw('COUNT(*) as count'), DB::raw('SUM(waste_weight) as total_weight'))
                ->groupBy('routes.barangay')
                ->get()
                ->mapWithKeys(function ($item) {
                    return [
                        $item->barangay => [
                            'count' => $item->count,
                            'weight_kg' => (float) $item->total_weight,
                        ]
                    ];
                });

            // Monthly trend (last 6 months)
            $monthlyTrend = [];
            for ($i = 5; $i >= 0; $i--) {
                $date = Carbon::now()->subMonths($i);
                $count = QrCollection::where('collector_id', $collectorId)
                    ->whereIn('collection_status', ['collected', 'completed'])
                    ->whereMonth('collection_timestamp', $date->month)
                    ->whereYear('collection_timestamp', $date->year)
                    ->count();
                
                $weight = QrCollection::where('collector_id', $collectorId)
                    ->whereIn('collection_status', ['collected', 'completed'])
                    ->whereMonth('collection_timestamp', $date->month)
                    ->whereYear('collection_timestamp', $date->year)
                    ->sum('waste_weight');

                $monthlyTrend[] = [
                    'month' => $date->format('M Y'),
                    'collections' => $count,
                    'weight_kg' => (float) $weight,
                ];
            }

            // Photos uploaded
            $withPhotos = QrCollection::where('collector_id', $collectorId)
                ->whereIn('collection_status', ['collected', 'completed'])
                ->whereNotNull('photo_url')
                ->count();

            return response()->json([
                'success' => true,
                'message' => 'Collection statistics retrieved successfully',
                'data' => [
                    'totals' => [
                        'collections' => $totalCollections,
                        'weight_kg' => (float) $totalWeight,
                        'skipped' => $totalSkipped,
                        'with_photos' => $withPhotos,
                        'photo_percentage' => $totalCollections > 0
                            ? round(($withPhotos / $totalCollections) * 100, 2)
                            : 0,
                    ],
                    'by_waste_type' => $byWasteType,
                    'by_barangay' => $byBarangay,
                    'monthly_trend' => $monthlyTrend,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve collection statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get daily report for a specific date
     * 
     * @param string $date
     * @return \Illuminate\Http\JsonResponse
     */
    public function getDailyReport($date)
    {
        try {
            $collectorId = Auth::guard('collector')->id();
            $reportDate = Carbon::parse($date);

            // Get assignment for the day
            $assignment = RouteAssignment::with(['route', 'qrCollections'])
                ->where('collector_id', $collectorId)
                ->whereDate('assignment_date', $reportDate)
                ->first();

            if (!$assignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'No assignment found for this date'
                ], 404);
            }

            $collections = $assignment->qrCollections;

            $completedCollections = $collections->whereIn('collection_status', ['collected', 'completed']);
            $skippedCollections = $collections->where('collection_status', 'skipped');

            $totalWeight = $completedCollections->sum('waste_weight');
            $duration = $assignment->start_time && $assignment->end_time
                ? $assignment->start_time->diffInMinutes($assignment->end_time)
                : null;

            // Waste breakdown
            $wasteBreakdown = $completedCollections->groupBy('waste_type')
                ->map(function ($items, $type) {
                    return [
                        'count' => $items->count(),
                        'weight_kg' => (float) $items->sum('waste_weight'),
                    ];
                });

            // Skip reasons
            $skipReasons = $skippedCollections->pluck('skip_reason')
                ->filter()
                ->groupBy(function ($reason) {
                    return $reason;
                })
                ->map(function ($items) {
                    return $items->count();
                });

            return response()->json([
                'success' => true,
                'message' => 'Daily report retrieved successfully',
                'data' => [
                    'date' => $reportDate->format('Y-m-d'),
                    'day_of_week' => $reportDate->format('l'),
                    'assignment' => [
                        'id' => $assignment->id,
                        'route_name' => $assignment->route->route_name,
                        'barangay' => $assignment->route->barangay,
                        'status' => $assignment->status,
                        'start_time' => $assignment->start_time?->format('h:i A'),
                        'end_time' => $assignment->end_time?->format('h:i A'),
                        'duration_minutes' => $duration,
                    ],
                    'collections' => [
                        'total_stops' => $assignment->route->total_stops,
                        'completed' => $completedCollections->count(),
                        'skipped' => $skippedCollections->count(),
                        'completion_rate' => $assignment->route->total_stops > 0
                            ? round(($completedCollections->count() / $assignment->route->total_stops) * 100, 2)
                            : 0,
                    ],
                    'waste' => [
                        'total_weight_kg' => (float) $totalWeight,
                        'breakdown' => $wasteBreakdown,
                    ],
                    'skip_analysis' => [
                        'total_skipped' => $skippedCollections->count(),
                        'reasons' => $skipReasons,
                    ],
                    'performance' => [
                        'with_photos' => $completedCollections->whereNotNull('photo_url')->count(),
                        'verified' => $completedCollections->where('is_verified', true)->count(),
                        'avg_weight_per_collection' => $completedCollections->count() > 0
                            ? round($totalWeight / $completedCollections->count(), 2)
                            : 0,
                    ],
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve daily report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get weekly performance report
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getWeeklyReport(Request $request)
    {
        try {
            $collectorId = Auth::guard('collector')->id();
            
            // Default to current week, or use provided week
            $startOfWeek = $request->has('week_start') 
                ? Carbon::parse($request->week_start) 
                : Carbon::now()->startOfWeek();
            $endOfWeek = $startOfWeek->copy()->endOfWeek();

            // Get assignments for the week
            $assignments = RouteAssignment::with(['route', 'qrCollections'])
                ->where('collector_id', $collectorId)
                ->whereBetween('assignment_date', [$startOfWeek, $endOfWeek])
                ->get();

            $dailyBreakdown = [];
            $totalCollections = 0;
            $totalWeight = 0;
            $totalRoutes = 0;
            $completedRoutes = 0;

            // Process each day
            for ($i = 0; $i < 7; $i++) {
                $day = $startOfWeek->copy()->addDays($i);
                $dayAssignment = $assignments->firstWhere('assignment_date', $day->format('Y-m-d'));

                if ($dayAssignment) {
                    $dayCollections = $dayAssignment->qrCollections
                        ->whereIn('collection_status', ['collected', 'completed'])
                        ->count();
                    $dayWeight = $dayAssignment->qrCollections
                        ->whereIn('collection_status', ['collected', 'completed'])
                        ->sum('waste_weight');

                    $totalCollections += $dayCollections;
                    $totalWeight += $dayWeight;
                    $totalRoutes++;
                    
                    if ($dayAssignment->status === 'completed') {
                        $completedRoutes++;
                    }

                    $dailyBreakdown[] = [
                        'date' => $day->format('Y-m-d'),
                        'day' => $day->format('D'),
                        'collections' => $dayCollections,
                        'weight_kg' => (float) $dayWeight,
                        'status' => $dayAssignment->status,
                    ];
                } else {
                    $dailyBreakdown[] = [
                        'date' => $day->format('Y-m-d'),
                        'day' => $day->format('D'),
                        'collections' => 0,
                        'weight_kg' => 0,
                        'status' => 'no_assignment',
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Weekly report retrieved successfully',
                'data' => [
                    'week_period' => [
                        'start' => $startOfWeek->format('M d, Y'),
                        'end' => $endOfWeek->format('M d, Y'),
                    ],
                    'summary' => [
                        'total_collections' => $totalCollections,
                        'total_weight_kg' => (float) $totalWeight,
                        'total_routes' => $totalRoutes,
                        'completed_routes' => $completedRoutes,
                        'avg_collections_per_day' => $totalRoutes > 0 
                            ? round($totalCollections / $totalRoutes, 2) 
                            : 0,
                        'avg_weight_per_day' => $totalRoutes > 0 
                            ? round($totalWeight / $totalRoutes, 2) 
                            : 0,
                    ],
                    'daily_breakdown' => $dailyBreakdown,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve weekly report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get monthly performance report
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getMonthlyReport(Request $request)
    {
        try {
            $collectorId = Auth::guard('collector')->id();
            
            $month = $request->input('month', Carbon::now()->month);
            $year = $request->input('year', Carbon::now()->year);

            $collections = QrCollection::where('collector_id', $collectorId)
                ->whereIn('collection_status', ['collected', 'completed'])
                ->whereMonth('collection_timestamp', $month)
                ->whereYear('collection_timestamp', $year)
                ->get();

            $routes = RouteAssignment::where('collector_id', $collectorId)
                ->whereMonth('assignment_date', $month)
                ->whereYear('assignment_date', $year)
                ->get();

            $totalWeight = $collections->sum('waste_weight');
            $completedRoutes = $routes->where('status', 'completed')->count();

            // Waste type breakdown
            $wasteTypeBreakdown = $collections->groupBy('waste_type')
                ->map(function ($items, $type) {
                    return [
                        'count' => $items->count(),
                        'weight_kg' => (float) $items->sum('waste_weight'),
                        'percentage' => 0, // Will calculate later
                    ];
                });

            // Add percentages
            $totalCount = $collections->count();
            if ($totalCount > 0) {
                $wasteTypeBreakdown = $wasteTypeBreakdown->map(function ($item) use ($totalCount) {
                    $item['percentage'] = round(($item['count'] / $totalCount) * 100, 2);
                    return $item;
                });
            }

            return response()->json([
                'success' => true,
                'message' => 'Monthly report retrieved successfully',
                'data' => [
                    'period' => Carbon::createFromDate($year, $month, 1)->format('F Y'),
                    'summary' => [
                        'total_collections' => $collections->count(),
                        'total_weight_kg' => (float) $totalWeight,
                        'total_routes_assigned' => $routes->count(),
                        'completed_routes' => $completedRoutes,
                        'completion_rate' => $routes->count() > 0 
                            ? round(($completedRoutes / $routes->count()) * 100, 2) 
                            : 0,
                        'avg_collections_per_route' => $completedRoutes > 0 
                            ? round($collections->count() / $completedRoutes, 2) 
                            : 0,
                        'with_photos' => $collections->whereNotNull('photo_url')->count(),
                        'verified' => $collections->where('is_verified', true)->count(),
                    ],
                    'waste_type_breakdown' => $wasteTypeBreakdown,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve monthly report',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}