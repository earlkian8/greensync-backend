<?php

namespace App\Http\Controllers\Api\Residents;

use App\Http\Controllers\Controller;
use App\Models\Resident;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

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
}
