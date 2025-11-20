<?php

namespace App\Http\Controllers\v1\Admin;

use App\Models\RouteAssignment;
use App\Models\Route;
use App\Models\Collector;
use App\Models\CollectionSchedule;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use App\Trait\ActivityLogsTrait;

class RouteAssignmentController extends Controller
{
    use ActivityLogsTrait;

    /**
     * Display a listing of route assignments.
     */
    public function index(Request $request): Response
    {
        $search = $request->get('search', '');
        $page = $request->get('page', 1);
        $statusFilter = $request->get('status', ''); // all, pending, in_progress, completed, cancelled
        $dateFilter = $request->get('date', '');

        $query = RouteAssignment::with([
            'route:id,route_name,barangay',
            'collector:id,name,phone_number,employee_id',
            'schedule:id,barangay,collection_day,collection_time,frequency',
            'assignedBy:id,name'
        ]);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('route', function($q) use ($search) {
                    $q->where('route_name', 'like', "%{$search}%")
                      ->orWhere('barangay', 'like', "%{$search}%");
                })
                ->orWhereHas('collector', function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                })
                ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($statusFilter && $statusFilter !== 'all') {
            $query->where('status', $statusFilter);
        }

        // Filter by date
        if ($dateFilter) {
            $query->whereDate('assignment_date', $dateFilter);
        }

        $assignments = $query->orderBy('assignment_date', 'desc')
                            ->orderBy('created_at', 'desc')
                            ->paginate(10)
                            ->withQueryString();

        // Get active routes for dropdown
        $routes = Route::where('is_active', true)
                      ->select('id', 'route_name', 'barangay')
                      ->orderBy('route_name')
                      ->get();

        // Get active and verified collectors for dropdown
        $collectors = Collector::where('is_active', true)
                              ->where('is_verified', true)
                              ->select('id', 'name', 'phone_number', 'employee_id')
                              ->orderBy('name')
                              ->get();

        // Get active schedules for dropdown
        $schedules = CollectionSchedule::where('is_active', true)
                                      ->select('id', 'barangay', 'collection_day', 'collection_time', 'frequency')
                                      ->orderBy('barangay')
                                      ->orderBy('collection_day')
                                      ->get();

        return Inertia::render('Admin/RouteAssignmentManagement/index', [
            'assignments' => $assignments,
            'routes' => $routes,
            'collectors' => $collectors,
            'schedules' => $schedules,
            'search' => $search,
            'statusFilter' => $statusFilter,
            'dateFilter' => $dateFilter,
        ]);
    }

    /**
     * Show the form for creating a new route assignment.
     */
    public function create(): Response
    {
        // Get active routes
        $routes = Route::where('is_active', true)
                      ->select('id', 'route_name', 'barangay')
                      ->orderBy('route_name')
                      ->get();

        // Get active and verified collectors
        $collectors = Collector::where('is_active', true)
                              ->where('is_verified', true)
                              ->select('id', 'name', 'phone_number', 'employee_id')
                              ->orderBy('name')
                              ->get();

        // Get active schedules
        $schedules = CollectionSchedule::where('is_active', true)
                                      ->select('id', 'barangay', 'collection_day', 'collection_time', 'frequency')
                                      ->orderBy('barangay')
                                      ->orderBy('collection_day')
                                      ->get();

        return Inertia::render('Admin/RouteAssignmentManagement/add', [
            'routes' => $routes,
            'collectors' => $collectors,
            'schedules' => $schedules,
        ]);
    }

    /**
     * Store a newly created route assignment in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'route_id' => 'required|exists:routes,id',
            'collector_id' => 'required|exists:collectors,id',
            'schedule_id' => 'required|exists:collection_schedules,id',
            'assignment_date' => 'required|date',
            'status' => 'nullable|in:pending,in_progress,completed,cancelled',
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date|after:start_time',
            'notes' => 'nullable|string',
        ]);

        $assignmentData = [
            'route_id' => $validated['route_id'],
            'collector_id' => $validated['collector_id'],
            'schedule_id' => $validated['schedule_id'],
            'assignment_date' => $validated['assignment_date'],
            'status' => $validated['status'] ?? 'pending',
            'start_time' => $validated['start_time'] ?? null,
            'end_time' => $validated['end_time'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'assigned_by' => Auth::id(),
        ];

        $assignment = RouteAssignment::create($assignmentData);
        $assignment->load(['route', 'collector']);

        $this->adminActivityLogs(
            'Route Assignment',
            'Add',
            'Created Route Assignment: ' . $assignment->route->route_name . ' to ' . $assignment->collector->name
        );

        return redirect()->route('admin.route-assignment-management.index')
            ->with('success', 'Route assignment created successfully');
    }

    /**
     * Display the specified route assignment.
     */
    public function show(RouteAssignment $routeAssignment): Response
    {
        // Load relationships
        $routeAssignment->load([
            'route.stops' => function($query) {
                $query->orderBy('stop_order');
            },
            'route.creator:id,name,email',
            'collector',
            'schedule',
            'assignedBy:id,name',
            'qrCollections.resident:id,name'
        ]);

        $this->adminActivityLogs(
            'Route Assignment',
            'View',
            'Viewed Route Assignment ID: ' . $routeAssignment->id
        );

        return Inertia::render('Admin/RouteAssignmentManagement/show', [
            'assignment' => $routeAssignment,
        ]);
    }

    /**
     * Show the form for editing the specified route assignment.
     */
    public function edit(RouteAssignment $routeAssignment): Response
    {
        // Load relationships
        $routeAssignment->load(['route', 'collector', 'schedule']);

        // Get active routes
        $routes = Route::where('is_active', true)
                      ->select('id', 'route_name', 'barangay')
                      ->orderBy('route_name')
                      ->get();

        // Get active and verified collectors
        $collectors = Collector::where('is_active', true)
                              ->where('is_verified', true)
                              ->select('id', 'name', 'phone_number', 'employee_id')
                              ->orderBy('name')
                              ->get();

        // Get active schedules
        $schedules = CollectionSchedule::where('is_active', true)
                                      ->select('id', 'barangay', 'collection_day', 'collection_time', 'frequency')
                                      ->orderBy('barangay')
                                      ->orderBy('collection_day')
                                      ->get();

        $this->adminActivityLogs(
            'Route Assignment',
            'Edit',
            'Edit Route Assignment ID: ' . $routeAssignment->id
        );

        return Inertia::render('Admin/RouteAssignmentManagement/edit', [
            'assignment' => $routeAssignment,
            'routes' => $routes,
            'collectors' => $collectors,
            'schedules' => $schedules,
        ]);
    }

    /**
     * Update the specified route assignment in storage.
     */
    public function update(Request $request, RouteAssignment $routeAssignment)
    {
        $validated = $request->validate([
            'route_id' => 'required|exists:routes,id',
            'collector_id' => 'required|exists:collectors,id',
            'schedule_id' => 'required|exists:collection_schedules,id',
            'assignment_date' => 'required|date',
            'status' => 'required|in:pending,in_progress,completed,cancelled',
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date|after:start_time',
            'notes' => 'nullable|string',
        ]);

        $updateData = [
            'route_id' => $validated['route_id'],
            'collector_id' => $validated['collector_id'],
            'schedule_id' => $validated['schedule_id'],
            'assignment_date' => $validated['assignment_date'],
            'status' => $validated['status'],
            'start_time' => $validated['start_time'] ?? null,
            'end_time' => $validated['end_time'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ];

        $routeAssignment->update($updateData);
        $routeAssignment->load(['route', 'collector']);

        $this->adminActivityLogs(
            'Route Assignment',
            'Update',
            'Updated Route Assignment: ' . $routeAssignment->route->route_name . ' to ' . $routeAssignment->collector->name
        );

        return redirect()->route('admin.route-assignment-management.index')
            ->with('success', 'Route assignment updated successfully');
    }

    /**
     * Update the status of a route assignment.
     */
    public function updateStatus(Request $request, RouteAssignment $routeAssignment)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,in_progress,completed,cancelled',
        ]);

        $oldStatus = $routeAssignment->status;
        $routeAssignment->update(['status' => $validated['status']]);

        $this->adminActivityLogs(
            'Route Assignment',
            'Update Status',
            'Updated Route Assignment Status from ' . $oldStatus . ' to ' . $validated['status'] . ' (ID: ' . $routeAssignment->id . ')'
        );

        return back()->with('success', 'Assignment status updated successfully');
    }

    /**
     * Start a route assignment.
     */
    public function start(RouteAssignment $routeAssignment)
    {
        $routeAssignment->update([
            'status' => 'in_progress',
            'start_time' => now(),
        ]);

        $this->adminActivityLogs(
            'Route Assignment',
            'Start',
            'Started Route Assignment ID: ' . $routeAssignment->id
        );

        return back()->with('success', 'Route assignment started successfully');
    }

    /**
     * Complete a route assignment.
     */
    public function complete(RouteAssignment $routeAssignment)
    {
        $routeAssignment->update([
            'status' => 'completed',
            'end_time' => now(),
        ]);

        $this->adminActivityLogs(
            'Route Assignment',
            'Complete',
            'Completed Route Assignment ID: ' . $routeAssignment->id
        );

        return back()->with('success', 'Route assignment completed successfully');
    }

    /**
     * Cancel a route assignment.
     */
    public function cancel(RouteAssignment $routeAssignment)
    {
        $routeAssignment->update(['status' => 'cancelled']);

        $this->adminActivityLogs(
            'Route Assignment',
            'Cancel',
            'Cancelled Route Assignment ID: ' . $routeAssignment->id
        );

        return back()->with('success', 'Route assignment cancelled successfully');
    }

    /**
     * Remove the specified route assignment from storage.
     */
    public function destroy(RouteAssignment $routeAssignment)
    {
        $this->adminActivityLogs(
            'Route Assignment',
            'Delete',
            'Deleted Route Assignment ID: ' . $routeAssignment->id
        );

        $routeAssignment->delete();

        return redirect()->route('admin.route-assignment-management.index')
            ->with('success', 'Route assignment deleted successfully');
    }

    /**
     * Get route assignment statistics for dashboard.
     */
    public function statistics(): Response
    {
        $stats = [
            'total_assignments' => RouteAssignment::count(),
            'pending_assignments' => RouteAssignment::where('status', 'pending')->count(),
            'in_progress_assignments' => RouteAssignment::where('status', 'in_progress')->count(),
            'completed_assignments' => RouteAssignment::where('status', 'completed')->count(),
            'cancelled_assignments' => RouteAssignment::where('status', 'cancelled')->count(),
            'today_assignments' => RouteAssignment::whereDate('assignment_date', today())->count(),
            'upcoming_assignments' => RouteAssignment::where('assignment_date', '>', today())
                ->where('status', 'pending')
                ->count(),
            'recent_assignments' => RouteAssignment::with(['route:id,route_name', 'collector:id,name'])
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get(),
        ];

        $this->adminActivityLogs(
            'Route Assignment',
            'View Statistics',
            'Viewed Route Assignment Statistics Dashboard'
        );

        return Inertia::render('Admin/RouteAssignmentManagement/statistics', [
            'statistics' => $stats,
        ]);
    }
}