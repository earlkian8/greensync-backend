<?php

namespace App\Http\Controllers\v1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Collector;
use App\Models\CollectionRequest;
use App\Models\QrCollection;
use App\Models\Resident;
use App\Models\Route;
use App\Models\RouteAssignment;
use App\Models\WasteBin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the admin dashboard with statistics and analytics.
     */
    public function index(Request $request): Response
    {
        $data = $this->getDashboardData($request);
        
        return Inertia::render('Admin/Dashboard', $data);
    }

    /**
     * Get dashboard data as JSON (for API usage).
     */
    public function getData(Request $request)
    {
        $data = $this->getDashboardData($request);
        
        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * Get comprehensive dashboard data.
     */
    private function getDashboardData(Request $request)
    {
        $period = $request->get('period', 'today'); // today, week, month, year, all
        
        // Set date ranges based on period
        $dateRange = $this->getDateRange($period);
        $startDate = $dateRange['start'];
        $endDate = $dateRange['end'];

        // Overall Statistics
        $overallStats = [
            'total_residents' => Resident::count(),
            'verified_residents' => Resident::where('is_verified', true)->count(),
            'total_collectors' => Collector::count(),
            'active_collectors' => Collector::where('is_active', true)->count(),
            'verified_collectors' => Collector::where('is_verified', true)->count(),
            'total_bins' => WasteBin::count(),
            'active_bins' => WasteBin::where('status', 'active')->count(),
            'total_routes' => Route::count(),
            'active_routes' => Route::where('is_active', true)->count(),
            'total_collections' => QrCollection::count(),
            'total_collection_requests' => CollectionRequest::count(),
        ];

        // Period-specific Statistics
        $periodStats = [
            'collections_count' => QrCollection::whereBetween('collection_timestamp', [$startDate, $endDate])->count(),
            'collections_weight' => QrCollection::whereBetween('collection_timestamp', [$startDate, $endDate])
                ->sum('waste_weight') ?? 0,
            'new_residents' => Resident::whereBetween('created_at', [$startDate, $endDate])->count(),
            'new_collectors' => Collector::whereBetween('created_at', [$startDate, $endDate])->count(),
            'new_bins' => WasteBin::whereBetween('created_at', [$startDate, $endDate])->count(),
            'collection_requests' => CollectionRequest::whereBetween('created_at', [$startDate, $endDate])->count(),
        ];

        // Collection Status Breakdown
        $collectionStatusBreakdown = QrCollection::whereBetween('collection_timestamp', [$startDate, $endDate])
            ->select('collection_status', DB::raw('count(*) as count'))
            ->groupBy('collection_status')
            ->pluck('count', 'collection_status')
            ->toArray();

        // Waste Type Distribution
        $wasteTypeDistribution = QrCollection::whereBetween('collection_timestamp', [$startDate, $endDate])
            ->whereNotNull('waste_type')
            ->select('waste_type', DB::raw('count(*) as count'))
            ->groupBy('waste_type')
            ->pluck('count', 'waste_type')
            ->toArray();

        // Collection Requests Status Breakdown
        $collectionRequestStatus = CollectionRequest::whereBetween('created_at', [$startDate, $endDate])
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // Recent Collections (last 10)
        $recentCollections = QrCollection::with(['wasteBin.resident', 'collector'])
            ->orderBy('collection_timestamp', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($collection) {
                return [
                    'id' => $collection->id,
                    'qr_code' => $collection->qr_code,
                    'resident_name' => $collection->wasteBin->resident->name ?? 'N/A',
                    'collector_name' => $collection->collector->name ?? 'N/A',
                    'waste_weight' => $collection->waste_weight,
                    'waste_type' => $collection->waste_type,
                    'collection_status' => $collection->collection_status,
                    'collection_timestamp' => $collection->collection_timestamp->format('Y-m-d H:i:s'),
                ];
            });

        // Top Performing Collectors (by collection count)
        $topCollectors = Collector::withCount(['qrCollections' => function ($query) use ($startDate, $endDate) {
            $query->whereBetween('collection_timestamp', [$startDate, $endDate]);
        }])
            ->orderBy('qr_collections_count', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($collector) {
                return [
                    'id' => $collector->id,
                    'name' => $collector->name,
                    'employee_id' => $collector->employee_id,
                    'collections_count' => $collector->qr_collections_count,
                ];
            });

        // Active Route Assignments Today
        $todayAssignments = RouteAssignment::with(['route', 'collector'])
            ->whereDate('assignment_date', Carbon::today())
            ->get()
            ->map(function ($assignment) {
                $collectionsCount = QrCollection::where('assignment_id', $assignment->id)->count();
                $totalStops = $assignment->route->total_stops ?? 0;
                
                return [
                    'id' => $assignment->id,
                    'route_name' => $assignment->route->route_name ?? 'N/A',
                    'collector_name' => $assignment->collector->name ?? 'N/A',
                    'status' => $assignment->status,
                    'collections_count' => $collectionsCount,
                    'total_stops' => $totalStops,
                    'completion_percentage' => $totalStops > 0 ? round(($collectionsCount / $totalStops) * 100, 2) : 0,
                ];
            });

        // Collection Trends (last 7 days)
        $collectionTrends = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $count = QrCollection::whereDate('collection_timestamp', $date)->count();
            $weight = QrCollection::whereDate('collection_timestamp', $date)->sum('waste_weight') ?? 0;
            
            $collectionTrends[] = [
                'date' => $date->format('Y-m-d'),
                'day' => $date->format('D'),
                'count' => $count,
                'weight' => $weight,
            ];
        }

        // Monthly Collection Trends (last 6 months)
        $monthlyTrends = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $startOfMonth = $date->copy()->startOfMonth();
            $endOfMonth = $date->copy()->endOfMonth();
            
            $count = QrCollection::whereBetween('collection_timestamp', [$startOfMonth, $endOfMonth])->count();
            $weight = QrCollection::whereBetween('collection_timestamp', [$startOfMonth, $endOfMonth])->sum('waste_weight') ?? 0;
            
            $monthlyTrends[] = [
                'month' => $date->format('M Y'),
                'month_number' => $date->format('Y-m'),
                'count' => $count,
                'weight' => $weight,
            ];
        }

        // Pending Collection Requests
        $pendingRequests = CollectionRequest::with(['resident', 'wasteBin'])
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($request) {
                return [
                    'id' => $request->id,
                    'resident_name' => $request->resident->name ?? 'N/A',
                    'request_type' => $request->request_type,
                    'priority' => $request->priority,
                    'preferred_date' => $request->preferred_date?->format('Y-m-d'),
                    'created_at' => $request->created_at->format('Y-m-d H:i:s'),
                ];
            });

        // Route Performance
        $routePerformance = Route::withCount(['assignments' => function ($query) use ($startDate, $endDate) {
            $query->whereBetween('assignment_date', [$startDate, $endDate]);
        }])
            ->withCount(['stops'])
            ->orderBy('assignments_count', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($route) {
                return [
                    'id' => $route->id,
                    'route_name' => $route->route_name,
                    'barangay' => $route->barangay,
                    'total_stops' => $route->total_stops,
                    'assignments_count' => $route->assignments_count,
                ];
            });

        return [
            'overall_stats' => $overallStats,
            'period_stats' => $periodStats,
            'period' => $period,
            'date_range' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d'),
            ],
            'collection_status_breakdown' => $collectionStatusBreakdown,
            'waste_type_distribution' => $wasteTypeDistribution,
            'collection_request_status' => $collectionRequestStatus,
            'recent_collections' => $recentCollections,
            'top_collectors' => $topCollectors,
            'today_assignments' => $todayAssignments,
            'collection_trends' => $collectionTrends,
            'monthly_trends' => $monthlyTrends,
            'pending_requests' => $pendingRequests,
            'route_performance' => $routePerformance,
        ];
    }

    /**
     * Get date range based on period.
     */
    private function getDateRange(string $period): array
    {
        $endDate = Carbon::now()->endOfDay();
        
        switch ($period) {
            case 'today':
                $startDate = Carbon::today()->startOfDay();
                break;
            case 'week':
                $startDate = Carbon::now()->startOfWeek()->startOfDay();
                break;
            case 'month':
                $startDate = Carbon::now()->startOfMonth()->startOfDay();
                break;
            case 'year':
                $startDate = Carbon::now()->startOfYear()->startOfDay();
                break;
            case 'all':
            default:
                $startDate = Carbon::create(2020, 1, 1)->startOfDay();
                break;
        }
        
        return [
            'start' => $startDate,
            'end' => $endDate,
        ];
    }
}

