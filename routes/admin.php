<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\v1\Admin\UserManagement\RolesController;
use App\Http\Controllers\v1\Admin\UserManagement\UserController;
use App\Http\Controllers\v1\Admin\ResidentController;
use App\Http\Controllers\v1\Admin\CollectorController;
use App\Http\Controllers\v1\Admin\WasteBinController;
use App\Http\Controllers\v1\Admin\CollectionScheduleController;
use App\Http\Controllers\v1\Admin\RouteController;
use App\Http\Controllers\v1\Admin\RouteAssignmentController;
use App\Http\Controllers\v1\Admin\CollectionRequestController;
use App\Http\Controllers\v1\Admin\NotificationController;
use App\Http\Controllers\v1\Admin\ReportingController;
use App\Http\Controllers\ActivityLogsController;

Route::middleware('auth')->group(function () {


    // Admin
    Route::prefix('admin')->name('admin.')->middleware(['auth', 'verified'])->group(function(){
    
        // Resident Management
        Route::prefix('resident-management')->name('resident-management.')->group(function(){
            Route::get('/', [ResidentController::class, 'index'])->name('index');
            Route::get('/create', [ResidentController::class, 'create'])->name('create');
            Route::post('/store', [ResidentController::class, 'store'])->name('store');
            Route::get('/statistics', [ResidentController::class, 'statistics'])->name('statistics');
            Route::get('/export', [ResidentController::class, 'export'])->name('export');
            Route::post('/bulk-delete', [ResidentController::class, 'bulkDelete'])->name('bulk-delete');
            Route::get('/{resident}', [ResidentController::class, 'show'])->name('show');
            Route::get('/{resident}/edit', [ResidentController::class, 'edit'])->name('edit');
            Route::put('/update/{resident}', [ResidentController::class, 'update'])->name('update');
            Route::delete('/delete/{resident}', [ResidentController::class, 'destroy'])->name('destroy');
        });

        // Collector Management
        Route::prefix('collector-management')->name('collector-management.')->group(function(){
            Route::get('/', [CollectorController::class, 'index'])->name('index');
            Route::get('/create', [CollectorController::class, 'create'])->name('create');
            Route::post('/store', [CollectorController::class, 'store'])->name('store');
            Route::get('/statistics', [CollectorController::class, 'statistics'])->name('statistics');
            Route::post('/verify/{collector}', [CollectorController::class, 'verify'])->name('verify');
            Route::post('/unverify/{collector}', [CollectorController::class, 'unverify'])->name('unverify');
            Route::post('/activate/{collector}', [CollectorController::class, 'activate'])->name('activate');
            Route::post('/deactivate/{collector}', [CollectorController::class, 'deactivate'])->name('deactivate');
            Route::get('/{collector}', [CollectorController::class, 'show'])->name('show');
            Route::get('/{collector}/edit', [CollectorController::class, 'edit'])->name('edit');
            Route::put('/update/{collector}', [CollectorController::class, 'update'])->name('update');
            Route::delete('/destroy/{collector}', [CollectorController::class, 'destroy'])->name('destroy');
        });

        // Waste Bin Management
        Route::prefix('waste-bin-management')->name('waste-bin-management.')->group(function(){
            Route::get('/', [WasteBinController::class, 'index'])->name('index');
            Route::get('/create', [WasteBinController::class, 'create'])->name('create');
            Route::post('/store', [WasteBinController::class, 'store'])->name('store');
            Route::get('/statistics', [WasteBinController::class, 'statistics'])->name('statistics');
            Route::post('/update-status/{wasteBin}', [WasteBinController::class, 'updateStatus'])->name('update-status');
            Route::post('/mark-collected/{wasteBin}', [WasteBinController::class, 'markCollected'])->name('mark-collected');
            Route::get('/generate-qr/{wasteBin}', [WasteBinController::class, 'generateQrCode'])->name('generate-qr');
            Route::get('/{wasteBin}', [WasteBinController::class, 'show'])->name('show');
            Route::get('/{wasteBin}/edit', [WasteBinController::class, 'edit'])->name('edit');
            Route::put('/update/{wasteBin}', [WasteBinController::class, 'update'])->name('update');
            Route::delete('/destroy/{wasteBin}', [WasteBinController::class, 'destroy'])->name('destroy');
        });

        // Collection Schedule Management
        Route::prefix('collection-schedule-management')->name('collection-schedule-management.')->group(function(){
            Route::get('/', [CollectionScheduleController::class, 'index'])->name('index');
            Route::get('/create', [CollectionScheduleController::class, 'create'])->name('create');
            Route::post('/store', [CollectionScheduleController::class, 'store'])->name('store');
            Route::get('/statistics', [CollectionScheduleController::class, 'statistics'])->name('statistics');
            Route::post('/activate/{collectionSchedule}', [CollectionScheduleController::class, 'activate'])->name('activate');
            Route::post('/deactivate/{collectionSchedule}', [CollectionScheduleController::class, 'deactivate'])->name('deactivate');
            Route::get('/{collectionSchedule}', [CollectionScheduleController::class, 'show'])->name('show');
            Route::get('/{collectionSchedule}/edit', [CollectionScheduleController::class, 'edit'])->name('edit');
            Route::put('/update/{collectionSchedule}', [CollectionScheduleController::class, 'update'])->name('update');
            Route::delete('/destroy/{collectionSchedule}', [CollectionScheduleController::class, 'destroy'])->name('destroy');
        });

        // Route Management
        Route::prefix('route-management')->name('route-management.')->group(function(){
            Route::get('/', [RouteController::class, 'index'])->name('index');
            Route::get('/create', [RouteController::class, 'create'])->name('create');
            Route::post('/store', [RouteController::class, 'store'])->name('store');
            Route::get('/statistics', [RouteController::class, 'statistics'])->name('statistics');
            Route::post('/activate/{route}', [RouteController::class, 'activate'])->name('activate');
            Route::post('/deactivate/{route}', [RouteController::class, 'deactivate'])->name('deactivate');
            Route::get('/{route}', [RouteController::class, 'show'])->name('show');
            Route::get('/{route}/edit', [RouteController::class, 'edit'])->name('edit');
            Route::put('/update/{route}', [RouteController::class, 'update'])->name('update');
            Route::delete('/destroy/{route}', [RouteController::class, 'destroy'])->name('destroy');
        });

        // Route Assignment Management
        Route::prefix('route-assignment')->name('route-assignment-management.')->group(function(){
            Route::get('/', [RouteAssignmentController::class, 'index'])->name('index');
            Route::get('/create', [RouteAssignmentController::class, 'create'])->name('create');
            Route::post('/store', [RouteAssignmentController::class, 'store'])->name('store');
            Route::get('/statistics', [RouteAssignmentController::class, 'statistics'])->name('statistics');
            // Action routes
            Route::post('/start/{routeAssignment}', [RouteAssignmentController::class, 'start'])->name('start');
            Route::post('/complete/{routeAssignment}', [RouteAssignmentController::class, 'complete'])->name('complete');
            Route::post('/cancel/{routeAssignment}', [RouteAssignmentController::class, 'cancel'])->name('cancel');
            Route::post('/update-status/{routeAssignment}', [RouteAssignmentController::class, 'updateStatus'])->name('update-status');
            // CRUD
            Route::get('/{routeAssignment}', [RouteAssignmentController::class, 'show'])->name('show');
            Route::get('/{routeAssignment}/edit', [RouteAssignmentController::class, 'edit'])->name('edit');
            Route::put('/update/{routeAssignment}', [RouteAssignmentController::class, 'update'])->name('update');
            Route::delete('/destroy/{routeAssignment}', [RouteAssignmentController::class, 'destroy'])->name('destroy');
        });

        // Collection Request Management Routes
        Route::prefix('collection-request-management')->name('collection-request-management.')->group(function () {
            Route::get('/', [CollectionRequestController::class, 'index'])->name('index');
            Route::get('/create', [CollectionRequestController::class, 'create'])->name('create');
            Route::post('/store', [CollectionRequestController::class, 'store'])->name('store');
            
            // Statistics should come BEFORE the resource routes to avoid conflicts
            Route::get('/statistics', [CollectionRequestController::class, 'statistics'])->name('statistics');
            
            // Workflow actions (these should also come before resource routes)
            Route::post('/assign/{collectionRequest}', [CollectionRequestController::class, 'assign'])->name('assign');
            Route::post('/start-progress/{collectionRequest}', [CollectionRequestController::class, 'startProgress'])->name('start-progress');
            Route::post('/complete/{collectionRequest}', [CollectionRequestController::class, 'complete'])->name('complete');
            Route::post('/cancel/{collectionRequest}', [CollectionRequestController::class, 'cancel'])->name('cancel');
            
            // Resource routes (these should be at the bottom)
            Route::get('/{collectionRequest}', [CollectionRequestController::class, 'show'])->name('show');
            Route::get('/{collectionRequest}/edit', [CollectionRequestController::class, 'edit'])->name('edit');
            Route::put('/{collectionRequest}', [CollectionRequestController::class, 'update'])->name('update');
            Route::delete('/{collectionRequest}', [CollectionRequestController::class, 'destroy'])->name('destroy');
        });

        // Notification Management
        Route::prefix('notification-management')->name('notification-management.')->group(function(){
            Route::get('/', [NotificationController::class, 'index'])->name('index');
            Route::get('/create', [NotificationController::class, 'create'])->name('create');
            Route::post('/store', [NotificationController::class, 'store'])->name('store');
            
            // Statistics should come BEFORE the resource routes to avoid conflicts
            Route::get('/statistics', [NotificationController::class, 'statistics'])->name('statistics');
            
            // Custom action routes (these should also come before resource routes)
            Route::post('/send-bulk', [NotificationController::class, 'sendBulk'])->name('send-bulk');
            Route::post('/mark-read/{notification}', [NotificationController::class, 'markAsRead'])->name('mark-read');
            Route::post('/mark-unread/{notification}', [NotificationController::class, 'markAsUnread'])->name('mark-unread');
            
            // Resource routes (these should be at the bottom)
            Route::get('/{notification}', [NotificationController::class, 'show'])->name('show');
            Route::get('/{notification}/edit', [NotificationController::class, 'edit'])->name('edit');
            Route::put('/update/{notification}', [NotificationController::class, 'update'])->name('update');
            Route::delete('/destroy/{notification}', [NotificationController::class, 'destroy'])->name('destroy');
        });

        // Report Management
        Route::prefix('reporting-management')->name('reporting-management.')->group(function(){
            Route::get('/', [ReportingController::class, 'index'])->name('index');
            Route::get('/create', [ReportingController::class, 'create'])->name('create');
            Route::post('/store', [ReportingController::class, 'store'])->name('store');
            
            // Statistics
            Route::get('/statistics', [ReportingController::class, 'statistics'])->name('statistics');
            
            // Export actions
            Route::get('/export/{report}/excel', [ReportingController::class, 'exportExcel'])->name('export-excel');
             
            // Regenerate report
            Route::post('/regenerate/{report}', [ReportingController::class, 'regenerate'])->name('regenerate');
            
            // Resource routes
            Route::get('/{report}', [ReportingController::class, 'show'])->name('show');
            Route::delete('/destroy/{report}', [ReportingController::class, 'destroy'])->name('destroy');
        });
        
        
    });

    // User Management
    Route::prefix('user-management')->name('user-management.')->group(function(){

        // Roles and Permissions
        Route::prefix('roles-and-permissions')->name('roles-and-permissions.')->group(function(){
            Route::get('/', [RolesController::class, 'index'])->name('index');
            Route::post('/store', [RolesController::class, 'store'])->name('store');
            Route::delete('/destroy/{role}', [RolesController::class, 'destroy'])->name('destroy');
        });

        // Users
        Route::prefix('users')->name('users.')->group(function(){
            Route::get('/', [UserController::class, 'index'])->name('index');
            Route::get('/create', [UserController::class, 'create'])->name('create');
            Route::post('/store', [UserController::class, 'store'])->name('store');
            Route::get('/edit/{user}', [UserController::class, 'edit'])->name('edit');
            Route::put('/update/{user}', [UserController::class, 'update'])->name('update');
            Route::patch('/reset-password/{user}', [UserController::class, 'resetPassword'])->name('reset-password');
            Route::delete('/destroy/{user}', [UserController::class, 'destroy'])->name('destroy');
        });

        // Activity Logs
        Route::prefix('activity-logs')->name('activity-logs.')->group(function(){
            Route::get('/', [ActivityLogsController::class,'index'])->name('index');
        });
    });
});