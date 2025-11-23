<?php

use App\Http\Controllers\Api\Collectors\CollectorPerformanceController;
use App\Http\Controllers\Api\Collectors\CollectorDashboardController;
use App\Http\Controllers\Api\Collectors\CollectorRouteController;
use App\Http\Controllers\Api\Collectors\CollectorsController;
use App\Http\Controllers\Api\Collectors\QRCollectionController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Residents\ResidentsController;
use App\Http\Controllers\Api\Residents\BinsController;
use App\Http\Controllers\Api\Residents\CollectionRequestController;
use App\Http\Controllers\Api\Residents\NotificationController;
use App\Http\Controllers\Api\Residents\PhilippineAddressController;

Route::prefix('v1')->group(function () {

    // ============================================
    // PHILIPPINE ADDRESSES MODULE (Public)
    // ============================================
    Route::prefix('addresses')->group(function () {
        // Regions
        Route::get('/regions', [PhilippineAddressController::class, 'getRegions']);
        Route::get('/regions/{id}', [PhilippineAddressController::class, 'getRegion']);
        
        // Provinces - specific routes first to avoid conflicts
        Route::get('/provinces/region/{regionId}', [PhilippineAddressController::class, 'getProvincesByRegion']);
        Route::get('/provinces', [PhilippineAddressController::class, 'getProvincesByRegion']);
        Route::get('/provinces/{id}', [PhilippineAddressController::class, 'getProvince']);
        
        // Cities - specific routes first to avoid conflicts
        Route::get('/cities/province/{provinceId}', [PhilippineAddressController::class, 'getCitiesByProvince']);
        Route::get('/cities', [PhilippineAddressController::class, 'getCitiesByProvince']);
        Route::get('/cities/{id}', [PhilippineAddressController::class, 'getCity']);
        
        // Barangays - specific routes first to avoid conflicts
        Route::get('/barangays/city/{cityId}', [PhilippineAddressController::class, 'getBarangaysByCity']);
        Route::get('/barangays/{id}', [PhilippineAddressController::class, 'getBarangay']);
    });

    // ============================================
    // RESIDENTS MODULE
    // ============================================
    Route::prefix('resident')->group(function () {

        Route::post('/register', [ResidentsController::class, 'store']);
        Route::post('/login', [ResidentsController::class, 'login']);
        Route::post('/verify-email', [ResidentsController::class, 'verifyEmail']);
        Route::post('/reset-password', [ResidentsController::class, 'resetPassword']);
        Route::get('/profile-image/{resident}', [ResidentsController::class, 'profileImage'])
            ->name('resident.profile-image');

        Route::middleware('auth:sanctum')->group(function () {
            
            // === Dashboard ===
            Route::get('/home/{resident_id}', [ResidentsController::class, 'dashboard']);
            
            // === Profile Management ===
            Route::get('/profile', [ResidentsController::class, 'profile']);
            Route::put('/profile', [ResidentsController::class, 'update']);
            Route::post('/logout', [ResidentsController::class, 'logout']);
            Route::delete('/delete', [ResidentsController::class, 'destroy']);

            // === Bins Management ===
            Route::prefix('bins')->group(function () {
                Route::get('/', [BinsController::class, 'index']);
                Route::post('/', [BinsController::class, 'store']);
                Route::get('/qr', [BinsController::class, 'getByQrCode']);
                Route::get('/{id}', [BinsController::class, 'show']);
                Route::put('/{id}', [BinsController::class, 'update']);
                Route::delete('/{id}', [BinsController::class, 'destroy']);
                Route::post('/{id}/mark-collected', [BinsController::class, 'markCollected']);
            });

            // === Collection Requests ===
            Route::prefix('collection-requests')->group(function () {
                Route::post('/', [CollectionRequestController::class, 'store']);
                Route::get('/', [CollectionRequestController::class, 'index']);
                Route::get('/{id}', [CollectionRequestController::class, 'show']);
                Route::delete('/{id}', [CollectionRequestController::class, 'destroy']);
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
            // Logout collector
            Route::post('/logout', [CollectorsController::class, 'logout']);
            // Update profile
            Route::put('/profile', [CollectorsController::class, 'update']);
            // Serve images from private storage
            Route::get('/images/{path}', [CollectorsController::class, 'getImage'])->where('path', '.+');

            // === Dashboard ===
            Route::get('/dashboard', [CollectorDashboardController::class, 'getDashboardData']);

            // === Route Assignment & Schedule ===
            Route::prefix('routes')->group(function () {
                // Get today's assigned routes
                Route::get('/today', [CollectorRouteController::class, 'getTodayAssignments']);
                
                // Get all assignments with filters (past/future)
                Route::get('/all', [CollectorRouteController::class, 'getAllAssignments']);
                
                // Get detailed route assignment information with stops
                Route::get('/assignments/{assignmentId}', [CollectorRouteController::class, 'getRouteDetails']);
            });

            // === QR Collection Module ===
            Route::prefix('collections')->group(function () {
                // Scan and validate QR code before collection
                Route::post('/scan', [QRCollectionController::class, 'scanQRCode']);
                
                // Record waste collection data
                Route::post('/record', [QRCollectionController::class, 'recordCollection']);
                
                // Manual collection fallback
                Route::post('/manual', [QRCollectionController::class, 'manualCollectStop']);
            });

            // === Performance & History Module ===
            Route::prefix('performance')->group(function () {
                // Get overall performance summary
                Route::get('/summary', [CollectorPerformanceController::class, 'getPerformanceSummary']);
                
                // Get collection history with filters
                Route::get('/collections', [CollectorPerformanceController::class, 'getCollectionHistory']);
            });

            // === Google Maps Integration ===
            Route::prefix('maps')->group(function () {
                // Get directions route that follows roads
                Route::post('/directions', [\App\Http\Controllers\Api\Collectors\GoogleMapsController::class, 'getDirections']);
            });
        });
    });

});