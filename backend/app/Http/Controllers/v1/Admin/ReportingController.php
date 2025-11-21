<?php

namespace App\Http\Controllers\v1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Collector;
use App\Models\CollectionRequest;
use App\Models\QrCollection;
use App\Models\Resident;
use App\Models\Route;
use App\Models\RouteAssignment;
use App\Models\RouteStop;
use App\Models\WasteBin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use App\Trait\ActivityLogsTrait;

class ReportingController extends Controller
{
    use ActivityLogsTrait;

    /**
     * Display the reporting index page.
     */
    public function index(): Response
    {
        $this->adminActivityLogs(
            'Reporting',
            'View',
            'Accessed Reporting Module'
        );

        return Inertia::render('Admin/Reporting/index');
    }

    /**
     * Generate collection report.
     */
    public function collectionReport(Request $request): Response
    {
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));
        $groupBy = $request->get('group_by', 'day'); // day, week, month

        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->endOfDay();

        // Collection summary
        $summary = [
            'total_collections' => QrCollection::whereBetween('collection_timestamp', [$start, $end])->count(),
            'total_weight' => QrCollection::whereBetween('collection_timestamp', [$start, $end])->sum('waste_weight') ?? 0,
            'average_weight' => QrCollection::whereBetween('collection_timestamp', [$start, $end])->avg('waste_weight') ?? 0,
            'collections_by_status' => QrCollection::whereBetween('collection_timestamp', [$start, $end])
                ->select('collection_status', DB::raw('count(*) as count'))
                ->groupBy('collection_status')
                ->get(),
            'collections_by_type' => QrCollection::whereBetween('collection_timestamp', [$start, $end])
                ->whereNotNull('waste_type')
                ->select('waste_type', DB::raw('count(*) as count'), DB::raw('sum(waste_weight) as total_weight'))
                ->groupBy('waste_type')
                ->get(),
        ];

        // Grouped data
        $groupedData = [];
        if ($groupBy === 'day') {
            $collections = QrCollection::whereBetween('collection_timestamp', [$start, $end])
                ->select(
                    DB::raw('DATE(collection_timestamp) as date'),
                    DB::raw('count(*) as count'),
                    DB::raw('sum(waste_weight) as total_weight')
                )
                ->groupBy(DB::raw('DATE(collection_timestamp)'))
                ->orderBy('date', 'asc')
                ->get();

            foreach ($collections as $collection) {
                $groupedData[] = [
                    'period' => Carbon::parse($collection->date)->format('M d, Y'),
                    'date' => $collection->date,
                    'count' => $collection->count,
                    'total_weight' => $collection->total_weight ?? 0,
                ];
            }
        } elseif ($groupBy === 'week') {
            $collections = QrCollection::whereBetween('collection_timestamp', [$start, $end])
                ->select(
                    DB::raw('YEAR(collection_timestamp) as year'),
                    DB::raw('WEEK(collection_timestamp) as week'),
                    DB::raw('count(*) as count'),
                    DB::raw('sum(waste_weight) as total_weight')
                )
                ->groupBy('year', 'week')
                ->orderBy('year', 'asc')
                ->orderBy('week', 'asc')
                ->get();

            foreach ($collections as $collection) {
                $groupedData[] = [
                    'period' => "Week {$collection->week}, {$collection->year}",
                    'year' => $collection->year,
                    'week' => $collection->week,
                    'count' => $collection->count,
                    'total_weight' => $collection->total_weight ?? 0,
                ];
            }
        } else { // month
            $collections = QrCollection::whereBetween('collection_timestamp', [$start, $end])
                ->select(
                    DB::raw('YEAR(collection_timestamp) as year'),
                    DB::raw('MONTH(collection_timestamp) as month'),
                    DB::raw('count(*) as count'),
                    DB::raw('sum(waste_weight) as total_weight')
                )
                ->groupBy('year', 'month')
                ->orderBy('year', 'asc')
                ->orderBy('month', 'asc')
                ->get();

            foreach ($collections as $collection) {
                $groupedData[] = [
                    'period' => Carbon::create($collection->year, $collection->month, 1)->format('M Y'),
                    'year' => $collection->year,
                    'month' => $collection->month,
                    'count' => $collection->count,
                    'total_weight' => $collection->total_weight ?? 0,
                ];
            }
        }

        // Top collectors for the period
        $topCollectors = Collector::withCount(['qrCollections' => function ($query) use ($start, $end) {
            $query->whereBetween('collection_timestamp', [$start, $end]);
        }])
            ->withSum(['qrCollections' => function ($query) use ($start, $end) {
                $query->whereBetween('collection_timestamp', [$start, $end]);
            }], 'waste_weight')
            ->orderBy('qr_collections_count', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($collector) {
                return [
                    'id' => $collector->id,
                    'name' => $collector->name,
                    'employee_id' => $collector->employee_id,
                    'collections_count' => $collector->qr_collections_count,
                    'total_weight' => $collector->qr_collections_sum_waste_weight ?? 0,
                ];
            });

        $this->adminActivityLogs(
            'Reporting',
            'Generate',
            "Generated Collection Report from {$startDate} to {$endDate}"
        );

        return Inertia::render('Admin/Reporting/CollectionReport', [
            'summary' => $summary,
            'grouped_data' => $groupedData,
            'top_collectors' => $topCollectors,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'group_by' => $groupBy,
        ]);
    }

    /**
     * Generate collector performance report.
     */
    public function collectorPerformanceReport(Request $request): Response
    {
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));
        $collectorId = $request->get('collector_id');

        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->endOfDay();

        $query = Collector::withCount(['qrCollections' => function ($q) use ($start, $end) {
            $q->whereBetween('collection_timestamp', [$start, $end]);
        }])
            ->withSum(['qrCollections' => function ($q) use ($start, $end) {
                $q->whereBetween('collection_timestamp', [$start, $end]);
            }], 'waste_weight')
            ->withCount(['routeAssignments' => function ($q) use ($start, $end) {
                $q->whereBetween('assignment_date', [$start, $end]);
            }]);

        if ($collectorId) {
            $query->where('id', $collectorId);
        }

        $collectors = $query->get()->map(function ($collector) use ($start, $end) {
            // Get daily performance
            $dailyPerformance = QrCollection::where('collector_id', $collector->id)
                ->whereBetween('collection_timestamp', [$start, $end])
                ->select(
                    DB::raw('DATE(collection_timestamp) as date'),
                    DB::raw('count(*) as count'),
                    DB::raw('sum(waste_weight) as total_weight')
                )
                ->groupBy(DB::raw('DATE(collection_timestamp)'))
                ->orderBy('date', 'asc')
                ->get()
                ->map(function ($item) {
                    return [
                        'date' => $item->date,
                        'count' => $item->count,
                        'total_weight' => $item->total_weight ?? 0,
                    ];
                });

            // Get status breakdown
            $statusBreakdown = QrCollection::where('collector_id', $collector->id)
                ->whereBetween('collection_timestamp', [$start, $end])
                ->select('collection_status', DB::raw('count(*) as count'))
                ->groupBy('collection_status')
                ->pluck('count', 'collection_status')
                ->toArray();

            // Get waste type breakdown
            $wasteTypeBreakdown = QrCollection::where('collector_id', $collector->id)
                ->whereBetween('collection_timestamp', [$start, $end])
                ->whereNotNull('waste_type')
                ->select('waste_type', DB::raw('count(*) as count'))
                ->groupBy('waste_type')
                ->pluck('count', 'waste_type')
                ->toArray();

            return [
                'id' => $collector->id,
                'name' => $collector->name,
                'employee_id' => $collector->employee_id,
                'email' => $collector->email,
                'phone_number' => $collector->phone_number,
                'is_active' => $collector->is_active,
                'collections_count' => $collector->qr_collections_count,
                'total_weight' => $collector->qr_collections_sum_waste_weight ?? 0,
                'assignments_count' => $collector->route_assignments_count,
                'average_weight_per_collection' => $collector->qr_collections_count > 0 
                    ? ($collector->qr_collections_sum_waste_weight ?? 0) / $collector->qr_collections_count 
                    : 0,
                'daily_performance' => $dailyPerformance,
                'status_breakdown' => $statusBreakdown,
                'waste_type_breakdown' => $wasteTypeBreakdown,
            ];
        });

        $allCollectors = Collector::select('id', 'name', 'employee_id')->get();

        $this->adminActivityLogs(
            'Reporting',
            'Generate',
            "Generated Collector Performance Report from {$startDate} to {$endDate}"
        );

        return Inertia::render('Admin/Reporting/CollectorPerformanceReport', [
            'collectors' => $collectors,
            'all_collectors' => $allCollectors,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'selected_collector_id' => $collectorId,
        ]);
    }

    /**
     * Generate route performance report.
     */
    public function routePerformanceReport(Request $request): Response
    {
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));
        $routeId = $request->get('route_id');

        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->endOfDay();

        $query = Route::withCount(['assignments' => function ($q) use ($start, $end) {
            $q->whereBetween('assignment_date', [$start, $end]);
        }])
            ->withCount(['stops']);

        if ($routeId) {
            $query->where('id', $routeId);
        }

        $routes = $query->get()->map(function ($route) use ($start, $end) {
            // Get assignments for this route
            $assignments = RouteAssignment::where('route_id', $route->id)
                ->whereBetween('assignment_date', [$start, $end])
                ->with('collector:id,name,employee_id')
                ->get();

            // Calculate completion rates
            $totalAssignments = $assignments->count();
            $completedAssignments = $assignments->where('status', 'completed')->count();
            $completionRate = $totalAssignments > 0 ? ($completedAssignments / $totalAssignments) * 100 : 0;

            // Get collections from assignments
            $totalCollections = 0;
            $totalWeight = 0;
            foreach ($assignments as $assignment) {
                $collections = QrCollection::where('assignment_id', $assignment->id)->get();
                $totalCollections += $collections->count();
                $totalWeight += $collections->sum('waste_weight') ?? 0;
            }

            // Average collections per assignment
            $avgCollectionsPerAssignment = $totalAssignments > 0 ? $totalCollections / $totalAssignments : 0;

            // Get assignments by status
            $assignmentsByStatus = $assignments->groupBy('status')->map->count();

            return [
                'id' => $route->id,
                'route_name' => $route->route_name,
                'barangay' => $route->barangay,
                'total_stops' => $route->total_stops,
                'is_active' => $route->is_active,
                'assignments_count' => $route->assignments_count,
                'total_collections' => $totalCollections,
                'total_weight' => $totalWeight,
                'completion_rate' => round($completionRate, 2),
                'avg_collections_per_assignment' => round($avgCollectionsPerAssignment, 2),
                'assignments_by_status' => $assignmentsByStatus,
                'recent_assignments' => $assignments->take(10)->map(function ($assignment) {
                    $collectionsCount = QrCollection::where('assignment_id', $assignment->id)->count();
                    return [
                        'id' => $assignment->id,
                        'assignment_date' => $assignment->assignment_date->format('Y-m-d'),
                        'collector_name' => $assignment->collector->name ?? 'N/A',
                        'status' => $assignment->status,
                        'collections_count' => $collectionsCount,
                    ];
                }),
            ];
        });

        $allRoutes = Route::select('id', 'route_name', 'barangay')->get();

        $this->adminActivityLogs(
            'Reporting',
            'Generate',
            "Generated Route Performance Report from {$startDate} to {$endDate}"
        );

        return Inertia::render('Admin/Reporting/RoutePerformanceReport', [
            'routes' => $routes,
            'all_routes' => $allRoutes,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'selected_route_id' => $routeId,
        ]);
    }

    /**
     * Generate waste type analysis report.
     */
    public function wasteTypeAnalysisReport(Request $request): Response
    {
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->endOfDay();

        // Waste type summary
        $wasteTypeSummary = QrCollection::whereBetween('collection_timestamp', [$start, $end])
            ->whereNotNull('waste_type')
            ->select(
                'waste_type',
                DB::raw('count(*) as count'),
                DB::raw('sum(waste_weight) as total_weight'),
                DB::raw('avg(waste_weight) as avg_weight')
            )
            ->groupBy('waste_type')
            ->orderBy('count', 'desc')
            ->get();

        // Waste type by day
        $wasteTypeByDay = QrCollection::whereBetween('collection_timestamp', [$start, $end])
            ->whereNotNull('waste_type')
            ->select(
                DB::raw('DATE(collection_timestamp) as date'),
                'waste_type',
                DB::raw('count(*) as count'),
                DB::raw('sum(waste_weight) as total_weight')
            )
            ->groupBy(DB::raw('DATE(collection_timestamp)'), 'waste_type')
            ->orderBy('date', 'asc')
            ->get()
            ->groupBy('date')
            ->map(function ($items) {
                return $items->map(function ($item) {
                    return [
                        'waste_type' => $item->waste_type,
                        'count' => $item->count,
                        'total_weight' => $item->total_weight ?? 0,
                    ];
                });
            });

        // Top collectors by waste type
        $topCollectorsByType = [];
        foreach ($wasteTypeSummary as $type) {
            $collectors = Collector::withCount(['qrCollections' => function ($q) use ($start, $end, $type) {
                $q->whereBetween('collection_timestamp', [$start, $end])
                  ->where('waste_type', $type->waste_type);
            }])
                ->withSum(['qrCollections' => function ($q) use ($start, $end, $type) {
                    $q->whereBetween('collection_timestamp', [$start, $end])
                      ->where('waste_type', $type->waste_type);
                }], 'waste_weight')
                ->having('qr_collections_count', '>', 0)
                ->orderBy('qr_collections_count', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($collector) {
                    return [
                        'id' => $collector->id,
                        'name' => $collector->name,
                        'employee_id' => $collector->employee_id,
                        'count' => $collector->qr_collections_count,
                        'total_weight' => $collector->qr_collections_sum_waste_weight ?? 0,
                    ];
                });

            $topCollectorsByType[$type->waste_type] = $collectors;
        }

        $this->adminActivityLogs(
            'Reporting',
            'Generate',
            "Generated Waste Type Analysis Report from {$startDate} to {$endDate}"
        );

        return Inertia::render('Admin/Reporting/WasteTypeAnalysisReport', [
            'waste_type_summary' => $wasteTypeSummary,
            'waste_type_by_day' => $wasteTypeByDay,
            'top_collectors_by_type' => $topCollectorsByType,
            'start_date' => $startDate,
            'end_date' => $endDate,
        ]);
    }

    /**
     * Generate resident participation report.
     */
    public function residentParticipationReport(Request $request): Response
    {
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->endOfDay();

        // Residents with collections
        $participatingResidents = Resident::whereHas('wasteBins.qrCollections', function ($q) use ($start, $end) {
            $q->whereBetween('collection_timestamp', [$start, $end]);
        })
            ->withCount(['wasteBins' => function ($q) use ($start, $end) {
                $q->whereHas('qrCollections', function ($q2) use ($start, $end) {
                    $q2->whereBetween('collection_timestamp', [$start, $end]);
                });
            }])
            ->with(['wasteBins' => function ($q) use ($start, $end) {
                $q->withCount(['qrCollections' => function ($q2) use ($start, $end) {
                    $q2->whereBetween('collection_timestamp', [$start, $end]);
                }])
                ->withSum(['qrCollections' => function ($q2) use ($start, $end) {
                    $q2->whereBetween('collection_timestamp', [$start, $end]);
                }], 'waste_weight');
            }])
            ->get()
            ->map(function ($resident) {
                $totalCollections = $resident->wasteBins->sum('qr_collections_count');
                $totalWeight = $resident->wasteBins->sum('qr_collections_sum_waste_weight') ?? 0;

                return [
                    'id' => $resident->id,
                    'name' => $resident->name,
                    'email' => $resident->email,
                    'phone_number' => $resident->phone_number,
                    'barangay' => $resident->barangay,
                    'full_address' => $resident->full_address,
                    'bins_count' => $resident->waste_bins_count,
                    'total_collections' => $totalCollections,
                    'total_weight' => $totalWeight,
                    'bins' => $resident->wasteBins->map(function ($bin) {
                        return [
                            'id' => $bin->id,
                            'name' => $bin->name,
                            'qr_code' => $bin->qr_code,
                            'bin_type' => $bin->bin_type,
                            'collections_count' => $bin->qr_collections_count,
                            'total_weight' => $bin->qr_collections_sum_waste_weight ?? 0,
                        ];
                    }),
                ];
            })
            ->sortByDesc('total_collections')
            ->values();

        // Participation statistics
        $totalResidents = Resident::count();
        $participatingCount = $participatingResidents->count();
        $participationRate = $totalResidents > 0 ? ($participatingCount / $totalResidents) * 100 : 0;

        // Participation by barangay
        $participationByBarangay = DB::table('residents')
            ->select('residents.barangay', DB::raw('count(distinct residents.id) as total_residents'))
            ->leftJoin('waste_bins', 'residents.id', '=', 'waste_bins.resident_id')
            ->leftJoin('qr_collections', function ($join) use ($start, $end) {
                $join->on('waste_bins.id', '=', 'qr_collections.bin_id')
                     ->whereBetween('qr_collections.collection_timestamp', [$start, $end]);
            })
            ->groupBy('residents.barangay')
            ->get()
            ->map(function ($item) use ($start, $end) {
                $participating = DB::table('residents')
                    ->join('waste_bins', 'residents.id', '=', 'waste_bins.resident_id')
                    ->join('qr_collections', function ($join) use ($start, $end) {
                        $join->on('waste_bins.id', '=', 'qr_collections.bin_id')
                             ->whereBetween('qr_collections.collection_timestamp', [$start, $end]);
                    })
                    ->where('residents.barangay', $item->barangay)
                    ->distinct('residents.id')
                    ->count('residents.id');

                return [
                    'barangay' => $item->barangay,
                    'total_residents' => $item->total_residents,
                    'participating_residents' => $participating,
                    'participation_rate' => $item->total_residents > 0 
                        ? round(($participating / $item->total_residents) * 100, 2) 
                        : 0,
                ];
            })
            ->sortByDesc('participation_rate');

        $this->adminActivityLogs(
            'Reporting',
            'Generate',
            "Generated Resident Participation Report from {$startDate} to {$endDate}"
        );

        return Inertia::render('Admin/Reporting/ResidentParticipationReport', [
            'participating_residents' => $participatingResidents,
            'total_residents' => $totalResidents,
            'participating_count' => $participatingCount,
            'participation_rate' => round($participationRate, 2),
            'participation_by_barangay' => $participationByBarangay,
            'start_date' => $startDate,
            'end_date' => $endDate,
        ]);
    }

    /**
     * Generate collection request report.
     */
    public function collectionRequestReport(Request $request): Response
    {
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->endOfDay();

        // Request summary
        $summary = [
            'total_requests' => CollectionRequest::whereBetween('created_at', [$start, $end])->count(),
            'pending' => CollectionRequest::whereBetween('created_at', [$start, $end])
                ->where('status', 'pending')->count(),
            'assigned' => CollectionRequest::whereBetween('created_at', [$start, $end])
                ->where('status', 'assigned')->count(),
            'in_progress' => CollectionRequest::whereBetween('created_at', [$start, $end])
                ->where('status', 'in_progress')->count(),
            'completed' => CollectionRequest::whereBetween('created_at', [$start, $end])
                ->where('status', 'completed')->count(),
            'cancelled' => CollectionRequest::whereBetween('created_at', [$start, $end])
                ->where('status', 'cancelled')->count(),
        ];

        // Requests by type
        $requestsByType = CollectionRequest::whereBetween('created_at', [$start, $end])
            ->select('request_type', DB::raw('count(*) as count'))
            ->groupBy('request_type')
            ->get();

        // Requests by priority
        $requestsByPriority = CollectionRequest::whereBetween('created_at', [$start, $end])
            ->select('priority', DB::raw('count(*) as count'))
            ->groupBy('priority')
            ->get();

        // Requests by status (daily)
        $requestsByStatusDaily = CollectionRequest::whereBetween('created_at', [$start, $end])
            ->select(
                DB::raw('DATE(created_at) as date'),
                'status',
                DB::raw('count(*) as count')
            )
            ->groupBy(DB::raw('DATE(created_at)'), 'status')
            ->orderBy('date', 'asc')
            ->get()
            ->groupBy('date')
            ->map(function ($items) {
                return $items->map(function ($item) {
                    return [
                        'status' => $item->status,
                        'count' => $item->count,
                    ];
                });
            });

        // Detailed requests
        $requests = CollectionRequest::whereBetween('created_at', [$start, $end])
            ->with(['resident:id,name,email', 'wasteBin:id,name,qr_code', 'collector:id,name'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($request) {
                return [
                    'id' => $request->id,
                    'resident_name' => $request->resident->name ?? 'N/A',
                    'request_type' => $request->request_type,
                    'priority' => $request->priority,
                    'status' => $request->status,
                    'preferred_date' => $request->preferred_date?->format('Y-m-d'),
                    'created_at' => $request->created_at->format('Y-m-d H:i:s'),
                    'completed_at' => $request->completed_at?->format('Y-m-d H:i:s'),
                    'bin_name' => $request->wasteBin->name ?? 'N/A',
                    'collector_name' => $request->collector->name ?? 'N/A',
                ];
            });

        $this->adminActivityLogs(
            'Reporting',
            'Generate',
            "Generated Collection Request Report from {$startDate} to {$endDate}"
        );

        return Inertia::render('Admin/Reporting/CollectionRequestReport', [
            'summary' => $summary,
            'requests_by_type' => $requestsByType,
            'requests_by_priority' => $requestsByPriority,
            'requests_by_status_daily' => $requestsByStatusDaily,
            'requests' => $requests,
            'start_date' => $startDate,
            'end_date' => $endDate,
        ]);
    }

    /**
     * Generate executive summary report.
     */
    public function executiveSummaryReport(Request $request): Response
    {
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->endOfDay();

        // Overall metrics
        $metrics = [
            'total_collections' => QrCollection::whereBetween('collection_timestamp', [$start, $end])->count(),
            'total_weight' => QrCollection::whereBetween('collection_timestamp', [$start, $end])->sum('waste_weight') ?? 0,
            'active_collectors' => Collector::where('is_active', true)->count(),
            'total_routes' => Route::where('is_active', true)->count(),
            'completed_assignments' => RouteAssignment::whereBetween('assignment_date', [$start, $end])
                ->where('status', 'completed')->count(),
            'total_requests' => CollectionRequest::whereBetween('created_at', [$start, $end])->count(),
            'completed_requests' => CollectionRequest::whereBetween('created_at', [$start, $end])
                ->where('status', 'completed')->count(),
        ];

        // Growth metrics (compare with previous period)
        $previousStart = $start->copy()->subDays($start->diffInDays($end));
        $previousEnd = $start->copy()->subDay();

        $previousCollections = QrCollection::whereBetween('collection_timestamp', [$previousStart, $previousEnd])->count();
        $previousWeight = QrCollection::whereBetween('collection_timestamp', [$previousStart, $previousEnd])->sum('waste_weight') ?? 0;

        $collectionsGrowth = $previousCollections > 0 
            ? (($metrics['total_collections'] - $previousCollections) / $previousCollections) * 100 
            : 0;
        $weightGrowth = $previousWeight > 0 
            ? (($metrics['total_weight'] - $previousWeight) / $previousWeight) * 100 
            : 0;

        // Top performers
        $topCollectors = Collector::withCount(['qrCollections' => function ($q) use ($start, $end) {
            $q->whereBetween('collection_timestamp', [$start, $end]);
        }])
            ->orderBy('qr_collections_count', 'desc')
            ->limit(5)
            ->get(['id', 'name', 'employee_id']);

        $topRoutes = Route::withCount(['assignments' => function ($q) use ($start, $end) {
            $q->whereBetween('assignment_date', [$start, $end]);
        }])
            ->orderBy('assignments_count', 'desc')
            ->limit(5)
            ->get(['id', 'route_name', 'barangay']);

        $this->adminActivityLogs(
            'Reporting',
            'Generate',
            "Generated Executive Summary Report from {$startDate} to {$endDate}"
        );

        return Inertia::render('Admin/Reporting/ExecutiveSummaryReport', [
            'metrics' => $metrics,
            'collections_growth' => round($collectionsGrowth, 2),
            'weight_growth' => round($weightGrowth, 2),
            'top_collectors' => $topCollectors,
            'top_routes' => $topRoutes,
            'start_date' => $startDate,
            'end_date' => $endDate,
        ]);
    }
}

