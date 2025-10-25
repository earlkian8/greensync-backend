<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Residents\ResidentsController;
use App\Http\Controllers\Api\Residents\BinsController;
use App\Http\Controllers\Api\Residents\CollectionRequestController;

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
        });
    });

    // Collectors
    Route::prefix('collector')->group(function () {
        // im gay im gay im gay im gay im gay im gay im gay 
    });

});