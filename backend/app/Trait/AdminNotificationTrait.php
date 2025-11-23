<?php

namespace App\Trait;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

trait AdminNotificationTrait
{
    /**
     * Create notifications for all admin users when an action occurs
     * 
     * @param string $module - The module name (e.g., 'collector_management', 'resident_management')
     * @param string $title - Notification title
     * @param string $message - Notification message
     * @param string|null $actionUrl - Optional URL to redirect to
     * @param string $priority - Priority level (low, medium, high, urgent)
     * @param string $notificationType - Type of notification (alert, announcement, etc.)
     */
    protected function notifyAllAdmins(
        string $module,
        string $title,
        string $message,
        ?string $actionUrl = null,
        string $priority = 'medium',
        string $notificationType = 'alert'
    ) {
        // Get all admin users except the current user (who performed the action)
        $adminUsers = User::where('id', '!=', Auth::id())->get();

        $notifications = [];
        foreach ($adminUsers as $admin) {
            $notifications[] = [
                'recipient_type' => 'specific',
                'recipient_id' => $admin->id,
                'sender_id' => Auth::id(),
                'title' => $title,
                'message' => $message,
                'notification_type' => $notificationType,
                'module' => $module,
                'priority' => $priority,
                'is_read' => false,
                'action_url' => $actionUrl,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!empty($notifications)) {
            Notification::insert($notifications);
        }
    }
}

