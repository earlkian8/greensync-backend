<?php

namespace App\Http\Controllers\v1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Resident;
use App\Models\Collector;
use App\Models\WasteBin;
use App\Models\CollectionSchedule;
use App\Models\Route;
use App\Models\RouteAssignment;
use App\Models\CollectionRequest;
use Illuminate\Http\Request;

class UnreadCountsController extends Controller
{
    /**
     * Get unread counts for all modules
     */
    public function getUnreadCounts()
    {
        return [
            'resident_management' => Resident::where('is_verified', false)->count(),
            'collector_management' => Collector::where('is_verified', false)->orWhere('is_active', false)->count(),
            'waste_bin_management' => WasteBin::whereIn('status', ['full', 'damaged'])->count(),
            'collection_schedule_management' => CollectionSchedule::where('is_active', false)->count(),
            'route_management' => Route::where('is_active', false)->count(),
            'route_assignment' => RouteAssignment::where('status', 'pending')->count(),
            'request_management' => CollectionRequest::whereIn('status', ['pending', 'assigned'])->count(),
            'reporting' => 0, // Reports don't have unread items
            'user_management' => 0, // User management doesn't have unread items
            'activity_logs' => 0, // Activity logs don't have unread items
        ];
    }
}

