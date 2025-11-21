<?php

namespace App\Http\Controllers\Api\Collectors;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleMapsController extends Controller
{
    /**
     * Get directions route from Google Maps Directions API
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getDirections(Request $request)
    {
        try {
            $validator = \Validator::make($request->all(), [
                'waypoints' => 'required|array|min:2',
                'waypoints.*.lat' => 'required|numeric|between:-90,90',
                'waypoints.*.lng' => 'required|numeric|between:-180,180',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $apiKey = config('services.google.maps_api_key');
            
            if (!$apiKey) {
                return response()->json([
                    'success' => false,
                    'message' => 'Google Maps API key not configured'
                ], 500);
            }

            $waypoints = $request->waypoints;
            
            // Build waypoints string for Google Directions API
            // Format: lat1,lng1|lat2,lng2|lat3,lng3
            $waypointsString = collect($waypoints)->map(function ($point) {
                return $point['lat'] . ',' . $point['lng'];
            })->implode('|');

            // Origin is first waypoint
            $origin = $waypoints[0]['lat'] . ',' . $waypoints[0]['lng'];
            
            // Destination is last waypoint
            $destination = end($waypoints);
            $destination = $destination['lat'] . ',' . $destination['lng'];

            // Intermediate waypoints (all except first and last)
            $intermediateWaypoints = array_slice($waypoints, 1, -1);
            $waypointsParam = collect($intermediateWaypoints)->map(function ($point) {
                return $point['lat'] . ',' . $point['lng'];
            })->implode('|');

            // Build the API request URL
            $url = 'https://maps.googleapis.com/maps/api/directions/json';
            $params = [
                'origin' => $origin,
                'destination' => $destination,
                'waypoints' => $waypointsParam ? 'optimize:true|' . $waypointsParam : '',
                'key' => $apiKey,
                'mode' => 'driving', // driving, walking, bicycling, transit
            ];

            // Remove empty waypoints parameter if no intermediate waypoints
            if (empty($params['waypoints'])) {
                unset($params['waypoints']);
            }

            // Make request to Google Directions API
            $response = Http::get($url, $params);

            if (!$response->successful()) {
                Log::error('Google Directions API error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Failed to get directions from Google Maps',
                    'error' => $response->body()
                ], $response->status());
            }

            $data = $response->json();

            if ($data['status'] !== 'OK') {
                return response()->json([
                    'success' => false,
                    'message' => 'Google Directions API returned error: ' . $data['status'],
                    'error' => $data['error_message'] ?? 'Unknown error'
                ], 400);
            }

            // Extract polyline and decode coordinates
            $route = $data['routes'][0] ?? null;
            
            if (!$route) {
                return response()->json([
                    'success' => false,
                    'message' => 'No route found'
                ], 404);
            }

            // Get the overview polyline (encoded)
            $overviewPolyline = $route['overview_polyline']['points'] ?? null;
            
            if (!$overviewPolyline) {
                return response()->json([
                    'success' => false,
                    'message' => 'No polyline found in route'
                ], 404);
            }

            // Decode the polyline to get coordinates
            $decodedCoordinates = $this->decodePolyline($overviewPolyline);

            // Get route summary
            $legs = $route['legs'] ?? [];
            $totalDistance = 0;
            $totalDuration = 0;
            
            foreach ($legs as $leg) {
                $totalDistance += $leg['distance']['value'] ?? 0; // in meters
                $totalDuration += $leg['duration']['value'] ?? 0; // in seconds
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'polyline' => $overviewPolyline,
                    'coordinates' => $decodedCoordinates,
                    'distance' => [
                        'meters' => $totalDistance,
                        'text' => $legs[0]['distance']['text'] ?? '0 m',
                    ],
                    'duration' => [
                        'seconds' => $totalDuration,
                        'text' => $legs[0]['duration']['text'] ?? '0 min',
                    ],
                    'bounds' => $route['bounds'] ?? null,
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error getting directions', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get directions',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Decode Google polyline string to array of coordinates
     * 
     * @param string $encoded
     * @return array
     */
    private function decodePolyline($encoded)
    {
        $length = strlen($encoded);
        $index = 0;
        $points = [];
        $lat = 0;
        $lng = 0;

        while ($index < $length) {
            $b = 0;
            $shift = 0;
            $result = 0;
            do {
                $b = ord($encoded[$index++]) - 63;
                $result |= ($b & 0x1f) << $shift;
                $shift += 5;
            } while ($b >= 0x20);
            $dlat = (($result & 1) ? ~($result >> 1) : ($result >> 1));
            $lat += $dlat;

            $shift = 0;
            $result = 0;
            do {
                $b = ord($encoded[$index++]) - 63;
                $result |= ($b & 0x1f) << $shift;
                $shift += 5;
            } while ($b >= 0x20);
            $dlng = (($result & 1) ? ~($result >> 1) : ($result >> 1));
            $lng += $dlng;

            $points[] = [
                'latitude' => $lat * 1e-5,
                'longitude' => $lng * 1e-5,
            ];
        }

        return $points;
    }
}

