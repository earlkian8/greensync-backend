<?php

namespace App\Http\Controllers\Api\Residents;

use App\Http\Controllers\Controller;
use App\Models\Resident;
use App\Models\CollectionRequest;
use App\Models\WasteBin;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;
use Woenel\Prpcmblmts\Facades\Philippines;
use Woenel\Prpcmblmts\Philippines as PrpcmblmtsPhilippines;

class ResidentsController extends Controller
{
    protected PrpcmblmtsPhilippines $philippines;

    public function __construct(PrpcmblmtsPhilippines $philippines)
    {
        $this->philippines = $philippines;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|unique:residents,email',
            'phone_number' => 'nullable|string|max:20',
            'password' => 'required|min:6',
            'name' => 'required|string|max:255',
            'house_no' => 'nullable|string|max:50',
            'street' => 'nullable|string|max:255',
            // New structure with foreign keys
            'region_id' => 'nullable|exists:philippine_regions,id',
            'province_id' => 'nullable|exists:philippine_provinces,id',
            'city_id' => 'nullable|exists:philippine_cities,id',
            'barangay_id' => 'nullable|exists:philippine_barangays,id',
            // Old structure for backward compatibility
            'barangay' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'province' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:20',
            'profile_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Validate that if using new structure, all required fields are present
        if ($request->has('region_id') || $request->has('province_id') || $request->has('city_id') || $request->has('barangay_id')) {
            if (!$request->region_id || !$request->province_id || !$request->city_id || !$request->barangay_id) {
                throw ValidationException::withMessages([
                    'address' => ['When using the new address structure, all of region_id, province_id, city_id, and barangay_id are required.'],
                ]);
            }
            
            // Validate relationships
            $region = $this->philippines->regions()->where('id', $request->region_id)->first();
            if (!$region) {
                throw ValidationException::withMessages([
                    'region_id' => ['The selected region does not exist.'],
                ]);
            }

            $province = $this->philippines->provinces()->where('id', $request->province_id)->first();
            if (!$province || $province->region_code !== $region->code) {
                throw ValidationException::withMessages([
                    'province_id' => ['The selected province does not belong to the selected region.'],
                ]);
            }
            
            $city = $this->philippines->cities()->where('id', $request->city_id)->first();
            if (!$city || $city->province_code !== $province->code) {
                throw ValidationException::withMessages([
                    'city_id' => ['The selected city does not belong to the selected province.'],
                ]);
            }
            
            $barangay = $this->philippines->barangays()->where('id', $request->barangay_id)->first();
            if (!$barangay || $barangay->city_code !== $city->code) {
                throw ValidationException::withMessages([
                    'barangay_id' => ['The selected barangay does not belong to the selected city.'],
                ]);
            }

            // Ensure legacy string columns are populated for backward compatibility
            $validated['province'] = $province->name;
            $validated['city'] = $city->name;
            $validated['barangay'] = $barangay->name;
            if (!isset($validated['country'])) {
                $validated['country'] = 'Philippines';
            }
        }

        $validated['password'] = Hash::make($request->password);
        
        // Set default country if using new structure
        if ($request->has('region_id') && !$request->has('country')) {
            $validated['country'] = 'Philippines';
        }

        // Handle profile image upload using private storage
        if ($request->hasFile('profile_image')) {
            $path = $request->file('profile_image')->store('residents/profiles', 'private');
            $validated['profile_image'] = $path;
        }

        // Auto-verify if address is complete
        $resident = new Resident($validated);
        $validated['is_verified'] = $resident->isAddressComplete();

        $resident = Resident::create($validated);
        
        // Load address relationships for response
        $resident->load(['region', 'provinceRelation', 'cityRelation', 'barangayRelation']);

        $token = $resident->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Resident registered successfully.',
            'resident' => $resident,
            'token' => $token
        ], 201);
    }

    /** Login */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $resident = Resident::where('email', $request->email)->first();

        if (! $resident || ! Hash::check($request->password, $resident->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid email or password'],
            ]);
        }

        $token = $resident->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'resident' => $resident,
            'token' => $token
        ]);
    }

    /** Logout */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully.'
        ]);
    }

    /** Update Profile */
    public function update(Request $request)
    {
        $resident = $request->user();

        $validated = $request->validate([
            'phone_number' => 'nullable|string|max:20',
            'name' => 'nullable|string|max:255',
            'house_no' => 'nullable|string|max:50',
            'street' => 'nullable|string|max:255',
            // New structure with foreign keys
            'region_id' => 'nullable|exists:philippine_regions,id',
            'province_id' => 'nullable|exists:philippine_provinces,id',
            'city_id' => 'nullable|exists:philippine_cities,id',
            'barangay_id' => 'nullable|exists:philippine_barangays,id',
            // Old structure for backward compatibility
            'barangay' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'province' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:20',
            'profile_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Validate relationships if using new structure
        if ($request->has('region_id') || $request->has('province_id') || $request->has('city_id') || $request->has('barangay_id')) {
            // If any new structure field is provided, all should be provided
            $hasNewStructure = $request->region_id || $request->province_id || $request->city_id || $request->barangay_id;
            $hasAllNewFields = $request->region_id && $request->province_id && $request->city_id && $request->barangay_id;
            
            if ($hasNewStructure && !$hasAllNewFields) {
                throw ValidationException::withMessages([
                    'address' => ['When updating address with new structure, all of region_id, province_id, city_id, and barangay_id are required.'],
                ]);
            }
            
            if ($hasAllNewFields) {
                // Validate relationships
                $region = $this->philippines->regions()->where('id', $request->region_id)->first();
                if (!$region) {
                    throw ValidationException::withMessages([
                        'region_id' => ['The selected region does not exist.'],
                    ]);
                }
                
                $province = $this->philippines->provinces()->where('id', $request->province_id)->first();
                if (!$province || $province->region_code !== $region->code) {
                    throw ValidationException::withMessages([
                        'province_id' => ['The selected province does not belong to the selected region.'],
                    ]);
                }
                
                $city = $this->philippines->cities()->where('id', $request->city_id)->first();
                if (!$city || $city->province_code !== $province->code) {
                    throw ValidationException::withMessages([
                        'city_id' => ['The selected city does not belong to the selected province.'],
                    ]);
                }
                
                $barangay = $this->philippines->barangays()->where('id', $request->barangay_id)->first();
                if (!$barangay || $barangay->city_code !== $city->code) {
                    throw ValidationException::withMessages([
                        'barangay_id' => ['The selected barangay does not belong to the selected city.'],
                    ]);
                }
                
                // Sync legacy string columns for backward compatibility
                $validated['province'] = $province->name;
                $validated['city'] = $city->name;
                $validated['barangay'] = $barangay->name;
                if (!isset($validated['country'])) {
                    $validated['country'] = 'Philippines';
                }
            }
        }

        // Handle profile image upload
        if ($request->hasFile('profile_image')) {
            // Delete old image if exists
            if ($resident->profile_image) {
                Storage::disk('private')->delete($resident->profile_image);
            }
            $path = $request->file('profile_image')->store('residents/profiles', 'private');
            $validated['profile_image'] = $path;
        }

        $resident->update($validated);

        // Auto-verify if address is complete
        if ($resident->isAddressComplete() && !$resident->is_verified) {
            $resident->update(['is_verified' => true]);
        }
        
        // Load address relationships for response
        $resident->load(['region', 'provinceRelation', 'cityRelation', 'barangayRelation']);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'resident' => $resident->fresh(['region', 'provinceRelation', 'cityRelation', 'barangayRelation'])
        ]);
    }

    /** Delete Account */
    public function destroy(Request $request)
    {
        $resident = $request->user();
        $resident->delete();

        return response()->json([
            'message' => 'Account deleted successfully.'
        ]);
    }

    public function profile(Request $request)
    {
        $resident = $request->user();
        
        // Load relationships for accurate counts and address data
        $resident->loadCount(['wasteBins', 'collectionRequests', 'verifiedCollections']);
        $resident->load(['region', 'provinceRelation', 'cityRelation', 'barangayRelation']);

        return response()->json([
            'message' => 'Profile fetched successfully.',
            'resident' => $resident
        ]);
    }

    /**
     * Serve the resident's profile image from private storage.
     */
    public function profileImage(Resident $resident)
    {
        if (!$resident->profile_image || !Storage::disk('private')->exists($resident->profile_image)) {
            return response()->json([
                'message' => 'Profile image not found.',
            ], 404);
        }

        return Storage::disk('private')->response(
            $resident->profile_image,
            null,
            ['Cache-Control' => 'public, max-age=86400']
        );
    }

    /** Get Dashboard Data */
    public function dashboard(Request $request, $resident_id)
    {
        // Get resident by ID
        $resident = Resident::find($resident_id);

        if (!$resident) {
            return response()->json([
                'message' => 'Resident not found.'
            ], 404);
        }

        // Get upcoming schedules (collection requests that are scheduled/assigned and future dated)
        $upcomingSchedules = CollectionRequest::with('wasteBin.resident')
            ->where('user_id', $resident_id)
            ->whereIn('status', ['assigned', 'in_progress', 'pending'])
            ->whereDate('preferred_date', '>=', Carbon::today())
            ->orderBy('preferred_date', 'asc')
            ->orderBy('preferred_time', 'asc')
            ->limit(10)
            ->get()
            ->map(function ($request) use ($resident) {
                $time = $request->preferred_time 
                    ? Carbon::parse($request->preferred_time)->format('H:i:s') 
                    : '08:00:00';
                
                return [
                    'id' => $request->id,
                    'collection_date' => $request->preferred_date->format('Y-m-d'),
                    'collection_time' => $time,
                    'waste_type' => ucfirst(str_replace('-', ' ', $request->waste_type ?? 'General Waste')),
                    'status' => ucfirst(str_replace('_', ' ', $request->status ?? 'Scheduled')),
                    'bin_location' => $resident->barangayRelation?->name ?? $resident->barangay ?? 'N/A',
                ];
            });

        // Get waste bins for the resident
        $wasteBins = WasteBin::where('resident_id', $resident_id)
            ->get()
            ->map(function ($bin) {
                return [
                    'id' => $bin->id,
                    'bin_type' => ucfirst(str_replace('-', ' ', $bin->bin_type)),
                    'status' => $bin->status ?? 'Active',
                ];
            });

        // Get recent notifications (limit 2)
        $notifications = Notification::where(function ($query) use ($resident_id) {
                $query->where('recipient_type', 'resident')
                    ->where('recipient_id', $resident_id);
            })
            ->orWhere('recipient_type', 'all_residents')
            ->orderBy('created_at', 'desc')
            ->limit(2)
            ->get()
            ->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'created_at' => $notification->created_at->toISOString(),
                    'is_read' => $notification->is_read ?? false,
                ];
            });

        // Get unread notification count
        $unreadNotifications = Notification::where(function ($query) use ($resident_id) {
                $query->where('recipient_type', 'resident')
                    ->where('recipient_id', $resident_id);
            })
            ->orWhere('recipient_type', 'all_residents')
            ->where('is_read', false)
            ->count();

        return response()->json([
            'message' => 'Dashboard data fetched successfully.',
            'data' => [
                'upcoming_schedules' => $upcomingSchedules,
                'waste_bins' => $wasteBins,
                'notifications' => $notifications,
                'unread_notifications_count' => $unreadNotifications,
            ]
        ]);
    }
}
