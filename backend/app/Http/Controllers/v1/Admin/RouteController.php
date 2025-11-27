<?php

namespace App\Http\Controllers\v1\Admin;

use App\Models\Route;
use App\Models\RouteStop;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use App\Trait\ActivityLogsTrait;
use App\Trait\AdminNotificationTrait;

class RouteController extends Controller
{
    use ActivityLogsTrait, AdminNotificationTrait;

    /**
     * Display a listing of routes.
     */
    public function index(Request $request): Response
    {
        // Mark module notifications as read when viewing the page
        \App\Models\Notification::where('recipient_id', Auth::id())
            ->where('module', 'route_management')
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        $search = $request->get('search', '');
        $page = $request->get('page', 1);
        $statusFilter = $request->get('status', ''); // all, active, inactive
        $barangayFilter = $request->get('barangay', '');

        $query = Route::with(['creator:id,name,email', 'stops']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('route_name', 'like', "%{$search}%")
                  ->orWhere('barangay', 'like', "%{$search}%");
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

        $routes = $query->withCount(['assignments'])
                       ->orderBy('created_at', 'desc')
                       ->paginate(10)
                       ->withQueryString();

        // Get unique barangays for filter dropdown
        $barangays = Route::select('barangay')
                         ->distinct()
                         ->orderBy('barangay')
                         ->pluck('barangay');

        return Inertia::render('Admin/RouteManagement/index', [
            'routes' => $routes,
            'barangays' => $barangays,
            'search' => $search,
            'statusFilter' => $statusFilter,
            'barangayFilter' => $barangayFilter,
        ]);
    }

    /**
     * Show the form for creating a new route.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/RouteManagement/add');
    }

    /**
     * Store a newly created route in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'route_name' => 'required|string|max:255',
            'barangay' => 'required|string|max:100',
            'estimated_duration' => 'nullable|integer|min:1',
            'route_map_data' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        DB::beginTransaction();
        try {
            $routeData = [
                'route_name' => $validated['route_name'],
                'barangay' => $validated['barangay'],
                'estimated_duration' => $validated['estimated_duration'] ?? null,
                'total_stops' => 0,
                'route_map_data' => $validated['route_map_data'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
                'created_by' => Auth::id(),
            ];

            $route = Route::create($routeData);

            DB::commit();

            $this->adminActivityLogs(
                'Route',
                'Add',
                'Created Route ' . $route->route_name . ' - ' . $route->barangay
            );

            // Notify all other admin users
            $this->notifyAllAdmins(
                'route_management',
                'New Route Created',
                Auth::user()->name . ' created a new route: ' . $route->route_name . ' (' . $route->barangay . ')',
                route('admin.route-management.index'),
                'medium',
                'alert'
            );

            return redirect()->route('admin.route-management.index')
                ->with('success', 'Route created successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to create route: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified route.
     */
    public function show(Route $route): Response
    {
        // Load relationships with accurate counts
        $route->load([
            'creator:id,name,email',
            'stops' => function($query) {
                $query->orderBy('stop_order');
            },
            'assignments.collector:id,name',
            'assignments.schedule:id,collection_day,collection_time,frequency'
        ]);
        $route->loadCount(['assignments']);

        $this->adminActivityLogs(
            'Route',
            'View',
            'Viewed Route ' . $route->route_name . ' (' . $route->barangay . ')'
        );

        return Inertia::render('Admin/RouteManagement/show', [
            'route' => $route,
        ]);
    }

    /**
     * Show the form for editing the specified route.
     */
    public function edit(Route $route): Response
    {
        // Load stops
        $route->load(['stops' => function($query) {
            $query->orderBy('stop_order');
        }]);

        $this->adminActivityLogs(
            'Route',
            'Edit',
            'Edit Route ' . $route->route_name . ' (' . $route->barangay . ')'
        );

        return Inertia::render('Admin/RouteManagement/edit', [
            'route' => $route,
        ]);
    }

    /**
     * Update the specified route in storage.
     */
    public function update(Request $request, Route $route)
    {
        $validated = $request->validate([
            'route_name' => 'required|string|max:255',
            'barangay' => 'required|string|max:100',
            'estimated_duration' => 'nullable|integer|min:1',
            'route_map_data' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        DB::beginTransaction();
        try {
            $updateData = [
                'route_name' => $validated['route_name'],
                'barangay' => $validated['barangay'],
                'estimated_duration' => $validated['estimated_duration'] ?? null,
                'route_map_data' => $validated['route_map_data'] ?? null,
                'is_active' => $validated['is_active'] ?? $route->is_active,
                // Keep the original created_by when updating
            ];

            $route->update($updateData);

            DB::commit();

            $this->adminActivityLogs(
                'Route',
                'Update',
                'Updated Route ' . $route->route_name . ' - ' . $route->barangay
            );

            return redirect()->route('admin.route-management.index')
                ->with('success', 'Route updated successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to update route: ' . $e->getMessage()]);
        }
    }

    /**
     * Activate a route.
     */
    public function activate(Route $route)
    {
        $route->update(['is_active' => true]);

        $this->adminActivityLogs(
            'Route',
            'Activate',
            'Activated Route ' . $route->route_name . ' (' . $route->barangay . ')'
        );

        return back()->with('success', 'Route activated successfully');
    }

    /**
     * Deactivate a route.
     */
    public function deactivate(Route $route)
    {
        $route->update(['is_active' => false]);

        $this->adminActivityLogs(
            'Route',
            'Deactivate',
            'Deactivated Route ' . $route->route_name . ' (' . $route->barangay . ')'
        );

        return back()->with('success', 'Route deactivated successfully');
    }

    /**
     * Remove the specified route from storage.
     */
    public function destroy(Route $route)
    {
        $this->adminActivityLogs(
            'Route',
            'Delete',
            'Deleted Route ' . $route->route_name . ' - ' . $route->barangay
        );

        $route->delete();

        return redirect()->route('admin.route-management.index')
            ->with('success', 'Route deleted successfully');
    }

    /**
     * Get route statistics for dashboard.
     */
    public function statistics(): Response
    {
        $stats = [
            'total_routes' => Route::count(),
            'active_routes' => Route::where('is_active', true)->count(),
            'inactive_routes' => Route::where('is_active', false)->count(),
            'routes_by_barangay' => Route::selectRaw('barangay, COUNT(*) as count')
                ->groupBy('barangay')
                ->orderBy('count', 'desc')
                ->get(),
            'recent_routes' => Route::with('creator:id,name')
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get(['id', 'route_name', 'barangay', 'total_stops', 'is_active', 'created_by', 'created_at']),
            'total_stops' => RouteStop::count(),
            'avg_stops_per_route' => Route::avg('total_stops'),
        ];

        $this->adminActivityLogs(
            'Route',
            'View Statistics',
            'Viewed Route Statistics Dashboard'
        );

        return Inertia::render('Admin/RouteManagement/statistics', [
            'statistics' => $stats,
        ]);
    }
}