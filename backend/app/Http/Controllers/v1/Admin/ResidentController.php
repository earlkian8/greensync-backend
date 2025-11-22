<?php

namespace App\Http\Controllers\v1\Admin;

use App\Models\Resident;
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
use Maatwebsite\Excel\Facades\Excel;

class ResidentController extends Controller
{
    use ActivityLogsTrait;

    /**
     * Display a listing of residents.
     */
    public function index(Request $request): Response
    {
        $search = $request->get('search', '');
        $page = $request->get('page', 1);
        $verificationFilter = $request->get('verification', ''); // all, verified, unverified
        $barangayFilter = $request->get('barangay', '');

        $query = Resident::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone_number', 'like', "%{$search}%")
                  ->orWhere('barangay', 'like', "%{$search}%");
            });
        }

        // Filter by verification status
        if ($verificationFilter === 'verified') {
            $query->where('is_verified', true);
        } elseif ($verificationFilter === 'unverified') {
            $query->where('is_verified', false);
        }

        // Filter by barangay
        if ($barangayFilter) {
            $query->where('barangay', $barangayFilter);
        }

        $residents = $query->withCount([
            'wasteBins',
            'collectionRequests',
            'verifiedCollections'
        ])
        ->orderBy('created_at', 'desc')
        ->paginate(10)
        ->withQueryString();

        // Profile image URLs are automatically included via the model accessor

        // Get unique barangays for filter dropdown
        $barangays = Resident::select('barangay')
                            ->distinct()
                            ->orderBy('barangay')
                            ->pluck('barangay');

        return Inertia::render('Admin/ResidentManagement/index', [
            'residents' => $residents,
            'barangays' => $barangays,
            'search' => $search,
            'verificationFilter' => $verificationFilter,
            'barangayFilter' => $barangayFilter,
        ]);
    }

    /**
     * Show the form for creating a new resident.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/ResidentManagement/add');
    }

    /**
     * Store a newly created resident in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:residents',
            'phone_number' => 'required|string|max:20|unique:residents',
            'password' => 'required|string|min:8|confirmed',
            'house_no' => 'nullable|string|max:50',
            'street' => 'nullable|string|max:255',
            'barangay' => 'required|string|max:100',
            'city' => 'required|string|max:100',
            'province' => 'required|string|max:100',
            'country' => 'required|string|max:100',
            'postal_code' => 'required|string|max:10',
            'profile_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'is_verified' => 'nullable|boolean',
        ]);

        DB::beginTransaction();
        try {
            $residentData = [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone_number' => $validated['phone_number'],
                'password' => Hash::make($validated['password']),
                'house_no' => $validated['house_no'] ?? null,
                'street' => $validated['street'] ?? null,
                'barangay' => $validated['barangay'],
                'city' => $validated['city'],
                'province' => $validated['province'],
                'country' => $validated['country'],
                'postal_code' => $validated['postal_code'],
                'is_verified' => $validated['is_verified'] ?? false,
            ];

            // Handle profile image upload
            $imagePath = null;
            if ($request->hasFile('profile_image')) {
                $imagePath = $request->file('profile_image')->store('residents/profiles', 'public');
                $residentData['profile_image'] = $imagePath;
            }

            // Auto-verify if address is complete (only if is_verified is not explicitly set)
            $tempResident = new Resident($residentData);
            if ($tempResident->isAddressComplete() && !array_key_exists('is_verified', $validated)) {
                $residentData['is_verified'] = true;
            }

            $resident = Resident::create($residentData);

            DB::commit();

            $this->adminActivityLogs(
                'Resident',
                'Add',
                'Created Resident ' . $resident->name . ' (' . $resident->email . ') - ' . $resident->barangay
            );

            return redirect()->route('admin.resident-management.index')
                ->with('success', 'Resident created successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            
            // Delete uploaded image if transaction failed
            if (isset($imagePath)) {
                Storage::disk('public')->delete($imagePath);
            }
            
            return back()->withErrors(['error' => 'Failed to create resident: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Display the specified resident.
     */
    public function show(Resident $resident): Response
{
    $resident->load([
        'wasteBins',
        'collectionRequests',
        'verifiedCollections',
        'region',
        'provinceRelation',
        'cityRelation',
        'barangayRelation'
    ]);

    $resident->loadCount([
        'wasteBins',
        'collectionRequests',
        'verifiedCollections'
    ]);

    $this->adminActivityLogs(
        'Resident',
        'View',
        'Viewed Resident ' . $resident->name . ' (' . $resident->email . ')'
    );

    return Inertia::render('Admin/ResidentManagement/show', [
        'resident' => $resident,
    ]);
}

    /**
     * Show the form for editing the specified resident.
     */
    public function edit(Resident $resident): Response
    {
        $this->adminActivityLogs(
            'Resident',
            'Edit',
            'Edit Resident ' . $resident->name . ' (' . $resident->email . ')'
        );

        return Inertia::render('Admin/ResidentManagement/edit', [
            'resident' => $resident,
        ]);
    }

    /**
     * Update the specified resident in storage.
     */
    public function update(Request $request, Resident $resident)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('residents')->ignore($resident->id),
            ],
            'phone_number' => [
                'required',
                'string',
                'max:20',
                Rule::unique('residents')->ignore($resident->id),
            ],
            'password' => 'nullable|string|min:8|confirmed',
            'house_no' => 'nullable|string|max:50',
            'street' => 'nullable|string|max:255',
            'barangay' => 'required|string|max:100',
            'city' => 'required|string|max:100',
            'province' => 'required|string|max:100',
            'country' => 'required|string|max:100',
            'postal_code' => 'required|string|max:10',
            'profile_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'is_verified' => 'nullable|boolean',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone_number' => $validated['phone_number'],
            'house_no' => $validated['house_no'] ?? null,
            'street' => $validated['street'] ?? null,
            'barangay' => $validated['barangay'],
            'city' => $validated['city'],
            'province' => $validated['province'],
            'country' => $validated['country'],
            'postal_code' => $validated['postal_code'],
            'is_verified' => $validated['is_verified'] ?? $resident->is_verified,
        ];

        // Only update password if provided
        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        // Handle profile image upload
        if ($request->hasFile('profile_image')) {
            // Delete old image if exists
            if ($resident->profile_image) {
                Storage::disk('public')->delete($resident->profile_image);
            }
            $path = $request->file('profile_image')->store('residents/profiles', 'public');
            $updateData['profile_image'] = $path;
        }

        // Auto-verify if address is complete (only if is_verified is not explicitly set to false)
        $tempResident = $resident->replicate();
        $tempResident->fill($updateData);
        
        // Only auto-verify if address is complete and is_verified wasn't explicitly set to false
        if ($tempResident->isAddressComplete() && (!array_key_exists('is_verified', $validated) || $validated['is_verified'] !== false)) {
            $updateData['is_verified'] = true;
        }

        $resident->update($updateData);

        $this->adminActivityLogs(
            'Resident',
            'Update',
            'Updated Resident ' . $resident->name . ' (' . $resident->email . ') - ' . $resident->barangay
        );

        return redirect()->route('admin.resident-management.index')
            ->with('success', 'Resident updated successfully');
    }

    /**
     * Verify a resident account.
     */
    public function verify(Resident $resident)
    {
        $resident->update(['is_verified' => true]);

        $this->adminActivityLogs(
            'Resident',
            'Verify',
            'Verified Resident ' . $resident->name . ' (' . $resident->email . ')'
        );

        return back()->with('success', 'Resident verified successfully');
    }

    /**
     * Unverify a resident account.
     */
    public function unverify(Resident $resident)
    {
        $resident->update(['is_verified' => false]);

        $this->adminActivityLogs(
            'Resident',
            'Unverify',
            'Unverified Resident ' . $resident->name . ' (' . $resident->email . ')'
        );

        return back()->with('success', 'Resident unverified successfully');
    }

    

    /**
     * Remove the specified resident from storage.
     */
    public function destroy(Resident $resident)
    {
        $this->adminActivityLogs(
            'Resident',
            'Delete',
            'Deleted Resident ' . $resident->name . ' (' . $resident->email . ') - ' . $resident->barangay
        );

        // Delete profile image if exists
        if ($resident->profile_image) {
            Storage::disk('public')->delete($resident->profile_image);
        }

        $resident->delete();

        return redirect()->route('admin.resident-management.index')
            ->with('success', 'Resident deleted successfully');
    }

    /**
     * Bulk delete residents.
     */
    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'resident_ids' => 'required|array|min:1',
            'resident_ids.*' => 'required|exists:residents,id',
        ]);

        DB::beginTransaction();
        try {
            $residents = Resident::whereIn('id', $validated['resident_ids'])->get();
            $deletedCount = 0;

            foreach ($residents as $resident) {
                // Delete profile image if exists
                if ($resident->profile_image) {
                    Storage::disk('public')->delete($resident->profile_image);
                }
                $resident->delete();
                $deletedCount++;
            }

            DB::commit();

            $this->adminActivityLogs(
                'Resident',
                'Bulk Delete',
                'Bulk deleted ' . $deletedCount . ' residents'
            );

            return redirect()->route('admin.resident-management.index')
                ->with('success', $deletedCount . ' resident(s) deleted successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to delete residents: ' . $e->getMessage()]);
        }
    }

    /**
     * Export residents to Excel/CSV.
     */
    public function export(Request $request)
    {
        $search = $request->get('search', '');
        $verificationFilter = $request->get('verification', '');
        $barangayFilter = $request->get('barangay', '');

        $query = Resident::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone_number', 'like', "%{$search}%")
                  ->orWhere('barangay', 'like', "%{$search}%");
            });
        }

        if ($verificationFilter === 'verified') {
            $query->where('is_verified', true);
        } elseif ($verificationFilter === 'unverified') {
            $query->where('is_verified', false);
        }

        if ($barangayFilter) {
            $query->where('barangay', $barangayFilter);
        }

        $residents = $query->orderBy('created_at', 'desc')->get();

        $filename = 'residents_export_' . date('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function() use ($residents) {
            $file = fopen('php://output', 'w');
            
            // Add CSV headers
            fputcsv($file, [
                'ID',
                'Name',
                'Email',
                'Phone Number',
                'House No',
                'Street',
                'Barangay',
                'City',
                'Province',
                'Country',
                'Postal Code',
                'Is Verified',
                'Created At'
            ]);

            // Add data rows
            foreach ($residents as $resident) {
                fputcsv($file, [
                    $resident->id,
                    $resident->name,
                    $resident->email,
                    $resident->phone_number,
                    $resident->house_no ?? '',
                    $resident->street ?? '',
                    $resident->barangay,
                    $resident->city,
                    $resident->province,
                    $resident->country,
                    $resident->postal_code,
                    $resident->is_verified ? 'Yes' : 'No',
                    $resident->created_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($file);
        };

        $this->adminActivityLogs(
            'Resident',
            'Export',
            'Exported ' . $residents->count() . ' residents to CSV'
        );

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Serve resident profile image stored in private disk.
     */
    public function serveProfileImage(Resident $resident)
    {
        if (!$resident->profile_image || !Storage::disk('private')->exists($resident->profile_image)) {
            abort(404);
        }

        return Storage::disk('private')->response($resident->profile_image);
    }

    /**
     * Get resident statistics for dashboard.
     */
    public function statistics(): Response
    {
        $stats = [
            'total_residents' => Resident::count(),
            'verified_residents' => Resident::where('is_verified', true)->count(),
            'unverified_residents' => Resident::where('is_verified', false)->count(),
            'residents_by_barangay' => Resident::selectRaw('barangay, COUNT(*) as count')
                ->groupBy('barangay')
                ->orderBy('count', 'desc')
                ->get(),
            'recent_registrations' => Resident::orderBy('created_at', 'desc')
                ->take(10)
                ->get(['id', 'name', 'email', 'barangay', 'is_verified', 'created_at']),
        ];

        $this->adminActivityLogs(
            'Resident',
            'View Statistics',
            'Viewed Resident Statistics Dashboard'
        );

        return Inertia::render('Admin/ResidentManagement/statistics', [
            'statistics' => $stats,
        ]);
    }

    
}