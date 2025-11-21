<?php

namespace App\Http\Controllers\Api\Collectors;

use App\Http\Controllers\Controller;
use App\Models\QrCollection;
use App\Models\RouteAssignment;
use App\Models\RouteStop;
use App\Models\WasteBin;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
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

            $assignment = RouteAssignment::where('id', $request->assignment_id)
                ->where('collector_id', $collectorId)
                ->firstOrFail();

            $wasteBin = WasteBin::with('resident')
                ->whereRaw('LOWER(qr_code) = ?', [strtolower(trim($request->qr_code))])
                ->firstOrFail();

            if (QrCollection::where('bin_id', $wasteBin->id)
                ->where('assignment_id', $request->assignment_id)
                ->whereIn('collection_status', ['completed', 'collected', 'manual', 'successful'])
                ->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'This bin has already been collected for this assignment',
                    'data' => ['bin_id' => $wasteBin->id, 'already_collected' => true]
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
                        'name' => $wasteBin->resident->name,
                        'address' => $wasteBin->resident->full_address ?? $wasteBin->resident->address,
                    ],
                    'can_collect' => true,
                ]
            ], 200);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid QR code - Bin not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'QR code scan failed',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
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
                'waste_type' => 'nullable|string|in:biodegradable,non-biodegradable,recyclable,special,all,mixed,hazardous',
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

            RouteAssignment::where('id', $request->assignment_id)
                ->where('collector_id', $collectorId)
                ->firstOrFail();

            if (QrCollection::where('assignment_id', $request->assignment_id)
                ->where('bin_id', $request->bin_id)
                ->whereIn('collection_status', ['completed', 'collected', 'manual', 'successful'])
                ->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'This bin has already been collected for this assignment'
                ], 400);
            }

            // Map 'mixed' and 'hazardous' to database-compatible values
            $wasteType = $request->waste_type ?? 'mixed';
            if ($wasteType === 'mixed' || $wasteType === 'hazardous') {
                $wasteType = 'all'; // Map to 'all' which represents mixed waste in database
            }

            $collection = QrCollection::create([
                'bin_id' => $request->bin_id,
                'collector_id' => $collectorId,
                'assignment_id' => $request->assignment_id,
                'qr_code' => $request->qr_code,
                'collection_timestamp' => Carbon::now(),
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'waste_weight' => $request->waste_weight,
                'waste_type' => $wasteType,
                'collection_status' => 'collected',
                'notes' => $request->notes,
                'is_verified' => false,
            ]);

            WasteBin::where('id', $request->bin_id)->update(['last_collected' => Carbon::now()]);

            return response()->json([
                'success' => true,
                'message' => 'Collection recorded successfully',
                'data' => [
                    'collection_id' => $collection->id,
                    'collection_timestamp' => $collection->collection_timestamp->format('Y-m-d H:i:s'),
                    'collection_status' => $collection->collection_status,
                ]
            ], 201);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid route assignment'
            ], 403);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to record collection',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
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
                'waste_type' => 'nullable|string|in:biodegradable,non-biodegradable,recyclable,special,all,mixed,hazardous',
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

            // Verify assignment belongs to the collector
            $assignment = RouteAssignment::where('id', $request->assignment_id)
                ->where('collector_id', $collectorId)
                ->firstOrFail();

            // Get the route stop and verify it belongs to the assignment's route
            $routeStop = RouteStop::where('id', $request->stop_id)
                ->where('route_id', $assignment->route_id)
                ->with('bin')
                ->firstOrFail();

            // Verify the stop has a bin_id
            if (!$routeStop->bin_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'This stop is not linked to a waste bin'
                ], 400);
            }

            $binId = $routeStop->bin_id;
            $wasteBin = $routeStop->bin;

            if (!$wasteBin) {
                $wasteBin = WasteBin::findOrFail($binId);
            }

            // Check if already collected
            if (QrCollection::where('assignment_id', $request->assignment_id)
                ->where('bin_id', $binId)
                ->whereIn('collection_status', ['completed', 'collected', 'manual', 'successful'])
                ->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'This bin has already been collected for this assignment'
                ], 400);
            }

            // Map 'mixed' and 'hazardous' to database-compatible values
            $wasteType = $request->waste_type ?? 'mixed';
            if ($wasteType === 'mixed' || $wasteType === 'hazardous') {
                $wasteType = 'all'; // Map to 'all' which represents mixed waste in database
            }

            // Use request coordinates if provided, otherwise use stop coordinates
            $latitude = $request->latitude ?? $routeStop->latitude;
            $longitude = $request->longitude ?? $routeStop->longitude;

            // Create manual collection record
            $collection = QrCollection::create([
                'bin_id' => $binId,
                'collector_id' => $collectorId,
                'assignment_id' => $request->assignment_id,
                'qr_code' => $wasteBin->qr_code,
                'collection_timestamp' => Carbon::now(),
                'latitude' => $latitude,
                'longitude' => $longitude,
                'waste_weight' => $request->waste_weight,
                'waste_type' => $wasteType,
                'collection_status' => 'manual',
                'notes' => $request->notes,
                'is_verified' => false,
            ]);

            // Update waste bin's last_collected timestamp
            WasteBin::where('id', $binId)->update(['last_collected' => Carbon::now()]);

            return response()->json([
                'success' => true,
                'message' => 'Stop marked as collected successfully',
                'data' => [
                    'collection_id' => $collection->id,
                    'collection_timestamp' => $collection->collection_timestamp->format('Y-m-d H:i:s'),
                    'collection_status' => $collection->collection_status,
                ]
            ], 201);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid route assignment or stop'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Manual collect stop failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark stop as collected',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

}