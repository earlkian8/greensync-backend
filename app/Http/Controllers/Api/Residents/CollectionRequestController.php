<?php

namespace App\Http\Controllers\Api\Residents;

use App\Http\Controllers\Controller;
use App\Models\CollectionRequest;
use App\Models\WasteBin;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CollectionRequestController extends Controller
{
    public function store(Request $request)
    {
        $resident = $request->user();

        $validated = $request->validate([
            'bin_id' => 'required|exists:waste_bins,id',
            'request_type' => 'required|string|in:regular,special,bulk,emergency',
            'description' => 'nullable|string|max:500',
            'preferred_date' => 'required|date|after_or_equal:today',
            'preferred_time' => 'required|date_format:H:i',
            'waste_type' => 'required|string|in:biodegradable,non-biodegradable,recyclable,hazardous,mixed',
            'image_url' => 'nullable|url|max:255',
            'priority' => 'nullable|string|in:low,medium,high,urgent',
        ]);

        // Verify that the bin belongs to the resident
        $bin = WasteBin::where('id', $validated['bin_id'])
                       ->where('resident_id', $resident->id)
                       ->first();

        if (!$bin) {
            throw ValidationException::withMessages([
                'bin_id' => ['Bin not found or does not belong to you.'],
            ]);
        }

        // Set default values
        $validated['user_id'] = $resident->id;
        $validated['status'] = 'pending';
        $validated['priority'] = $validated['priority'] ?? 'medium';

        $collectionRequest = CollectionRequest::create($validated);

        return response()->json([
            'message' => 'Collection request submitted successfully.',
            'collection_request' => $collectionRequest->load('wasteBin')
        ], 201);
    }
}
