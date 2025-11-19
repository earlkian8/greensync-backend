<?php

namespace App\Http\Controllers\v1\Admin;

use App\Models\CollectionRequest;
use App\Models\Resident;
use App\Models\WasteBin;
use App\Models\Collector;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
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
            'wasteBin:id,name,qr_code,bin_type',
            'collector:id,name,phone_number,employee_id'
        ]);

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

        return Inertia::render('Admin/CollectionRequestManagement/index', [
            'requests' => $requests,
            'residents' => $residents,
            'wasteBins' => $wasteBins,
            'collectors' => $collectors,
            'search' => $search,
            'statusFilter' => $statusFilter,
            'priorityFilter' => $priorityFilter,
            'wasteTypeFilter' => $wasteTypeFilter,
            'assignedFilter' => $assignedFilter,
        ]);
    }

    /**
     * Show the form for creating a new collection request.
     */
    public function create(): Response
    {
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

        return Inertia::render('Admin/CollectionRequestManagement/add', [
            'residents' => $residents,
            'wasteBins' => $wasteBins,
            'collectors' => $collectors,
        ]);
    }

    /**
     * Store a newly created collection request in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:residents,id',
            'bin_id' => 'required|exists:waste_bins,id',
            'request_type' => 'required|string|max:255',
            'description' => 'nullable|string',
            'preferred_date' => 'nullable|date',
            'preferred_time' => 'nullable|date_format:H:i',
            'waste_type' => 'required|in:biodegradable,non-biodegradable,recyclable,special,all',
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'priority' => 'required|in:low,medium,high,urgent',
            'status' => 'nullable|in:pending,assigned,in_progress,completed,cancelled',
            'assigned_collector_id' => 'nullable|exists:collectors,id',
            'resolution_notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // Handle image upload
            $imageUrl = null;
            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store('collection-requests', 'public');
                $imageUrl = Storage::url($imagePath);
            }

            $requestData = [
                'user_id' => $validated['user_id'],
                'bin_id' => $validated['bin_id'],
                'request_type' => $validated['request_type'],
                'description' => $validated['description'] ?? null,
                'preferred_date' => $validated['preferred_date'] ?? null,
                'preferred_time' => $validated['preferred_time'] ?? null,
                'waste_type' => $validated['waste_type'],
                'image_url' => $imageUrl,
                'priority' => $validated['priority'],
                'status' => $validated['status'] ?? 'pending',
                'assigned_collector_id' => $validated['assigned_collector_id'] ?? null,
                'resolution_notes' => $validated['resolution_notes'] ?? null,
            ];

            $collectionRequest = CollectionRequest::create($requestData);
            $collectionRequest->load(['resident', 'wasteBin', 'collector']);

            DB::commit();

            $this->adminActivityLogs(
                'Collection Request',
                'Add',
                'Created Collection Request: ' . $collectionRequest->request_type . ' for ' . $collectionRequest->resident->name
            );

            return redirect()->route('admin.collection-request-management.index')
                ->with('success', 'Collection request created successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            
            // Delete uploaded image if transaction failed
            if (isset($imagePath)) {
                Storage::disk('public')->delete($imagePath);
            }
            
            return back()->withErrors(['error' => 'Failed to create collection request: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Display the specified collection request.
     */
    public function show(CollectionRequest $collectionRequest): Response
    {
        // Load relationships
        $collectionRequest->load([
            'resident:id,name,email,phone_number,barangay,address',
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
        $validated = $request->validate([
            'user_id' => 'required|exists:residents,id',
            'bin_id' => 'required|exists:waste_bins,id',
            'request_type' => 'required|string|max:255',
            'description' => 'nullable|string',
            'preferred_date' => 'nullable|date',
            'preferred_time' => 'nullable|date_format:H:i',
            'waste_type' => 'required|in:biodegradable,non-biodegradable,recyclable,special,all',
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'priority' => 'required|in:low,medium,high,urgent',
            'status' => 'required|in:pending,assigned,in_progress,completed,cancelled',
            'assigned_collector_id' => 'nullable|exists:collectors,id',
            'resolution_notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
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
                'bin_id' => $validated['bin_id'],
                'request_type' => $validated['request_type'],
                'description' => $validated['description'] ?? null,
                'preferred_date' => $validated['preferred_date'] ?? null,
                'preferred_time' => $validated['preferred_time'] ?? null,
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

            $collectionRequest->update($updateData);
            $collectionRequest->load(['resident', 'wasteBin', 'collector']);

            DB::commit();

            $this->adminActivityLogs(
                'Collection Request',
                'Update',
                'Updated Collection Request: ' . $collectionRequest->request_type . ' for ' . $collectionRequest->resident->name
            );

            return redirect()->route('admin.collection-request-management.index')
                ->with('success', 'Collection request updated successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            
            // Delete newly uploaded image if transaction failed
            if (isset($imagePath)) {
                Storage::disk('public')->delete($imagePath);
            }
            
            return back()->withErrors(['error' => 'Failed to update collection request: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Assign a collector to the collection request.
     */
    public function assign(Request $request, CollectionRequest $collectionRequest)
    {
        $validated = $request->validate([
            'assigned_collector_id' => 'required|exists:collectors,id',
        ]);

        $collectionRequest->update([
            'assigned_collector_id' => $validated['assigned_collector_id'],
            'status' => 'assigned',
        ]);

        $collectionRequest->load('collector');

        $this->adminActivityLogs(
            'Collection Request',
            'Assign',
            'Assigned Collection Request ID: ' . $collectionRequest->id . ' to Collector: ' . $collectionRequest->collector->name
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
     * Cancel a collection request.
     */
    public function cancel(CollectionRequest $collectionRequest)
    {
        $collectionRequest->update([
            'status' => 'cancelled',
        ]);

        $this->adminActivityLogs(
            'Collection Request',
            'Cancel',
            'Cancelled Collection Request ID: ' . $collectionRequest->id . ' - ' . $collectionRequest->request_type
        );

        return back()->with('success', 'Collection request cancelled successfully');
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