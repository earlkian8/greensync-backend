import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, ActivityIndicator, Dimensions, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { MapIcon, NavigationIcon } from 'lucide-react-native';
import collectorRoutesService from '@/services/collectorRoutesService';

const { height } = Dimensions.get('window');

// This component will only be loaded when map is actually needed
const RouteMapView = ({ 
  stops, 
  selectedStop, 
  onStopSelect, 
  mapRegion, 
  routeCoordinates,
  onFitToStops 
}) => {
  const [mapComponents, setMapComponents] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [fallbackMessage, setFallbackMessage] = React.useState(null);
  const [roadRouteCoordinates, setRoadRouteCoordinates] = useState([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const mapRef = useRef(null);
  const isMountedRef = useRef(true);
  const fitToStopsCalledRef = useRef(false);
  const lastRouteCoordinatesRef = useRef(null);
  const animationTimeoutRef = useRef(null);
  const routeFetchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Load map components on mount
  useEffect(() => {
    isMountedRef.current = true;
    
    const loadMap = async () => {
      try {
        // Dynamic import only when this component is rendered
        const mapModule = await import('react-native-maps');
        
        if (isMountedRef.current && mapModule && mapModule.default) {
          setMapComponents({
            MapView: mapModule.default,
            Marker: mapModule.Marker,
            Polyline: mapModule.Polyline,
            PROVIDER_GOOGLE: mapModule.PROVIDER_GOOGLE,
            PROVIDER_DEFAULT: mapModule.PROVIDER_DEFAULT,
          });
        }
      } catch (err) {
        console.error('Failed to load map:', err);
        if (isMountedRef.current) {
          const isDevClientIssue =
            err?.message?.includes('Native component for "AIRMap" does not exist') ||
            err?.message?.includes('Expo Go') ||
            err?.message?.includes('AIRGoogleMap');

          setError(
            isDevClientIssue
              ? 'Map is unavailable in Expo Go builds.'
              : err.message
          );
          if (isDevClientIssue) {
            setFallbackMessage(
              'To view maps on a device, install the Greensync dev build or run the app in a simulator/emulator created with "expo run".'
            );
          }
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    // Small delay to ensure navigation context is ready
    const timer = setTimeout(() => {
      loadMap();
    }, 300);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
    };
  }, []);

  // Focus on selected stop with debouncing and guards
  useEffect(() => {
    if (!mapRef.current || !mapComponents || !selectedStop?.latitude || !selectedStop?.longitude) {
      return;
    }

    // Clear any pending animation
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    animationTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current || !mapRef.current) return;
      
      try {
        const lat = parseFloat(selectedStop.latitude);
        const lng = parseFloat(selectedStop.longitude);
        
        if (isNaN(lat) || isNaN(lng)) return;
        
        mapRef.current.animateToRegion(
          {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          500
        );
      } catch (err) {
        console.warn('Error animating to region:', err);
      }
    }, 200); // Increased debounce to prevent rapid animations

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    };
  }, [selectedStop?.id, selectedStop?.latitude, selectedStop?.longitude, mapComponents]);

  // Fetch road-following route from Google Directions API with proper cancellation
  useEffect(() => {
    // Check if coordinates actually changed
    const coordinatesKey = JSON.stringify(routeCoordinates);
    if (lastRouteCoordinatesRef.current === coordinatesKey) {
      return;
    }
    lastRouteCoordinatesRef.current = coordinatesKey;

    // Need at least 2 points for a route
    if (routeCoordinates.length < 2) {
      if (isMountedRef.current) {
        setRoadRouteCoordinates([]);
      }
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Clear previous timeout
    if (routeFetchTimeoutRef.current) {
      clearTimeout(routeFetchTimeoutRef.current);
    }

    const fetchRoadRoute = async () => {
      if (!isMountedRef.current) return;

      setLoadingRoute(true);

      try {
        const response = await collectorRoutesService.getDirections(routeCoordinates);
        
        if (!isMountedRef.current) return;

        if (response && response.coordinates && response.coordinates.length > 0) {
          // Convert to format expected by react-native-maps
          const coordinates = response.coordinates.map(coord => ({
            latitude: coord.latitude,
            longitude: coord.longitude,
          }));
          setRoadRouteCoordinates(coordinates);
        } else {
          // Fallback to straight line if API doesn't return coordinates
          setRoadRouteCoordinates(routeCoordinates);
        }
      } catch (err) {
        if (!isMountedRef.current) return;
        
        // Only log if it's not an abort error
        if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
          console.warn('Failed to fetch road route, using straight line:', err);
        }
        // Fallback to straight line route if API fails
        setRoadRouteCoordinates(routeCoordinates);
      } finally {
        if (isMountedRef.current) {
          setLoadingRoute(false);
        }
      }
    };

    // Debounce the API call to prevent excessive requests
    routeFetchTimeoutRef.current = setTimeout(() => {
      fetchRoadRoute();
    }, 500); // Increased debounce time

    return () => {
      if (routeFetchTimeoutRef.current) {
        clearTimeout(routeFetchTimeoutRef.current);
        routeFetchTimeoutRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [routeCoordinates]);

  // Fit to stops when map is ready (only once when map loads)
  useEffect(() => {
    if (!mapRef.current || !mapComponents || fitToStopsCalledRef.current) return;

    const fitToCoordinates = () => {
      if (!isMountedRef.current || !mapRef.current || fitToStopsCalledRef.current) return;

      const coordsToFit = roadRouteCoordinates.length > 0 ? roadRouteCoordinates : routeCoordinates;
      if (coordsToFit.length > 0) {
        try {
          mapRef.current.fitToCoordinates(coordsToFit, {
            edgePadding: {
              top: 50,
              right: 50,
              bottom: 50,
              left: 50,
            },
            animated: true,
          });
          fitToStopsCalledRef.current = true;
        } catch (err) {
          console.warn('Error fitting to coordinates:', err);
        }
      }
    };

    // Delay to ensure map is fully rendered
    const timeoutId = setTimeout(fitToCoordinates, 800);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [mapComponents, routeCoordinates, roadRouteCoordinates]);

  // Handle fitToStops callback - optimized version
  const handleFitToStops = useCallback(() => {
    if (!mapRef.current || !mapComponents) return;

    const coordsToFit = roadRouteCoordinates.length > 0 ? roadRouteCoordinates : routeCoordinates;
    if (coordsToFit.length > 0) {
      try {
        mapRef.current.fitToCoordinates(coordsToFit, {
          edgePadding: {
            top: 50,
            right: 50,
            bottom: 50,
            left: 50,
          },
          animated: true,
        });
      } catch (err) {
        console.warn('Error fitting to coordinates:', err);
      }
    }
  }, [mapComponents, routeCoordinates, roadRouteCoordinates]);

  // Memoize valid stops to prevent unnecessary recalculations
  const validStops = useMemo(() => {
    return stops.filter(
      (stop) => stop.latitude && stop.longitude && 
      !isNaN(parseFloat(stop.latitude)) && 
      !isNaN(parseFloat(stop.longitude))
    );
  }, [stops]);

  if (loading) {
    return (
      <View style={[styles.mapContainer, { height: Math.min(height * 0.55, 500) }]}>
        <View style={[styles.flex1, styles.itemsCenter, styles.justifyCenter, styles.p6]}>
          <ActivityIndicator size="large" color="#16A34A" />
          <Text style={[styles.textGray500, styles.textCenter, styles.mt4]}>
            Loading map...
          </Text>
        </View>
      </View>
    );
  }

  if (error || !mapComponents) {
    return (
      <View style={[styles.mapContainer, { height: Math.min(height * 0.55, 500) }]}>
        <View style={[styles.flex1, styles.itemsCenter, styles.justifyCenter, styles.p6]}>
          <MapIcon size={48} color="#9CA3AF" />
          <Text style={[styles.textGray500, styles.textCenter, styles.mt4]}>
            {error || 'Map unavailable'}
          </Text>
          {fallbackMessage ? (
            <Text style={[styles.textXs, styles.textGray500, styles.textCenter, styles.mt2, styles.px4]}>
              {fallbackMessage}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  if (validStops.length === 0) {
    return (
      <View style={[styles.mapContainer, { height: Math.min(height * 0.55, 500) }]}>
        <View style={[styles.flex1, styles.itemsCenter, styles.justifyCenter, styles.p6]}>
          <MapIcon size={48} color="#9CA3AF" />
          <Text style={[styles.textGray500, styles.textCenter, styles.mt4]}>
            No stops with valid coordinates available
          </Text>
        </View>
      </View>
    );
  }

  const { MapView, Marker, Polyline, PROVIDER_GOOGLE, PROVIDER_DEFAULT } = mapComponents;
  const mapProvider = Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      if (routeFetchTimeoutRef.current) {
        clearTimeout(routeFetchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (mapRef.current) {
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <View style={[styles.mt4, styles.rounded2xl, styles.overflowHidden, styles.border, styles.borderGray200]}>
      <MapView
        ref={mapRef}
        style={{ width: '100%', height: Math.min(height * 0.55, 500) }}
        provider={mapProvider}
        initialRegion={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        mapType="standard"
        loadingEnabled={true}
        loadingIndicatorColor="#16A34A"
        toolbarEnabled={false}
        cacheEnabled={true}
        maxZoomLevel={20}
        minZoomLevel={5}
        moveOnMarkerPress={false}
        pitchEnabled={false}
        rotateEnabled={false}
        scrollEnabled={true}
        zoomEnabled={true}
        onMapReady={() => {
          // Map is ready, can perform operations
        }}
      >
        {/* Route polyline - use road-following route if available, otherwise fallback to straight line */}
        {useMemo(() => {
          const coords = roadRouteCoordinates.length > 1 ? roadRouteCoordinates : routeCoordinates;
          if (coords.length < 2) return null;
          
          return (
            <Polyline
              coordinates={coords}
              strokeColor="#16A34A"
              strokeWidth={5}
              lineCap="round"
              lineJoin="round"
              miterLimit={10}
              tappable={false}
            />
          );
        }, [roadRouteCoordinates, routeCoordinates])}
        
        {/* Show loading indicator while fetching route */}
        {loadingRoute && (
          <View style={[styles.absolute, { top: 16, left: 16 }]}>
            <View style={[styles.bgWhite, styles.roundedLg, { padding: 8 }, styles.shadowLg]}>
              <ActivityIndicator size="small" color="#16A34A" />
              <Text style={[styles.textXs, styles.textGray500, styles.mt1]}>Loading route...</Text>
            </View>
          </View>
        )}

        {/* Markers for each stop - memoized to prevent unnecessary re-renders */}
        {useMemo(() => {
          const selectedStopId = selectedStop?.id;
          return validStops.map((stop) => {
            const isSelected = selectedStopId === stop.id;
            const lat = parseFloat(stop.latitude);
            const lng = parseFloat(stop.longitude);
            
            if (isNaN(lat) || isNaN(lng)) return null;

            const coordinate = {
              latitude: lat,
              longitude: lng,
            };

            let markerColor = '#FACC15'; // Yellow for pending
            if (stop.is_completed) {
              markerColor = '#22C55E'; // Green for completed
            } else if (isSelected) {
              markerColor = '#3B82F6'; // Blue for selected
            }

            return (
              <Marker
                key={`stop-${stop.id}`}
                coordinate={coordinate}
                title={`Stop #${stop.stop_order}`}
                description={stop.address || ''}
                onPress={() => {
                  if (onStopSelect) {
                    onStopSelect(stop);
                  }
                }}
                pinColor={markerColor}
                tracksViewChanges={false}
                zIndex={isSelected ? 1000 : stop.is_completed ? 500 : 0}
              />
            );
          }).filter(Boolean);
        }, [validStops, selectedStop?.id, onStopSelect])}
      </MapView>

      {/* Map controls */}
      <View style={[styles.absolute, { top: 16, right: 16 }, styles.flexCol, styles.gap2]}>
        <TouchableOpacity
          style={[styles.bgWhite, styles.roundedFull, { padding: 12 }, styles.shadowLg]}
          onPress={handleFitToStops}
          activeOpacity={0.7}
        >
          <NavigationIcon size={20} color="#16A34A" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  flexRow: {
    flexDirection: 'row',
  },
  flexCol: {
    flexDirection: 'column',
  },
  itemsCenter: {
    alignItems: 'center',
  },
  justifyCenter: {
    justifyContent: 'center',
  },
  mt2: {
    marginTop: 8,
  },
  mt4: {
    marginTop: 16,
  },
  px4: {
    paddingHorizontal: 16,
  },
  p6: {
    padding: 24,
  },
  gap2: {
    gap: 8,
  },
  rounded2xl: {
    borderRadius: 16,
  },
  roundedFull: {
    borderRadius: 9999,
  },
  roundedLg: {
    borderRadius: 8,
  },
  overflowHidden: {
    overflow: 'hidden',
  },
  mt1: {
    marginTop: 4,
  },
  border: {
    borderWidth: 1,
  },
  borderGray200: {
    borderColor: '#E5E7EB',
  },
  bgGray100: {
    backgroundColor: '#F3F4F6',
  },
  bgWhite: {
    backgroundColor: '#FFFFFF',
  },
  textCenter: {
    textAlign: 'center',
  },
  textGray500: {
    color: '#6B7280',
  },
  textXs: {
    fontSize: 12,
  },
  absolute: {
    position: 'absolute',
  },
  shadowLg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mapContainer: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
  },
});

// Memoize component to prevent unnecessary re-renders
export default React.memo(RouteMapView);

