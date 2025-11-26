<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\Notification;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        // Only calculate unread counts for authenticated admin users based on notifications
        $unreadCounts = [];
        if ($request->user()) {
            $userId = $request->user()->id;
            
            // Get unread notification counts per module
            $moduleCounts = Notification::where('recipient_id', $userId)
                ->where('is_read', false)
                ->whereNotNull('module')
                ->selectRaw('module, COUNT(*) as count')
                ->groupBy('module')
                ->pluck('count', 'module')
                ->toArray();

            $unreadCounts = [
                'resident_management' => $moduleCounts['resident_management'] ?? 0,
                'collector_management' => $moduleCounts['collector_management'] ?? 0,
                'waste_bin_management' => $moduleCounts['waste_bin_management'] ?? 0,
                'collection_schedule_management' => $moduleCounts['collection_schedule_management'] ?? 0,
                'route_management' => $moduleCounts['route_management'] ?? 0,
                'route_assignment' => $moduleCounts['route_assignment'] ?? 0,
                'request_management' => $moduleCounts['request_management'] ?? 0,
                'reporting' => 0,
                'user_management' => 0,
                'activity_logs' => 0,
            ];
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'warning' => $request->session()->get('warning'),
                'info' => $request->session()->get('info'),
            ],
            'unreadCounts' => $unreadCounts,
            'googleMapsApiKey' => config('services.google.maps_api_key'),
        ];
    }
}
