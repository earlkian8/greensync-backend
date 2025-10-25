<?php

use App\Http\Controllers\Api\Collectors\CollectorRouteController;
use App\Http\Controllers\Api\Collectors\CollectorsController;
use App\Http\Controllers\Api\Collectors\QRCollectionController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Residents\ResidentsController;
use App\Http\Controllers\Api\Residents\BinsController;
use App\Http\Controllers\Api\Residents\CollectionRequestController;
use App\Http\Controllers\Api\Residents\NotificationController;

Route::prefix('v1')->group(function () {

    // Residents
    Route::prefix('resident')->group(function () {
        
        // Public routes
        Route::post('/register', [ResidentsController::class, 'store']);
        Route::post('/login', [ResidentsController::class, 'login']);

        // Protected routes
        Route::middleware('auth:sanctum')->group(function () {
            
            // Profile management
            Route::get('/profile', [ResidentsController::class, 'profile']);
            Route::put('/profile', [ResidentsController::class, 'update']);
            Route::post('/logout', [ResidentsController::class, 'logout']);
            Route::delete('/delete', [ResidentsController::class, 'destroy']);

            // Bins management
            Route::prefix('bins')->group(function () {
                Route::get('/', [BinsController::class, 'index']);
                Route::post('/', [BinsController::class, 'store']);
                Route::get('/qr', [BinsController::class, 'getByQrCode']);
                Route::get('/{id}', [BinsController::class, 'show']);
                Route::put('/{id}', [BinsController::class, 'update']);
                Route::delete('/{id}', [BinsController::class, 'destroy']);
                Route::post('/{id}/mark-collected', [BinsController::class, 'markCollected']);
            });

            // Collection requests
            Route::prefix('collection-requests')->group(function () {
                Route::post('/', [CollectionRequestController::class, 'store']);
            });

            // Notifications
            Route::prefix('notifications')->group(function () {
                Route::get('/', [NotificationController::class, 'index']);
                Route::get('/unread', [NotificationController::class, 'unread']);
                Route::get('/count', [NotificationController::class, 'count']);
                Route::get('/{id}', [NotificationController::class, 'show']);
                Route::put('/{id}/read', [NotificationController::class, 'markAsRead']);
                Route::put('/read-all', [NotificationController::class, 'markAllAsRead']);
                Route::delete('/{id}', [NotificationController::class, 'destroy']);
                Route::delete('/', [NotificationController::class, 'clearAll']);
            });
        });
    });

    // Collectors
    Route::prefix('collector')->group(function () {
        
        // Public routes
        Route::post('/register', [CollectorsController::class, 'store']);
        Route::post('/login', [CollectorsController::class, 'login']);

        // Protected routes
        Route::middleware('auth:sanctum')->group(function () {
            
            // Profile management
            Route::get('/profile', [CollectorsController::class, 'profile']);
            Route::put('/profile', [CollectorsController::class, 'update']);
            Route::post('/logout', [CollectorsController::class, 'logout']);
            Route::delete('/delete', [CollectorsController::class, 'destroy']);
            Route::post('/change-password', [CollectorsController::class, 'changePassword']);

            // Route Assignment & Schedule
            Route::prefix('routes')->group(function () {
                Route::get('/today', [CollectorRouteController::class, 'getTodayAssignments']);
                Route::get('/assignments/{assignmentId}', [CollectorRouteController::class, 'getRouteDetails']);
                Route::get('/{routeId}/stops', [CollectorRouteController::class, 'getRouteStops']);
                Route::post('/assignments/{assignmentId}/start', [CollectorRouteController::class, 'startRoute']);
                Route::post('/assignments/{assignmentId}/complete', [CollectorRouteController::class, 'completeRoute']);
                Route::get('/all', [CollectorRouteController::class, 'getAllAssignments']);
                Route::get('/summary', [CollectorRouteController::class, 'getAssignmentSummary']);
                Route::get('/upcoming', [CollectorRouteController::class, 'getUpcomingAssignments']);
                Route::post('/assignments/{assignmentId}/pause', [CollectorRouteController::class, 'pauseRoute']);
                Route::post('/assignments/{assignmentId}/resume', [CollectorRouteController::class, 'resumeRoute']);
                Route::get('/assignments/{assignmentId}/navigation', [CollectorRouteController::class, 'getRouteNavigation']);
                Route::post('/assignments/{assignmentId}/report-issue', [CollectorRouteController::class, 'reportIssue']);
            });

            // QR Collection Module
            Route::prefix('collections')->group(function () {
                Route::post('/scan', [QRCollectionController::class, 'scanQRCode']);
                Route::post('/record', [QRCollectionController::class, 'recordCollection']);
                Route::post('/upload-photo', [QRCollectionController::class, 'uploadPhoto']);
                Route::post('/skip', [QRCollectionController::class, 'skipCollection']);
                Route::get('/assignments/{assignmentId}', [QRCollectionController::class, 'getAssignmentCollections']);
                Route::get('/{collectionId}', [QRCollectionController::class, 'getCollectionDetails']);
                Route::put('/{collectionId}', [QRCollectionController::class, 'updateCollection']);
                Route::delete('/{collectionId}', [QRCollectionController::class, 'deleteCollection']);
            });
        });
    });

});