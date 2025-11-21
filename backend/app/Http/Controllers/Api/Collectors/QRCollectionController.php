<?php

namespace App\Http\Controllers\Api\Collectors;

use App\Http\Controllers\Controller;
use App\Models\QrCollection;
use App\Models\RouteAssignment;
use App\Models\RouteStop;
use App\Models\WasteBin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class QRCollectionController extends Controller
{
    /**
     * Scan and validate QR code
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function scanQRCode(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'qr_code' => 'required|string',
                'assignment_id' => 'required|exists:route_assignments,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $collectorId = Auth::guard('collector')->id();

            // Verify assignment belongs to collector
            $assignment = RouteAssignment::where('id', $request->assignment_id)
                ->where('collector_id', $collectorId)
                ->first();

            if (!$assignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid route assignment'
                ], 403);
            }

            $qrCode = strtolower(trim($request->qr_code));

            // Find waste bin by QR code (case-insensitive)
            $wasteBin = WasteBin::with('resident')
                ->whereRaw('LOWER(qr_code) = ?', [$qrCode])
                ->first();

            if (!$wasteBin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid QR code - Bin not found'
                ], 404);
            }

            // Check if bin is already collected today
            $alreadyCollected = QrCollection::where('bin_id', $wasteBin->id)
                ->where('assignment_id', $request->assignment_id)
                ->whereIn('collection_status', ['completed', 'collected', 'manual', 'successful'])
                ->exists();

            if ($alreadyCollected) {
                return response()->json([
                    'success' => false,
                    'message' => 'This bin has already been collected for this assignment',
                    'data' => [
                        'bin_id' => $wasteBin->id,
                        'already_collected' => true
                    ]
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => 'QR code validated successfully',
                'data' => [
                    'bin' => [
                        'id' => $wasteBin->id,
                        'qr_code' => $wasteBin->qr_code,
                        'bin_type' => $wasteBin->bin_type,
                        'status' => $wasteBin->status,
                        'last_collected' => $wasteBin->last_collected?->format('Y-m-d H:i:s'),
                    ],
                    'resident' => [
                        'id' => $wasteBin->resident->id,
                        'name' => $wasteBin->resident->first_name . ' ' . $wasteBin->resident->last_name,
                        'address' => $wasteBin->resident->address,
                    ],
                    'can_collect' => true,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'QR code scan failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Record a new collection
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function recordCollection(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'bin_id' => 'required|exists:waste_bins,id',
                'assignment_id' => 'required|exists:route_assignments,id',
                'qr_code' => 'required|string',
                'latitude' => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
                'waste_weight' => 'nullable|numeric|min:0',
                'waste_type' => 'nullable|string|in:biodegradable,non-biodegradable,recyclable,hazardous,mixed',
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

            // Verify assignment
            $assignment = RouteAssignment::where('id', $request->assignment_id)
                ->where('collector_id', $collectorId)
                ->first();

            if (!$assignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid route assignment'
                ], 403);
            }

            // Create collection record
            $collection = QrCollection::create([
                'bin_id' => $request->bin_id,
                'collector_id' => $collectorId,
                'assignment_id' => $request->assignment_id,
                'qr_code' => $request->qr_code,
                'collection_timestamp' => Carbon::now(),
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'waste_weight' => $request->waste_weight,
                'waste_type' => $request->waste_type ?? 'mixed',
                'collection_status' => 'collected',
                'notes' => $request->notes,
                'is_verified' => false,
            ]);

            // Update waste bin last collected timestamp
            WasteBin::where('id', $request->bin_id)
                ->update(['last_collected' => Carbon::now()]);

            return response()->json([
                'success' => true,
                'message' => 'Collection recorded successfully',
                'data' => [
                    'collection_id' => $collection->id,
                    'collection_timestamp' => $collection->collection_timestamp->format('Y-m-d H:i:s'),
                    'collection_status' => $collection->collection_status,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to record collection',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Manually mark a stop as collected (fallback when QR scan fails)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function manualCollectStop(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'assignment_id' => 'required|exists:route_assignments,id',
                'stop_id' => 'required|exists:route_stops,id',
                'latitude' => 'nullable|numeric|between:-90,90',
                'longitude' => 'nullable|numeric|between:-180,180',
                'waste_weight' => 'nullable|numeric|min:0',
                'waste_type' => 'nullable|string|in:biodegradable,non-biodegradable,recyclable,hazardous,mixed',
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
                    'message' => 'Invalid route assignment'
                ], 403);
            }

            $stop = RouteStop::with('bin.resident')
                ->where('id', $request->stop_id)
                ->where('route_id', $assignment->route_id)
                ->first();

            if (!$stop) {
                return response()->json([
                    'success' => false,
                    'message' => 'Stop not found for this assignment'
                ], 404);
            }

            // Check if stop has bin_id, if not, check relationship
            $binId = $stop->bin_id;
            if (!$binId && !$stop->bin) {
                return response()->json([
                    'success' => false,
                    'message' => 'This stop is not linked to a registered bin'
                ], 422);
            }

            // Get bin from relationship or load it if we have bin_id
            $bin = $stop->bin;
            if (!$bin && $binId) {
                $bin = WasteBin::with('resident')->find($binId);
            }

            if (!$bin) {
                return response()->json([
                    'success' => false,
                    'message' => 'The waste bin linked to this stop does not exist'
                ], 422);
            }

            $alreadyCollected = QrCollection::where('assignment_id', $assignment->id)
                ->where('bin_id', $bin->id)
                ->whereIn('collection_status', ['completed', 'collected', 'manual', 'successful'])
                ->exists();

            if ($alreadyCollected) {
                return response()->json([
                    'success' => false,
                    'message' => 'This stop has already been marked as collected for this assignment'
                ], 400);
            }

            $collection = QrCollection::create([
                'bin_id' => $bin->id,
                'collector_id' => $collectorId,
                'assignment_id' => $assignment->id,
                'qr_code' => $bin->qr_code,
                'collection_timestamp' => Carbon::now(),
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'waste_weight' => $request->waste_weight,
                'waste_type' => $request->waste_type ?? 'mixed',
                'collection_status' => 'manual',
                'notes' => $request->notes,
                'is_verified' => false,
            ]);

            // Update the stop's completion status
            $stop->update(['is_completed' => true]);

            WasteBin::where('id', $bin->id)
                ->update(['last_collected' => Carbon::now()]);

            return response()->json([
                'success' => true,
                'message' => 'Stop marked as collected successfully',
                'data' => [
                    'collection_id' => $collection->id,
                    'collection_timestamp' => $collection->collection_timestamp->format('Y-m-d H:i:s'),
                    'collection_status' => $collection->collection_status,
                ]
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark stop as collected',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload collection photo
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function uploadPhoto(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'collection_id' => 'required|exists:qr_collections,id',
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

            // Verify collection belongs to collector
            $collection = QrCollection::where('id', $request->collection_id)
                ->where('collector_id', $collectorId)
                ->first();

            if (!$collection) {
                return response()->json([
                    'success' => false,
                    'message' => 'Collection not found or unauthorized'
                ], 404);
            }

            // Delete old photo if exists
            if ($collection->photo_url) {
                Storage::disk('public')->delete($collection->photo_url);
            }

            // Store new photo
            $path = $request->file('photo')->store('collection_photos', 'public');

            // Update collection record
            $collection->update([
                'photo_url' => $path,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Photo uploaded successfully',
                'data' => [
                    'collection_id' => $collection->id,
                    'photo_url' => Storage::url($path),
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
     * Skip a collection with reason
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function skipCollection(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'bin_id' => 'required|exists:waste_bins,id',
                'assignment_id' => 'required|exists:route_assignments,id',
                'qr_code' => 'required|string',
                'skip_reason' => 'required|string|max:500',
                'latitude' => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $collectorId = Auth::guard('collector')->id();

            // Verify assignment
            $assignment = RouteAssignment::where('id', $request->assignment_id)
                ->where('collector_id', $collectorId)
                ->first();

            if (!$assignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid route assignment'
                ], 403);
            }

            // Create skip record
            $collection = QrCollection::create([
                'bin_id' => $request->bin_id,
                'collector_id' => $collectorId,
                'assignment_id' => $request->assignment_id,
                'qr_code' => $request->qr_code,
                'collection_timestamp' => Carbon::now(),
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'collection_status' => 'skipped',
                'skip_reason' => $request->skip_reason,
                'is_verified' => false,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Collection skipped and recorded',
                'data' => [
                    'collection_id' => $collection->id,
                    'collection_status' => $collection->collection_status,
                    'skip_reason' => $collection->skip_reason,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to record skip',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get collection details
     * 
     * @param int $collectionId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCollectionDetails($collectionId)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $collection = QrCollection::with([
                'wasteBin.resident',
                'collector',
                'assignment.route'
            ])
            ->where('id', $collectionId)
            ->where('collector_id', $collectorId)
            ->first();

            if (!$collection) {
                return response()->json([
                    'success' => false,
                    'message' => 'Collection not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Collection details retrieved successfully',
                'data' => [
                    'id' => $collection->id,
                    'qr_code' => $collection->qr_code,
                    'collection_timestamp' => $collection->collection_timestamp->format('Y-m-d H:i:s'),
                    'latitude' => $collection->latitude,
                    'longitude' => $collection->longitude,
                    'waste_weight' => $collection->waste_weight,
                    'waste_type' => $collection->waste_type,
                    'collection_status' => $collection->collection_status,
                    'skip_reason' => $collection->skip_reason,
                    'photo_url' => $collection->photo_url ? Storage::url($collection->photo_url) : null,
                    'notes' => $collection->notes,
                    'is_verified' => $collection->is_verified,
                    'verified_at' => $collection->verified_at?->format('Y-m-d H:i:s'),
                    'bin' => [
                        'id' => $collection->wasteBin->id,
                        'bin_type' => $collection->wasteBin->bin_type,
                        'status' => $collection->wasteBin->status,
                    ],
                    'resident' => [
                        'id' => $collection->wasteBin->resident->id,
                        'name' => $collection->wasteBin->resident->first_name . ' ' . $collection->wasteBin->resident->last_name,
                        'address' => $collection->wasteBin->resident->address,
                    ],
                    'route' => [
                        'id' => $collection->assignment->route->id,
                        'name' => $collection->assignment->route->route_name,
                        'barangay' => $collection->assignment->route->barangay,
                    ]
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve collection details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get collections for current assignment
     * 
     * @param int $assignmentId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAssignmentCollections($assignmentId)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            // Verify assignment belongs to collector
            $assignment = RouteAssignment::where('id', $assignmentId)
                ->where('collector_id', $collectorId)
                ->first();

            if (!$assignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Assignment not found'
                ], 404);
            }

            $collections = QrCollection::with('wasteBin.resident')
                ->where('assignment_id', $assignmentId)
                ->orderBy('collection_timestamp', 'desc')
                ->get()
                ->map(function ($collection) {
                    return [
                        'id' => $collection->id,
                        'qr_code' => $collection->qr_code,
                        'collection_timestamp' => $collection->collection_timestamp->format('Y-m-d H:i:s'),
                        'waste_weight' => $collection->waste_weight,
                        'waste_type' => $collection->waste_type,
                        'collection_status' => $collection->collection_status,
                        'skip_reason' => $collection->skip_reason,
                        'has_photo' => !is_null($collection->photo_url),
                        'bin_type' => $collection->wasteBin->bin_type,
                        'resident_name' => $collection->wasteBin->resident->first_name . ' ' . $collection->wasteBin->resident->last_name,
                    ];
                });

            $summary = [
                'total_collections' => $collections->count(),
                'completed' => $collections->where('collection_status', 'collected')->count(),
                'skipped' => $collections->where('collection_status', 'skipped')->count(),
                'total_weight' => $collections->where('collection_status', 'collected')->sum('waste_weight'),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Collections retrieved successfully',
                'data' => [
                    'collections' => $collections,
                    'summary' => $summary,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve collections',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update collection (edit details)
     * 
     * @param Request $request
     * @param int $collectionId
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateCollection(Request $request, $collectionId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'waste_weight' => 'nullable|numeric|min:0',
                'waste_type' => 'nullable|string|in:biodegradable,non-biodegradable,recyclable,hazardous,mixed',
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

            $collection = QrCollection::where('id', $collectionId)
                ->where('collector_id', $collectorId)
                ->first();

            if (!$collection) {
                return response()->json([
                    'success' => false,
                    'message' => 'Collection not found'
                ], 404);
            }

            $collection->update($request->only(['waste_weight', 'waste_type', 'notes']));

            return response()->json([
                'success' => true,
                'message' => 'Collection updated successfully',
                'data' => [
                    'id' => $collection->id,
                    'waste_weight' => $collection->waste_weight,
                    'waste_type' => $collection->waste_type,
                    'notes' => $collection->notes,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update collection',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete/cancel a collection (within time limit)
     * 
     * @param int $collectionId
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteCollection($collectionId)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $collection = QrCollection::where('id', $collectionId)
                ->where('collector_id', $collectorId)
                ->first();

            if (!$collection) {
                return response()->json([
                    'success' => false,
                    'message' => 'Collection not found'
                ], 404);
            }

            // Only allow deletion within 15 minutes of collection
            $timeLimit = Carbon::now()->subMinutes(15);
            if ($collection->collection_timestamp < $timeLimit) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete collection after 15 minutes'
                ], 400);
            }

            // Delete photo if exists
            if ($collection->photo_url) {
                Storage::disk('public')->delete($collection->photo_url);
            }

            $collection->delete();

            return response()->json([
                'success' => true,
                'message' => 'Collection deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete collection',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}