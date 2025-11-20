<?php

namespace App\Http\Controllers;

use App\Models\ActivityLogs;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Trait\ActivityLogsTrait;

class ActivityLogsController extends Controller
{
    use ActivityLogsTrait;

    public function index(Request $request)
    {
        //
        $search = $request->input('search');

        $logs = ActivityLogs::with('user')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('module', 'ilike', "%{$search}%")
                      ->orWhere('action', 'ilike', "%{$search}%")
                      ->orWhere('description', 'ilike', "%{$search}%")
                      ->orWhere('ip_address', 'ilike', "%{$search}%");
                });
            })
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        

        return Inertia::render('UserManagement/ActivityLogs/index', [
            'logs' => $logs,
            'search' => $search,
        ]);
    }
}
