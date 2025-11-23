<?php

namespace App\Http\Controllers\Api\Collectors;

use App\Http\Controllers\Controller;
use App\Models\RouteAssignment;
use App\Models\QrCollection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class CollectorDashboardController extends Controller
{
    /**
     * Get dashboard/home page data
     * Returns today's assignments and collection statistics
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getDashboardData()
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

            // Get today's assignments
            $todayAssignments = RouteAssignment::with('route:id,route_name,barangay,total_stops,estimated_duration')
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

            // Get today's collections count
            $todayCollections = QrCollection::where('collector_id', $collectorId)
                ->whereIn('collection_status', ['collected', 'completed', 'manual', 'successful'])
                ->whereDate('collection_timestamp', $today)
                ->count();

            // Get weekly collections count (this week)
            $thisWeekCollections = QrCollection::where('collector_id', $collectorId)
                ->whereIn('collection_status', ['collected', 'completed', 'manual', 'successful'])
                ->whereBetween('collection_timestamp', [
                    Carbon::now()->startOfWeek(),
                    Carbon::now()->endOfWeek()
                ])
                ->count();

            return response()->json([
                'success' => true,
                'message' => 'Dashboard data retrieved successfully',
                'data' => [
                    'today_assignments' => $todayAssignments,
                    'collection_stats' => [
                        'today' => $todayCollections,
                        'weekly' => $thisWeekCollections,
                    ],
                ]
            ], 200);

        } catch (\Exception $e) {
            \Log::error('getDashboardData error: ' . $e->getMessage(), [
                'collector_id' => $collectorId ?? null,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve dashboard data',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }
}

