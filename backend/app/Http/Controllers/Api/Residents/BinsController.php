<?php

namespace App\Http\Controllers\Api\Residents;

use App\Http\Controllers\Controller;
use App\Models\WasteBin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class BinsController extends Controller
{
    /** Get all bins for the authenticated resident */
    public function index(Request $request)
    {
        $resident = $request->user();
        
        $bins = WasteBin::where('resident_id', $resident->id)
                        ->with(['collectionRequests' => function($query) {
                            $query->latest()->limit(5);
                        }])
                        ->get();

        return response()->json([
            'message' => 'Bins fetched successfully.',
            'bins' => $bins
        ]);
    }

    /** Get specific bin */
    public function show(Request $request, $id)
    {
        $resident = $request->user();
        
        $bin = WasteBin::where('resident_id', $resident->id)
                       ->with(['collectionRequests', 'qrCollections'])
                       ->findOrFail($id);

        return response()->json([
            'message' => 'Bin fetched successfully.',
            'bin' => $bin
        ]);
    }

    /** Store new bin */
    public function store(Request $request)
    {
        $resident = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'qr_code' => 'required|string|unique:waste_bins,qr_code',
            'bin_type' => 'required|string|in:biodegradable,non-biodegradable,recyclable,hazardous',
            'status' => 'nullable|string|in:active,inactive,full,damaged',
        ]);

        $validated['resident_id'] = $resident->id;
        $validated['registered_at'] = now();

        DB::beginTransaction();
        try {
            $bin = WasteBin::create($validated);
            
            DB::commit();

            return response()->json([
                'message' => 'Bin registered successfully.',
                'bin' => $bin
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Failed to create waste bin', [
                'resident_id' => $resident->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Failed to register bin. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /** Update bin */
    public function update(Request $request, $id)
    {
        $resident = $request->user();

        $bin = WasteBin::where('resident_id', $resident->id)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'bin_type' => 'sometimes|required|string|in:biodegradable,non-biodegradable,recyclable,hazardous',
            'status' => 'sometimes|required|string|in:active,inactive,full,damaged',
        ]);

        DB::beginTransaction();
        try {
            $bin->update($validated);
            
            DB::commit();

            return response()->json([
                'message' => 'Bin updated successfully.',
                'bin' => $bin->fresh()
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Failed to update waste bin', [
                'bin_id' => $bin->id,
                'resident_id' => $resident->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Failed to update bin. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /** Delete bin */
    public function destroy(Request $request, $id)
    {
        $resident = $request->user();

        $bin = WasteBin::where('resident_id', $resident->id)->findOrFail($id);
        
        DB::beginTransaction();
        try {
            $bin->delete();
            
            DB::commit();

            return response()->json([
                'message' => 'Bin deleted successfully.'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Failed to delete waste bin', [
                'bin_id' => $bin->id,
                'resident_id' => $resident->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Failed to delete bin. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /** Mark bin as collected */
    // public function markCollected(Request $request, $id)
    // {
    //     $resident = $request->user();

    //     $bin = WasteBin::where('resident_id', $resident->id)->findOrFail($id);
    //     $bin->update([
    //         'last_collected' => now(),
    //         'status' => 'active'
    //     ]);

    //     return response()->json([
    //         'message' => 'Bin marked as collected successfully.',
    //         'bin' => $bin
    //     ]);
    // }

    /** Get bin by QR code */
    public function getByQrCode(Request $request)
    {
        $resident = $request->user();

        $request->validate([
            'qr_code' => 'required|string'
        ]);

        $bin = WasteBin::where('resident_id', $resident->id)
                       ->where('qr_code', $request->qr_code)
                       ->with(['collectionRequests', 'qrCollections'])
                       ->first();

        if (!$bin) {
            throw ValidationException::withMessages([
                'qr_code' => ['Bin not found for this resident.'],
            ]);
        }

        return response()->json([
            'message' => 'Bin fetched successfully.',
            'bin' => $bin
        ]);
    }
}