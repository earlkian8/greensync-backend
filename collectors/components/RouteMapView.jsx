import React, { useRef, useEffect, useState } from 'react';
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

  useEffect(() => {
    let mounted = true;
    
    const loadMap = async () => {
      try {
        // Dynamic import only when this component is rendered
        const mapModule = await import('react-native-maps');
        
        if (mounted && mapModule && mapModule.default) {
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
        if (mounted) {
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
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Small delay to ensure navigation context is ready
    const timer = setTimeout(() => {
      loadMap();
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Focus on selected stop
  useEffect(() => {
    if (mapRef.current && selectedStop?.latitude && selectedStop?.longitude) {
      const coordinate = {
        latitude: parseFloat(selectedStop.latitude),
        longitude: parseFloat(selectedStop.longitude),
      };
      mapRef.current.animateToRegion(
        {
          ...coordinate,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      );
    }
  }, [selectedStop]);

  // Fetch road-following route from Google Directions API
  useEffect(() => {
    const fetchRoadRoute = async () => {
      // Need at least 2 points for a route
      if (routeCoordinates.length < 2) {
        setRoadRouteCoordinates([]);
        return;
      }

      setLoadingRoute(true);
      try {
        const response = await collectorRoutesService.getDirections(routeCoordinates);
        
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
        console.warn('Failed to fetch road route, using straight line:', err);
        // Fallback to straight line route if API fails
        setRoadRouteCoordinates(routeCoordinates);
      } finally {
        setLoadingRoute(false);
      }
    };

    fetchRoadRoute();
  }, [routeCoordinates]);

  // Fit to stops when map is ready
  useEffect(() => {
    const coordsToFit = roadRouteCoordinates.length > 0 ? roadRouteCoordinates : routeCoordinates;
    if (mapRef.current && mapComponents && coordsToFit.length > 0) {
      mapRef.current.fitToCoordinates(coordsToFit, {
        edgePadding: {
          top: 50,
          right: 50,
          bottom: 50,
          left: 50,
        },
        animated: true,
      });
    }
  }, [mapComponents, roadRouteCoordinates, routeCoordinates]);

  const validStops = stops.filter(
    (stop) => stop.latitude && stop.longitude && 
    !isNaN(parseFloat(stop.latitude)) && 
    !isNaN(parseFloat(stop.longitude))
  );

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
      >
        {/* Route polyline - use road-following route if available, otherwise fallback to straight line */}
        {(roadRouteCoordinates.length > 1 || routeCoordinates.length > 1) && (
          <Polyline
            coordinates={roadRouteCoordinates.length > 1 ? roadRouteCoordinates : routeCoordinates}
            strokeColor="#16A34A"
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
            miterLimit={10}
          />
        )}
        
        {/* Show loading indicator while fetching route */}
        {loadingRoute && (
          <View style={[styles.absolute, { top: 16, left: 16 }]}>
            <View style={[styles.bgWhite, styles.roundedLg, { padding: 8 }, styles.shadowLg]}>
              <ActivityIndicator size="small" color="#16A34A" />
              <Text style={[styles.textXs, styles.textGray500, styles.mt1]}>Loading route...</Text>
            </View>
          </View>
        )}

        {/* Markers for each stop */}
        {validStops.map((stop, index) => {
          const isSelected = selectedStop?.id === stop.id;
          const coordinate = {
            latitude: parseFloat(stop.latitude),
            longitude: parseFloat(stop.longitude),
          };

          let markerColor = '#FACC15'; // Yellow for pending
          if (stop.is_completed) {
            markerColor = '#22C55E'; // Green for completed
          } else if (isSelected) {
            markerColor = '#3B82F6'; // Blue for selected
          }

          return (
            <Marker
              key={`stop-${stop.id}-${index}`}
              coordinate={coordinate}
              title={`Stop #${stop.stop_order}`}
              description={stop.address}
              onPress={() => onStopSelect?.(stop)}
              pinColor={markerColor}
              tracksViewChanges={false}
            />
          );
        })}
      </MapView>

      {/* Map controls */}
      <View style={[styles.absolute, { top: 16, right: 16 }, styles.flexCol, styles.gap2]}>
        <TouchableOpacity
          style={[styles.bgWhite, styles.roundedFull, { padding: 12 }, styles.shadowLg]}
          onPress={onFitToStops}
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

export default RouteMapView;

