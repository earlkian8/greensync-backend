<?php

namespace App\Http\Controllers\v1\Admin;

use App\Models\Notification;
use App\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use App\Trait\ActivityLogsTrait;

class NotificationController extends Controller
{
    use ActivityLogsTrait;

    /**
     * Display a listing of notifications.
     */
    public function index(Request $request): Response
    {
        $search = $request->get('search', '');
        $page = $request->get('page', 1);
        $typeFilter = $request->get('type', ''); // schedule, alert, announcement, request_update, route_assignment
        $priorityFilter = $request->get('priority', ''); // low, medium, high, urgent
        $recipientTypeFilter = $request->get('recipient_type', ''); // resident, collector, all_residents, all_collectors, specific

        $query = Notification::with(['recipient', 'sender']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%")
                  ->orWhereHas('recipient', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by notification type
        if ($typeFilter) {
            $query->where('notification_type', $typeFilter);
        }

        // Filter by priority
        if ($priorityFilter) {
            $query->where('priority', $priorityFilter);
        }

        // Filter by recipient type
        if ($recipientTypeFilter) {
            $query->where('recipient_type', $recipientTypeFilter);
        }

        $notifications = $query->orderBy('created_at', 'desc')
                               ->paginate(10)
                               ->withQueryString();

        // Get all users for recipient dropdown
        $users = User::select('id', 'name', 'email')
                    ->orderBy('name')
                    ->get();

        return Inertia::render('Admin/NotificationManagement/index', [
            'notifications' => $notifications,
            'users' => $users,
            'search' => $search,
            'typeFilter' => $typeFilter,
            'priorityFilter' => $priorityFilter,
            'recipientTypeFilter' => $recipientTypeFilter,
        ]);
    }

    /**
     * Show the form for creating a new notification.
     */
    public function create(): Response
    {
        $users = User::select('id', 'name', 'email')
                    ->orderBy('name')
                    ->get();

        return Inertia::render('Admin/NotificationManagement/add', [
            'users' => $users,
        ]);
    }

    /**
     * Store a newly created notification in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'recipient_type' => 'required|in:resident,collector,all_residents,all_collectors,specific',
            'recipient_id' => 'nullable|exists:users,id',
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'notification_type' => 'required|in:schedule,alert,announcement,request_update,route_assignment',
            'priority' => 'required|in:low,medium,high,urgent',
            'action_url' => 'nullable|string|max:255',
        ]);

        // Validate recipient_id based on recipient_type
        if ($validated['recipient_type'] === 'specific' && empty($validated['recipient_id'])) {
            return back()->withErrors(['recipient_id' => 'Recipient is required when recipient type is specific.']);
        }

        $notificationData = [
            'recipient_type' => $validated['recipient_type'],
            'recipient_id' => $validated['recipient_id'] ?? null,
            'sender_id' => Auth::id(),
            'title' => $validated['title'],
            'message' => $validated['message'],
            'notification_type' => $validated['notification_type'],
            'priority' => $validated['priority'],
            'action_url' => $validated['action_url'] ?? null,
            'is_read' => false,
        ];

        $notification = Notification::create($notificationData);

        $recipientInfo = $validated['recipient_type'];
        if ($validated['recipient_type'] === 'specific' && $notification->recipient) {
            $recipientInfo .= ' - ' . $notification->recipient->name;
        }

        $this->adminActivityLogs(
            'Notification',
            'Add',
            'Created Notification "' . $notification->title . '" for ' . $recipientInfo
        );

        return redirect()->route('admin.notification-management.index')
            ->with('success', 'Notification created successfully');
    }

    /**
     * Display the specified notification.
     */
    public function show(Notification $notification): Response
    {
        $notification->load(['recipient', 'sender']);

        $this->adminActivityLogs(
            'Notification',
            'View',
            'Viewed Notification "' . $notification->title . '"'
        );

        return Inertia::render('Admin/NotificationManagement/show', [
            'notification' => $notification,
        ]);
    }

    /**
     * Show the form for editing the specified notification.
     */
    public function edit(Notification $notification): Response
    {
        $users = User::select('id', 'name', 'email')
                    ->orderBy('name')
                    ->get();

        $this->adminActivityLogs(
            'Notification',
            'Edit',
            'Edit Notification "' . $notification->title . '"'
        );

        return Inertia::render('Admin/NotificationManagement/edit', [
            'notification' => $notification,
            'users' => $users,
        ]);
    }

    /**
     * Update the specified notification in storage.
     */
    public function update(Request $request, Notification $notification)
    {
        $validated = $request->validate([
            'recipient_type' => 'required|in:resident,collector,all_residents,all_collectors,specific',
            'recipient_id' => 'nullable|exists:users,id',
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'notification_type' => 'required|in:schedule,alert,announcement,request_update,route_assignment',
            'priority' => 'required|in:low,medium,high,urgent',
            'action_url' => 'nullable|string|max:255',
        ]);

        // Validate recipient_id based on recipient_type
        if ($validated['recipient_type'] === 'specific' && empty($validated['recipient_id'])) {
            return back()->withErrors(['recipient_id' => 'Recipient is required when recipient type is specific.']);
        }

        $updateData = [
            'recipient_type' => $validated['recipient_type'],
            'recipient_id' => $validated['recipient_id'] ?? null,
            'title' => $validated['title'],
            'message' => $validated['message'],
            'notification_type' => $validated['notification_type'],
            'priority' => $validated['priority'],
            'action_url' => $validated['action_url'] ?? null,
        ];

        $notification->update($updateData);

        $recipientInfo = $validated['recipient_type'];
        if ($validated['recipient_type'] === 'specific' && $notification->recipient) {
            $recipientInfo .= ' - ' . $notification->recipient->name;
        }

        $this->adminActivityLogs(
            'Notification',
            'Update',
            'Updated Notification "' . $notification->title . '" for ' . $recipientInfo
        );

        return redirect()->route('admin.notification-management.index')
            ->with('success', 'Notification updated successfully');
    }

    /**
     * Mark notification as read.
     */
    public function markAsRead(Notification $notification)
    {
        $notification->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        $this->adminActivityLogs(
            'Notification',
            'Mark as Read',
            'Marked Notification "' . $notification->title . '" as read'
        );

        return back()->with('success', 'Notification marked as read');
    }

    /**
     * Mark notification as unread.
     */
    public function markAsUnread(Notification $notification)
    {
        $notification->update([
            'is_read' => false,
            'read_at' => null,
        ]);

        $this->adminActivityLogs(
            'Notification',
            'Mark as Unread',
            'Marked Notification "' . $notification->title . '" as unread'
        );

        return back()->with('success', 'Notification marked as unread');
    }

    /**
     * Remove the specified notification from storage.
     */
    public function destroy(Notification $notification)
    {
        $this->adminActivityLogs(
            'Notification',
            'Delete',
            'Deleted Notification "' . $notification->title . '"'
        );

        $notification->delete();

        return redirect()->route('admin.notification-management.index')
            ->with('success');
    }

    /**
     * Get notification statistics for dashboard.
     */
    public function statistics(): Response
    {
        $stats = [
            'total_notifications' => Notification::count(),
            'read_notifications' => Notification::where('is_read', true)->count(),
            'unread_notifications' => Notification::where('is_read', false)->count(),
            'notifications_by_type' => Notification::selectRaw('notification_type, COUNT(*) as count')
                ->groupBy('notification_type')
                ->orderBy('count', 'desc')
                ->get(),
            'notifications_by_priority' => Notification::selectRaw('priority, COUNT(*) as count')
                ->groupBy('priority')
                ->orderBy('count', 'desc')
                ->get(),
            'recent_notifications' => Notification::with(['recipient', 'sender'])
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get(),
        ];

        $this->adminActivityLogs(
            'Notification',
            'View Statistics',
            'Viewed Notification Statistics Dashboard'
        );

        return Inertia::render('Admin/NotificationManagement/statistics', [
            'statistics' => $stats,
        ]);
    }

    /**
     * Send bulk notifications.
     */
    public function sendBulk(Request $request)
    {
        $validated = $request->validate([
            'recipient_type' => 'required|in:all_residents,all_collectors',
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'notification_type' => 'required|in:schedule,alert,announcement,request_update,route_assignment',
            'priority' => 'required|in:low,medium,high,urgent',
            'action_url' => 'nullable|string|max:255',
        ]);

        // Get all users based on recipient type
        $role = $validated['recipient_type'] === 'all_residents' ? 'resident' : 'collector';
        $users = User::where('role', $role)->get();

        $createdCount = 0;
        foreach ($users as $user) {
            Notification::create([
                'recipient_type' => 'specific',
                'recipient_id' => $user->id,
                'sender_id' => Auth::id(),
                'title' => $validated['title'],
                'message' => $validated['message'],
                'notification_type' => $validated['notification_type'],
                'priority' => $validated['priority'],
                'action_url' => $validated['action_url'] ?? null,
                'is_read' => false,
            ]);
            $createdCount++;
        }

        $this->adminActivityLogs(
            'Notification',
            'Bulk Send',
            'Sent ' . $createdCount . ' notifications to ' . $validated['recipient_type']
        );

        return redirect()->route('admin.notification-management.index')
            ->with('success', "Successfully sent {$createdCount} notifications");
    }
}