<?php

namespace App\Http\Controllers\v1\Admin;

use App\Models\Collector;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use App\Trait\ActivityLogsTrait;
use App\Trait\AdminNotificationTrait;

class CollectorController extends Controller
{
    use ActivityLogsTrait, AdminNotificationTrait;

    /**
     * Display a listing of collectors.
     */
    public function index(Request $request): Response
    {
        // Mark module notifications as read when viewing the page
        \App\Models\Notification::where('recipient_id', Auth::id())
            ->where('module', 'collector_management')
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        $search = $request->get('search', '');
        $page = $request->get('page', 1);
        $verificationFilter = $request->get('verification', ''); // all, verified, unverified
        $statusFilter = $request->get('status', ''); // all, active, inactive

        $query = Collector::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone_number', 'like', "%{$search}%")
                  ->orWhere('employee_id', '=', (int)$search)
                  ->orWhere('license_number', 'like', "%{$search}%")
                  ->orWhere('vehicle_plate_number', 'like', "%{$search}%");
            });
        }

        // Filter by verification status
        if ($verificationFilter === 'verified') {
            $query->where('is_verified', true);
        } elseif ($verificationFilter === 'unverified') {
            $query->where('is_verified', false);
        }

        // Filter by active status
        if ($statusFilter === 'active') {
            $query->where('is_active', true);
        } elseif ($statusFilter === 'inactive') {
            $query->where('is_active', false);
        }

        $collectors = $query->withCount([
            'routeAssignments',
            'collectionRequests',
            'qrCollections'
        ])
        ->orderBy('created_at', 'desc')
        ->paginate(10)
        ->withQueryString();

        // Profile image URLs are automatically included via the model accessor

        return Inertia::render('Admin/CollectorManagement/index', [
            'collectors' => $collectors,
            'search' => $search,
            'verificationFilter' => $verificationFilter,
            'statusFilter' => $statusFilter,
        ]);
    }

    /**
     * Show the form for creating a new collector.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/CollectorManagement/add');
    }

    /**
     * Store a newly created collector in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:collectors',
            'phone_number' => 'required|string|max:20|unique:collectors',
            'password' => 'required|string|min:8|confirmed',
            'license_number' => 'nullable|string|max:50',
            'license_number_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'vehicle_plate_number' => 'nullable|string|max:20',
            'vehicle_plate_number_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'vehicle_type' => 'nullable|string|max:50',
            'vehicle_type_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'profile_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'is_active' => 'nullable|boolean',
            'is_verified' => 'nullable|boolean',
        ]);

        DB::beginTransaction();
        try {
            // Auto-generate employee_id
            $lastEmployeeId = Collector::max('employee_id') ?? 0;
            $employeeId = $lastEmployeeId + 1;

            $collectorData = [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone_number' => $validated['phone_number'],
                'password' => Hash::make($validated['password']),
                'employee_id' => $employeeId,
                'license_number' => $validated['license_number'] ?? null,
                'vehicle_plate_number' => $validated['vehicle_plate_number'] ?? null,
                'vehicle_type' => $validated['vehicle_type'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
                'is_verified' => $validated['is_verified'] ?? false,
            ];

            $imagePaths = [];

            // Handle profile image upload
            if ($request->hasFile('profile_image')) {
                $path = $request->file('profile_image')->store('collectors/profiles', 'private');
                $collectorData['profile_image'] = $path;
                $imagePaths[] = $path;
            }

            // Handle license number image upload
            if ($request->hasFile('license_number_image')) {
                $path = $request->file('license_number_image')->store('collectors/licenses', 'private');
                $collectorData['license_number_image'] = $path;
                $imagePaths[] = $path;
            }

            // Handle vehicle plate number image upload
            if ($request->hasFile('vehicle_plate_number_image')) {
                $path = $request->file('vehicle_plate_number_image')->store('collectors/vehicle-plates', 'private');
                $collectorData['vehicle_plate_number_image'] = $path;
                $imagePaths[] = $path;
            }

            // Handle vehicle type image upload
            if ($request->hasFile('vehicle_type_image')) {
                $path = $request->file('vehicle_type_image')->store('collectors/vehicle-types', 'private');
                $collectorData['vehicle_type_image'] = $path;
                $imagePaths[] = $path;
            }

            $collector = Collector::create($collectorData);

            DB::commit();

            $this->adminActivityLogs(
                'Collector',
                'Add',
                'Created Collector ' . $collector->name . ' (ID: ' . $collector->employee_id . ') - ' . $collector->email
            );

            // Notify all other admin users
            $this->notifyAllAdmins(
                'collector_management',
                'New Collector Added',
                Auth::user()->name . ' added a new collector: ' . $collector->name . ' (ID: ' . $collector->employee_id . ')',
                route('admin.collector-management.index'),
                'medium',
                'alert'
            );

            return redirect()->route('admin.collector-management.index')
                ->with('success', 'Collector created successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            
            // Delete uploaded images if transaction failed
            foreach ($imagePaths as $imagePath) {
                Storage::disk('private')->delete($imagePath);
            }
            
            return back()->withErrors(['error' => 'Failed to create collector: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Display the specified collector.
     */
    public function show(Collector $collector): Response
    {
        // Load relationships with accurate counts
        $collector->load(['routeAssignments', 'collectionRequests', 'qrCollections']);
        $collector->loadCount(['routeAssignments', 'collectionRequests', 'qrCollections']);

        // Image URLs are automatically included via the model accessor

        $this->adminActivityLogs(
            'Collector',
            'View',
            'Viewed Collector ' . $collector->name . ' (ID: ' . $collector->employee_id . ')'
        );

        return Inertia::render('Admin/CollectorManagement/show', [
            'collector' => $collector,
        ]);
    }

    /**
     * Show the form for editing the specified collector.
     */
    public function edit(Collector $collector): Response
    {
        $this->adminActivityLogs(
            'Collector',
            'Edit',
            'Edit Collector ' . $collector->name . ' (ID: ' . $collector->employee_id . ')'
        );

        return Inertia::render('Admin/CollectorManagement/edit', [
            'collector' => $collector,
        ]);
    }

    /**
     * Update the specified collector in storage.
     */
    public function update(Request $request, Collector $collector)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('collectors')->ignore($collector->id),
            ],
            'phone_number' => [
                'required',
                'string',
                'max:20',
                Rule::unique('collectors')->ignore($collector->id),
            ],
            'license_number' => 'nullable|string|max:50',
            'license_number_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'vehicle_plate_number' => 'nullable|string|max:20',
            'vehicle_plate_number_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'vehicle_type' => 'nullable|string|max:50',
            'vehicle_type_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'profile_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'is_active' => 'nullable|boolean',
            'is_verified' => 'nullable|boolean',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone_number' => $validated['phone_number'],
            'license_number' => $validated['license_number'] ?? null,
            'vehicle_plate_number' => $validated['vehicle_plate_number'] ?? null,
            'vehicle_type' => $validated['vehicle_type'] ?? null,
            'is_active' => $validated['is_active'] ?? $collector->is_active,
            'is_verified' => $validated['is_verified'] ?? $collector->is_verified,
        ];

        // Handle profile image upload
        if ($request->hasFile('profile_image')) {
            // Delete old image if exists
            if ($collector->profile_image) {
                Storage::disk('private')->delete($collector->profile_image);
            }
            $path = $request->file('profile_image')->store('collectors/profiles', 'private');
            $updateData['profile_image'] = $path;
        }

        // Handle license number image upload
        if ($request->hasFile('license_number_image')) {
            // Delete old image if exists
            if ($collector->license_number_image) {
                Storage::disk('private')->delete($collector->license_number_image);
            }
            $path = $request->file('license_number_image')->store('collectors/licenses', 'private');
            $updateData['license_number_image'] = $path;
        }

        // Handle vehicle plate number image upload
        if ($request->hasFile('vehicle_plate_number_image')) {
            // Delete old image if exists
            if ($collector->vehicle_plate_number_image) {
                Storage::disk('private')->delete($collector->vehicle_plate_number_image);
            }
            $path = $request->file('vehicle_plate_number_image')->store('collectors/vehicle-plates', 'private');
            $updateData['vehicle_plate_number_image'] = $path;
        }

        // Handle vehicle type image upload
        if ($request->hasFile('vehicle_type_image')) {
            // Delete old image if exists
            if ($collector->vehicle_type_image) {
                Storage::disk('private')->delete($collector->vehicle_type_image);
            }
            $path = $request->file('vehicle_type_image')->store('collectors/vehicle-types', 'private');
            $updateData['vehicle_type_image'] = $path;
        }

        $collector->update($updateData);

        $this->adminActivityLogs(
            'Collector',
            'Update',
            'Updated Collector ' . $collector->name . ' (ID: ' . $collector->employee_id . ') - ' . $collector->email
        );

        return redirect()->route('admin.collector-management.index')
            ->with('success', 'Collector updated successfully');
    }

    /**
     * Verify a collector account.
     */
    public function verify(Collector $collector)
    {
        $collector->update(['is_verified' => true]);

        $this->adminActivityLogs(
            'Collector',
            'Verify',
            'Verified Collector ' . $collector->name . ' (ID: ' . $collector->employee_id . ')'
        );

        return back()->with('success', 'Collector verified successfully');
    }

    /**
     * Unverify a collector account.
     */
    public function unverify(Collector $collector)
    {
        $collector->update(['is_verified' => false]);

        $this->adminActivityLogs(
            'Collector',
            'Unverify',
            'Unverified Collector ' . $collector->name . ' (ID: ' . $collector->employee_id . ')'
        );

        return back()->with('success', 'Collector unverified successfully');
    }

    /**
     * Approve and verify an unverified collector account.
     */
    public function approve(Collector $collector)
    {
        if ($collector->is_verified) {
            return back()->with('error', 'Collector is already verified');
        }

        $collector->update(['is_verified' => true]);

        $this->adminActivityLogs(
            'Collector',
            'Approve',
            'Approved and Verified Collector ' . $collector->name . ' (ID: ' . $collector->employee_id . ')'
        );

        return back()->with('success', 'Collector approved and verified successfully');
    }

    /**
     * Activate a collector account.
     */
    public function activate(Collector $collector)
    {
        $collector->update(['is_active' => true]);

        $this->adminActivityLogs(
            'Collector',
            'Activate',
            'Activated Collector ' . $collector->name . ' (ID: ' . $collector->employee_id . ')'
        );

        return back()->with('success', 'Collector activated successfully');
    }

    /**
     * Deactivate a collector account.
     */
    public function deactivate(Collector $collector)
    {
        $collector->update(['is_active' => false]);

        $this->adminActivityLogs(
            'Collector',
            'Deactivate',
            'Deactivated Collector ' . $collector->name . ' (ID: ' . $collector->employee_id . ')'
        );

        return back()->with('success', 'Collector deactivated successfully');
    }

    /**
     * Remove the specified collector from storage.
     */
    public function destroy(Collector $collector)
    {
        $this->adminActivityLogs(
            'Collector',
            'Delete',
            'Deleted Collector ' . $collector->name . ' (ID: ' . $collector->employee_id . ') - ' . $collector->email
        );

        // Delete all images if they exist
        if ($collector->profile_image) {
            Storage::disk('private')->delete($collector->profile_image);
        }
        if ($collector->license_number_image) {
            Storage::disk('private')->delete($collector->license_number_image);
        }
        if ($collector->vehicle_plate_number_image) {
            Storage::disk('private')->delete($collector->vehicle_plate_number_image);
        }
        if ($collector->vehicle_type_image) {
            Storage::disk('private')->delete($collector->vehicle_type_image);
        }

        $collector->delete();

        return redirect()->route('admin.collector-management.index')
            ->with('success', 'Collector deleted successfully');
    }

    /**
     * Get collector statistics for dashboard.
     */
    public function statistics(): Response
    {
        $stats = [
            'total_collectors' => Collector::count(),
            'active_collectors' => Collector::where('is_active', true)->count(),
            'inactive_collectors' => Collector::where('is_active', false)->count(),
            'verified_collectors' => Collector::where('is_verified', true)->count(),
            'unverified_collectors' => Collector::where('is_verified', false)->count(),
            'collectors_by_vehicle_type' => Collector::selectRaw('vehicle_type, COUNT(*) as count')
                ->whereNotNull('vehicle_type')
                ->groupBy('vehicle_type')
                ->orderBy('count', 'desc')
                ->get(),
            'recent_registrations' => Collector::orderBy('created_at', 'desc')
                ->take(10)
                ->get(['id', 'name', 'email', 'employee_id', 'is_active', 'is_verified', 'created_at']),
        ];

        $this->adminActivityLogs(
            'Collector',
            'View Statistics',
            'Viewed Collector Statistics Dashboard'
        );

        return Inertia::render('Admin/CollectorManagement/statistics', [
            'statistics' => $stats,
        ]);
    }

    /**
     * Serve collector profile image.
     */
    public function serveProfileImage(Collector $collector)
    {
        if (!$collector->profile_image || !Storage::disk('private')->exists($collector->profile_image)) {
            abort(404);
        }

        return Storage::disk('private')->response($collector->profile_image);
    }

    /**
     * Serve collector license number image.
     */
    public function serveLicenseImage(Collector $collector)
    {
        if (!$collector->license_number_image || !Storage::disk('private')->exists($collector->license_number_image)) {
            abort(404);
        }

        return Storage::disk('private')->response($collector->license_number_image);
    }

    /**
     * Serve collector vehicle plate number image.
     */
    public function serveVehiclePlateImage(Collector $collector)
    {
        if (!$collector->vehicle_plate_number_image || !Storage::disk('private')->exists($collector->vehicle_plate_number_image)) {
            abort(404);
        }

        return Storage::disk('private')->response($collector->vehicle_plate_number_image);
    }

    /**
     * Serve collector vehicle type image.
     */
    public function serveVehicleTypeImage(Collector $collector)
    {
        if (!$collector->vehicle_type_image || !Storage::disk('private')->exists($collector->vehicle_type_image)) {
            abort(404);
        }

        return Storage::disk('private')->response($collector->vehicle_type_image);
    }
}