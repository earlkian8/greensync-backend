<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Residents\ResidentsController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| Base API versioning for scalability
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Resident Authentication Routes
    |--------------------------------------------------------------------------
    */
    Route::prefix('residents')->group(function () {

        // Public routes
        Route::post('/register', [ResidentsController::class, 'store']);
        Route::post('/login', [ResidentsController::class, 'login']);

        // Protected (Sanctum)
        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/profile', [ResidentsController::class, 'profile']);
            Route::put('/profile', [ResidentsController::class, 'update']);
            Route::post('/logout', [ResidentsController::class, 'logout']);
            Route::delete('/delete', [ResidentsController::class, 'destroy']);
        });

    });

});
