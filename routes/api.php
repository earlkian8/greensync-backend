<?php

use App\Http\Controllers\Api\Collectors\CollectorNotificationController;
use App\Http\Controllers\Api\Collectors\CollectorRequestController;
use App\Http\Controllers\Api\Collectors\CollectorRouteController;
use App\Http\Controllers\Api\Collectors\CollectorsController;
use App\Http\Controllers\Api\Collectors\QRCollectionController;
use App\Http\Controllers\Api\Collectors\RouteProgressController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Residents\ResidentsController;
use App\Http\Controllers\Api\Residents\BinsController;
use App\Http\Controllers\Api\Residents\CollectionRequestController;
use App\Http\Controllers\Api\Residents\NotificationController;

Route::prefix('v1')->group(function () {

    // ============================================
    // RESIDENTS MODULE
    // ============================================
    Route::prefix('resident')->group(function () {
        
        // -------------------- Public Routes --------------------
        // Register new resident account
        Route::post('/register', [ResidentsController::class, 'store']);
        
        // Login resident user
        Route::post('/login', [ResidentsController::class, 'login']);

        // -------------------- Protected Routes (Requires Authentication) --------------------
        Route::middleware('auth:sanctum')->group(function () {
            
            // === Profile Management ===
            // Get logged-in resident profile information
            Route::get('/profile', [ResidentsController::class, 'profile']);
            
            // Update resident profile details
            Route::put('/profile', [ResidentsController::class, 'update']);
            
            // Logout resident user
            Route::post('/logout', [ResidentsController::class, 'logout']);
            
            // Delete resident account
            Route::delete('/delete', [ResidentsController::class, 'destroy']);

            // === Bins Management ===
            Route::prefix('bins')->group(function () {
                // Get all bins owned by resident
                Route::get('/', [BinsController::class, 'index']);
                
                // Register new waste bin
                Route::post('/', [BinsController::class, 'store']);
                
                // Get bin details by QR code
                Route::get('/qr', [BinsController::class, 'getByQrCode']);
                
                // Get specific bin details by ID
                Route::get('/{id}', [BinsController::class, 'show']);
                
                // Update bin information
                Route::put('/{id}', [BinsController::class, 'update']);
                
                // Delete/unregister a bin
                Route::delete('/{id}', [BinsController::class, 'destroy']);
                
                // Mark bin as collected (for resident tracking)
                Route::post('/{id}/mark-collected', [BinsController::class, 'markCollected']);
            });

            // === Collection Requests ===
            Route::prefix('collection-requests')->group(function () {
                // Create special pickup request
                Route::post('/', [CollectionRequestController::class, 'store']);
            });

            // === Notifications ===
            Route::prefix('notifications')->group(function () {
                // Get all notifications
                Route::get('/', [NotificationController::class, 'index']);
                
                // Get only unread notifications
                Route::get('/unread', [NotificationController::class, 'unread']);
                
                // Get unread notification count
                Route::get('/count', [NotificationController::class, 'count']);
                
                // Get specific notification details
                Route::get('/{id}', [NotificationController::class, 'show']);
                
                // Mark single notification as read
                Route::put('/{id}/read', [NotificationController::class, 'markAsRead']);
                
                // Mark all notifications as read
                Route::put('/read-all', [NotificationController::class, 'markAllAsRead']);
                
                // Delete single notification
                Route::delete('/{id}', [NotificationController::class, 'destroy']);
                
                // Clear all notifications
                Route::delete('/', [NotificationController::class, 'clearAll']);
            });
        });
    });

    // ============================================
    // COLLECTORS MODULE
    // ============================================
    Route::prefix('collector')->group(function () {
        
        // -------------------- Public Routes --------------------
        // Register new collector account
        Route::post('/register', [CollectorsController::class, 'store']);
        
        // Login collector user
        Route::post('/login', [CollectorsController::class, 'login']);

        // -------------------- Protected Routes (Requires Authentication) --------------------
        Route::middleware('auth:sanctum')->group(function () {
            
            // === Profile Management ===
            // Get logged-in collector profile
            Route::get('/profile', [CollectorsController::class, 'profile']);
            
            // Update collector profile
            Route::put('/profile', [CollectorsController::class, 'update']);
            
            // Logout collector
            Route::post('/logout', [CollectorsController::class, 'logout']);
            
            // Delete collector account
            Route::delete('/delete', [CollectorsController::class, 'destroy']);
            
            // Change collector password
            Route::post('/change-password', [CollectorsController::class, 'changePassword']);

            // === Route Assignment & Schedule ===
            Route::prefix('routes')->group(function () {
                // Get today's assigned routes
                Route::get('/today', [CollectorRouteController::class, 'getTodayAssignments']);
                
                // Get all assignments with filters (past/future)
                Route::get('/all', [CollectorRouteController::class, 'getAllAssignments']);
                
                // Get assignment summary statistics (dashboard data)
                Route::get('/summary', [CollectorRouteController::class, 'getAssignmentSummary']);
                
                // Get upcoming assignments (next 7 days)
                Route::get('/upcoming', [CollectorRouteController::class, 'getUpcomingAssignments']);
                
                // Get detailed route assignment information with stops
                Route::get('/assignments/{assignmentId}', [CollectorRouteController::class, 'getRouteDetails']);
                
                // Get all stops for a specific route
                Route::get('/{routeId}/stops', [CollectorRouteController::class, 'getRouteStops']);
                
                // Get navigation details for route (GPS directions)
                Route::get('/assignments/{assignmentId}/navigation', [CollectorRouteController::class, 'getRouteNavigation']);
                
                // Start route collection (mark as in-progress)
                Route::post('/assignments/{assignmentId}/start', [CollectorRouteController::class, 'startRoute']);
                
                // Pause route (for breaks)
                Route::post('/assignments/{assignmentId}/pause', [CollectorRouteController::class, 'pauseRoute']);
                
                // Resume paused route
                Route::post('/assignments/{assignmentId}/resume', [CollectorRouteController::class, 'resumeRoute']);
                
                // Complete route collection
                Route::post('/assignments/{assignmentId}/complete', [CollectorRouteController::class, 'completeRoute']);
                
                // Report issue during route (vehicle breakdown, road closure, etc.)
                Route::post('/assignments/{assignmentId}/report-issue', [CollectorRouteController::class, 'reportIssue']);
            });

            // === QR Collection Module ===
            Route::prefix('collections')->group(function () {
                // Scan and validate QR code before collection
                Route::post('/scan', [QRCollectionController::class, 'scanQRCode']);
                
                // Record waste collection data
                Route::post('/record', [QRCollectionController::class, 'recordCollection']);
                
                // Upload collection photo evidence
                Route::post('/upload-photo', [QRCollectionController::class, 'uploadPhoto']);
                
                // Skip collection with reason
                Route::post('/skip', [QRCollectionController::class, 'skipCollection']);
                
                // Get all collections for a specific assignment
                Route::get('/assignments/{assignmentId}', [QRCollectionController::class, 'getAssignmentCollections']);
                
                // Get specific collection details
                Route::get('/{collectionId}', [QRCollectionController::class, 'getCollectionDetails']);
                
                // Update collection details (weight, type, notes)
                Route::put('/{collectionId}', [QRCollectionController::class, 'updateCollection']);
                
                // Delete collection (within 15-minute time limit)
                Route::delete('/{collectionId}', [QRCollectionController::class, 'deleteCollection']);
            });

            // === Route Progress Tracking ===
            Route::prefix('progress')->group(function () {
                // Get overall route progress (completed vs pending stops)
                Route::get('/assignments/{assignmentId}', [RouteProgressController::class, 'getRouteProgress']);
                
                // Update route assignment status (pending, in-progress, completed, etc.)
                Route::put('/status', [RouteProgressController::class, 'updateRouteStatus']);
                
                // Get list of completed stops/collections
                Route::get('/assignments/{assignmentId}/completed', [RouteProgressController::class, 'getCompletedStops']);
                
                // Get list of pending/remaining stops
                Route::get('/assignments/{assignmentId}/pending', [RouteProgressController::class, 'getPendingStops']);
                
                // Get list of skipped stops with reasons
                Route::get('/assignments/{assignmentId}/skipped', [RouteProgressController::class, 'getSkippedStops']);
                
                // Get real-time progress updates (for live tracking/maps)
                Route::get('/assignments/{assignmentId}/live', [RouteProgressController::class, 'getLiveProgress']);
                
                // Get detailed progress report with statistics
                Route::get('/assignments/{assignmentId}/report', [RouteProgressController::class, 'getProgressReport']);
            });

            // === Request Handling Module ===
            Route::prefix('requests')->group(function () {
                // Get all special requests assigned to collector
                Route::get('/', [CollectorRequestController::class, 'getAssignedRequests']);
                
                // Get request statistics/summary
                Route::get('/summary', [CollectorRequestController::class, 'getRequestSummary']);
                
                // Get completed requests history
                Route::get('/completed', [CollectorRequestController::class, 'getCompletedRequests']);
                
                // Get specific request details
                Route::get('/{requestId}', [CollectorRequestController::class, 'getRequestDetails']);
                
                // Accept or reject a request
                Route::post('/{requestId}/respond', [CollectorRequestController::class, 'respondToRequest']);
                
                // Update request status (in-progress, completed, etc.)
                Route::put('/status', [CollectorRequestController::class, 'updateRequestStatus']);
                
                // Complete request with resolution notes
                Route::post('/complete', [CollectorRequestController::class, 'completeRequest']);
                
                // Upload photo evidence for request
                Route::post('/upload-photo', [CollectorRequestController::class, 'uploadRequestPhoto']);
            });

            // === Notification Module ===
            Route::prefix('notifications')->group(function () {
                // Get all notifications with filters
                Route::get('/', [CollectorNotificationController::class, 'getNotifications']);
                
                // Get unread notifications only
                Route::get('/unread', [CollectorNotificationController::class, 'getUnreadNotifications']);
                
                // Get unread notification count
                Route::get('/count', [CollectorNotificationController::class, 'getUnreadCount']);
                
                // Get notification statistics
                Route::get('/stats', [CollectorNotificationController::class, 'getNotificationStats']);
                
                // Get specific notification details (auto-marks as read)
                Route::get('/{notificationId}', [CollectorNotificationController::class, 'getNotificationDetails']);
                
                // Mark single notification as read
                Route::put('/{notificationId}/read', [CollectorNotificationController::class, 'markAsRead']);
                
                // Mark all notifications as read
                Route::put('/read-all', [CollectorNotificationController::class, 'markAllAsRead']);
                
                // Mark multiple notifications as read
                Route::put('/read-multiple', [CollectorNotificationController::class, 'markMultipleAsRead']);
                
                // Delete single notification
                Route::delete('/{notificationId}', [CollectorNotificationController::class, 'deleteNotification']);
                
                // Delete multiple notifications
                Route::delete('/delete-multiple', [CollectorNotificationController::class, 'deleteMultipleNotifications']);
                
                // Clear all read notifications
                Route::delete('/clear-read', [CollectorNotificationController::class, 'clearReadNotifications']);
                
                // Clear all notifications
                Route::delete('/clear-all', [CollectorNotificationController::class, 'clearAllNotifications']);
            });
        });
    });

});