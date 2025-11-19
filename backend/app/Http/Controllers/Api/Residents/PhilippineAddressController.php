<?php

namespace App\Http\Controllers\Api\Residents;

use App\Http\Controllers\Controller;
use Woenel\Prpcmblmts\Facades\Philippines;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class PhilippineAddressController extends Controller
{
    /**
     * Get all regions
     */
    public function getRegions()
    {
        try {
            // Try using the Philippines facade
            $regions = Philippines::regions()
                ->orderBy('name', 'asc')
                ->get(['id', 'name', 'code', 'psgc']);

            // Convert to array to ensure proper JSON encoding
            $regionsArray = $regions->toArray();

            // If no regions found, try direct database query as fallback
            if (empty($regionsArray)) {
                Log::warning('No regions found via facade, trying direct query');
                $regionsArray = \DB::table('philippine_regions')
                    ->select('id', 'name', 'code', 'psgc')
                    ->orderBy('name', 'asc')
                    ->get()
                    ->toArray();
            }

            Log::info('Regions fetched', [
                'count' => count($regionsArray),
                'sample' => !empty($regionsArray) ? $regionsArray[0] : null
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Regions fetched successfully.',
                'data' => array_values($regionsArray) // Ensure indexed array
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching regions', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch regions.',
                'error' => $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Get provinces by region
     */
    public function getProvincesByRegion(Request $request, $regionId = null)
    {
        try {
            $query = Philippines::provinces();

            if ($regionId) {
                // Get region first to use relationship
                $region = Philippines::regions()->where('id', $regionId)->first();
                
                if (!$region) {
                    return response()->json([
                        'message' => 'Region not found.'
                    ], 404);
                }

                $provinces = $region->provinces()
                    ->orderBy('name', 'asc')
                    ->get(['id', 'name', 'code', 'region_code', 'psgc']);
            } else {
                // Get all provinces if no region specified
                $provinces = $query->orderBy('name', 'asc')
                    ->get(['id', 'name', 'code', 'region_code', 'psgc']);
            }

            return response()->json([
                'message' => 'Provinces fetched successfully.',
                'data' => $provinces
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch provinces.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get cities by province
     */
    public function getCitiesByProvince(Request $request, $provinceId = null)
    {
        try {
            $query = Philippines::cities();

            if ($provinceId) {
                // Get province first to use relationship
                $province = Philippines::provinces()->where('id', $provinceId)->first();
                
                if (!$province) {
                    return response()->json([
                        'message' => 'Province not found.'
                    ], 404);
                }

                $cities = $province->cities()
                    ->orderBy('name', 'asc')
                    ->get(['id', 'name', 'code', 'province_code', 'region_code', 'psgc']);
            } else {
                // Get all cities if no province specified
                $cities = $query->orderBy('name', 'asc')
                    ->get(['id', 'name', 'code', 'province_code', 'region_code', 'psgc']);
            }

            return response()->json([
                'message' => 'Cities fetched successfully.',
                'data' => $cities
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch cities.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get barangays by city
     */
    public function getBarangaysByCity(Request $request, $cityId = null)
    {
        try {
            $query = Philippines::barangays();

            if ($cityId) {
                // Get city first to use relationship
                $city = Philippines::cities()->where('id', $cityId)->first();
                
                if (!$city) {
                    return response()->json([
                        'message' => 'City not found.'
                    ], 404);
                }

                $barangays = $city->barangays()
                    ->orderBy('name', 'asc')
                    ->get(['id', 'name', 'city_code', 'province_code', 'region_code', 'psgc']);
            } else {
                // For barangays, we should always require a city to avoid performance issues
                return response()->json([
                    'message' => 'City ID is required to fetch barangays.'
                ], 400);
            }

            return response()->json([
                'message' => 'Barangays fetched successfully.',
                'data' => $barangays
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch barangays.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific region by ID
     */
    public function getRegion($id)
    {
        try {
            $region = Philippines::regions()->where('id', $id)->first();

            if (!$region) {
                return response()->json([
                    'message' => 'Region not found.'
                ], 404);
            }

            return response()->json([
                'message' => 'Region fetched successfully.',
                'data' => $region
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch region.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific province by ID
     */
    public function getProvince($id)
    {
        try {
            $province = Philippines::provinces()->where('id', $id)->first();

            if (!$province) {
                return response()->json([
                    'message' => 'Province not found.'
                ], 404);
            }

            return response()->json([
                'message' => 'Province fetched successfully.',
                'data' => $province
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch province.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific city by ID
     */
    public function getCity($id)
    {
        try {
            $city = Philippines::cities()->where('id', $id)->first();

            if (!$city) {
                return response()->json([
                    'message' => 'City not found.'
                ], 404);
            }

            return response()->json([
                'message' => 'City fetched successfully.',
                'data' => $city
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch city.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific barangay by ID
     */
    public function getBarangay($id)
    {
        try {
            $barangay = Philippines::barangays()->where('id', $id)->first();

            if (!$barangay) {
                return response()->json([
                    'message' => 'Barangay not found.'
                ], 404);
            }

            return response()->json([
                'message' => 'Barangay fetched successfully.',
                'data' => $barangay
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch barangay.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

