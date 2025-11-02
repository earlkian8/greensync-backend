<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\v1\Admin\UserManagement\RolesController;
use App\Http\Controllers\v1\Admin\UserManagement\UserController;
use App\Http\Controllers\v1\Admin\ResidentController;
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