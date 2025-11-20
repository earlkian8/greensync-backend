<?php

namespace App\Http\Controllers\Api\Residents;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    /** Get all notifications for the authenticated resident */
    public function index(Request $request)
    {
        $resident = $request->user();

        $notifications = Notification::where(function ($query) use ($resident) {
                $query->where('recipient_type', 'resident')
                    ->where('recipient_id', $resident->id);
            })
            ->orWhere('recipient_type', 'all_residents')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'message' => 'Notifications fetched successfully.',
            'notifications' => $notifications,
            'unread_count' => $this->getUnreadCount($resident->id)
        ]);
    }

    /** Get unread notifications */
    public function unread(Request $request)
    {
        $resident = $request->user();

        $notifications = Notification::where(function ($query) use ($resident) {
                $query->where('recipient_type', 'resident')
                    ->where('recipient_id', $resident->id);
            })
            ->orWhere('recipient_type', 'all_residents')
            ->where('is_read', false)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'message' => 'Unread notifications fetched successfully.',
            'notifications' => $notifications,
            'unread_count' => $notifications->count()
        ]);
    }

    /** Mark notification as read */
    public function markAsRead(Request $request, $id)
    {
        $resident = $request->user();

        $notification = Notification::where(function ($query) use ($resident) {
                $query->where('recipient_type', 'resident')
                    ->where('recipient_id', $resident->id);
            })
            ->orWhere('recipient_type', 'all_residents')
            ->where('id', $id)
            ->firstOrFail();

        $notification->update([
            'is_read' => true,
            'read_at' => now()
        ]);

        return response()->json([
            'message' => 'Notification marked as read.',
            'notification' => $notification
        ]);
    }

    /** Mark all notifications as read */
    public function markAllAsRead(Request $request)
    {
        $resident = $request->user();

        Notification::where(function ($query) use ($resident) {
                $query->where('recipient_type', 'resident')
                    ->where('recipient_id', $resident->id);
            })
            ->orWhere('recipient_type', 'all_residents')
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now()
            ]);

        return response()->json([
            'message' => 'All notifications marked as read.',
            'unread_count' => 0
        ]);
    }

    /** Get notification count */
    public function count(Request $request)
    {
        $resident = $request->user();

        $unreadCount = $this->getUnreadCount($resident->id);
        $totalCount = Notification::where(function ($query) use ($resident) {
                $query->where('recipient_type', 'resident')
                    ->where('recipient_id', $resident->id);
            })
            ->orWhere('recipient_type', 'all_residents')
            ->count();

        return response()->json([
            'message' => 'Notification counts fetched successfully.',
            'total_count' => $totalCount,
            'unread_count' => $unreadCount
        ]);
    }

    /** Delete notification */
    public function destroy(Request $request, $id)
    {
        $resident = $request->user();

        $notification = Notification::where(function ($query) use ($resident) {
                $query->where('recipient_type', 'resident')
                    ->where('recipient_id', $resident->id);
            })
            ->orWhere('recipient_type', 'all_residents')
            ->where('id', $id)
            ->firstOrFail();

        $notification->delete();

        return response()->json([
            'message' => 'Notification deleted successfully.'
        ]);
    }

    /** Clear all notifications */
    public function clearAll(Request $request)
    {
        $resident = $request->user();

        Notification::where(function ($query) use ($resident) {
                $query->where('recipient_type', 'resident')
                    ->where('recipient_id', $resident->id);
            })
            ->orWhere('recipient_type', 'all_residents')
            ->delete();

        return response()->json([
            'message' => 'All notifications cleared successfully.'
        ]);
    }

    /** Get specific notification */
    public function show(Request $request, $id)
    {
        $resident = $request->user();

        $notification = Notification::where(function ($query) use ($resident) {
                $query->where('recipient_type', 'resident')
                    ->where('recipient_id', $resident->id);
            })
            ->orWhere('recipient_type', 'all_residents')
            ->where('id', $id)
            ->firstOrFail();

        // Mark as read when viewing
        if (!$notification->is_read) {
            $notification->update([
                'is_read' => true,
                'read_at' => now()
            ]);
        }

        return response()->json([
            'message' => 'Notification fetched successfully.',
            'notification' => $notification
        ]);
    }

    /** Helper function to get unread count */
    private function getUnreadCount($residentId)
    {
        return Notification::where(function ($query) use ($residentId) {
                $query->where('recipient_type', 'resident')
                    ->where('recipient_id', $residentId);
            })
            ->orWhere('recipient_type', 'all_residents')
            ->where('is_read', false)
            ->count();
    }
}