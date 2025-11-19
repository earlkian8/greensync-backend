<?php

namespace App\Http\Controllers\Api\Collectors;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class CollectorNotificationController extends Controller
{
    /**
     * Get all notifications for the collector
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getNotifications(Request $request)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $query = Notification::where('recipient_type', 'collector')
                ->where('recipient_id', $collectorId);

            // Filter by read status
            if ($request->has('is_read')) {
                $query->where('is_read', $request->boolean('is_read'));
            }

            // Filter by notification type
            if ($request->has('notification_type')) {
                $query->where('notification_type', $request->notification_type);
            }

            // Filter by priority
            if ($request->has('priority')) {
                $query->where('priority', $request->priority);
            }

            // Filter by date range
            if ($request->has('start_date')) {
                $query->whereDate('created_at', '>=', $request->start_date);
            }
            if ($request->has('end_date')) {
                $query->whereDate('created_at', '<=', $request->end_date);
            }

            $notifications = $query->orderBy('priority', 'desc')
                ->orderBy('created_at', 'desc')
                ->paginate($request->input('per_page', 20));

            $notifications->getCollection()->transform(function ($notification) {
                return [
                    'id' => $notification->id,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'notification_type' => $notification->notification_type,
                    'priority' => $notification->priority,
                    'is_read' => $notification->is_read,
                    'read_at' => $notification->read_at?->format('Y-m-d H:i:s'),
                    'action_url' => $notification->action_url,
                    'created_at' => $notification->created_at->format('Y-m-d H:i:s'),
                    'time_ago' => $notification->created_at->diffForHumans(),
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Notifications retrieved successfully',
                'data' => $notifications
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get only unread notifications
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUnreadNotifications()
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $notifications = Notification::where('recipient_type', 'collector')
                ->where('recipient_id', $collectorId)
                ->where('is_read', false)
                ->orderBy('priority', 'desc')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($notification) {
                    return [
                        'id' => $notification->id,
                        'title' => $notification->title,
                        'message' => $notification->message,
                        'notification_type' => $notification->notification_type,
                        'priority' => $notification->priority,
                        'action_url' => $notification->action_url,
                        'created_at' => $notification->created_at->format('Y-m-d H:i:s'),
                        'time_ago' => $notification->created_at->diffForHumans(),
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Unread notifications retrieved successfully',
                'data' => [
                    'notifications' => $notifications,
                    'unread_count' => $notifications->count(),
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve unread notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get unread notification count
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUnreadCount()
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $count = Notification::where('recipient_type', 'collector')
                ->where('recipient_id', $collectorId)
                ->where('is_read', false)
                ->count();

            // Get count by priority
            $byPriority = Notification::where('recipient_type', 'collector')
                ->where('recipient_id', $collectorId)
                ->where('is_read', false)
                ->selectRaw('priority, COUNT(*) as count')
                ->groupBy('priority')
                ->pluck('count', 'priority');

            // Get count by type
            $byType = Notification::where('recipient_type', 'collector')
                ->where('recipient_id', $collectorId)
                ->where('is_read', false)
                ->selectRaw('notification_type, COUNT(*) as count')
                ->groupBy('notification_type')
                ->pluck('count', 'notification_type');

            return response()->json([
                'success' => true,
                'message' => 'Unread count retrieved successfully',
                'data' => [
                    'total_unread' => $count,
                    'by_priority' => $byPriority,
                    'by_type' => $byType,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve unread count',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get specific notification details
     * 
     * @param int $notificationId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getNotificationDetails($notificationId)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $notification = Notification::where('recipient_type', 'collector')
                ->where('recipient_id', $collectorId)
                ->where('id', $notificationId)
                ->first();

            if (!$notification) {
                return response()->json([
                    'success' => false,
                    'message' => 'Notification not found'
                ], 404);
            }

            // Auto-mark as read when viewing details
            if (!$notification->is_read) {
                $notification->update([
                    'is_read' => true,
                    'read_at' => Carbon::now(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Notification details retrieved successfully',
                'data' => [
                    'id' => $notification->id,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'notification_type' => $notification->notification_type,
                    'priority' => $notification->priority,
                    'is_read' => $notification->is_read,
                    'read_at' => $notification->read_at?->format('Y-m-d H:i:s'),
                    'action_url' => $notification->action_url,
                    'created_at' => $notification->created_at->format('Y-m-d H:i:s'),
                    'time_ago' => $notification->created_at->diffForHumans(),
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve notification details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark single notification as read
     * 
     * @param int $notificationId
     * @return \Illuminate\Http\JsonResponse
     */
    public function markAsRead($notificationId)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $notification = Notification::where('recipient_type', 'collector')
                ->where('recipient_id', $collectorId)
                ->where('id', $notificationId)
                ->first();

            if (!$notification) {
                return response()->json([
                    'success' => false,
                    'message' => 'Notification not found'
                ], 404);
            }

            if ($notification->is_read) {
                return response()->json([
                    'success' => true,
                    'message' => 'Notification already marked as read',
                    'data' => [
                        'id' => $notification->id,
                        'is_read' => true,
                    ]
                ], 200);
            }

            $notification->update([
                'is_read' => true,
                'read_at' => Carbon::now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Notification marked as read',
                'data' => [
                    'id' => $notification->id,
                    'is_read' => true,
                    'read_at' => $notification->read_at->format('Y-m-d H:i:s'),
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark notification as read',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark all notifications as read
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function markAllAsRead()
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $updated = Notification::where('recipient_type', 'collector')
                ->where('recipient_id', $collectorId)
                ->where('is_read', false)
                ->update([
                    'is_read' => true,
                    'read_at' => Carbon::now(),
                ]);

            return response()->json([
                'success' => true,
                'message' => 'All notifications marked as read',
                'data' => [
                    'updated_count' => $updated,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark all notifications as read',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete single notification
     * 
     * @param int $notificationId
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteNotification($notificationId)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $notification = Notification::where('recipient_type', 'collector')
                ->where('recipient_id', $collectorId)
                ->where('id', $notificationId)
                ->first();

            if (!$notification) {
                return response()->json([
                    'success' => false,
                    'message' => 'Notification not found'
                ], 404);
            }

            $notification->delete();

            return response()->json([
                'success' => true,
                'message' => 'Notification deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete notification',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clear all read notifications
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function clearReadNotifications()
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $deleted = Notification::where('recipient_type', 'collector')
                ->where('recipient_id', $collectorId)
                ->where('is_read', true)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Read notifications cleared successfully',
                'data' => [
                    'deleted_count' => $deleted,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clear all notifications
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function clearAllNotifications()
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $deleted = Notification::where('recipient_type', 'collector')
                ->where('recipient_id', $collectorId)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'All notifications cleared successfully',
                'data' => [
                    'deleted_count' => $deleted,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear all notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get notification statistics
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getNotificationStats()
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $stats = [
                'total' => Notification::where('recipient_type', 'collector')
                    ->where('recipient_id', $collectorId)
                    ->count(),
                'unread' => Notification::where('recipient_type', 'collector')
                    ->where('recipient_id', $collectorId)
                    ->where('is_read', false)
                    ->count(),
                'read' => Notification::where('recipient_type', 'collector')
                    ->where('recipient_id', $collectorId)
                    ->where('is_read', true)
                    ->count(),
                'today' => Notification::where('recipient_type', 'collector')
                    ->where('recipient_id', $collectorId)
                    ->whereDate('created_at', Carbon::today())
                    ->count(),
                'this_week' => Notification::where('recipient_type', 'collector')
                    ->where('recipient_id', $collectorId)
                    ->whereBetween('created_at', [
                        Carbon::now()->startOfWeek(),
                        Carbon::now()->endOfWeek()
                    ])
                    ->count(),
                'by_priority' => Notification::where('recipient_type', 'collector')
                    ->where('recipient_id', $collectorId)
                    ->where('is_read', false)
                    ->selectRaw('priority, COUNT(*) as count')
                    ->groupBy('priority')
                    ->pluck('count', 'priority'),
                'by_type' => Notification::where('recipient_type', 'collector')
                    ->where('recipient_id', $collectorId)
                    ->selectRaw('notification_type, COUNT(*) as count')
                    ->groupBy('notification_type')
                    ->pluck('count', 'notification_type'),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Notification statistics retrieved successfully',
                'data' => $stats
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve notification statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark multiple notifications as read
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function markMultipleAsRead(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'notification_ids' => 'required|array',
                'notification_ids.*' => 'required|integer|exists:notifications,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $collectorId = Auth::guard('collector')->id();

            $updated = Notification::where('recipient_type', 'collector')
                ->where('recipient_id', $collectorId)
                ->whereIn('id', $request->notification_ids)
                ->where('is_read', false)
                ->update([
                    'is_read' => true,
                    'read_at' => Carbon::now(),
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Notifications marked as read',
                'data' => [
                    'updated_count' => $updated,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark notifications as read',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete multiple notifications
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteMultipleNotifications(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'notification_ids' => 'required|array',
                'notification_ids.*' => 'required|integer|exists:notifications,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $collectorId = Auth::guard('collector')->id();

            $deleted = Notification::where('recipient_type', 'collector')
                ->where('recipient_id', $collectorId)
                ->whereIn('id', $request->notification_ids)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Notifications deleted successfully',
                'data' => [
                    'deleted_count' => $deleted,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}