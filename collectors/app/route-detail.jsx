import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Modal, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import { Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import collectorRoutesService from '@/services/collectorRoutesService';
import { ArrowLeftIcon, CameraIcon, MapIcon, MapPinnedIcon, RefreshCwIcon, ListIcon, AlertTriangleIcon, NavigationIcon } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const VIEW_MODES = {
  LIST: 'list',
  MAP: 'map',
};

const calculateRegionFromStops = (stops) => {
  if (!stops?.length) {
    return {
      latitude: 14.5995,
      longitude: 120.9842,
      latitudeDelta: 0.2,
      longitudeDelta: 0.2,
    };
  }

  // Filter stops with valid coordinates
  const validStops = stops.filter(
    (stop) => stop.latitude && stop.longitude && 
    !isNaN(parseFloat(stop.latitude)) && 
    !isNaN(parseFloat(stop.longitude))
  );

  if (validStops.length === 0) {
    return {
      latitude: 14.5995,
      longitude: 120.9842,
      latitudeDelta: 0.2,
      longitudeDelta: 0.2,
    };
  }

  if (validStops.length === 1) {
    return {
      latitude: parseFloat(validStops[0].latitude),
      longitude: parseFloat(validStops[0].longitude),
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }

  // Calculate bounding box
  const latitudes = validStops.map((stop) => parseFloat(stop.latitude));
  const longitudes = validStops.map((stop) => parseFloat(stop.longitude));

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  const latDelta = (maxLat - minLat) * 1.5; // Add padding
  const lngDelta = (maxLng - minLng) * 1.5;

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(latDelta, 0.01), // Minimum delta
    longitudeDelta: Math.max(lngDelta, 0.01),
  };
};

const RouteDetailScreen = () => {
  const router = useRouter();
  const { assignmentId } = useLocalSearchParams();

  const [activeView, setActiveView] = useState(VIEW_MODES.LIST);
  const [assignmentData, setAssignmentData] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scanProcessing, setScanProcessing] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [scanSuccess, setScanSuccess] = useState(null);
  const mapRef = useRef(null);

  const fetchDetails = useCallback(async () => {
    if (!assignmentId) return;
    try {
      setError(null);
      setLoading(true);
      const data = await collectorRoutesService.getAssignmentDetails(assignmentId);
      setAssignmentData(data);
      setStops(data?.stops ?? []);
    } catch (err) {
      console.error('Failed to load route details', err);
      const message = err?.response?.data?.message ?? 'Unable to load route details. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleOpenScanner = async (stop) => {
    setScanError(null);
    setScanSuccess(null);
    if (!cameraPermission?.granted) {
      const permissionResult = await requestCameraPermission();
      if (!permissionResult?.granted) {
        setScanError('Camera permission is required to scan QR codes.');
        return;
      }
    }
    setSelectedStop(stop);
    setScannerVisible(true);
  };

  const updateStopCompletion = (stopId) => {
    setStops((prev) =>
      prev.map((stop) => (stop.id === stopId ? { ...stop, is_completed: true } : stop))
    );
  };

  const handleBarcodeScanned = async ({ data: qrCode }) => {
    if (scanProcessing || !selectedStop) return;
    setScanProcessing(true);
    setScanError(null);

    try {
      const scanResult = await collectorRoutesService.scanBinQr({
        assignmentId,
        qrCode,
      });

      const binId = scanResult?.bin?.id;
      if (!binId) {
        throw new Error('Bin not found for scanned code.');
      }

      await collectorRoutesService.recordCollection({
        assignmentId,
        binId,
        qrCode,
        latitude: parseFloat(selectedStop.latitude) || 0,
        longitude: parseFloat(selectedStop.longitude) || 0,
        wasteType: 'mixed',
      });

      updateStopCompletion(selectedStop.id);
      setScanSuccess('Collection recorded successfully.');
      setTimeout(() => {
        setScannerVisible(false);
        setScanSuccess(null);
      }, 1200);
    } catch (err) {
      console.error('QR scan failed', err);
      const message =
        err?.response?.data?.message ??
        err?.message ??
        'Failed to record collection. Please try again.';
      setScanError(message);
    } finally {
      setScanProcessing(false);
    }
  };

  const closeScanner = () => {
    setScannerVisible(false);
    setSelectedStop(null);
    setScanProcessing(false);
    setScanError(null);
    setScanSuccess(null);
  };

  const progress = useMemo(() => {
    const total = stops.length;
    const completed = stops.filter((stop) => stop.is_completed).length;
    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [stops]);

  // Calculate map region from stops
  const mapRegion = useMemo(() => calculateRegionFromStops(stops), [stops]);

  // Get valid coordinates for polyline
  const routeCoordinates = useMemo(() => {
    return stops
      .filter((stop) => stop.latitude && stop.longitude && 
        !isNaN(parseFloat(stop.latitude)) && 
        !isNaN(parseFloat(stop.longitude)))
      .sort((a, b) => (a.stop_order || 0) - (b.stop_order || 0))
      .map((stop) => ({
        latitude: parseFloat(stop.latitude),
        longitude: parseFloat(stop.longitude),
      }));
  }, [stops]);

  // Fit map to show all stops
  const fitToStops = useCallback(() => {
    if (mapRef.current && routeCoordinates.length > 0) {
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
  }, [routeCoordinates]);

  // Focus on selected stop
  const focusOnStop = useCallback((stop) => {
    if (mapRef.current && stop?.latitude && stop?.longitude) {
      const coordinate = {
        latitude: parseFloat(stop.latitude),
        longitude: parseFloat(stop.longitude),
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
  }, []);

  // Focus on selected stop when it changes
  useEffect(() => {
    if (selectedStop && activeView === VIEW_MODES.MAP) {
      focusOnStop(selectedStop);
    }
  }, [selectedStop, activeView, focusOnStop]);

  const renderToggle = () => (
    <View className="flex-row bg-gray-100 rounded-full p-1 mt-4">
      {[VIEW_MODES.LIST, VIEW_MODES.MAP].map((mode) => (
        <TouchableOpacity
          key={mode}
          className={`flex-1 py-2 rounded-full flex-row justify-center items-center ${
            activeView === mode ? 'bg-white shadow' : ''
          }`}
          onPress={() => setActiveView(mode)}
        >
          {mode === VIEW_MODES.LIST ? (
            <ListIcon size={16} color={activeView === mode ? '#16A34A' : '#6B7280'} />
          ) : (
            <MapIcon size={16} color={activeView === mode ? '#16A34A' : '#6B7280'} />
          )}
          <Text
            className={`ml-1 text-sm font-medium ${
              activeView === mode ? 'text-green-600' : 'text-gray-500'
            }`}
          >
            {mode === VIEW_MODES.LIST ? 'List' : 'Map'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStopCard = (stop) => (
    <View
      key={stop.id}
      className="bg-white border border-gray-200 rounded-xl p-4 mb-3 shadow-sm"
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1 pr-2">
          <Text className="text-sm text-gray-500">Stop #{stop.stop_order}</Text>
          <Text className="text-base font-semibold text-gray-900 mt-1">{stop.address}</Text>
          {stop.notes ? (
            <Text className="text-xs text-gray-500 mt-1">{stop.notes}</Text>
          ) : null}
        </View>
        <View
          className={`px-2 py-1 rounded-full ${
            stop.is_completed ? 'bg-green-100' : 'bg-yellow-100'
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              stop.is_completed ? 'text-green-800' : 'text-yellow-800'
            }`}
          >
            {stop.is_completed ? 'Collected' : 'Pending'}
          </Text>
        </View>
      </View>

      <View className="flex-row mt-4 gap-2">
        <TouchableOpacity
          className="flex-1 border border-gray-200 rounded-lg py-2 flex-row items-center justify-center"
          onPress={() => {
            setSelectedStop(stop);
            setActiveView(VIEW_MODES.MAP);
          }}
        >
          <MapPinnedIcon size={16} color="#16A34A" />
          <Text className="ml-1 font-medium text-green-700">View on Map</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 rounded-lg py-2 flex-row items-center justify-center ${
            stop.is_completed ? 'bg-gray-200' : 'bg-green-600'
          }`}
          disabled={stop.is_completed}
          onPress={() => handleOpenScanner(stop)}
        >
          <CameraIcon size={16} color={stop.is_completed ? '#6B7280' : '#ffffff'} />
          <Text
            className={`ml-1 font-semibold ${
              stop.is_completed ? 'text-gray-600' : 'text-white'
            }`}
          >
            {stop.is_completed ? 'Completed' : 'Scan QR'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMap = () => {
    const validStops = stops.filter(
      (stop) => stop.latitude && stop.longitude && 
      !isNaN(parseFloat(stop.latitude)) && 
      !isNaN(parseFloat(stop.longitude))
    );

    // Use Google Maps on Android, default on iOS
    const mapProvider = Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;

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
          onMapReady={fitToStops}
          loadingEnabled={true}
          loadingIndicatorColor="#16A34A"
          toolbarEnabled={false}
        >
          {/* Route polyline connecting all stops in order */}
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

            // Determine marker color
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
                onPress={() => setSelectedStop(stop)}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
              >
                {/* Custom marker view with stop number */}
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
            onPress={fitToStops}
          >
            <NavigationIcon size={20} color="#16A34A" />
          </TouchableOpacity>
        </View>

        {/* Selected stop info panel */}
        {selectedStop ? (
          <View className="bg-white p-4 border-t border-gray-200">
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1">
                <Text className="text-sm text-gray-500">Selected Stop</Text>
                <Text className="text-base font-semibold text-gray-900 mt-1">
                  Stop #{selectedStop.stop_order}
                </Text>
                <Text className="text-sm text-gray-600 mt-1">
                  {selectedStop.address}
                </Text>
                {selectedStop.notes ? (
                  <Text className="text-xs text-gray-500 mt-1 italic">
                    {selectedStop.notes}
                  </Text>
                ) : null}
              </View>
              <View
                className={`px-3 py-1 rounded-full ${
                  selectedStop.is_completed ? 'bg-green-100' : 'bg-yellow-100'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    selectedStop.is_completed ? 'text-green-800' : 'text-yellow-800'
                  }`}
                >
                  {selectedStop.is_completed ? 'Completed' : 'Pending'}
                </Text>
              </View>
            </View>
            <View className="flex-row gap-2 mt-3">
              <TouchableOpacity
                className="flex-1 border border-gray-200 rounded-lg py-2.5 flex-row items-center justify-center"
                onPress={() => setSelectedStop(null)}
              >
                <RefreshCwIcon size={16} color="#6B7280" />
                <Text className="ml-1 text-gray-600 font-medium">Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 rounded-lg py-2.5 flex-row items-center justify-center ${
                  selectedStop.is_completed ? 'bg-gray-200' : 'bg-green-600'
                }`}
                disabled={selectedStop.is_completed}
                onPress={() => handleOpenScanner(selectedStop)}
              >
                <CameraIcon
                  size={16}
                  color={selectedStop.is_completed ? '#6B7280' : '#ffffff'}
                />
                <Text
                  className={`ml-1 font-semibold ${
                    selectedStop.is_completed ? 'text-gray-600' : 'text-white'
                  }`}
                >
                  {selectedStop.is_completed ? 'Completed' : 'Scan QR'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="bg-white p-3 border-t border-gray-200">
            <Text className="text-xs text-gray-500 text-center">
              Tap on a marker to view stop details • {validStops.length} stops on map
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      );
    }

    if (error) {
      return (
        <View className="flex-1 items-center justify-center px-6">
          <AlertTriangleIcon size={40} color="#DC2626" />
          <Text className="text-red-600 font-semibold text-base mt-3">{error}</Text>
          <TouchableOpacity
            className="mt-4 px-6 py-3 bg-red-600 rounded-lg"
            onPress={fetchDetails}
          >
            <Text className="text-white font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView className="flex-1">
        <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <Text className="text-lg font-semibold text-gray-900">
            {assignmentData?.route?.name}
          </Text>
          <Text className="text-sm text-gray-500 mt-1">
            {assignmentData?.route?.barangay} • {assignmentData?.route?.total_stops} stops
          </Text>
          <View className="mt-4">
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500">Progress</Text>
              <Text className="text-sm font-semibold text-gray-900">
                {progress.completed}/{progress.total} ({progress.percentage}%)
              </Text>
            </View>
            <View className="w-full h-3 bg-gray-100 rounded-full mt-2 overflow-hidden">
              <View
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${progress.percentage}%` }}
              />
            </View>
          </View>
        </View>

        {renderToggle()}

        {activeView === VIEW_MODES.LIST ? (
          <View className="mt-4">{stops.map(renderStopCard)}</View>
        ) : (
          renderMap()
        )}

        <View className="h-6" />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3"
          onPress={() => router.back()}
        >
          <ArrowLeftIcon size={20} color="#111827" />
        </TouchableOpacity>
        <View>
          <Text className="text-xs text-gray-500 uppercase">Route Details</Text>
          <Text className="text-base font-semibold text-gray-900">
            Assignment #{assignmentId}
          </Text>
        </View>
      </View>

      {renderContent()}

      <Modal visible={scannerVisible} animationType="slide" onRequestClose={closeScanner}>
        <SafeAreaView className="flex-1 bg-black">
          <View className="flex-row items-center justify-between px-4 py-3">
            <Text className="text-white font-semibold text-lg">Scan QR Code</Text>
            <Pressable onPress={closeScanner}>
              <Text className="text-gray-200 text-sm">Close</Text>
            </Pressable>
          </View>

          <View className="flex-1 items-center justify-center">
            {!cameraPermission?.granted ? (
              <Text className="text-white px-6 text-center">
                Camera permission is required to scan QR codes.
              </Text>
            ) : (
              <CameraView
                style={{ width: width - 40, height: width - 40 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={scanProcessing ? undefined : handleBarcodeScanned}
              />
            )}

            <View className="mt-6 px-4 w-full">
              {scanProcessing ? (
                <View className="flex-row items-center justify-center gap-2">
                  <ActivityIndicator color="#ffffff" />
                  <Text className="text-white text-sm">Processing scan...</Text>
                </View>
              ) : null}
              {scanSuccess ? (
                <Text className="text-green-400 text-center mt-3">{scanSuccess}</Text>
              ) : null}
              {scanError ? (
                <Text className="text-red-400 text-center mt-3">{scanError}</Text>
              ) : null}
              {selectedStop ? (
                <Text className="text-gray-200 text-center mt-4 text-sm">
                  Stop #{selectedStop.stop_order} • {selectedStop.address}
                </Text>
              ) : null}
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default RouteDetailScreen;

