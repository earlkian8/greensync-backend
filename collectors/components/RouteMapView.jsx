import React, { useRef, useEffect } from 'react';
import { View, Text, ActivityIndicator, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { MapIcon, NavigationIcon } from 'lucide-react-native';

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
          setError(err.message);
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

  // Fit to stops when map is ready
  useEffect(() => {
    if (mapRef.current && mapComponents && routeCoordinates.length > 0) {
      mapRef.current.fitToCoordinates(routeCoordinates, {
        edgePadding: {
          top: 50,
          right: 50,
          bottom: 50,
          left: 50,
        },
        animated: true,
      });
    }
  }, [mapComponents, routeCoordinates]);

  const validStops = stops.filter(
    (stop) => stop.latitude && stop.longitude && 
    !isNaN(parseFloat(stop.latitude)) && 
    !isNaN(parseFloat(stop.longitude))
  );

  if (loading) {
    return (
      <View className="mt-4 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100" style={{ height: Math.min(height * 0.55, 500) }}>
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="large" color="#16A34A" />
          <Text className="text-gray-500 text-center mt-4">
            Loading map...
          </Text>
        </View>
      </View>
    );
  }

  if (error || !mapComponents) {
    return (
      <View className="mt-4 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100" style={{ height: Math.min(height * 0.55, 500) }}>
        <View className="flex-1 items-center justify-center p-6">
          <MapIcon size={48} color="#9CA3AF" />
          <Text className="text-gray-500 text-center mt-4">
            {error || 'Map unavailable'}
          </Text>
        </View>
      </View>
    );
  }

  if (validStops.length === 0) {
    return (
      <View className="mt-4 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100" style={{ height: Math.min(height * 0.55, 500) }}>
        <View className="flex-1 items-center justify-center p-6">
          <MapIcon size={48} color="#9CA3AF" />
          <Text className="text-gray-500 text-center mt-4">
            No stops with valid coordinates available
          </Text>
        </View>
      </View>
    );
  }

  const { MapView, Marker, Polyline, PROVIDER_GOOGLE, PROVIDER_DEFAULT } = mapComponents;
  const mapProvider = Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;

  return (
    <View className="mt-4 rounded-2xl overflow-hidden border border-gray-200">
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
        {/* Route polyline */}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#16A34A"
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
            miterLimit={10}
          />
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
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View
                style={{
                  backgroundColor: markerColor,
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  borderWidth: 3,
                  borderColor: '#FFFFFF',
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.4,
                  shadowRadius: 5,
                  elevation: 8,
                }}
              >
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: 'bold',
                  }}
                >
                  {stop.stop_order}
                </Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Map controls */}
      <View className="absolute top-4 right-4 flex-col gap-2">
        <TouchableOpacity
          className="bg-white rounded-full p-3 shadow-lg"
          onPress={onFitToStops}
        >
          <NavigationIcon size={20} color="#16A34A" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default RouteMapView;

