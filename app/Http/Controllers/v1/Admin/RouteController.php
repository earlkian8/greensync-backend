<?php

namespace App\Http\Controllers\v1\Admin;

use App\Models\Route;
use App\Models\RouteStop;
use App\Models\Resident;
use App\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use App\Trait\ActivityLogsTrait;

class RouteController extends Controller
{
    use ActivityLogsTrait;

    /**
     * Display a listing of routes.
     */
    public function index(Request $request): Response
    {
        $search = $request->get('search', '');
        $page = $request->get('page', 1);
        $statusFilter = $request->get('status', ''); // all, active, inactive
        $barangayFilter = $request->get('barangay', '');

        $query = Route::with(['creator:id,name', 'stops']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('route_name', 'like', "%{$search}%")
                  ->orWhere('barangay', 'like', "%{$search}%")
                  ->orWhere('start_location', 'like', "%{$search}%")
                  ->orWhere('end_location', 'like', "%{$search}%");
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

        $routes = $query->orderBy('created_at', 'desc')
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
            'residents' => User::all(),
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
        // Get residents for the created_by dropdown
        $residents = Resident::select('id', 'name', 'email')
                            ->where('is_verified', true)
                            ->orderBy('name')
                            ->get();

        return Inertia::render('Admin/RouteManagement/add', [
            'residents' => $residents,
        ]);
    }

    /**
     * Store a newly created route in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'route_name' => 'required|string|max:255',
            'barangay' => 'required|string|max:100',
            'start_location' => 'nullable|string',
            'end_location' => 'nullable|string',
            'estimated_duration' => 'nullable|integer|min:1',
            'route_map_data' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'created_by' => 'required|exists:residents,id',
            'stops' => 'nullable|array',
            'stops.*.stop_order' => 'required|integer|min:1',
            'stops.*.stop_address' => 'required|string',
            'stops.*.latitude' => 'nullable|numeric|between:-90,90',
            'stops.*.longitude' => 'nullable|numeric|between:-180,180',
            'stops.*.estimated_time' => 'nullable|date_format:H:i',
            'stops.*.notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // Calculate total stops
            $totalStops = isset($validated['stops']) ? count($validated['stops']) : 0;

            $routeData = [
                'route_name' => $validated['route_name'],
                'barangay' => $validated['barangay'],
                'start_location' => $validated['start_location'] ?? null,
                'end_location' => $validated['end_location'] ?? null,
                'estimated_duration' => $validated['estimated_duration'] ?? null,
                'total_stops' => $totalStops,
                'route_map_data' => $validated['route_map_data'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
                'created_by' => $validated['created_by'],
            ];

            $route = Route::create($routeData);

            // Create route stops if provided
            if (isset($validated['stops']) && count($validated['stops']) > 0) {
                foreach ($validated['stops'] as $stop) {
                    RouteStop::create([
                        'route_id' => $route->id,
                        'stop_order' => $stop['stop_order'],
                        'stop_address' => $stop['stop_address'],
                        'latitude' => $stop['latitude'] ?? null,
                        'longitude' => $stop['longitude'] ?? null,
                        'estimated_time' => $stop['estimated_time'] ?? null,
                        'notes' => $stop['notes'] ?? null,
                    ]);
                }
            }

            DB::commit();

            $this->adminActivityLogs(
                'Route',
                'Add',
                'Created Route ' . $route->route_name . ' - ' . $route->barangay . ' with ' . $totalStops . ' stops'
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
        // Load relationships
        $route->load([
            'creator:id,name,email',
            'stops' => function($query) {
                $query->orderBy('stop_order');
            },
            'assignments.collector:id,name',
            'assignments.schedule:id,schedule_name'
        ]);

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

        // Get residents for the created_by dropdown
        $residents = Resident::select('id', 'name', 'email')
                            ->where('is_verified', true)
                            ->orderBy('name')
                            ->get();

        $this->adminActivityLogs(
            'Route',
            'Edit',
            'Edit Route ' . $route->route_name . ' (' . $route->barangay . ')'
        );

        return Inertia::render('Admin/RouteManagement/edit', [
            'route' => $route,
            'residents' => $residents,
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
            'start_location' => 'nullable|string',
            'end_location' => 'nullable|string',
            'estimated_duration' => 'nullable|integer|min:1',
            'route_map_data' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'created_by' => 'required|exists:residents,id',
            'stops' => 'nullable|array',
            'stops.*.id' => 'nullable|exists:route_stops,id',
            'stops.*.stop_order' => 'required|integer|min:1',
            'stops.*.stop_address' => 'required|string',
            'stops.*.latitude' => 'nullable|numeric|between:-90,90',
            'stops.*.longitude' => 'nullable|numeric|between:-180,180',
            'stops.*.estimated_time' => 'nullable|date_format:H:i',
            'stops.*.notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // Calculate total stops
            $totalStops = isset($validated['stops']) ? count($validated['stops']) : 0;

            $updateData = [
                'route_name' => $validated['route_name'],
                'barangay' => $validated['barangay'],
                'start_location' => $validated['start_location'] ?? null,
                'end_location' => $validated['end_location'] ?? null,
                'estimated_duration' => $validated['estimated_duration'] ?? null,
                'total_stops' => $totalStops,
                'route_map_data' => $validated['route_map_data'] ?? null,
                'is_active' => $validated['is_active'] ?? $route->is_active,
                'created_by' => $validated['created_by'],
            ];

            $route->update($updateData);

            // Update route stops
            if (isset($validated['stops'])) {
                // Get existing stop IDs
                $existingStopIds = $route->stops->pluck('id')->toArray();
                $updatedStopIds = [];

                foreach ($validated['stops'] as $stopData) {
                    if (isset($stopData['id']) && in_array($stopData['id'], $existingStopIds)) {
                        // Update existing stop
                        RouteStop::where('id', $stopData['id'])->update([
                            'stop_order' => $stopData['stop_order'],
                            'stop_address' => $stopData['stop_address'],
                            'latitude' => $stopData['latitude'] ?? null,
                            'longitude' => $stopData['longitude'] ?? null,
                            'estimated_time' => $stopData['estimated_time'] ?? null,
                            'notes' => $stopData['notes'] ?? null,
                        ]);
                        $updatedStopIds[] = $stopData['id'];
                    } else {
                        // Create new stop
                        $newStop = RouteStop::create([
                            'route_id' => $route->id,
                            'stop_order' => $stopData['stop_order'],
                            'stop_address' => $stopData['stop_address'],
                            'latitude' => $stopData['latitude'] ?? null,
                            'longitude' => $stopData['longitude'] ?? null,
                            'estimated_time' => $stopData['estimated_time'] ?? null,
                            'notes' => $stopData['notes'] ?? null,
                        ]);
                        $updatedStopIds[] = $newStop->id;
                    }
                }

                // Delete stops that were removed
                $stopsToDelete = array_diff($existingStopIds, $updatedStopIds);
                if (count($stopsToDelete) > 0) {
                    RouteStop::whereIn('id', $stopsToDelete)->delete();
                }
            } else {
                // If no stops provided, delete all existing stops
                $route->stops()->delete();
            }

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