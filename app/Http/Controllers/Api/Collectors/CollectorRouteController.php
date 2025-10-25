<?php

namespace App\Http\Controllers\Api\Collectors;

use App\Http\Controllers\Controller;
use App\Models\Route;
use App\Models\RouteAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

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
            $today = Carbon::today();

            $assignments = RouteAssignment::with([
                'route:id,route_name,barangay,start_location,end_location,total_stops',
                'schedule:id,collection_day,collection_time,waste_type'
            ])
            ->where('collector_id', $collectorId)
            ->whereDate('assignment_date', $today)
            ->orderBy('assignment_date', 'desc')
            ->get()
            ->map(function ($assignment) {
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
                        'barangay' => $assignment->route->barangay,
                        'start_location' => $assignment->route->start_location,
                        'end_location' => $assignment->route->end_location,
                        'total_stops' => $assignment->route->total_stops,
                    ],
                    'schedule' => $assignment->schedule ? [
                        'collection_day' => $assignment->schedule->collection_day,
                        'collection_time' => $assignment->schedule->collection_time,
                        'waste_type' => $assignment->schedule->waste_type,
                    ] : null,
                    // Calculate progress
                    'completed_stops' => $assignment->qrCollections()->where('status', 'completed')->count(),
                    'total_stops' => $assignment->route->total_stops,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Today\'s assignments retrieved successfully',
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
     * Get detailed information about a specific route assignment
     * 
     * @param int $assignmentId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getRouteDetails($assignmentId)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $assignment = RouteAssignment::with([
                'route.stops' => function ($query) {
                    $query->orderBy('stop_order', 'asc');
                },
                'schedule',
                'qrCollections'
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

            $completedStops = $assignment->qrCollections()
                ->where('status', 'completed')
                ->pluck('stop_id')
                ->toArray();

            return response()->json([
                'success' => true,
                'message' => 'Route details retrieved successfully',
                'data' => [
                    'assignment' => [
                        'id' => $assignment->id,
                        'assignment_date' => $assignment->assignment_date->format('Y-m-d'),
                        'status' => $assignment->status,
                        'start_time' => $assignment->start_time?->format('Y-m-d H:i:s'),
                        'end_time' => $assignment->end_time?->format('Y-m-d H:i:s'),
                        'notes' => $assignment->notes,
                    ],
                    'route' => [
                        'id' => $assignment->route->id,
                        'name' => $assignment->route->route_name,
                        'barangay' => $assignment->route->barangay,
                        'start_location' => $assignment->route->start_location,
                        'end_location' => $assignment->route->end_location,
                        'estimated_duration' => $assignment->route->estimated_duration,
                        'total_stops' => $assignment->route->total_stops,
                        'route_map_data' => $assignment->route->route_map_data,
                    ],
                    'schedule' => $assignment->schedule ? [
                        'collection_day' => $assignment->schedule->collection_day,
                        'collection_time' => $assignment->schedule->collection_time,
                        'waste_type' => $assignment->schedule->waste_type,
                        'frequency' => $assignment->schedule->frequency,
                    ] : null,
                    'stops' => $assignment->route->stops->map(function ($stop) use ($completedStops) {
                        return [
                            'id' => $stop->id,
                            'stop_order' => $stop->stop_order,
                            'address' => $stop->stop_address,
                            'latitude' => $stop->latitude,
                            'longitude' => $stop->longitude,
                            'estimated_time' => $stop->estimated_time,
                            'notes' => $stop->notes,
                            'is_completed' => in_array($stop->id, $completedStops),
                        ];
                    }),
                    'progress' => [
                        'completed' => count($completedStops),
                        'total' => $assignment->route->total_stops,
                        'percentage' => $assignment->route->total_stops > 0 
                            ? round((count($completedStops) / $assignment->route->total_stops) * 100, 2)
                            : 0,
                    ]
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve route details',
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

            // Verify the collector has an assignment for this route
            $hasAssignment = RouteAssignment::where('route_id', $routeId)
                ->where('collector_id', $collectorId)
                ->exists();

            if (!$hasAssignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have access to this route'
                ], 403);
            }

            $route = Route::with(['stops' => function ($query) {
                $query->orderBy('stop_order', 'asc');
            }])->find($routeId);

            if (!$route) {
                return response()->json([
                    'success' => false,
                    'message' => 'Route not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Route stops retrieved successfully',
                'data' => [
                    'route' => [
                        'id' => $route->id,
                        'name' => $route->route_name,
                        'barangay' => $route->barangay,
                        'total_stops' => $route->total_stops,
                    ],
                    'stops' => $route->stops->map(function ($stop) {
                        return [
                            'id' => $stop->id,
                            'stop_order' => $stop->stop_order,
                            'address' => $stop->stop_address,
                            'latitude' => $stop->latitude,
                            'longitude' => $stop->longitude,
                            'estimated_time' => $stop->estimated_time,
                            'notes' => $stop->notes,
                        ];
                    })
                ]
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
     * Mark route assignment as started (in-progress)
     * 
     * @param int $assignmentId
     * @return \Illuminate\Http\JsonResponse
     */
    public function startRoute($assignmentId)
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

            // Check if already started
            if ($assignment->status === 'in-progress' || $assignment->status === 'completed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Route has already been started or completed'
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
                ->where('status', 'completed')
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
                    'completion_percentage' => $totalStops > 0 
                        ? round(($completedStops / $totalStops) * 100, 2) 
                        : 0,
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
}