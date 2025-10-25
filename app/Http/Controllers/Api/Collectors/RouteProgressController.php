<?php

namespace App\Http\Controllers\Api\Collectors;

use App\Http\Controllers\Controller;
use App\Models\RouteAssignment;
use App\Models\QrCollection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class RouteProgressController extends Controller
{
    /**
     * Get route progress (completed vs pending stops)
     * 
     * @param int $assignmentId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getRouteProgress($assignmentId)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $assignment = RouteAssignment::with([
                'route:id,route_name,barangay,total_stops',
                'qrCollections.wasteBin'
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

            // Get collection statistics
            $totalStops = $assignment->route->total_stops;
            $completedCollections = $assignment->qrCollections()
                ->whereIn('collection_status', ['collected', 'completed'])
                ->count();
            $skippedCollections = $assignment->qrCollections()
                ->where('collection_status', 'skipped')
                ->count();
            $pendingStops = $totalStops - ($completedCollections + $skippedCollections);

            // Calculate waste statistics
            $totalWeight = $assignment->qrCollections()
                ->whereIn('collection_status', ['collected', 'completed'])
                ->sum('waste_weight');

            $wasteByType = $assignment->qrCollections()
                ->whereIn('collection_status', ['collected', 'completed'])
                ->selectRaw('waste_type, COUNT(*) as count, SUM(waste_weight) as total_weight')
                ->groupBy('waste_type')
                ->get()
                ->mapWithKeys(function ($item) {
                    return [
                        $item->waste_type => [
                            'count' => $item->count,
                            'weight' => (float) $item->total_weight,
                        ]
                    ];
                });

            // Calculate time metrics
            $duration = null;
            $estimatedCompletion = null;
            
            if ($assignment->start_time) {
                $duration = $assignment->start_time->diffInMinutes(
                    $assignment->end_time ?? Carbon::now()
                );

                // Estimate completion time based on current progress
                if ($completedCollections > 0 && $pendingStops > 0) {
                    $avgTimePerStop = $duration / $completedCollections;
                    $estimatedMinutesRemaining = $avgTimePerStop * $pendingStops;
                    $estimatedCompletion = Carbon::now()->addMinutes($estimatedMinutesRemaining);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Route progress retrieved successfully',
                'data' => [
                    'assignment' => [
                        'id' => $assignment->id,
                        'status' => $assignment->status,
                        'assignment_date' => $assignment->assignment_date->format('Y-m-d'),
                        'start_time' => $assignment->start_time?->format('Y-m-d H:i:s'),
                        'end_time' => $assignment->end_time?->format('Y-m-d H:i:s'),
                    ],
                    'route' => [
                        'id' => $assignment->route->id,
                        'name' => $assignment->route->route_name,
                        'barangay' => $assignment->route->barangay,
                    ],
                    'progress' => [
                        'total_stops' => $totalStops,
                        'completed' => $completedCollections,
                        'skipped' => $skippedCollections,
                        'pending' => $pendingStops,
                        'completion_percentage' => $totalStops > 0 
                            ? round(($completedCollections / $totalStops) * 100, 2) 
                            : 0,
                    ],
                    'waste_statistics' => [
                        'total_weight_kg' => (float) $totalWeight,
                        'by_type' => $wasteByType,
                    ],
                    'time_metrics' => [
                        'duration_minutes' => $duration,
                        'estimated_completion' => $estimatedCompletion?->format('Y-m-d H:i:s'),
                    ],
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve route progress',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update route assignment status
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateRouteStatus(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'assignment_id' => 'required|exists:route_assignments,id',
                'status' => 'required|string|in:pending,in-progress,paused,completed,cancelled',
                'notes' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $collectorId = Auth::guard('collector')->id();

            $assignment = RouteAssignment::where('id', $request->assignment_id)
                ->where('collector_id', $collectorId)
                ->first();

            if (!$assignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Route assignment not found'
                ], 404);
            }

            // Validate status transitions
            $validTransitions = [
                'pending' => ['in-progress', 'cancelled'],
                'in-progress' => ['paused', 'completed', 'cancelled'],
                'paused' => ['in-progress', 'cancelled'],
                'completed' => [],
                'cancelled' => [],
            ];

            if (!in_array($request->status, $validTransitions[$assignment->status] ?? [])) {
                return response()->json([
                    'success' => false,
                    'message' => "Cannot change status from {$assignment->status} to {$request->status}"
                ], 400);
            }

            $updateData = ['status' => $request->status];

            // Set timestamps based on status
            if ($request->status === 'in-progress' && !$assignment->start_time) {
                $updateData['start_time'] = Carbon::now();
            }

            if ($request->status === 'completed' && !$assignment->end_time) {
                $updateData['end_time'] = Carbon::now();
            }

            if ($request->has('notes')) {
                $updateData['notes'] = $request->notes;
            }

            $assignment->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Route status updated successfully',
                'data' => [
                    'id' => $assignment->id,
                    'status' => $assignment->status,
                    'start_time' => $assignment->start_time?->format('Y-m-d H:i:s'),
                    'end_time' => $assignment->end_time?->format('Y-m-d H:i:s'),
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update route status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get list of completed stops/collections
     * 
     * @param int $assignmentId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCompletedStops($assignmentId)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            // Verify assignment belongs to collector
            $assignment = RouteAssignment::where('id', $assignmentId)
                ->where('collector_id', $collectorId)
                ->exists();

            if (!$assignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Route assignment not found'
                ], 404);
            }

            $completedCollections = QrCollection::with([
                'wasteBin.resident:id,first_name,last_name,address'
            ])
            ->where('assignment_id', $assignmentId)
            ->whereIn('collection_status', ['collected', 'completed'])
            ->orderBy('collection_timestamp', 'desc')
            ->get()
            ->map(function ($collection) {
                return [
                    'id' => $collection->id,
                    'qr_code' => $collection->qr_code,
                    'collection_timestamp' => $collection->collection_timestamp->format('Y-m-d H:i:s'),
                    'time_ago' => $collection->collection_timestamp->diffForHumans(),
                    'waste_weight' => (float) $collection->waste_weight,
                    'waste_type' => $collection->waste_type,
                    'has_photo' => !is_null($collection->photo_url),
                    'latitude' => (float) $collection->latitude,
                    'longitude' => (float) $collection->longitude,
                    'bin' => [
                        'id' => $collection->wasteBin->id,
                        'bin_type' => $collection->wasteBin->bin_type,
                    ],
                    'resident' => [
                        'name' => $collection->wasteBin->resident->first_name . ' ' . 
                                  $collection->wasteBin->resident->last_name,
                        'address' => $collection->wasteBin->resident->address,
                    ],
                ];
            });

            $summary = [
                'total_completed' => $completedCollections->count(),
                'total_weight' => $completedCollections->sum('waste_weight'),
                'with_photos' => $completedCollections->where('has_photo', true)->count(),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Completed stops retrieved successfully',
                'data' => [
                    'collections' => $completedCollections,
                    'summary' => $summary,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve completed stops',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get list of pending/remaining stops
     * 
     * @param int $assignmentId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPendingStops($assignmentId)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $assignment = RouteAssignment::with([
                'route.stops' => function ($query) {
                    $query->orderBy('stop_order', 'asc');
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

            // Get all completed and skipped bin IDs
            $processedStopIds = $assignment->qrCollections()
                ->whereIn('collection_status', ['collected', 'completed', 'skipped'])
                ->pluck('bin_id')
                ->toArray();

            // Get all stops and mark which are pending
            $allStops = $assignment->route->stops;
            $pendingStops = $allStops->map(function ($stop) use ($processedStopIds) {
                $isProcessed = in_array($stop->id, $processedStopIds);
                
                return [
                    'id' => $stop->id,
                    'stop_order' => $stop->stop_order,
                    'address' => $stop->stop_address,
                    'latitude' => (float) $stop->latitude,
                    'longitude' => (float) $stop->longitude,
                    'estimated_time' => $stop->estimated_time,
                    'notes' => $stop->notes,
                    'is_pending' => !$isProcessed,
                ];
            })->filter(function ($stop) {
                return $stop['is_pending'];
            })->values();

            // Find next stop (first pending stop)
            $nextStop = $pendingStops->first();

            return response()->json([
                'success' => true,
                'message' => 'Pending stops retrieved successfully',
                'data' => [
                    'pending_stops' => $pendingStops,
                    'total_pending' => $pendingStops->count(),
                    'next_stop' => $nextStop,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve pending stops',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get skipped collections for an assignment
     * 
     * @param int $assignmentId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSkippedStops($assignmentId)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            // Verify assignment
            $assignment = RouteAssignment::where('id', $assignmentId)
                ->where('collector_id', $collectorId)
                ->exists();

            if (!$assignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Route assignment not found'
                ], 404);
            }

            $skippedCollections = QrCollection::with([
                'wasteBin.resident:id,first_name,last_name,address'
            ])
            ->where('assignment_id', $assignmentId)
            ->where('collection_status', 'skipped')
            ->orderBy('collection_timestamp', 'desc')
            ->get()
            ->map(function ($collection) {
                return [
                    'id' => $collection->id,
                    'qr_code' => $collection->qr_code,
                    'collection_timestamp' => $collection->collection_timestamp->format('Y-m-d H:i:s'),
                    'skip_reason' => $collection->skip_reason,
                    'latitude' => (float) $collection->latitude,
                    'longitude' => (float) $collection->longitude,
                    'bin' => [
                        'id' => $collection->wasteBin->id,
                        'bin_type' => $collection->wasteBin->bin_type,
                    ],
                    'resident' => [
                        'name' => $collection->wasteBin->resident->first_name . ' ' . 
                                  $collection->wasteBin->resident->last_name,
                        'address' => $collection->wasteBin->resident->address,
                    ],
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Skipped stops retrieved successfully',
                'data' => [
                    'skipped_collections' => $skippedCollections,
                    'total_skipped' => $skippedCollections->count(),
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve skipped stops',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get real-time progress updates (for live tracking)
     * 
     * @param int $assignmentId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getLiveProgress($assignmentId)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $assignment = RouteAssignment::with('route:id,route_name,total_stops')
                ->where('id', $assignmentId)
                ->where('collector_id', $collectorId)
                ->first();

            if (!$assignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Route assignment not found'
                ], 404);
            }

            $completed = $assignment->qrCollections()
                ->whereIn('collection_status', ['collected', 'completed'])
                ->count();

            $skipped = $assignment->qrCollections()
                ->where('collection_status', 'skipped')
                ->count();

            $totalStops = $assignment->route->total_stops;
            $pending = $totalStops - ($completed + $skipped);

            // Get last collection
            $lastCollection = $assignment->qrCollections()
                ->latest('collection_timestamp')
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Live progress retrieved successfully',
                'data' => [
                    'assignment_id' => $assignment->id,
                    'route_name' => $assignment->route->route_name,
                    'status' => $assignment->status,
                    'progress' => [
                        'completed' => $completed,
                        'skipped' => $skipped,
                        'pending' => $pending,
                        'total' => $totalStops,
                        'percentage' => $totalStops > 0 
                            ? round(($completed / $totalStops) * 100, 2) 
                            : 0,
                    ],
                    'last_collection' => $lastCollection ? [
                        'timestamp' => $lastCollection->collection_timestamp->format('Y-m-d H:i:s'),
                        'time_ago' => $lastCollection->collection_timestamp->diffForHumans(),
                        'latitude' => (float) $lastCollection->latitude,
                        'longitude' => (float) $lastCollection->longitude,
                    ] : null,
                    'timestamp' => Carbon::now()->format('Y-m-d H:i:s'),
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve live progress',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get detailed progress report
     * 
     * @param int $assignmentId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getProgressReport($assignmentId)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $assignment = RouteAssignment::with([
                'route:id,route_name,barangay,total_stops',
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

            $collections = $assignment->qrCollections;

            $report = [
                'assignment_info' => [
                    'id' => $assignment->id,
                    'route_name' => $assignment->route->route_name,
                    'barangay' => $assignment->route->barangay,
                    'date' => $assignment->assignment_date->format('Y-m-d'),
                    'status' => $assignment->status,
                    'start_time' => $assignment->start_time?->format('Y-m-d H:i:s'),
                    'end_time' => $assignment->end_time?->format('Y-m-d H:i:s'),
                ],
                'collection_stats' => [
                    'total_stops' => $assignment->route->total_stops,
                    'completed' => $collections->whereIn('collection_status', ['collected', 'completed'])->count(),
                    'skipped' => $collections->where('collection_status', 'skipped')->count(),
                    'with_photos' => $collections->whereNotNull('photo_url')->count(),
                ],
                'waste_stats' => [
                    'total_weight_kg' => (float) $collections
                        ->whereIn('collection_status', ['collected', 'completed'])
                        ->sum('waste_weight'),
                    'by_type' => $collections
                        ->whereIn('collection_status', ['collected', 'completed'])
                        ->groupBy('waste_type')
                        ->map(function ($items, $type) {
                            return [
                                'count' => $items->count(),
                                'weight' => (float) $items->sum('waste_weight'),
                            ];
                        }),
                ],
                'performance' => [
                    'completion_rate' => $assignment->route->total_stops > 0
                        ? round(($collections->whereIn('collection_status', ['collected', 'completed'])->count() 
                            / $assignment->route->total_stops) * 100, 2)
                        : 0,
                    'skip_rate' => $assignment->route->total_stops > 0
                        ? round(($collections->where('collection_status', 'skipped')->count() 
                            / $assignment->route->total_stops) * 100, 2)
                        : 0,
                    'duration_minutes' => $assignment->start_time && $assignment->end_time
                        ? $assignment->start_time->diffInMinutes($assignment->end_time)
                        : null,
                ],
            ];

            return response()->json([
                'success' => true,
                'message' => 'Progress report retrieved successfully',
                'data' => $report
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve progress report',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}