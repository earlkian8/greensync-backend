<?php

namespace App\Http\Controllers\v1\Admin;

use App\Models\CollectionSchedule;
use App\Models\Resident;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use App\Trait\ActivityLogsTrait;

class CollectionScheduleController extends Controller
{
    use ActivityLogsTrait;

    /**
     * Display a listing of collection schedules.
     */
    public function index(Request $request): Response
    {
        $search = $request->get('search', '');
        $page = $request->get('page', 1);
        $statusFilter = $request->get('status', ''); // all, active, inactive
        $barangayFilter = $request->get('barangay', '');
        $dayFilter = $request->get('day', '');

        $query = CollectionSchedule::with('creator:id,name,email');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('barangay', 'like', "%{$search}%")
                  ->orWhere('collection_day', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($statusFilter === 'active') {
            $query->where('is_active', true);
        } elseif ($statusFilter === 'inactive') {
            $query->where('is_active', false);
        }

        // Filter by barangay
        if ($barangayFilter) {
            $query->where('barangay', $barangayFilter);
        }

        // Filter by day
        if ($dayFilter) {
            $query->where('collection_day', $dayFilter);
        }

        $schedules = $query->orderBy('collection_day')
                          ->orderBy('collection_time')
                          ->paginate(10)
                          ->withQueryString();

        // Get unique barangays for filter dropdown
        $barangays = CollectionSchedule::select('barangay')
                            ->distinct()
                            ->orderBy('barangay')
                            ->pluck('barangay');

        return Inertia::render('Admin/CollectionScheduleManagement/index', [
            'schedules' => $schedules,
            'barangays' => $barangays,
            'search' => $search,
            'statusFilter' => $statusFilter,
            'barangayFilter' => $barangayFilter,
            'dayFilter' => $dayFilter,
        ]);
    }

    /**
     * Show the form for creating a new collection schedule.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/CollectionScheduleManagement/add');
    }

    /**
     * Store a newly created collection schedule in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'barangay' => 'required|string|max:100',
            'collection_day' => [
                'required',
                Rule::in(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
            ],
            'collection_time' => 'required|date_format:H:i',
            'frequency' => [
                'required',
                Rule::in(['weekly', 'bi-weekly', 'monthly'])
            ],
            'is_active' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        $scheduleData = [
            'barangay' => $validated['barangay'],
            'collection_day' => $validated['collection_day'],
            'collection_time' => $validated['collection_time'],
            'frequency' => $validated['frequency'],
            'is_active' => $validated['is_active'] ?? true,
            'notes' => $validated['notes'] ?? null,
            'created_by' => Auth::id(),
        ];

        $schedule = CollectionSchedule::create($scheduleData);

        $this->adminActivityLogs(
            'Collection Schedule',
            'Add',
            'Created Collection Schedule for ' . $schedule->barangay . ' on ' . $schedule->collection_day . ' at ' . $schedule->collection_time
        );

        return redirect()->route('admin.collection-schedule-management.index')
            ->with('success', 'Collection Schedule created successfully');
    }

    /**
     * Display the specified collection schedule.
     */
    public function show(CollectionSchedule $collectionSchedule): Response
    {
        // Load relationships with accurate counts
        $collectionSchedule->load(['creator', 'routeAssignments']);
        $collectionSchedule->loadCount(['routeAssignments']);

        $this->adminActivityLogs(
            'Collection Schedule',
            'View',
            'Viewed Collection Schedule for ' . $collectionSchedule->barangay . ' on ' . $collectionSchedule->collection_day
        );

        return Inertia::render('Admin/CollectionScheduleManagement/show', [
            'schedule' => $collectionSchedule,
        ]);
    }

    /**
     * Show the form for editing the specified collection schedule.
     */
    public function edit(CollectionSchedule $collectionSchedule): Response
    {
        $this->adminActivityLogs(
            'Collection Schedule',
            'Edit',
            'Edit Collection Schedule for ' . $collectionSchedule->barangay . ' on ' . $collectionSchedule->collection_day
        );

        return Inertia::render('Admin/CollectionScheduleManagement/edit', [
            'schedule' => $collectionSchedule,
        ]);
    }

    /**
     * Update the specified collection schedule in storage.
     */
    public function update(Request $request, CollectionSchedule $collectionSchedule)
    {
        $validated = $request->validate([
            'barangay' => 'required|string|max:100',
            'collection_day' => [
                'required',
                Rule::in(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
            ],
            'collection_time' => 'required|date_format:H:i',
            'frequency' => [
                'required',
                Rule::in(['weekly', 'bi-weekly', 'monthly'])
            ],
            'is_active' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        $updateData = [
            'barangay' => $validated['barangay'],
            'collection_day' => $validated['collection_day'],
            'collection_time' => $validated['collection_time'],
            'frequency' => $validated['frequency'],
            'is_active' => $validated['is_active'] ?? $collectionSchedule->is_active,
            'notes' => $validated['notes'] ?? null,
        ];

        $collectionSchedule->update($updateData);

        $this->adminActivityLogs(
            'Collection Schedule',
            'Update',
            'Updated Collection Schedule for ' . $collectionSchedule->barangay . ' on ' . $collectionSchedule->collection_day . ' at ' . $collectionSchedule->collection_time
        );

        return redirect()->route('admin.collection-schedule-management.index')
            ->with('success', 'Collection Schedule updated successfully');
    }

    /**
     * Activate a collection schedule.
     */
    public function activate(CollectionSchedule $collectionSchedule)
    {
        $collectionSchedule->update(['is_active' => true]);

        $this->adminActivityLogs(
            'Collection Schedule',
            'Activate',
            'Activated Collection Schedule for ' . $collectionSchedule->barangay . ' on ' . $collectionSchedule->collection_day
        );

        return back()->with('success', 'Collection schedule activated successfully');
    }

    /**
     * Deactivate a collection schedule.
     */
    public function deactivate(CollectionSchedule $collectionSchedule)
    {
        $collectionSchedule->update(['is_active' => false]);

        $this->adminActivityLogs(
            'Collection Schedule',
            'Deactivate',
            'Deactivated Collection Schedule for ' . $collectionSchedule->barangay . ' on ' . $collectionSchedule->collection_day
        );

        return back()->with('success', 'Collection Schedule deactivated successfully');
    }

    /**
     * Remove the specified collection schedule from storage.
     */
    public function destroy(CollectionSchedule $collectionSchedule)
    {
        $this->adminActivityLogs(
            'Collection Schedule',
            'Delete',
            'Deleted Collection Schedule for ' . $collectionSchedule->barangay . ' on ' . $collectionSchedule->collection_day . ' at ' . $collectionSchedule->collection_time
        );

        $collectionSchedule->delete();

        return redirect()->route('admin.collection-schedule-management.index')
            ->with('success');
    }

    /**
     * Get collection schedule statistics for dashboard.
     */
    public function statistics(): Response
    {
        $stats = [
            'total_schedules' => CollectionSchedule::count(),
            'active_schedules' => CollectionSchedule::where('is_active', true)->count(),
            'inactive_schedules' => CollectionSchedule::where('is_active', false)->count(),
            'schedules_by_barangay' => CollectionSchedule::selectRaw('barangay, COUNT(*) as count')
                ->groupBy('barangay')
                ->orderBy('count', 'desc')
                ->get(),
            'schedules_by_day' => CollectionSchedule::selectRaw('collection_day, COUNT(*) as count')
                ->where('is_active', true)
                ->groupBy('collection_day')
                ->orderByRaw("FIELD(collection_day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')")
                ->get(),
            'recent_schedules' => CollectionSchedule::with('creator:id,name,email')
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get(['id', 'barangay', 'collection_day', 'collection_time', 'is_active', 'created_by', 'created_at']),
        ];

        $this->adminActivityLogs(
            'Collection Schedule',
            'View Statistics',
            'Viewed Collection Schedule Statistics Dashboard'
        );

        return Inertia::render('Admin/CollectionScheduleManagement/statistics', [
            'statistics' => $stats,
        ]);
    }
}