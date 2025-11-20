<?php

namespace App\Http\Controllers\Api\Collectors;

use App\Http\Controllers\Controller;
use App\Models\Route;
use App\Models\RouteAssignment;
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
            $today = Carbon::today();

            $assignments = RouteAssignment::with([
                'route:id,route_name,barangay,start_location,end_location,total_stops',
                'schedule:id,collection_day,collection_time,frequency'
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
                        'frequency' => $assignment->schedule->frequency,
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
                'qrCollections.wasteBin.resident'
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

            // Get successful collections for this assignment
            $successfulCollections = $assignment->qrCollections()
                ->where('collection_status', 'successful')
                ->get();

            // Get collection bin IDs and addresses for matching
            $collectionBinIds = $successfulCollections->pluck('bin_id')->toArray();
            
            // Try to match stops with collections by address
            // First, get addresses from collections if available
            $collectionAddresses = [];
            foreach ($successfulCollections as $collection) {
                if ($collection->wasteBin && $collection->wasteBin->resident) {
                    $address = $collection->wasteBin->resident->address;
                    if ($address) {
                        $collectionAddresses[] = strtolower(trim($address));
                    }
                }
            }

            // Map stops and determine completion
            // Ensure stops collection exists and is not null
            $routeStops = $assignment->route->stops ?? collect([]);
            
            $stops = $routeStops->map(function ($stop) use ($collectionAddresses) {
                $stopAddress = strtolower(trim($stop->stop_address));
                // Match by address (case-insensitive, trimmed)
                $isCompleted = !empty($collectionAddresses) && in_array($stopAddress, $collectionAddresses);
                
                return [
                    'id' => $stop->id,
                    'stop_order' => $stop->stop_order,
                    'address' => $stop->stop_address,
                    'latitude' => $stop->latitude ? (string) $stop->latitude : null,
                    'longitude' => $stop->longitude ? (string) $stop->longitude : null,
                    'estimated_time' => $stop->estimated_time,
                    'notes' => $stop->notes,
                    'is_completed' => $isCompleted,
                ];
            });

            $completedCount = $stops->where('is_completed', true)->count();

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
                        'frequency' => $assignment->schedule->frequency,
                    ] : null,
                    'stops' => $stops->values(),
                    'progress' => [
                        'completed' => $completedCount,
                        'total' => $stops->count(),
                        'percentage' => $stops->count() > 0 
                            ? round(($completedCount / $stops->count()) * 100, 2)
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
    /**
     * Get all assignments (not just today) with filters
     * Useful for viewing past/future assignments
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAllAssignments(Request $request)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $query = RouteAssignment::with([
                'route:id,route_name,barangay,total_stops',
                'schedule:id,collection_day,frequency'
            ])
            ->where('collector_id', $collectorId);

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Filter by date range
            if ($request->has('start_date')) {
                $query->whereDate('assignment_date', '>=', $request->start_date);
            }
            if ($request->has('end_date')) {
                $query->whereDate('assignment_date', '<=', $request->end_date);
            }

            // Filter by barangay
            if ($request->has('barangay')) {
                $query->whereHas('route', function ($q) use ($request) {
                    $q->where('barangay', $request->barangay);
                });
            }

            $assignments = $query->orderBy('assignment_date', 'desc')
                ->paginate($request->input('per_page', 15));

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
     * Useful for dashboard overview
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
                    'pending' => RouteAssignment::where('collector_id', $collectorId)
                        ->whereDate('assignment_date', $today)
                        ->where('status', 'pending')
                        ->count(),
                    'in_progress' => RouteAssignment::where('collector_id', $collectorId)
                        ->whereDate('assignment_date', $today)
                        ->where('status', 'in-progress')
                        ->count(),
                    'completed' => RouteAssignment::where('collector_id', $collectorId)
                        ->whereDate('assignment_date', $today)
                        ->where('status', 'completed')
                        ->count(),
                ],
                'this_week' => [
                    'total' => RouteAssignment::where('collector_id', $collectorId)
                        ->whereBetween('assignment_date', [
                            Carbon::now()->startOfWeek(),
                            Carbon::now()->endOfWeek()
                        ])
                        ->count(),
                    'completed' => RouteAssignment::where('collector_id', $collectorId)
                        ->whereBetween('assignment_date', [
                            Carbon::now()->startOfWeek(),
                            Carbon::now()->endOfWeek()
                        ])
                        ->where('status', 'completed')
                        ->count(),
                ],
                'this_month' => [
                    'total' => RouteAssignment::where('collector_id', $collectorId)
                        ->whereMonth('assignment_date', Carbon::now()->month)
                        ->whereYear('assignment_date', Carbon::now()->year)
                        ->count(),
                    'completed' => RouteAssignment::where('collector_id', $collectorId)
                        ->whereMonth('assignment_date', Carbon::now()->month)
                        ->whereYear('assignment_date', Carbon::now()->year)
                        ->where('status', 'completed')
                        ->count(),
                ],
                'upcoming' => RouteAssignment::where('collector_id', $collectorId)
                    ->whereDate('assignment_date', '>', $today)
                    ->where('status', 'pending')
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
                'message' => 'Failed to retrieve summary',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Pause/Resume route (for breaks)
     * 
     * @param int $assignmentId
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function pauseRoute($assignmentId, Request $request)
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
                    'message' => 'Can only pause routes that are in progress'
                ], 400);
            }

            $assignment->update([
                'status' => 'paused',
                'notes' => $request->input('reason', 'Paused by collector'),
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
                    'message' => 'Can only resume paused routes'
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
     * Get upcoming assignments (next 7 days)
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUpcomingAssignments()
    {
        try {
            $collectorId = Auth::guard('collector')->id();
            $startDate = Carbon::tomorrow();
            $endDate = Carbon::now()->addDays(7);

            $assignments = RouteAssignment::with([
                'route:id,route_name,barangay,total_stops',
                'schedule:id,collection_day,collection_time,frequency'
            ])
            ->where('collector_id', $collectorId)
            ->whereBetween('assignment_date', [$startDate, $endDate])
            ->where('status', 'pending')
            ->orderBy('assignment_date', 'asc')
            ->get()
            ->map(function ($assignment) {
                return [
                    'id' => $assignment->id,
                    'assignment_date' => $assignment->assignment_date->format('Y-m-d'),
                    'day_of_week' => $assignment->assignment_date->format('l'),
                    'days_until' => Carbon::now()->diffInDays($assignment->assignment_date),
                    'route' => [
                        'id' => $assignment->route->id,
                        'name' => $assignment->route->route_name,
                        'barangay' => $assignment->route->barangay,
                        'total_stops' => $assignment->route->total_stops,
                    ],
                    'schedule' => $assignment->schedule ? [
                        'collection_time' => $assignment->schedule->collection_time,
                        'frequency' => $assignment->schedule->frequency,
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
     * Get route navigation/directions
     * Returns optimized stop sequence for navigation
     * 
     * @param int $assignmentId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getRouteNavigation($assignmentId)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $assignment = RouteAssignment::with([
                'route.stops' => function ($query) {
                    $query->orderBy('stop_order', 'asc');
                },
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

            $completedBinIds = $assignment->qrCollections()
                ->whereIn('collection_status', ['collected', 'completed'])
                ->pluck('bin_id')
                ->toArray();

            $stops = $assignment->route->stops->map(function ($stop) use ($completedBinIds) {
                return [
                    'id' => $stop->id,
                    'stop_order' => $stop->stop_order,
                    'address' => $stop->stop_address,
                    'latitude' => (float) $stop->latitude,
                    'longitude' => (float) $stop->longitude,
                    'estimated_time' => $stop->estimated_time,
                    'is_completed' => in_array($stop->id, $completedBinIds),
                    'notes' => $stop->notes,
                ];
            });

            $nextStop = $stops->where('is_completed', false)->first();

            return response()->json([
                'success' => true,
                'message' => 'Route navigation retrieved successfully',
                'data' => [
                    'route_name' => $assignment->route->route_name,
                    'start_location' => $assignment->route->start_location,
                    'end_location' => $assignment->route->end_location,
                    'current_progress' => [
                        'completed' => count($completedBinIds),
                        'total' => $stops->count(),
                        'percentage' => $stops->count() > 0 
                            ? round((count($completedBinIds) / $stops->count()) * 100, 2) 
                            : 0,
                    ],
                    'next_stop' => $nextStop,
                    'all_stops' => $stops,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve navigation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Report route issue/problem
     * 
     * @param int $assignmentId
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function reportIssue($assignmentId, Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'issue_type' => 'required|string|in:vehicle_breakdown,road_closure,weather,accident,other',
                'description' => 'required|string|max:1000',
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

            // Update assignment notes with issue
            $issueReport = sprintf(
                "[%s] %s: %s | Location: %s, %s",
                Carbon::now()->format('Y-m-d H:i:s'),
                strtoupper(str_replace('_', ' ', $request->issue_type)),
                $request->description,
                $request->latitude ?? 'N/A',
                $request->longitude ?? 'N/A'
            );

            $assignment->update([
                'notes' => $assignment->notes 
                    ? $assignment->notes . "\n\n" . $issueReport 
                    : $issueReport,
            ]);

            // Here you could also create a separate RouteIssue model/notification
            // to alert administrators

            return response()->json([
                'success' => true,
                'message' => 'Issue reported successfully',
                'data' => [
                    'assignment_id' => $assignment->id,
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