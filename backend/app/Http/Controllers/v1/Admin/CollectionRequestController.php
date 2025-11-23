<?php

namespace App\Http\Controllers\v1\Admin;

use App\Models\CollectionRequest;
use App\Models\Resident;
use App\Models\WasteBin;
use App\Models\Collector;
use App\Models\Route;
use App\Models\RouteStop;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use App\Trait\ActivityLogsTrait;

class CollectionRequestController extends Controller
{
    use ActivityLogsTrait;

    /**
     * Display a listing of collection requests.
     */
    public function index(Request $request): Response
    {
        $search = $request->get('search', '');
        $page = $request->get('page', 1);
        $statusFilter = $request->get('status', '');
        $priorityFilter = $request->get('priority', '');
        $wasteTypeFilter = $request->get('waste_type', '');
        $assignedFilter = $request->get('assigned', ''); // all, assigned, unassigned

        $query = CollectionRequest::with([
            'resident:id,name,email,phone_number,barangay',
            'wasteBin:id,name,qr_code,bin_type,status',
            'collector:id,name,phone_number,employee_id'
        ])->select('collection_requests.*');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('request_type', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('resolution_notes', 'like', "%{$search}%")
                  ->orWhereHas('resident', function($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  })
                  ->orWhereHas('wasteBin', function($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('qr_code', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by status
        if ($statusFilter && $statusFilter !== 'all') {
            $query->where('status', $statusFilter);
        }

        // Filter by priority
        if ($priorityFilter && $priorityFilter !== 'all') {
            $query->where('priority', $priorityFilter);
        }

        // Filter by waste type
        if ($wasteTypeFilter && $wasteTypeFilter !== 'all') {
            $query->where('waste_type', $wasteTypeFilter);
        }

        // Filter by assignment status
        if ($assignedFilter === 'assigned') {
            $query->whereNotNull('assigned_collector_id');
        } elseif ($assignedFilter === 'unassigned') {
            $query->whereNull('assigned_collector_id');
        }

        $requests = $query->orderByRaw("CASE 
                                                WHEN priority = 'urgent' THEN 1
                                                WHEN priority = 'high' THEN 2
                                                WHEN priority = 'medium' THEN 3
                                                WHEN priority = 'low' THEN 4
                                                ELSE 5
                                            END
                                        ")             
                          ->orderBy('created_at', 'desc')
                          ->paginate(10)
                          ->withQueryString();

        // Get verified residents for dropdown
        $residents = Resident::select('id', 'name', 'email', 'phone_number', 'barangay')
                             ->where('is_verified', true)
                             ->orderBy('name')
                             ->get();

        // Get waste bins for dropdown
        $wasteBins = WasteBin::select('id', 'name', 'qr_code', 'bin_type', 'status')
                             ->orderBy('name')
                             ->get();

        // Get active and verified collectors for dropdown
        $collectors = Collector::where('is_active', true)
                               ->where('is_verified', true)
                               ->select('id', 'name', 'phone_number', 'employee_id')
                               ->orderBy('name')
                               ->get();

        // Get active routes for To-Route action
        $routes = Route::where('is_active', true)
                      ->select('id', 'route_name', 'barangay', 'total_stops')
                      ->orderBy('route_name')
                      ->get();

        return Inertia::render('Admin/CollectionRequestManagement/index', [
            'requests' => $requests,
            'residents' => $residents,
            'wasteBins' => $wasteBins,
            'collectors' => $collectors,
            'routes' => $routes,
            'search' => $search,
            'statusFilter' => $statusFilter,
            'priorityFilter' => $priorityFilter,
            'wasteTypeFilter' => $wasteTypeFilter,
            'assignedFilter' => $assignedFilter,
        ]);
    }


    /**
     * Display the specified collection request.
     */
    public function show(CollectionRequest $collectionRequest): Response
    {
        // Load relationships
        $collectionRequest->load([
            'resident:id,name,email,phone_number,barangay',
            'wasteBin:id,name,qr_code,bin_type,status',
            'collector:id,name,phone_number,employee_id,email'
        ]);

        $this->adminActivityLogs(
            'Collection Request',
            'View',
            'Viewed Collection Request ID: ' . $collectionRequest->id . ' - ' . $collectionRequest->request_type
        );

        return Inertia::render('Admin/CollectionRequestManagement/show', [
            'request' => $collectionRequest,
        ]);
    }

    /**
     * Show the form for editing the specified collection request.
     */
    public function edit(CollectionRequest $collectionRequest): Response
    {
        // Load relationships
        $collectionRequest->load(['resident', 'wasteBin', 'collector']);

        // Get verified residents
        $residents = Resident::select('id', 'name', 'email', 'phone_number', 'barangay')
                             ->where('is_verified', true)
                             ->orderBy('name')
                             ->get();

        // Get waste bins
        $wasteBins = WasteBin::select('id', 'name', 'qr_code', 'bin_type', 'status')
                             ->orderBy('name')
                             ->get();

        // Get active and verified collectors
        $collectors = Collector::where('is_active', true)
                               ->where('is_verified', true)
                               ->select('id', 'name', 'phone_number', 'employee_id')
                               ->orderBy('name')
                               ->get();

        $this->adminActivityLogs(
            'Collection Request',
            'Edit',
            'Edit Collection Request ID: ' . $collectionRequest->id . ' - ' . $collectionRequest->request_type
        );

        return Inertia::render('Admin/CollectionRequestManagement/edit', [
            'request' => $collectionRequest,
            'residents' => $residents,
            'wasteBins' => $wasteBins,
            'collectors' => $collectors,
        ]);
    }

    /**
     * Update the specified collection request in storage.
     */
    public function update(Request $request, CollectionRequest $collectionRequest)
    {
        // Store original values for logging
        $originalBinId = $collectionRequest->bin_id;
        $originalBinName = $collectionRequest->wasteBin->name ?? 'N/A';
        
        $validated = $request->validate([
            'user_id' => 'required|exists:residents,id',
            'bin_id' => 'required|exists:waste_bins,id',
            'request_type' => 'required|string|max:255',
            'description' => 'nullable|string',
            'preferred_date' => 'nullable|date',
            'preferred_time' => 'nullable|date_format:H:i',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'waste_type' => 'required|in:biodegradable,non-biodegradable,recyclable,special,all',
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'priority' => 'required|in:low,medium,high,urgent',
            'status' => 'required|in:pending,assigned,in_progress,completed,cancelled',
            'assigned_collector_id' => 'nullable|exists:collectors,id',
            'resolution_notes' => 'nullable|string',
        ]);

        // Verify the request ID matches (safety check)
        $requestId = $request->route('collectionRequest');
        if ($requestId && $requestId->id !== $collectionRequest->id) {
            return back()->withErrors(['error' => 'Request ID mismatch. Please refresh and try again.'])
                ->withInput();
        }

        DB::beginTransaction();
        try {
            // Get the new bin to verify it exists and get its name for logging
            $newBin = WasteBin::findOrFail($validated['bin_id']);
            
            // Handle image upload
            $imagePath = null;
            if ($request->hasFile('image')) {
                // Delete old image if exists
                if ($collectionRequest->image_url) {
                    $oldImagePath = str_replace('/storage/', '', $collectionRequest->image_url);
                    Storage::disk('public')->delete($oldImagePath);
                }
                
                $imagePath = $request->file('image')->store('collection-requests', 'public');
                $validated['image_url'] = Storage::url($imagePath);
            }

            $updateData = [
                'user_id' => $validated['user_id'],
                'bin_id' => $validated['bin_id'], // Explicitly use validated bin_id
                'request_type' => $validated['request_type'],
                'description' => $validated['description'] ?? null,
                'preferred_date' => $validated['preferred_date'] ?? null,
                'preferred_time' => $validated['preferred_time'] ?? null,
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
                'waste_type' => $validated['waste_type'],
                'priority' => $validated['priority'],
                'status' => $validated['status'],
                'assigned_collector_id' => $validated['assigned_collector_id'] ?? null,
                'resolution_notes' => $validated['resolution_notes'] ?? null,
            ];

            if (isset($validated['image_url'])) {
                $updateData['image_url'] = $validated['image_url'];
            }

            // Set completed_at timestamp if status is completed
            if ($validated['status'] === 'completed' && $collectionRequest->status !== 'completed') {
                $updateData['completed_at'] = now();
            }

            // Update the collection request
            $collectionRequest->update($updateData);
            
            // Refresh to ensure we have the latest data
            $collectionRequest->refresh();
            $collectionRequest->load(['resident', 'wasteBin', 'collector']);

            // Verify the bin_id was actually updated correctly
            if ($collectionRequest->bin_id != $validated['bin_id']) {
                throw new \Exception('Failed to update bin_id. Expected: ' . $validated['bin_id'] . ', Got: ' . $collectionRequest->bin_id);
            }

            DB::commit();

            $this->adminActivityLogs(
                'Collection Request',
                'Update',
                'Updated Collection Request ID: ' . $collectionRequest->id . 
                ' - Bin changed from "' . $originalBinName . '" (ID: ' . $originalBinId . ') to "' . 
                ($newBin->name ?? 'N/A') . '" (ID: ' . $validated['bin_id'] . ')'
            );

            return redirect()->route('admin.collection-request-management.index')
                ->with('success', 'Collection request updated successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            
            // Delete newly uploaded image if transaction failed
            if (isset($imagePath)) {
                Storage::disk('public')->delete($imagePath);
            }
            
            Log::error('Collection Request Update Failed', [
                'request_id' => $collectionRequest->id,
                'error' => $e->getMessage(),
                'validated_bin_id' => $validated['bin_id'] ?? null,
                'current_bin_id' => $collectionRequest->bin_id,
            ]);
            
            return back()->withErrors(['error' => 'Failed to update collection request: ' . $e->getMessage()])
                ->withInput();
        }
    }


    /**
     * Assign a collector to a collection request.
     */
    public function assign(Request $request, CollectionRequest $collectionRequest)
    {
        $validated = $request->validate([
            'assigned_collector_id' => 'required|exists:collectors,id',
        ]);

        // Verify the collector is active and verified
        $collector = Collector::where('id', $validated['assigned_collector_id'])
            ->where('is_active', true)
            ->where('is_verified', true)
            ->first();

        if (!$collector) {
            return back()->withErrors(['error' => 'Selected collector is not active or verified']);
        }

        // Update the collection request with the assigned collector
        $collectionRequest->update([
            'assigned_collector_id' => $validated['assigned_collector_id'],
            'status' => 'assigned',
        ]);

        $collectionRequest->load(['resident', 'wasteBin', 'collector']);

        $this->adminActivityLogs(
            'Collection Request',
            'Assign',
            'Assigned Collector ' . $collector->name . ' to Collection Request ID: ' . $collectionRequest->id . ' (Bin: ' . ($collectionRequest->wasteBin->name ?? 'N/A') . ')'
        );

        return back()->with('success', 'Collector assigned successfully');
    }

    /**
     * Start progress on a collection request.
     */
    public function startProgress(CollectionRequest $collectionRequest)
    {
        if (!$collectionRequest->assigned_collector_id) {
            return back()->withErrors(['error' => 'Cannot start progress without assigned collector']);
        }

        $collectionRequest->update([
            'status' => 'in_progress',
        ]);

        $this->adminActivityLogs(
            'Collection Request',
            'Start Progress',
            'Started progress on Collection Request ID: ' . $collectionRequest->id . ' - ' . $collectionRequest->request_type
        );

        return back()->with('success', 'Collection request started successfully');
    }

    /**
     * Complete a collection request.
     */
    public function complete(CollectionRequest $collectionRequest)
    {
        $collectionRequest->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        $this->adminActivityLogs(
            'Collection Request',
            'Complete',
            'Completed Collection Request ID: ' . $collectionRequest->id . ' - ' . $collectionRequest->request_type
        );

        return back()->with('success', 'Collection request completed successfully');
    }

    /**
     * Add collection request to a route by creating a route stop.
     */
    public function toRoute(Request $request, CollectionRequest $collectionRequest)
    {
        $validated = $request->validate([
            'route_id' => 'required|exists:routes,id',
        ]);

        // Verify the route exists (removed active check - allow inactive routes too)
        $route = Route::findOrFail($validated['route_id']);

        // Check if this specific collection request is already added to this route
        // Check by looking for a stop with notes containing this collection request ID
        $existingStop = RouteStop::where('route_id', $validated['route_id'])
                                 ->where('notes', 'like', '%Collection Request #' . $collectionRequest->id . '%')
                                 ->first();

        if ($existingStop) {
            return back()->withErrors([
                'error' => 'This collection request is already added to the selected route.'
            ]);
        }

        DB::beginTransaction();
        try {
            // Get the next stop order (max stop_order + 1 for this route)
            $maxStopOrder = RouteStop::where('route_id', $validated['route_id'])
                                    ->max('stop_order') ?? 0;
            $nextStopOrder = $maxStopOrder + 1;

            // Load relationships for logging
            $collectionRequest->load(['resident', 'wasteBin']);
            
            // Get stop address - use resident address, description, or default
            $stopAddress = $collectionRequest->resident->full_address ?? 
                          ($collectionRequest->description ?? 'Collection Request Location');

            // Use coordinates from collection request, or set defaults if missing
            $latitude = $collectionRequest->latitude ?? 0;
            $longitude = $collectionRequest->longitude ?? 0;

            // Create the route stop (bin_id is optional - allow null)
            $routeStop = RouteStop::create([
                'route_id' => $validated['route_id'],
                'bin_id' => $collectionRequest->bin_id, // Can be null
                'stop_order' => $nextStopOrder,
                'stop_address' => $stopAddress,
                'latitude' => $latitude,
                'longitude' => $longitude,
                'notes' => 'Added from Collection Request #' . $collectionRequest->id . ' - ' . $collectionRequest->request_type,
            ]);

            // Update the route's total_stops count
            $route->increment('total_stops');

            // Update collection request status to 'assigned' if it's still 'pending'
            if ($collectionRequest->status === 'pending') {
                $collectionRequest->update(['status' => 'assigned']);
            }

            DB::commit();

            $this->adminActivityLogs(
                'Collection Request',
                'Add to Route',
                'Added Collection Request ID: ' . $collectionRequest->id . 
                ' (Bin: ' . ($collectionRequest->wasteBin->name ?? 'N/A') . ') to Route: ' . 
                $route->route_name . ' (' . $route->barangay . ') as Stop #' . $nextStopOrder
            );

            return back()->with('success', 'Collection request added to route successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Add Collection Request to Route Failed', [
                'request_id' => $collectionRequest->id,
                'route_id' => $validated['route_id'],
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return back()->withErrors([
                'error' => 'Failed to add collection request to route: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Remove the specified collection request from storage.
     */
    public function destroy(CollectionRequest $collectionRequest)
    {
        // Delete associated image if exists
        if ($collectionRequest->image_url) {
            $imagePath = str_replace('/storage/', '', $collectionRequest->image_url);
            Storage::disk('public')->delete($imagePath);
        }

        $requestType = $collectionRequest->request_type;
        $requestId = $collectionRequest->id;

        $this->adminActivityLogs(
            'Collection Request',
            'Delete',
            'Deleted Collection Request ID: ' . $requestId . ' - ' . $requestType
        );

        $collectionRequest->delete();

        return redirect()->route('admin.collection-request-management.index')
            ->with('success', 'Collection request deleted successfully');
    }

    /**
     * Get collection request statistics for dashboard.
     */
    public function statistics(): Response
    {
        $stats = [
            'total_requests' => CollectionRequest::count(),
            'pending_requests' => CollectionRequest::where('status', 'pending')->count(),
            'assigned_requests' => CollectionRequest::where('status', 'assigned')->count(),
            'in_progress_requests' => CollectionRequest::where('status', 'in_progress')->count(),
            'completed_requests' => CollectionRequest::where('status', 'completed')->count(),
            'cancelled_requests' => CollectionRequest::where('status', 'cancelled')->count(),
            'urgent_requests' => CollectionRequest::where('priority', 'urgent')
                ->whereIn('status', ['pending', 'assigned', 'in_progress'])
                ->count(),
            'unassigned_requests' => CollectionRequest::whereNull('assigned_collector_id')
                ->where('status', 'pending')
                ->count(),
            'requests_by_waste_type' => CollectionRequest::selectRaw('waste_type, COUNT(*) as count')
                ->groupBy('waste_type')
                ->orderBy('count', 'desc')
                ->get(),
            'requests_by_priority' => CollectionRequest::selectRaw('priority, COUNT(*) as count')
                ->groupBy('priority')
                ->orderByRaw ("CASE 
                                    WHEN priority = 'urgent' THEN 1
                                    WHEN priority = 'high' THEN 2
                                    WHEN priority = 'medium' THEN 3
                                    WHEN priority = 'low' THEN 4
                                    ELSE 5
                                    END            
                            ")
                ->get(),
            'recent_requests' => CollectionRequest::with([
                'resident:id,name', 
                'wasteBin:id,name,qr_code',
                'collector:id,name'
            ])
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get(),
            'avg_completion_time' => CollectionRequest::whereNotNull('completed_at')
                ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, created_at, completed_at)) as avg_hours')
                ->value('avg_hours'),
        ];

        $this->adminActivityLogs(
            'Collection Request',
            'View Statistics',
            'Viewed Collection Request Statistics Dashboard'
        );

        return Inertia::render('Admin/CollectionRequestManagement/statistics', [
            'statistics' => $stats,
        ]);
    }
}