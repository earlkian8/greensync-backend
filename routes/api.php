<?php

use App\Http\Controllers\Api\Residents\BinsController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Residents\ResidentsController;

Route::prefix('v1')->group(function () {

    Route::prefix('residents')->group(function () {

        // Public routes
        Route::post('/register', [ResidentsController::class, 'store']);
        Route::post('/login', [ResidentsController::class, 'login']);

        // Protected
        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/profile', [ResidentsController::class, 'profile']);
            Route::put('/profile', [ResidentsController::class, 'update']);
            Route::post('/logout', [ResidentsController::class, 'logout']);
            Route::delete('/delete', [ResidentsController::class, 'destroy']);

            Route::prefix('bins')->group(function () {
                Route::get('/', [BinsController::class, 'index']);
                Route::post('/', [BinsController::class, 'store']);
                Route::get('/qr', [BinsController::class, 'getByQrCode']);
                Route::get('/{id}', [BinsController::class, 'show']);
                Route::delete('/{id}', [BinsController::class, 'destroy']);
            });
        });

    });

});
