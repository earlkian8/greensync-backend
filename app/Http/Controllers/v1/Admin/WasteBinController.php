<?php

namespace App\Http\Controllers\v1\Admin;

use App\Models\WasteBin;
use App\Models\Resident;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use App\Trait\ActivityLogsTrait;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Str;

class WasteBinController extends Controller
{
    use ActivityLogsTrait;

    /**
     * Display a listing of waste bins.
     */
    public function index(Request $request): Response
    {
        $search = $request->get('search', '');
        $page = $request->get('page', 1);
        $binTypeFilter = $request->get('bin_type', ''); // all, biodegradable, non-biodegradable, recyclable, hazardous
        $statusFilter = $request->get('status', ''); // all, active, inactive, damaged, full
        $residentFilter = $request->get('resident', '');

        $query = WasteBin::with('resident');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('qr_code', 'like', "%{$search}%")
                  ->orWhereHas('resident', function ($residentQuery) use ($search) {
                      $residentQuery->where('name', 'like', "%{$search}%")
                                    ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by bin type
        if ($binTypeFilter) {
            $query->where('bin_type', $binTypeFilter);
        }

        // Filter by status
        if ($statusFilter) {
            $query->where('status', $statusFilter);
        }

        // Filter by resident
        if ($residentFilter) {
            $query->where('resident_id', $residentFilter);
        }

        $wasteBins = $query->orderBy('created_at', 'desc')
                          ->paginate(10)
                          ->withQueryString();

        // Get residents for filter dropdown
        $residents = Resident::select('id', 'name', 'email')
                            ->where('is_verified', true)
                            ->orderBy('name')
                            ->get();

        return Inertia::render('Admin/WasteBinManagement/index', [
            'wasteBins' => $wasteBins,
            'residents' => $residents,
            'search' => $search,
            'binTypeFilter' => $binTypeFilter,
            'statusFilter' => $statusFilter,
            'residentFilter' => $residentFilter,
        ]);
    }

    /**
     * Show the form for creating a new waste bin.
     */
    public function create(): Response
    {
        $residents = Resident::select('id', 'name', 'email', 'barangay')
                            ->where('is_verified', true)
                            ->orderBy('name')
                            ->get();

        return Inertia::render('Admin/WasteBinManagement/add', [
            
            'residents' => $residents,
        ]);
    }

    /**
     * Store a newly created waste bin in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'resident_id' => 'required|exists:residents,id',
            'bin_type' => 'required|in:biodegradable,non-biodegradable,recyclable,hazardous',
            'status' => 'required|in:active,inactive,damaged,full',
        ]);

        // Generate unique QR code
        $qrCode = 'WB-' . strtoupper(Str::random(10));
        while (WasteBin::where('qr_code', $qrCode)->exists()) {
            $qrCode = 'WB-' . strtoupper(Str::random(10));
        }

        $wasteBinData = [
            'name' => $validated['name'],
            'qr_code' => $qrCode,
            'resident_id' => $validated['resident_id'],
            'bin_type' => $validated['bin_type'],
            'status' => $validated['status'],
            'registered_at' => now(),
        ];

        $wasteBin = WasteBin::create($wasteBinData);
        $wasteBin->load('resident');

        $this->adminActivityLogs(
            'Waste Bin',
            'Add',
            'Created Waste Bin ' . $wasteBin->name . ' (QR: ' . $wasteBin->qr_code . ') for ' . $wasteBin->resident->name
        );

        return redirect()->route('admin.waste-bin-management.index')
            ->with('success', 'Waste bin created successfully');
    }

    /**
     * Display the specified waste bin.
     */
    public function show(WasteBin $wasteBin): Response
    {
        // Load relationships
        $wasteBin->load(['resident', 'collectionRequests', 'qrCollections']);

        $this->adminActivityLogs(
            'Waste Bin',
            'View',
            'Viewed Waste Bin ' . $wasteBin->name . ' (QR: ' . $wasteBin->qr_code . ')'
        );

        return Inertia::render('Admin/WasteBinManagement/show', [
            'wasteBin' => $wasteBin,
        ]);
    }

    /**
     * Show the form for editing the specified waste bin.
     */
    public function edit(WasteBin $wasteBin): Response
    {
        $wasteBin->load('resident');
        
        $residents = Resident::select('id', 'name', 'email', 'barangay')
                            ->where('is_verified', true)
                            ->orderBy('name')
                            ->get();

        $this->adminActivityLogs(
            'Waste Bin',
            'Edit',
            'Edit Waste Bin ' . $wasteBin->name . ' (QR: ' . $wasteBin->qr_code . ')'
        );

        return Inertia::render('Admin/WasteBinManagement/edit', [
            'wasteBin' => $wasteBin,
            'residents' => $residents,
        ]);
    }

    /**
     * Update the specified waste bin in storage.
     */
    public function update(Request $request, WasteBin $wasteBin)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'resident_id' => 'required|exists:residents,id',
            'bin_type' => 'required|in:biodegradable,non-biodegradable,recyclable,hazardous',
            'status' => 'required|in:active,inactive,damaged,full',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'resident_id' => $validated['resident_id'],
            'bin_type' => $validated['bin_type'],
            'status' => $validated['status'],
        ];

        $wasteBin->update($updateData);
        $wasteBin->load('resident');

        $this->adminActivityLogs(
            'Waste Bin',
            'Update',
            'Updated Waste Bin ' . $wasteBin->name . ' (QR: ' . $wasteBin->qr_code . ') for ' . $wasteBin->resident->name
        );

        return redirect()->route('admin.waste-bin-management.index')
            ->with('success', 'Waste bin updated successfully');
    }

    /**
     * Update the status of a waste bin.
     */
    public function updateStatus(Request $request, WasteBin $wasteBin)
    {
        $validated = $request->validate([
            'status' => 'required|in:active,inactive,damaged,full',
        ]);

        $oldStatus = $wasteBin->status;
        $wasteBin->update(['status' => $validated['status']]);

        $this->adminActivityLogs(
            'Waste Bin',
            'Status Update',
            'Changed Waste Bin ' . $wasteBin->name . ' status from ' . $oldStatus . ' to ' . $validated['status']
        );

        return back()->with('success', 'Waste bin status updated successfully');
    }

    /**
     * Mark waste bin as collected.
     */
    public function markCollected(WasteBin $wasteBin)
    {
        $wasteBin->update([
            'last_collected' => now(),
            'status' => 'active',
        ]);

        $this->adminActivityLogs(
            'Waste Bin',
            'Mark Collected',
            'Marked Waste Bin ' . $wasteBin->name . ' (QR: ' . $wasteBin->qr_code . ') as collected'
        );

        return back()->with('success', 'Waste bin marked as collected successfully');
    }

    /**
     * Remove the specified waste bin from storage.
     */
    public function destroy(WasteBin $wasteBin)
    {
        $wasteBinName = $wasteBin->name;
        $qrCode = $wasteBin->qr_code;

        $this->adminActivityLogs(
            'Waste Bin',
            'Delete',
            'Deleted Waste Bin ' . $wasteBinName . ' (QR: ' . $qrCode . ')'
        );

        $wasteBin->delete();

        return redirect()->route('admin.waste-bin-management.index')
            ->with('success', 'Waste bin deleted successfully');
    }

    /**
     * Generate QR code image for a waste bin.
     */
    public function generateQrCode(WasteBin $wasteBin)
    {
        $wasteBin->load('resident');

        $this->adminActivityLogs(
            'Waste Bin',
            'Generate QR',
            'Generated QR Code for Waste Bin ' . $wasteBin->name . ' (QR: ' . $wasteBin->qr_code . ')'
        );

        // Generate QR code
        $qrCode = QrCode::size(300)
                       ->format('png')
                       ->generate($wasteBin->qr_code);

        return response($qrCode)
            ->header('Content-Type', 'image/png')
            ->header('Content-Disposition', 'attachment; filename="' . $wasteBin->qr_code . '.png"');
    }

    /**
     * Get waste bin statistics for dashboard.
     */
    public function statistics(): Response
    {
        $stats = [
            'total_bins' => WasteBin::count(),
            'active_bins' => WasteBin::where('status', 'active')->count(),
            'inactive_bins' => WasteBin::where('status', 'inactive')->count(),
            'damaged_bins' => WasteBin::where('status', 'damaged')->count(),
            'full_bins' => WasteBin::where('status', 'full')->count(),
            'bins_by_type' => WasteBin::selectRaw('bin_type, COUNT(*) as count')
                ->groupBy('bin_type')
                ->orderBy('count', 'desc')
                ->get(),
            'bins_by_status' => WasteBin::selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->orderBy('count', 'desc')
                ->get(),
            'recent_registrations' => WasteBin::with('resident')
                ->orderBy('registered_at', 'desc')
                ->take(10)
                ->get(['id', 'name', 'qr_code', 'resident_id', 'bin_type', 'status', 'registered_at']),
            'recently_collected' => WasteBin::with('resident')
                ->whereNotNull('last_collected')
                ->orderBy('last_collected', 'desc')
                ->take(10)
                ->get(['id', 'name', 'qr_code', 'resident_id', 'bin_type', 'last_collected']),
        ];

        $this->adminActivityLogs(
            'Waste Bin',
            'View Statistics',
            'Viewed Waste Bin Statistics Dashboard'
        );

        return Inertia::render('Admin/WasteBinManagement/statistics', [
            'statistics' => $stats,
        ]);
    }
}