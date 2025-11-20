<?php

namespace App\Http\Controllers\v1\Admin;

use App\Models\Reporting;
use App\Models\ReportTemplate;
use App\Models\ReportSchedule;
use App\Models\ReportExport;
use App\Models\CollectionRequest;
use App\Models\Collector;
use App\Models\Resident;
use App\Models\WasteBin;
use App\Models\Route;
use App\Models\RouteAssignment;
use App\Models\CollectionSchedule;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use App\Trait\ActivityLogsTrait;
use Carbon\Carbon;

class ReportingController extends Controller
{
    use ActivityLogsTrait;

    /**
     * Display a listing of reports.
     */
    public function index(Request $request): Response
    {
        $search = $request->get('search', '');
        $typeFilter = $request->get('type', '');
        $statusFilter = $request->get('status', '');
        $periodFilter = $request->get('period', '');

        $query = Reporting::with('generatedBy:id,name,email');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('report_title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($typeFilter && $typeFilter !== 'all') {
            $query->where('report_type', $typeFilter);
        }

        if ($statusFilter && $statusFilter !== 'all') {
            $query->where('status', $statusFilter);
        }

        if ($periodFilter && $periodFilter !== 'all') {
            $query->where('report_period', $periodFilter);
        }

        $reports = $query->orderBy('created_at', 'desc')
                        ->paginate(15)
                        ->withQueryString();

        return Inertia::render('Admin/ReportingManagement/Index', [
            'reports' => $reports,
            'search' => $search,
            'typeFilter' => $typeFilter,
            'statusFilter' => $statusFilter,
            'periodFilter' => $periodFilter,
        ]);
    }

    /**
     * Show the form for creating a new report.
     */
    public function create(): Response
    {
        // Get available barangays
        $barangays = Resident::select('barangay')
                            ->distinct()
                            ->orderBy('barangay')
                            ->pluck('barangay');

        // Get collectors for filtering
        $collectors = Collector::where('is_verified', true)
                              ->select('id', 'name', 'employee_id')
                              ->orderBy('name')
                              ->get();

        return Inertia::render('Admin/ReportingManagement/Create', [
            'barangays' => $barangays,
            'collectors' => $collectors,
        ]);
    }

    /**
     * Store a newly created report.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'report_title' => 'required|string|max:255',
            'report_type' => 'required|in:collection_summary,collector_performance,resident_activity,waste_bin_status,route_efficiency,schedule_compliance,barangay_statistics,waste_type_analysis,monthly_overview,custom',
            'report_period' => 'required|in:daily,weekly,monthly,quarterly,yearly,custom',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'description' => 'nullable|string',
            'filters' => 'nullable|array',
        ]);

        $report = Reporting::create([
            'report_title' => $validated['report_title'],
            'report_type' => $validated['report_type'],
            'report_period' => $validated['report_period'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'description' => $validated['description'] ?? null,
            'filters' => $validated['filters'] ?? null,
            'status' => 'pending',
            'generated_by' => Auth::id(),
        ]);

        // Generate report data based on type
        $this->generateReportData($report);

        $this->adminActivityLogs(
            'Report',
            'Create',
            'Created report: ' . $report->report_title
        );

        return redirect()->route('admin.reporting-management.show', $report)
            ->with('success', 'Report created successfully');
    }

    /**
     * Display the specified report.
     */
    public function show(Reporting $report): Response
    {
        $report->load('generatedBy', 'exports');

        $this->adminActivityLogs(
            'Report',
            'View',
            'Viewed report: ' . $report->report_title
        );

        return Inertia::render('Admin/ReportingManagement/Show', [
            'report' => $report,
        ]);
    }

    /**
     * Generate report data based on report type.
     */
    private function generateReportData(Reporting $report)
    {
        $report->update(['status' => 'generating']);

        try {
            $data = match($report->report_type) {
                'collection_summary' => $this->generateCollectionSummary($report),
                'collector_performance' => $this->generateCollectorPerformance($report),
                'resident_activity' => $this->generateResidentActivity($report),
                'waste_bin_status' => $this->generateWasteBinStatus($report),
                'route_efficiency' => $this->generateRouteEfficiency($report),
                'schedule_compliance' => $this->generateScheduleCompliance($report),
                'barangay_statistics' => $this->generateBarangayStatistics($report),
                'waste_type_analysis' => $this->generateWasteTypeAnalysis($report),
                'monthly_overview' => $this->generateMonthlyOverview($report),
                default => []
            };

            $report->update([
                'report_data' => $data,
                'summary_stats' => $this->generateSummaryStats($report, $data),
                'status' => 'completed',
                'generated_at' => now(),
            ]);
        } catch (\Exception $e) {
            $report->update(['status' => 'failed']);
            throw $e;
        }
    }

    /**
     * Generate Collection Summary Report.
     */
    private function generateCollectionSummary(Reporting $report): array
    {
        $query = CollectionRequest::whereBetween('created_at', [
            $report->start_date,
            $report->end_date
        ]);

        // Apply filters
        if ($report->filters) {
            if (isset($report->filters['barangay'])) {
                $query->whereHas('resident', function($q) use ($report) {
                    $q->where('barangay', $report->filters['barangay']);
                });
            }
            if (isset($report->filters['waste_type'])) {
                $query->where('waste_type', $report->filters['waste_type']);
            }
        }

        // PostgreSQL-compatible average completion time calculation
        $avgCompletionTime = CollectionRequest::whereBetween('created_at', [
            $report->start_date,
            $report->end_date
        ])
        ->whereNotNull('completed_at')
        ->selectRaw("AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/3600) as avg_hours")
        ->value('avg_hours');

        return [
            'total_requests' => $query->count(),
            'by_status' => $query->select('status', DB::raw('COUNT(*) as count'))
                                 ->groupBy('status')
                                 ->get(),
            'by_priority' => $query->select('priority', DB::raw('COUNT(*) as count'))
                                   ->groupBy('priority')
                                   ->get(),
            'by_waste_type' => $query->select('waste_type', DB::raw('COUNT(*) as count'))
                                     ->groupBy('waste_type')
                                     ->get(),
            'completed_requests' => $query->where('status', 'completed')->count(),
            'pending_requests' => $query->where('status', 'pending')->count(),
            'average_completion_time' => $avgCompletionTime ? round($avgCompletionTime, 2) : 0,
            'daily_breakdown' => $query->selectRaw("DATE(created_at) as date, COUNT(*) as count")
                                       ->groupBy('date')
                                       ->orderBy('date')
                                       ->get(),
        ];
    }

    /**
     * Generate Collector Performance Report.
     */
    private function generateCollectorPerformance(Reporting $report): array
    {
        $collectors = Collector::with(['collectionRequests' => function($q) use ($report) {
            $q->whereBetween('created_at', [$report->start_date, $report->end_date]);
        }, 'routeAssignments' => function($q) use ($report) {
            $q->whereBetween('assignment_date', [$report->start_date, $report->end_date]);
        }])->where('is_verified', true)->get();

        $performanceData = $collectors->map(function($collector) {
            $assignments = $collector->routeAssignments;
            $requests = $collector->collectionRequests;

            // Calculate average duration for completed assignments (PostgreSQL compatible)
            $avgDuration = $assignments->where('status', 'completed')
                ->filter(fn($a) => $a->start_time && $a->end_time)
                ->map(function($a) {
                    return Carbon::parse($a->end_time)->diffInMinutes(Carbon::parse($a->start_time));
                })
                ->avg();

            return [
                'collector_id' => $collector->id,
                'collector_name' => $collector->name,
                'employee_id' => $collector->employee_id,
                'total_assignments' => $assignments->count(),
                'completed_assignments' => $assignments->where('status', 'completed')->count(),
                'total_collections' => $requests->count(),
                'completed_collections' => $requests->where('status', 'completed')->count(),
                'completion_rate' => $assignments->count() > 0 
                    ? round(($assignments->where('status', 'completed')->count() / $assignments->count()) * 100, 2)
                    : 0,
                'average_duration' => $avgDuration ? round($avgDuration, 2) : 0,
            ];
        });

        return [
            'collectors' => $performanceData,
            'top_performers' => $performanceData->sortByDesc('completion_rate')->take(5)->values(),
            'total_collectors' => $collectors->count(),
            'average_completion_rate' => $performanceData->avg('completion_rate'),
        ];
    }

    /**
     * Generate Resident Activity Report.
     */
    private function generateResidentActivity(Reporting $report): array
    {
        $query = Resident::with(['collectionRequests' => function($q) use ($report) {
            $q->whereBetween('created_at', [$report->start_date, $report->end_date]);
        }, 'wasteBins']);

        if ($report->filters && isset($report->filters['barangay'])) {
            $query->where('barangay', $report->filters['barangay']);
        }

        $residents = $query->get();

        return [
            'total_residents' => $residents->count(),
            'active_residents' => $residents->filter(fn($r) => $r->collectionRequests->count() > 0)->count(),
            'verified_residents' => $residents->where('is_verified', true)->count(),
            'by_barangay' => $residents->groupBy('barangay')->map(fn($group) => $group->count()),
            'top_requesters' => $residents->sortByDesc(fn($r) => $r->collectionRequests->count())
                                         ->take(10)
                                         ->map(fn($r) => [
                                             'name' => $r->name,
                                             'barangay' => $r->barangay,
                                             'request_count' => $r->collectionRequests->count(),
                                         ])->values(),
            'total_bins_registered' => $residents->sum(fn($r) => $r->wasteBins->count()),
        ];
    }

    /**
     * Generate Waste Bin Status Report.
     */
    private function generateWasteBinStatus(Reporting $report): array
    {
        $query = WasteBin::with('resident');

        if ($report->filters) {
            if (isset($report->filters['status'])) {
                $query->where('status', $report->filters['status']);
            }
            if (isset($report->filters['bin_type'])) {
                $query->where('bin_type', $report->filters['bin_type']);
            }
        }

        $bins = $query->get();

        return [
            'total_bins' => $bins->count(),
            'by_status' => $bins->groupBy('status')->map(fn($g) => $g->count()),
            'by_type' => $bins->groupBy('bin_type')->map(fn($g) => $g->count()),
            'active_bins' => $bins->where('status', 'active')->count(),
            'damaged_bins' => $bins->where('status', 'damaged')->count(),
            'full_bins' => $bins->where('status', 'full')->count(),
            'recently_collected' => $bins->whereNotNull('last_collected')
                                        ->sortByDesc('last_collected')
                                        ->take(10)
                                        ->values(),
            'bins_by_barangay' => $bins->groupBy(fn($b) => $b->resident->barangay ?? 'Unknown')
                                      ->map(fn($g) => $g->count()),
        ];
    }

    /**
     * Generate Route Efficiency Report.
     */
    private function generateRouteEfficiency(Reporting $report): array
    {
        $assignments = RouteAssignment::with(['route', 'collector'])
            ->whereBetween('assignment_date', [$report->start_date, $report->end_date])
            ->get();

        $routeStats = Route::with(['assignments' => function($q) use ($report) {
            $q->whereBetween('assignment_date', [$report->start_date, $report->end_date]);
        }])->where('is_active', true)->get()->map(function($route) {
            $assignments = $route->assignments;
            $completed = $assignments->where('status', 'completed');
            
            // Calculate average duration (PostgreSQL compatible)
            $avgDuration = $completed->filter(fn($a) => $a->start_time && $a->end_time)
                ->map(function($a) {
                    return Carbon::parse($a->end_time)->diffInMinutes(Carbon::parse($a->start_time));
                })
                ->avg();
            
            return [
                'route_name' => $route->route_name,
                'barangay' => $route->barangay,
                'total_stops' => $route->total_stops,
                'total_assignments' => $assignments->count(),
                'completed' => $completed->count(),
                'completion_rate' => $assignments->count() > 0 
                    ? round(($completed->count() / $assignments->count()) * 100, 2)
                    : 0,
                'avg_duration' => $avgDuration ? round($avgDuration, 2) : 0,
            ];
        });

        return [
            'total_routes' => $routeStats->count(),
            'total_assignments' => $assignments->count(),
            'completed_assignments' => $assignments->where('status', 'completed')->count(),
            'route_statistics' => $routeStats,
            'most_efficient_routes' => $routeStats->sortByDesc('completion_rate')->take(5)->values(),
            'average_completion_rate' => $routeStats->avg('completion_rate'),
        ];
    }

    /**
     * Generate Schedule Compliance Report.
     */
    private function generateScheduleCompliance(Reporting $report): array
    {
        $schedules = CollectionSchedule::where('is_active', true)->get();
        
        $assignments = RouteAssignment::with('schedule')
            ->whereBetween('assignment_date', [$report->start_date, $report->end_date])
            ->get();

        return [
            'total_schedules' => $schedules->count(),
            'total_assignments' => $assignments->count(),
            'on_time_collections' => $assignments->where('status', 'completed')->count(),
            'by_day' => $schedules->groupBy('collection_day')->map(fn($g) => $g->count()),
            'by_waste_type' => $schedules->groupBy('waste_type')->map(fn($g) => $g->count()),
            'compliance_rate' => $assignments->count() > 0 
                ? round(($assignments->where('status', 'completed')->count() / $assignments->count()) * 100, 2)
                : 0,
        ];
    }

    /**
     * Generate Barangay Statistics Report.
     */
    private function generateBarangayStatistics(Reporting $report): array
    {
        $barangays = Resident::select('barangay')
            ->distinct()
            ->pluck('barangay');

        $stats = $barangays->map(function($barangay) use ($report) {
            $residents = Resident::where('barangay', $barangay)->get();
            $requests = CollectionRequest::whereHas('resident', function($q) use ($barangay) {
                $q->where('barangay', $barangay);
            })->whereBetween('created_at', [$report->start_date, $report->end_date])->get();

            return [
                'barangay' => $barangay,
                'total_residents' => $residents->count(),
                'verified_residents' => $residents->where('is_verified', true)->count(),
                'total_requests' => $requests->count(),
                'completed_requests' => $requests->where('status', 'completed')->count(),
                'total_bins' => WasteBin::whereHas('resident', function($q) use ($barangay) {
                    $q->where('barangay', $barangay);
                })->count(),
            ];
        });

        return [
            'barangay_data' => $stats,
            'total_barangays' => $barangays->count(),
            'most_active' => $stats->sortByDesc('total_requests')->first(),
        ];
    }

    /**
     * Generate Waste Type Analysis Report.
     */
    private function generateWasteTypeAnalysis(Reporting $report): array
    {
        $requests = CollectionRequest::whereBetween('created_at', [
            $report->start_date,
            $report->end_date
        ])->get();

        $byType = $requests->groupBy('waste_type')->map(function($group, $type) {
            return [
                'waste_type' => $type,
                'total' => $group->count(),
                'completed' => $group->where('status', 'completed')->count(),
                'pending' => $group->where('status', 'pending')->count(),
                'percentage' => 0, // Will be calculated below
            ];
        });

        $total = $requests->count();
        if ($total > 0) {
            $byType = $byType->map(function($item) use ($total) {
                $item['percentage'] = round(($item['total'] / $total) * 100, 2);
                return $item;
            });
        }

        return [
            'by_waste_type' => $byType,
            'total_collections' => $total,
            'most_common_type' => $byType->sortByDesc('total')->first(),
        ];
    }

    /**
     * Generate Monthly Overview Report.
     */
    private function generateMonthlyOverview(Reporting $report): array
    {
        return [
            'collection_summary' => $this->generateCollectionSummary($report),
            'collector_stats' => [
                'total' => Collector::where('is_verified', true)->count(),
                'active' => Collector::where('is_active', true)->count(),
            ],
            'resident_stats' => [
                'total' => Resident::count(),
                'verified' => Resident::where('is_verified', true)->count(),
            ],
            'bin_stats' => [
                'total' => WasteBin::count(),
                'active' => WasteBin::where('status', 'active')->count(),
            ],
            'route_stats' => [
                'total' => Route::count(),
                'active' => Route::where('is_active', true)->count(),
            ],
        ];
    }

    /**
     * Generate summary statistics for a report.
     */
    private function generateSummaryStats(Reporting $report, array $data): array
    {
        // Extract key metrics based on report type
        return match($report->report_type) {
            'collection_summary' => [
                'total_requests' => $data['total_requests'] ?? 0,
                'completed' => $data['completed_requests'] ?? 0,
                'pending' => $data['pending_requests'] ?? 0,
            ],
            'collector_performance' => [
                'total_collectors' => $data['total_collectors'] ?? 0,
                'avg_completion_rate' => $data['average_completion_rate'] ?? 0,
            ],
            default => []
        };
    }

    /**
     * Delete a report.
     */
    public function destroy(Reporting $report)
    {
        $this->adminActivityLogs(
            'Report',
            'Delete',
            'Deleted report: ' . $report->report_title
        );

        $report->delete();

        return redirect()->route('admin.reporting-management.index')
            ->with('success', 'Report deleted successfully');
    }
}