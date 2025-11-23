<?php

namespace App\Http\Controllers\v1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MarkModuleNotificationsReadController extends Controller
{
    /**
     * Mark all notifications for a specific module as read
     */
    public function markAsRead(Request $request, string $module)
    {
        $userId = Auth::id();
        
        Notification::where('recipient_id', $userId)
            ->where('module', $module)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json(['success' => true]);
    }
}

