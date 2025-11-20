<?php

namespace App\Http\Controllers\Api\Residents;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Woenel\Prpcmblmts\Models\PhilippineRegion;
use Woenel\Prpcmblmts\Models\PhilippineProvince;
use Woenel\Prpcmblmts\Models\PhilippineCity;
use Woenel\Prpcmblmts\Models\PhilippineBarangay;

class PhilippineAddressController extends Controller
{
    /**
     * Get all regions
     */
    public function getRegions()
    {
        try {
            // Use the PhilippineRegion model directly
            $regions = PhilippineRegion::select('id', 'name', 'code', 'psgc')
                ->orderBy('name', 'asc')
                ->get();

            // Convert to array to ensure proper JSON encoding
            $regionsArray = $regions->toArray();

            // If no regions found, try direct database query as fallback
            if (empty($regionsArray)) {
                Log::warning('No regions found via model, trying direct query');
                $regionsArray = DB::table('philippine_regions')
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
            if ($regionId) {
                // Get region first to use relationship
                $region = PhilippineRegion::find($regionId);
                
                if (!$region) {
                    return response()->json([
                        'message' => 'Region not found.'
                    ], 404);
                }

                $provinces = $region->provinces()
                    ->select('id', 'name', 'code', 'region_code', 'psgc')
                    ->orderBy('name', 'asc')
                    ->get();
            } else {
                // Get all provinces if no region specified
                $provinces = PhilippineProvince::select('id', 'name', 'code', 'region_code', 'psgc')
                    ->orderBy('name', 'asc')
                    ->get();
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
            if ($provinceId) {
                // Get province first to use relationship
                $province = PhilippineProvince::find($provinceId);
                
                if (!$province) {
                    return response()->json([
                        'message' => 'Province not found.'
                    ], 404);
                }

                $cities = $province->cities()
                    ->select('id', 'name', 'code', 'province_code', 'region_code', 'psgc')
                    ->orderBy('name', 'asc')
                    ->get();
            } else {
                // Get all cities if no province specified
                $cities = PhilippineCity::select('id', 'name', 'code', 'province_code', 'region_code', 'psgc')
                    ->orderBy('name', 'asc')
                    ->get();
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
            if ($cityId) {
                // Get city first to use relationship
                $city = PhilippineCity::find($cityId);
                
                if (!$city) {
                    return response()->json([
                        'message' => 'City not found.'
                    ], 404);
                }

                $barangays = $city->barangays()
                    ->select('id', 'name', 'city_code', 'province_code', 'region_code', 'psgc')
                    ->orderBy('name', 'asc')
                    ->get();
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
            $region = PhilippineRegion::find($id);

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
            $province = PhilippineProvince::find($id);

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
            $city = PhilippineCity::find($id);

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
            $barangay = PhilippineBarangay::find($id);

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

