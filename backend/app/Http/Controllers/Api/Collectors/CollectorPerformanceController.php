<?php

namespace App\Http\Controllers\Api\Collectors;

use App\Http\Controllers\Controller;
use App\Models\QrCollection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class CollectorPerformanceController extends Controller
{
    /**
     * Get performance summary/overview
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPerformanceSummary()
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            // Collections today
            $todayCollections = QrCollection::where('collector_id', $collectorId)
                ->whereIn('collection_status', ['collected', 'completed'])
                ->whereDate('collection_timestamp', Carbon::today())
                ->count();

            // Collections this week
            $thisWeekCollections = QrCollection::where('collector_id', $collectorId)
                ->whereIn('collection_status', ['collected', 'completed'])
                ->whereBetween('collection_timestamp', [
                    Carbon::now()->startOfWeek(),
                    Carbon::now()->endOfWeek()
                ])
                ->count();

            // Collections this month
            $thisMonthCollections = QrCollection::where('collector_id', $collectorId)
                ->whereIn('collection_status', ['collected', 'completed'])
                ->whereMonth('collection_timestamp', Carbon::now()->month)
                ->whereYear('collection_timestamp', Carbon::now()->year)
                ->count();

            return response()->json([
                'success' => true,
                'message' => 'Performance summary retrieved successfully',
                'data' => [
                    'recent_activity' => [
                        'today' => $todayCollections,
                        'this_week' => $thisWeekCollections,
                        'this_month' => $thisMonthCollections,
                    ],
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve performance summary',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Get collection history with filters
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCollectionHistory(Request $request)
    {
        try {
            $collectorId = Auth::guard('collector')->id();

            $query = QrCollection::where('collector_id', $collectorId);

            // Filter by status
            if ($request->has('status')) {
                $query->where('collection_status', $request->status);
            } else {
                // Default: show completed and collected
                $query->whereIn('collection_status', ['collected', 'completed']);
            }

            // Filter by waste type
            if ($request->has('waste_type')) {
                $query->where('waste_type', $request->waste_type);
            }

            // Filter by date range
            if ($request->has('start_date')) {
                $query->whereDate('collection_timestamp', '>=', $request->start_date);
            }
            if ($request->has('end_date')) {
                $query->whereDate('collection_timestamp', '<=', $request->end_date);
            }

            // Filter by month/year
            if ($request->has('month') && $request->has('year')) {
                $query->whereMonth('collection_timestamp', $request->month)
                      ->whereYear('collection_timestamp', $request->year);
            }

            // Search by QR code or waste type
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('qr_code', 'like', "%{$search}%")
                      ->orWhere('waste_type', 'like', "%{$search}%");
                });
            }

            $collections = $query->orderBy('collection_timestamp', 'desc')
                ->paginate($request->input('per_page', 20));

            $collections->getCollection()->transform(function ($collection) {
                return [
                    'id' => $collection->id,
                    'qr_code' => $collection->qr_code,
                    'collection_timestamp' => $collection->collection_timestamp->format('Y-m-d H:i:s'),
                    'collection_date' => $collection->collection_timestamp->format('M d, Y'),
                    'collection_time' => $collection->collection_timestamp->format('h:i A'),
                    'waste_weight' => (float) $collection->waste_weight,
                    'waste_type' => $collection->waste_type ?? 'mixed',
                    'collection_status' => $collection->collection_status,
                    'is_verified' => $collection->is_verified ?? false,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Collection history retrieved successfully',
                'data' => $collections
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve collection history',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }
}
