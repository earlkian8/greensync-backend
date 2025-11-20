<?php

namespace App\Http\Controllers\Api\Collectors;

use App\Http\Controllers\Controller;
use App\Models\CollectionRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class CollectorRequestController extends Controller
{
    /**
     * Get special requests assigned to the collector
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAssignedRequests(Request $request)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $query = CollectionRequest::with([
                'resident:id,name,phone_number,house_no,street,barangay',
                'wasteBin:id,qr_code,bin_type'
            ])
            ->where('assigned_collector_id', $collectorId);

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->status);
            } else {
                // Default: show pending and in-progress requests
                $query->whereIn('status', ['pending', 'in-progress']);
            }

            // Filter by priority
            if ($request->has('priority')) {
                $query->where('priority', $request->priority);
            }

            // Filter by date
            if ($request->has('date')) {
                $query->whereDate('preferred_date', $request->date);
            }

            // Filter by request type
            if ($request->has('request_type')) {
                $query->where('request_type', $request->request_type);
            }

            $requests = $query->orderBy('priority', 'desc')
                ->orderBy('preferred_date', 'asc')
                ->orderBy('created_at', 'desc')
                ->paginate($request->input('per_page', 15));

            $requests->getCollection()->transform(function ($collectionRequest) {
                return [
                    'id' => $collectionRequest->id,
                    'request_type' => $collectionRequest->request_type,
                    'description' => $collectionRequest->description,
                    'preferred_date' => $collectionRequest->preferred_date?->format('Y-m-d'),
                    'preferred_time' => $collectionRequest->preferred_time,
                    'waste_type' => $collectionRequest->waste_type,
                    'priority' => $collectionRequest->priority,
                    'status' => $collectionRequest->status,
                    'image_url' => $collectionRequest->image_url 
                        ? Storage::url($collectionRequest->image_url) 
                        : null,
                    'created_at' => $collectionRequest->created_at->format('Y-m-d H:i:s'),
                    'resident' => [
                        'id' => $collectionRequest->resident->id,
                        'name' => $collectionRequest->resident->name,
                        'phone' => $collectionRequest->resident->phone_number,
                        'address' => sprintf(
                            '%s, %s, %s',
                            $collectionRequest->resident->house_no . ' ' . $collectionRequest->resident->street,
                            $collectionRequest->resident->barangay,
                            'Quezon City'
                        ),
                    ],
                    'bin' => $collectionRequest->wasteBin ? [
                        'id' => $collectionRequest->wasteBin->id,
                        'qr_code' => $collectionRequest->wasteBin->qr_code,
                        'bin_type' => $collectionRequest->wasteBin->bin_type,
                    ] : null,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Assigned requests retrieved successfully',
                'data' => $requests
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve assigned requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get detailed information about a specific request
     * 
     * @param int $requestId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getRequestDetails($requestId)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $collectionRequest = CollectionRequest::with([
                'resident:id,name,email,phone_number,house_no,street,barangay,city',
                'wasteBin:id,qr_code,bin_type,status,last_collected',
                'collector:id,first_name,last_name'
            ])
            ->where('id', $requestId)
            ->where('assigned_collector_id', $collectorId)
            ->first();

            if (!$collectionRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Request not found or not assigned to you'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Request details retrieved successfully',
                'data' => [
                    'id' => $collectionRequest->id,
                    'request_type' => $collectionRequest->request_type,
                    'description' => $collectionRequest->description,
                    'preferred_date' => $collectionRequest->preferred_date?->format('Y-m-d'),
                    'preferred_time' => $collectionRequest->preferred_time,
                    'waste_type' => $collectionRequest->waste_type,
                    'priority' => $collectionRequest->priority,
                    'status' => $collectionRequest->status,
                    'resolution_notes' => $collectionRequest->resolution_notes,
                    'completed_at' => $collectionRequest->completed_at?->format('Y-m-d H:i:s'),
                    'image_url' => $collectionRequest->image_url 
                        ? Storage::url($collectionRequest->image_url) 
                        : null,
                    'created_at' => $collectionRequest->created_at->format('Y-m-d H:i:s'),
                    'resident' => [
                        'id' => $collectionRequest->resident->id,
                        'name' => $collectionRequest->resident->name,
                        'email' => $collectionRequest->resident->email,
                        'phone' => $collectionRequest->resident->phone_number,
                        'full_address' => sprintf(
                            '%s, %s, %s, %s',
                            $collectionRequest->resident->house_no . ' ' . $collectionRequest->resident->street,
                            $collectionRequest->resident->barangay,
                            $collectionRequest->resident->city,
                            'Metro Manila'
                        ),
                    ],
                    'bin' => $collectionRequest->wasteBin ? [
                        'id' => $collectionRequest->wasteBin->id,
                        'qr_code' => $collectionRequest->wasteBin->qr_code,
                        'bin_type' => $collectionRequest->wasteBin->bin_type,
                        'status' => $collectionRequest->wasteBin->status,
                        'last_collected' => $collectionRequest->wasteBin->last_collected?->format('Y-m-d H:i:s'),
                    ] : null,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve request details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update request status (accept, start, etc.)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateRequestStatus(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'request_id' => 'required|exists:collection_requests,id',
                'status' => 'required|string|in:pending,accepted,in-progress,completed,cancelled,rejected',
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

            $collectionRequest = CollectionRequest::where('id', $request->request_id)
                ->where('assigned_collector_id', $collectorId)
                ->first();

            if (!$collectionRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Request not found or not assigned to you'
                ], 404);
            }

            // Validate status transitions
            $validTransitions = [
                'pending' => ['accepted', 'rejected', 'cancelled'],
                'accepted' => ['in-progress', 'cancelled'],
                'in-progress' => ['completed', 'cancelled'],
                'completed' => [],
                'cancelled' => [],
                'rejected' => [],
            ];

            if (!in_array($request->status, $validTransitions[$collectionRequest->status] ?? [])) {
                return response()->json([
                    'success' => false,
                    'message' => "Cannot change status from {$collectionRequest->status} to {$request->status}"
                ], 400);
            }

            $updateData = ['status' => $request->status];

            // Add completion timestamp if completed
            if ($request->status === 'completed') {
                $updateData['completed_at'] = Carbon::now();
            }

            // Add notes if provided
            if ($request->has('notes')) {
                $updateData['resolution_notes'] = $request->notes;
            }

            $collectionRequest->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Request status updated successfully',
                'data' => [
                    'id' => $collectionRequest->id,
                    'status' => $collectionRequest->status,
                    'completed_at' => $collectionRequest->completed_at?->format('Y-m-d H:i:s'),
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update request status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Complete a request with resolution details
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function completeRequest(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'request_id' => 'required|exists:collection_requests,id',
                'resolution_notes' => 'required|string|max:1000',
                'waste_weight' => 'nullable|numeric|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $collectorId = Auth::guard('collector')->id();

            $collectionRequest = CollectionRequest::where('id', $request->request_id)
                ->where('assigned_collector_id', $collectorId)
                ->first();

            if (!$collectionRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Request not found or not assigned to you'
                ], 404);
            }

            if ($collectionRequest->status === 'completed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Request is already completed'
                ], 400);
            }

            $collectionRequest->update([
                'status' => 'completed',
                'resolution_notes' => $request->resolution_notes,
                'completed_at' => Carbon::now(),
            ]);

            // Update bin's last_collected timestamp if bin exists
            if ($collectionRequest->bin_id) {
                $collectionRequest->wasteBin()->update([
                    'last_collected' => Carbon::now()
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Request completed successfully',
                'data' => [
                    'id' => $collectionRequest->id,
                    'status' => $collectionRequest->status,
                    'completed_at' => $collectionRequest->completed_at->format('Y-m-d H:i:s'),
                    'resolution_notes' => $collectionRequest->resolution_notes,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to complete request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload photo evidence for completed request
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function uploadRequestPhoto(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'request_id' => 'required|exists:collection_requests,id',
                'photo' => 'required|image|mimes:jpeg,png,jpg|max:5120', // 5MB max
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $collectorId = Auth::guard('collector')->id();

            $collectionRequest = CollectionRequest::where('id', $request->request_id)
                ->where('assigned_collector_id', $collectorId)
                ->first();

            if (!$collectionRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Request not found or not assigned to you'
                ], 404);
            }

            // Delete old photo if exists
            if ($collectionRequest->image_url) {
                Storage::disk('public')->delete($collectionRequest->image_url);
            }

            // Store new photo
            $path = $request->file('photo')->store('request_photos', 'public');

            $collectionRequest->update([
                'image_url' => $path,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Photo uploaded successfully',
                'data' => [
                    'request_id' => $collectionRequest->id,
                    'image_url' => Storage::url($path),
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Photo upload failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get request statistics/summary
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getRequestSummary()
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $summary = [
                'total_assigned' => CollectionRequest::where('assigned_collector_id', $collectorId)->count(),
                'pending' => CollectionRequest::where('assigned_collector_id', $collectorId)
                    ->where('status', 'pending')
                    ->count(),
                'accepted' => CollectionRequest::where('assigned_collector_id', $collectorId)
                    ->where('status', 'accepted')
                    ->count(),
                'in_progress' => CollectionRequest::where('assigned_collector_id', $collectorId)
                    ->where('status', 'in-progress')
                    ->count(),
                'completed' => CollectionRequest::where('assigned_collector_id', $collectorId)
                    ->where('status', 'completed')
                    ->count(),
                'today' => CollectionRequest::where('assigned_collector_id', $collectorId)
                    ->whereDate('preferred_date', Carbon::today())
                    ->whereIn('status', ['pending', 'accepted', 'in-progress'])
                    ->count(),
                'high_priority' => CollectionRequest::where('assigned_collector_id', $collectorId)
                    ->where('priority', 'high')
                    ->whereIn('status', ['pending', 'accepted', 'in-progress'])
                    ->count(),
                'this_week' => CollectionRequest::where('assigned_collector_id', $collectorId)
                    ->whereBetween('preferred_date', [
                        Carbon::now()->startOfWeek(),
                        Carbon::now()->endOfWeek()
                    ])
                    ->whereIn('status', ['pending', 'accepted', 'in-progress'])
                    ->count(),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Request summary retrieved successfully',
                'data' => $summary
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve request summary',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get completed requests history
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCompletedRequests(Request $request)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $query = CollectionRequest::with([
                'resident:id,name,phone_number,house_no,street,barangay',
                'wasteBin:id,qr_code,bin_type'
            ])
            ->where('assigned_collector_id', $collectorId)
            ->where('status', 'completed');

            // Filter by date range
            if ($request->has('start_date')) {
                $query->whereDate('completed_at', '>=', $request->start_date);
            }
            if ($request->has('end_date')) {
                $query->whereDate('completed_at', '<=', $request->end_date);
            }

            $requests = $query->orderBy('completed_at', 'desc')
                ->paginate($request->input('per_page', 15));

            $requests->getCollection()->transform(function ($collectionRequest) {
                return [
                    'id' => $collectionRequest->id,
                    'request_type' => $collectionRequest->request_type,
                    'waste_type' => $collectionRequest->waste_type,
                    'completed_at' => $collectionRequest->completed_at->format('Y-m-d H:i:s'),
                    'resolution_notes' => $collectionRequest->resolution_notes,
                    'resident_name' => $collectionRequest->resident->name,
                    'address' => $collectionRequest->resident->house_no . ' ' . 
                                $collectionRequest->resident->street . ', ' . 
                                $collectionRequest->resident->barangay,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Completed requests retrieved successfully',
                'data' => $requests
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve completed requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Accept/Reject a request
     * 
     * @param Request $request
     * @param int $requestId
     * @return \Illuminate\Http\JsonResponse
     */
    public function respondToRequest(Request $request, $requestId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'action' => 'required|string|in:accept,reject',
                'reason' => 'required_if:action,reject|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $collectorId = Auth::guard('collector')->id();

            $collectionRequest = CollectionRequest::where('id', $requestId)
                ->where('assigned_collector_id', $collectorId)
                ->first();

            if (!$collectionRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Request not found or not assigned to you'
                ], 404);
            }

            if ($collectionRequest->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Can only respond to pending requests'
                ], 400);
            }

            $newStatus = $request->action === 'accept' ? 'accepted' : 'rejected';
            
            $collectionRequest->update([
                'status' => $newStatus,
                'resolution_notes' => $request->action === 'reject' ? $request->reason : null,
            ]);

            return response()->json([
                'success' => true,
                'message' => "Request {$request->action}ed successfully",
                'data' => [
                    'id' => $collectionRequest->id,
                    'status' => $collectionRequest->status,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to respond to request',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}