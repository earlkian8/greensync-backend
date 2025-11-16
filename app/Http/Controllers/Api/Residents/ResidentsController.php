<?php

namespace App\Http\Controllers\Api\Residents;

use App\Http\Controllers\Controller;
use App\Models\Resident;
use App\Models\CollectionRequest;
use App\Models\WasteBin;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class ResidentsController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|unique:residents,email',
            'phone_number' => 'nullable|string|max:20',
            'password' => 'required|min:6',
            'name' => 'required|string|max:255',
            'house_no' => 'nullable|string|max:50',
            'street' => 'nullable|string|max:255',
            'barangay' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'province' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:20',
        ]);

        $validated['password'] = Hash::make($request->password);

        $resident = Resident::create($validated);

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
            'barangay' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'province' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:20',
        ]);

        $resident->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'resident' => $resident
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

        return response()->json([
            'message' => 'Profile fetched successfully.',
            'resident' => $resident
        ]);
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
                    'bin_location' => $resident->barangay ?? 'N/A',
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
