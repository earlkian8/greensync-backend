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

        // Refresh to get latest data
        $collectionRequest->refresh();
        
        // Get fresh resident data directly from database to avoid stale relationship data
        $resident = Resident::find($collectionRequest->user_id);
        if (!$resident) {
            return back()->withErrors(['error' => 'Collection request must have an associated resident']);
        }

        // Get fresh bin data directly from database
        $wasteBin = WasteBin::find($collectionRequest->bin_id);
        if (!$wasteBin) {
            return back()->withErrors(['error' => 'Collection request must have an associated waste bin']);
        }

        if (!$collectionRequest->latitude || !$collectionRequest->longitude) {
            return back()->withErrors(['error' => 'Collection request must have latitude and longitude coordinates']);
        }

        // Check if request is already assigned to a route
        $existingStop = RouteStop::where('bin_id', $collectionRequest->bin_id)
            ->whereHas('route', function($q) {
                $q->where('is_active', true);
            })
            ->first();

        if ($existingStop) {
            return back()->withErrors(['error' => 'This collection request is already assigned to route: ' . $existingStop->route->route_name]);
        }

        DB::beginTransaction();
        try {
            $route = Route::findOrFail($validated['route_id']);

            // Validate route is active
            if (!$route->is_active) {
                return back()->withErrors(['error' => 'Selected route is not active']);
            }

            // Validate route barangay matches resident barangay (warning, not blocking)
            if ($route->barangay !== $resident->barangay) {
                // Log warning but allow it
                Log::warning('Route barangay mismatch', [
                    'route_barangay' => $route->barangay,
                    'resident_barangay' => $resident->barangay,
                    'route_id' => $route->id,
                    'request_id' => $collectionRequest->id
                ]);
            }

            // Check if this bin is already in this route
            $existingBinInRoute = RouteStop::where('route_id', $route->id)
                ->where('bin_id', $collectionRequest->bin_id)
                ->first();

            if ($existingBinInRoute) {
                return back()->withErrors(['error' => 'This waste bin is already a stop in the selected route (Stop #' . $existingBinInRoute->stop_order . ')']);
            }

            $maxStopOrder = RouteStop::where('route_id', $route->id)->max('stop_order') ?? 0;
            
            // Build base address from fresh resident data - use full_address if available, otherwise build it
            $baseAddress = $resident->full_address ?? trim(implode(', ', array_filter([
                $resident->house_no,
                $resident->street,
                $resident->barangay,
                $resident->city,
                $resident->province,
            ])));

            // Make stop address unique by including bin name and resident name
            // This ensures different stops have different addresses even if they share coordinates
            $stopAddressParts = [];
            
            // Add bin name for uniqueness
            if ($wasteBin->name) {
                $stopAddressParts[] = $wasteBin->name;
            }
            
            // Add resident name for clarity
            if ($resident->name) {
                $stopAddressParts[] = $resident->name;
            }
            
            // Add base address
            if ($baseAddress) {
                $stopAddressParts[] = $baseAddress;
            } else {
                $stopAddressParts[] = $resident->barangay;
            }
            
            // Add coordinates as a unique identifier (formatted for readability)
            $stopAddressParts[] = sprintf('(%.6f, %.6f)', $collectionRequest->latitude, $collectionRequest->longitude);
            
            $stopAddress = implode(' - ', $stopAddressParts);

            $routeStop = RouteStop::create([
                'route_id' => $route->id,
                'bin_id' => $collectionRequest->bin_id,
                'stop_order' => $maxStopOrder + 1,
                'stop_address' => $stopAddress,
                'latitude' => $collectionRequest->latitude,
                'longitude' => $collectionRequest->longitude,
                'estimated_time' => $collectionRequest->preferred_time,
                'notes' => 'Collection Request: ' . $collectionRequest->request_type . 
                          ($collectionRequest->description ? ' - ' . $collectionRequest->description : ''),
            ]);

            $route->increment('total_stops');
            $collectionRequest->update(['status' => 'assigned']);

            DB::commit();

            $this->adminActivityLogs(
                'Collection Request',
                'To Route',
                'Added Collection Request ID: ' . $collectionRequest->id . 
                ' (Bin: "' . $wasteBin->name . '") to Route: ' . $route->route_name . 
                ' as Stop #' . $routeStop->stop_order
            );

            return back()->with('success', 'Collection request added to route successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to add collection request to route', [
                'request_id' => $collectionRequest->id,
                'route_id' => $validated['route_id'],
                'error' => $e->getMessage()
            ]);
            return back()->withErrors(['error' => 'Failed to add collection request to route: ' . $e->getMessage()]);
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