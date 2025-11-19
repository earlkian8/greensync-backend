<?php

namespace App\Http\Controllers\Api\Collectors;

use App\Http\Controllers\Controller;
use App\Models\Collector;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
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
            'license_number' => 'nullable|string|max:50',
            'license_number_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'vehicle_plate_number' => 'nullable|string|max:20',
            'vehicle_plate_number_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'vehicle_type' => 'nullable|string|max:50',
            'vehicle_type_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'profile_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Auto-generate employee_id
        $lastEmployeeId = Collector::max('employee_id') ?? 0;
        $employeeId = $lastEmployeeId + 1;

        $collectorData = [
            'email' => $validated['email'],
            'phone_number' => $validated['phone_number'] ?? null,
            'password' => Hash::make($request->password),
            'name' => $validated['name'],
            'employee_id' => $employeeId,
            'license_number' => $validated['license_number'] ?? null,
            'vehicle_plate_number' => $validated['vehicle_plate_number'] ?? null,
            'vehicle_type' => $validated['vehicle_type'] ?? null,
        ];

        // Handle profile image upload
        if ($request->hasFile('profile_image')) {
            $path = $request->file('profile_image')->store('collectors/profiles', 'private');
            $collectorData['profile_image'] = $path;
        }

        // Handle license number image upload
        if ($request->hasFile('license_number_image')) {
            $path = $request->file('license_number_image')->store('collectors/licenses', 'private');
            $collectorData['license_number_image'] = $path;
        }

        // Handle vehicle plate number image upload
        if ($request->hasFile('vehicle_plate_number_image')) {
            $path = $request->file('vehicle_plate_number_image')->store('collectors/vehicle-plates', 'private');
            $collectorData['vehicle_plate_number_image'] = $path;
        }

        // Handle vehicle type image upload
        if ($request->hasFile('vehicle_type_image')) {
            $path = $request->file('vehicle_type_image')->store('collectors/vehicle-types', 'private');
            $collectorData['vehicle_type_image'] = $path;
        }

        $collector = Collector::create($collectorData);

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
            'license_number_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'vehicle_plate_number' => 'nullable|string|max:20',
            'vehicle_plate_number_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'vehicle_type' => 'nullable|string|max:50',
            'vehicle_type_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'profile_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $updateData = [
            'phone_number' => $validated['phone_number'] ?? $collector->phone_number,
            'name' => $validated['name'] ?? $collector->name,
            'license_number' => $validated['license_number'] ?? $collector->license_number,
            'vehicle_plate_number' => $validated['vehicle_plate_number'] ?? $collector->vehicle_plate_number,
            'vehicle_type' => $validated['vehicle_type'] ?? $collector->vehicle_type,
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

        return response()->json([
            'message' => 'Profile updated successfully.',
            'collector' => $collector->fresh()
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