<?php

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
        // im gay im gay im gay im gay im gay im gay im gay 
    });

});