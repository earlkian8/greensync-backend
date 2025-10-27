<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\UserManagement\RolesController;
use App\Http\Controllers\Admin\UserManagement\UserController;
use App\Http\Controllers\ActivityLogsController;

Route::middleware('auth')->group(function () {

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