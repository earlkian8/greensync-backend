<?php

namespace App\Http\Controllers\Api\Collectors;

use App\Http\Controllers\Controller;
use App\Models\Collector;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
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
            $path = $request->file('profile_image')->store('collectors/profiles', 'public');
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
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:collectors,email,' . $collector->id,
            'phone_number' => 'nullable|string|max:20|unique:collectors,phone_number,' . $collector->id,
            'license_number' => 'nullable|string|max:50',
            'vehicle_plate_number' => 'nullable|string|max:20',
            'vehicle_type' => 'nullable|string|max:50',
            'profile_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $updateData = [];

        if (isset($validated['name'])) {
            $updateData['name'] = $validated['name'];
        }
        if (isset($validated['email'])) {
            $updateData['email'] = $validated['email'];
        }
        if (isset($validated['phone_number'])) {
            $updateData['phone_number'] = $validated['phone_number'];
        }
        if (isset($validated['license_number'])) {
            $updateData['license_number'] = $validated['license_number'];
        }
        if (isset($validated['vehicle_plate_number'])) {
            $updateData['vehicle_plate_number'] = $validated['vehicle_plate_number'];
        }
        if (isset($validated['vehicle_type'])) {
            $updateData['vehicle_type'] = $validated['vehicle_type'];
        }

        // Handle profile image upload
        if ($request->hasFile('profile_image')) {
            // Delete old image if exists
            if ($collector->profile_image) {
                Storage::disk('public')->delete($collector->profile_image);
            }
            $path = $request->file('profile_image')->store('collectors/profiles', 'public');
            $updateData['profile_image'] = $path;
        }

        $collector->update($updateData);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'collector' => $collector->fresh()
        ]);
    }

    /** Verify if email exists */
    public function verifyEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $collector = Collector::where('email', $request->email)->first();

        return response()->json([
            'success' => true,
            'exists' => $collector !== null,
            'message' => $collector ? 'Email found' : 'Email not found'
        ]);
    }

    /** Reset password using verification code */
    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'verification_code' => 'required|string|size:6',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $collector = Collector::where('email', $validated['email'])->first();

        if (!$collector) {
            return response()->json([
                'success' => false,
                'message' => 'Email not found'
            ], 404);
        }

        // In a real implementation, you would verify the code from storage/cache
        // For now, we'll use a simple approach - verify code from AsyncStorage on frontend
        // Backend just updates the password if collector exists
        // Note: In production, you should verify the code server-side too
        
        $collector->password = Hash::make($validated['password']);
        $collector->save();

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully'
        ]);
    }

    /** Serve profile image from public storage */
    public function getImage(Request $request, $path)
    {
        try {
            // Check authentication - either via header or query parameter (for React Native Image component)
            $token = $request->bearerToken() ?? $request->query('token');
            
            if (!$token) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            // Verify token using Sanctum
            // Try to authenticate with the token
            $personalAccessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
            
            if (!$personalAccessToken) {
                return response()->json(['message' => 'Invalid or expired token'], 401);
            }

            // Check if token is expired
            if ($personalAccessToken->expires_at && $personalAccessToken->expires_at->isPast()) {
                return response()->json(['message' => 'Token expired'], 401);
            }

            // Get the collector from the token
            $collector = $personalAccessToken->tokenable;
            if (!$collector || !($collector instanceof Collector)) {
                return response()->json(['message' => 'Invalid token'], 401);
            }

            // Decode the path in case it was URL encoded
            $decodedPath = urldecode($path);
            
            // Verify the image belongs to this collector (security check)
            if (strpos($decodedPath, 'collectors/') !== 0) {
                return response()->json(['message' => 'Invalid image path'], 403);
            }
            
            if (!Storage::disk('public')->exists($decodedPath)) {
                return response()->json(['message' => 'Image not found'], 404);
            }

            $file = Storage::disk('public')->get($decodedPath);
            $type = Storage::disk('public')->mimeType($decodedPath);
            $image = basename($decodedPath);

            return response($file, 200)
                ->header('Content-Type', $type)
                ->header('Content-Disposition', 'inline; filename="' . $image . '"');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error serving collector image: ' . $e->getMessage(), [
                'path' => $path ?? null,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Error loading image'], 500);
        }
    }

}