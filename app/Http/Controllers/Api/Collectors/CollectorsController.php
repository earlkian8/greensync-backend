<?php

namespace App\Http\Controllers\Api\Collectors;

use App\Http\Controllers\Controller;
use App\Models\Collector;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class CollectorsController extends Controller
{
    /** Register new collector */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|unique:collectors,email',
            'phone_number' => 'nullable|string|max:20|unique:collectors,phone_number',
            'password' => 'required|min:6',
            'name' => 'required|string|max:255',
            'employee_id' => 'required|integer|unique:collectors,employee_id',
            'license_number' => 'nullable|string|max:50',
            'vehicle_plate_number' => 'nullable|string|max:20',
            'vehicle_type' => 'nullable|string|max:50',
            'profile_image' => 'nullable|string|max:255',
        ]);

        $validated['password'] = Hash::make($request->password);

        $collector = Collector::create($validated);

        $token = $collector->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Collector registered successfully.',
            'collector' => $collector,
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

        $collector = Collector::where('email', $request->email)->first();

        if (! $collector || ! Hash::check($request->password, $collector->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid email or password'],
            ]);
        }

        // Check if collector is active and verified
        if (!$collector->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Your account has been deactivated.'],
            ]);
        }

        if (!$collector->is_verified) {
            throw ValidationException::withMessages([
                'email' => ['Your account is pending verification.'],
            ]);
        }

        $token = $collector->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'collector' => $collector,
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
        $collector = $request->user();

        $validated = $request->validate([
            'phone_number' => 'nullable|string|max:20|unique:collectors,phone_number,' . $collector->id,
            'name' => 'nullable|string|max:255',
            'license_number' => 'nullable|string|max:50',
            'vehicle_plate_number' => 'nullable|string|max:20',
            'vehicle_type' => 'nullable|string|max:50',
            'profile_image' => 'nullable|string|max:255',
        ]);

        $collector->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'collector' => $collector
        ]);
    }

    /** Delete Account */
    public function destroy(Request $request)
    {
        $collector = $request->user();
        $collector->delete();

        return response()->json([
            'message' => 'Account deleted successfully.'
        ]);
    }

    /** Get Profile */
    public function profile(Request $request)
    {
        $collector = $request->user();

        return response()->json([
            'message' => 'Profile fetched successfully.',
            'collector' => $collector
        ]);
    }

    /** Change Password */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        $collector = $request->user();

        if (!Hash::check($request->current_password, $collector->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is incorrect.'],
            ]);
        }

        $collector->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json([
            'message' => 'Password changed successfully.'
        ]);
    }
}