<?php

namespace App\Http\Controllers\v1\Admin\UserManagement;

use App\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use App\Trait\ActivityLogsTrait;

class UserController extends Controller
{
    use ActivityLogsTrait;

    /**
     * Display a listing of users.
     */
    public function index(Request $request): Response
    {
        $search = $request->get('search', '');
        $page = $request->get('page', 1);

        $query = User::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->with('roles')
                      ->orderBy('created_at', 'desc')
                      ->paginate(10)
                      ->withQueryString();

        // Get all roles for the dropdowns
        $roles = Role::all(['id', 'name']);

        return Inertia::render('UserManagement/Users/index', [
            'users' => $users,
            'roles' => $roles,
            'search' => $search,
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create(): Response
    {
        $roles = Role::all(['id', 'name']);
        
        return Inertia::render('UserManagement/Users/add', [
            'roles' => $roles,
        ]);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|string|exists:roles,name',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'email_verified_at' => now(),
        ]);

        // Assign role to user
        $user->assignRole($validated['role']);

        $this->adminActivityLogs(
            'User',
            'Add',
            'Created User ' . $user->name . ' (' . $user->email . ') with role: ' . $validated['role']
        );

        return redirect()->route('user-management.users.index')
            ->with('success', 'User created successfully');
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user): Response
    {
        $roles = Role::all(['id', 'name']);
        
        // Load user with roles
        $user->load('roles');

        $this->adminActivityLogs(
            'User',
            'Edit',
            'Edit User ' . $user->name . ' (' . $user->email . ')'
        );

        return Inertia::render('UserManagement/Users/edit', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
            'password' => 'nullable|string|min:8|confirmed',
            'role' => 'required|string|exists:roles,name',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
        ];

        // Only update password if provided
        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        // Update user role - remove all roles and assign new one
        $user->syncRoles([$validated['role']]);

        $this->adminActivityLogs(
            'User',
            'Update',
            'Updated User ' . $user->name . ' (' . $user->email . ') with role: ' . $validated['role']
        );

        return redirect()->route('user-management.users.index')
            ->with('success', 'User updated successfully');
    }

    /**
     * Reset user password to default.
     */
    public function resetPassword(User $user)
    {
        // Prevent resetting password of the current user
        if ($user->id === Auth::id()) {
            return back()->withErrors(['error' => 'You cannot reset your own password.']);
        }

        $defaultPassword = config('system.default_password');
        
        $user->update([
            'password' => Hash::make($defaultPassword),
        ]);

        $this->adminActivityLogs(
            'User',
            'Reset Password',
            'Reset password for User ' . $user->name . ' (' . $user->email . ')'
        );

        return back()->with('success', 'Password reset successfully');
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(User $user)
    {
        // Prevent deletion of the current user
        if ($user->id === Auth::id()) {
            return back()->withErrors(['error' => 'You cannot delete your own account.']);
        }

        $this->adminActivityLogs(
            'User',
            'Delete',
            'Deleted User ' . $user->name . ' (' . $user->email . ')'
        );

        $user->delete();

        return redirect()->route('user-management.users.index')
            ->with('success', 'User deleted successfully');
    }
}