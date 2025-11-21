import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Modal, Pressable, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import collectorRoutesService from '@/services/collectorRoutesService';
import { ArrowLeftIcon, CameraIcon, MapIcon, MapPinnedIcon, RefreshCwIcon, ListIcon, AlertTriangleIcon, CheckCircleIcon } from 'lucide-react-native';

// Don't import map component at module level - only import when needed
// This prevents any map-related code from being evaluated until map view is active

const { width, height } = Dimensions.get('window');

const calculateRegionFromStops = (stops) => {
  if (!stops?.length) {
    return {
      latitude: 14.5995,
      longitude: 120.9842,
      latitudeDelta: 0.2,
      longitudeDelta: 0.2,
    };
  }

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

  const latitudes = validStops.map((stop) => parseFloat(stop.latitude));
  const longitudes = validStops.map((stop) => parseFloat(stop.longitude));

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  const latDelta = (maxLat - minLat) * 1.5;
  const lngDelta = (maxLng - minLng) * 1.5;

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(latDelta, 0.01),
    longitudeDelta: Math.max(lngDelta, 0.01),
  };
};

const VIEW_MODES = {
  LIST: 'list',
  MAP: 'map',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  flex1: {
    flex: 1,
  },
  flexRow: {
    flexDirection: 'row',
  },
  itemsCenter: {
    alignItems: 'center',
  },
  justifyCenter: {
    justifyContent: 'center',
  },
  justifyBetween: {
    justifyContent: 'space-between',
  },
  px6: {
    paddingHorizontal: 24,
  },
  px4: {
    paddingHorizontal: 16,
  },
  px3: {
    paddingHorizontal: 12,
  },
  px2: {
    paddingHorizontal: 8,
  },
  py3: {
    paddingVertical: 12,
  },
  py2: {
    paddingVertical: 8,
  },
  py1: {
    paddingVertical: 4,
  },
  p4: {
    padding: 16,
  },
  p6: {
    padding: 24,
  },
  mt4: {
    marginTop: 16,
  },
  mt3: {
    marginTop: 12,
  },
  mt2: {
    marginTop: 8,
  },
  mt1: {
    marginTop: 4,
  },
  mb3: {
    marginBottom: 12,
  },
  mb2: {
    marginBottom: 8,
  },
  mb4: {
    marginBottom: 16,
  },
  ml1: {
    marginLeft: 4,
  },
  ml2: {
    marginLeft: 8,
  },
  ml3: {
    marginLeft: 12,
  },
  mr3: {
    marginRight: 12,
  },
  pr2: {
    paddingRight: 8,
  },
  pr3: {
    paddingRight: 12,
  },
  pr4: {
    paddingRight: 16,
  },
  bgGray50: {
    backgroundColor: '#F9FAFB',
  },
  bgWhite: {
    backgroundColor: '#FFFFFF',
  },
  bgGray100: {
    backgroundColor: '#F3F4F6',
  },
  bgGray200: {
    backgroundColor: '#E5E7EB',
  },
  bgGreen50: {
    backgroundColor: '#F0FDF4',
  },
  bgGreen100: {
    backgroundColor: '#DCFCE7',
  },
  bgGreen500: {
    backgroundColor: '#22C55E',
  },
  bgGreen600: {
    backgroundColor: '#16A34A',
  },
  bgYellow100: {
    backgroundColor: '#FEF3C7',
  },
  bgRed600: {
    backgroundColor: '#DC2626',
  },
  bgEmerald600: {
    backgroundColor: '#059669',
  },
  bgBlack: {
    backgroundColor: '#000000',
  },
  textRed600: {
    color: '#DC2626',
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textGray500: {
    color: '#6B7280',
  },
  textGray600: {
    color: '#4B5563',
  },
  textGray700: {
    color: '#374151',
  },
  textGray800: {
    color: '#1F2937',
  },
  textGray900: {
    color: '#111827',
  },
  textGreen600: {
    color: '#16A34A',
  },
  textGreen700: {
    color: '#15803D',
  },
  textGreen800: {
    color: '#166534',
  },
  textYellow800: {
    color: '#854D0E',
  },
  textAmber600: {
    color: '#D97706',
  },
  textEmerald700: {
    color: '#047857',
  },
  textBase: {
    fontSize: 16,
  },
  textSm: {
    fontSize: 14,
  },
  textXs: {
    fontSize: 12,
  },
  textLg: {
    fontSize: 18,
  },
  fontSemibold: {
    fontWeight: '600',
  },
  fontMedium: {
    fontWeight: '500',
  },
  roundedLg: {
    borderRadius: 8,
  },
  roundedXl: {
    borderRadius: 12,
  },
  rounded2xl: {
    borderRadius: 16,
  },
  roundedFull: {
    borderRadius: 9999,
  },
  border: {
    borderWidth: 1,
  },
  borderGray100: {
    borderColor: '#F3F4F6',
  },
  borderGray200: {
    borderColor: '#E5E7EB',
  },
  borderRed200: {
    borderColor: '#FECACA',
  },
  borderT: {
    borderTopWidth: 1,
  },
  borderB: {
    borderBottomWidth: 1,
  },
  shadowSm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  w10: {
    width: 40,
  },
  h10: {
    height: 40,
  },
  h3: {
    height: 12,
  },
  h6: {
    height: 24,
  },
  wFull: {
    width: '100%',
  },
  hFull: {
    height: '100%',
  },
  overflowHidden: {
    overflow: 'hidden',
  },
  uppercase: {
    textTransform: 'uppercase',
  },
  italic: {
    fontStyle: 'italic',
  },
  gap2: {
    gap: 8,
  },
  gap4: {
    gap: 16,
  },
  textCenter: {
    textAlign: 'center',
  },
  itemsStart: {
    alignItems: 'flex-start',
  },
});

const RouteDetailScreen = () => {
  const router = useRouter();
  const { assignmentId } = useLocalSearchParams();
  
  // Early return if no assignmentId to prevent any map-related code from running
  if (!assignmentId) {
    return (
      <SafeAreaView style={[styles.flex1, styles.bgGray50]}>
        <View style={[styles.flex1, styles.itemsCenter, styles.justifyCenter, styles.px6]}>
          <AlertTriangleIcon size={40} color="#DC2626" />
          <Text style={[styles.textRed600, styles.fontSemibold, styles.textBase, styles.mt3]}>
            No assignment ID provided
          </Text>
          <TouchableOpacity
            style={[styles.mt4, styles.px6, styles.py3, styles.bgRed600, styles.roundedLg]}
            onPress={() => router.back()}
          >
            <Text style={[styles.textWhite, styles.fontSemibold]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
  const [activeView, setActiveView] = useState(VIEW_MODES.LIST);
  const [RouteMapViewComponent, setRouteMapViewComponent] = useState(null);
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [detailStop, setDetailStop] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [stopActionLoading, setStopActionLoading] = useState(null);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsNavigationReady(true);
    }, 120);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const needsMap = activeView === VIEW_MODES.MAP || detailModalVisible;
    if (needsMap && !RouteMapViewComponent && isNavigationReady) {
      if (assignmentId) {
        import('@/components/RouteMapView')
          .then((module) => setRouteMapViewComponent(() => module.default))
          .catch((err) => console.error('Failed to load RouteMapView:', err));
      }
    }
  }, [activeView, detailModalVisible, RouteMapViewComponent, assignmentId, isNavigationReady]);

  useEffect(() => {
    if (activeView !== VIEW_MODES.MAP) return;
    if (selectedStop) return;
    const stopWithCoords = stops.find(
      (stop) =>
        stop.latitude &&
        stop.longitude &&
        !isNaN(parseFloat(stop.latitude)) &&
        !isNaN(parseFloat(stop.longitude))
    );
    if (stopWithCoords) {
      setSelectedStop(stopWithCoords);
    } else if (stops.length > 0) {
      setSelectedStop(stops[0]);
    }
  }, [activeView, stops, selectedStop]);

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

  const handleMarkAsCollected = async (stop) => {
    if (stop.is_completed) return;
    if (!stop.bin_id) {
      Alert.alert(
        'Missing bin information',
        'This stop is not linked to a specific bin yet.'
      );
      return;
    }

    setStopActionLoading(stop.id);
    try {
      await collectorRoutesService.manualCollectStop({
        assignmentId,
        stopId: stop.id,
        latitude: parseFloat(stop.latitude) || undefined,
        longitude: parseFloat(stop.longitude) || undefined,
        wasteType: 'mixed',
      });
      updateStopCompletion(stop.id);
      if (detailStop?.id === stop.id) {
        setDetailStop((prev) =>
          prev ? { ...prev, is_completed: true, last_collected_at: new Date().toISOString() } : prev
        );
      }
    } catch (err) {
      console.error('Manual mark collected failed', err);
      const message =
        err?.response?.data?.message ??
        err?.message ??
        'Unable to mark stop as collected.';
      Alert.alert('Mark as Collected', message);
    } finally {
      setStopActionLoading(null);
    }
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

  const openStopDetail = (stop) => {
    setDetailStop(stop);
    setDetailModalVisible(true);
  };

  const closeStopDetail = () => {
    setDetailModalVisible(false);
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

  const mapRegion = useMemo(() => calculateRegionFromStops(stops), [stops]);

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

  const fitToStops = useCallback(() => {
    // handled within RouteMapView via ref
  }, []);

  const detailRegion = useMemo(() => {
    if (!detailStop) return null;
    return calculateRegionFromStops([detailStop]);
  }, [detailStop]);

  const detailCoordinates = useMemo(() => {
    if (!detailStop) return [];
    if (detailStop.latitude && detailStop.longitude && 
      !isNaN(parseFloat(detailStop.latitude)) && 
      !isNaN(parseFloat(detailStop.longitude))) {
      return [{
        latitude: parseFloat(detailStop.latitude),
        longitude: parseFloat(detailStop.longitude),
      }];
    }
    return [];
  }, [detailStop]);

  const renderToggle = () => (
    <View style={[styles.flexRow, styles.bgGray100, styles.roundedFull, { padding: 4 }, styles.mt4]}>
      {[VIEW_MODES.LIST, VIEW_MODES.MAP].map((mode) => (
        <TouchableOpacity
          key={mode}
          style={[
            styles.flex1,
            styles.py2,
            styles.roundedFull,
            styles.flexRow,
            styles.justifyCenter,
            styles.itemsCenter,
            activeView === mode && [styles.bgWhite, styles.shadow]
          ]}
          onPress={() => setActiveView(mode)}
        >
          {mode === VIEW_MODES.LIST ? (
            <ListIcon size={16} color={activeView === mode ? '#16A34A' : '#6B7280'} />
          ) : (
            <MapIcon size={16} color={activeView === mode ? '#16A34A' : '#6B7280'} />
          )}
          <Text
            style={[
              styles.ml1,
              styles.textSm,
              styles.fontMedium,
              activeView === mode ? styles.textGreen600 : styles.textGray500
            ]}
          >
            {mode === VIEW_MODES.LIST ? 'List' : 'Map'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMap = () => {
    if (!RouteMapViewComponent) {
      const mapHeight = Math.min(height * 0.55, 500);
      return (
        <View style={[styles.mt4, styles.rounded2xl, styles.overflowHidden, styles.border, styles.borderGray200, styles.bgGray100, { height: mapHeight }]}>
          <View style={[styles.flex1, styles.itemsCenter, styles.justifyCenter, styles.p6]}>
            <ActivityIndicator size="large" color="#16A34A" />
            <Text style={[styles.textGray500, styles.textCenter, styles.mt4]}>
              Loading map...
            </Text>
          </View>
        </View>
      );
    }

    const RouteMapView = RouteMapViewComponent;

    return (
      <>
        <RouteMapView
          stops={stops}
          selectedStop={selectedStop}
          onStopSelect={setSelectedStop}
          mapRegion={mapRegion}
          routeCoordinates={routeCoordinates}
          onFitToStops={fitToStops}
        />

        {selectedStop ? (
          <View style={[styles.bgWhite, styles.p4, styles.borderT, styles.borderGray200, styles.mt4, styles.roundedLg]}>
            <View style={[styles.flexRow, styles.itemsStart, styles.justifyBetween, styles.mb2]}>
              <View style={styles.flex1}>
                <Text style={[styles.textSm, styles.textGray500]}>Selected Stop</Text>
                <Text style={[styles.textBase, styles.fontSemibold, styles.textGray900, styles.mt1]}>
                  Stop #{selectedStop.stop_order}
                </Text>
                <Text style={[styles.textSm, styles.textGray600, styles.mt1]}>
                  {selectedStop.address}
                </Text>
                {selectedStop.notes ? (
                  <Text style={[styles.textXs, styles.textGray500, styles.mt1, styles.italic]}>
                    {selectedStop.notes}
                  </Text>
                ) : null}
              </View>
              <View
                style={[
                  styles.px3,
                  styles.py1,
                  styles.roundedFull,
                  selectedStop.is_completed ? styles.bgGreen100 : styles.bgYellow100
                ]}
              >
                <Text
                  style={[
                    styles.textXs,
                    styles.fontSemibold,
                    selectedStop.is_completed ? { color: '#166534' } : { color: '#854D0E' }
                  ]}
                >
                  {selectedStop.is_completed ? 'Completed' : 'Pending'}
                </Text>
              </View>
            </View>
            <View style={[styles.flexRow, styles.gap2, styles.mt3]}>
              <TouchableOpacity
                style={[styles.flex1, styles.border, styles.borderGray200, styles.roundedLg, { paddingVertical: 10 }, styles.flexRow, styles.itemsCenter, styles.justifyCenter]}
                onPress={() => setSelectedStop(null)}
              >
                <RefreshCwIcon size={16} color="#6B7280" />
                <Text style={[styles.ml1, styles.textGray600, styles.fontMedium]}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.flex1,
                  styles.roundedLg,
                  { paddingVertical: 10 },
                  styles.flexRow,
                  styles.itemsCenter,
                  styles.justifyCenter,
                  selectedStop.is_completed ? styles.bgGray200 : styles.bgGreen600
                ]}
                disabled={selectedStop.is_completed}
                onPress={() => handleOpenScanner(selectedStop)}
              >
                <CameraIcon
                  size={16}
                  color={selectedStop.is_completed ? '#6B7280' : '#ffffff'}
                />
                <Text
                  style={[
                    styles.ml1,
                    styles.fontSemibold,
                    selectedStop.is_completed ? styles.textGray600 : styles.textWhite
                  ]}
                >
                  {selectedStop.is_completed ? 'Completed' : 'Scan QR'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </>
    );
  };

  const renderStopCard = (stop) => {
    const canManualCollect = !!stop.bin_id && !stop.is_completed;
    const manualDisabled = !canManualCollect || stopActionLoading === stop.id;

    return (
      <View
        key={stop.id}
        style={[styles.bgWhite, styles.border, styles.borderGray200, styles.roundedXl, styles.p4, styles.mb3, styles.shadowSm]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => openStopDetail(stop)}
        >
          <View style={[styles.flexRow, styles.justifyBetween, styles.itemsStart]}>
            <View style={[styles.flex1, styles.pr2]}>
              <Text style={[styles.textSm, styles.textGray500]}>Stop #{stop.stop_order}</Text>
              <Text style={[styles.textBase, styles.fontSemibold, styles.textGray900, styles.mt1]}>{stop.address}</Text>
              {stop.bin_owner_name ? (
                <Text style={[styles.textXs, { color: '#047857' }, styles.mt1]}>
                  Owner: {stop.bin_owner_name}
                </Text>
              ) : null}
              {stop.notes ? (
                <Text style={[styles.textXs, styles.textGray500, styles.mt1]}>{stop.notes}</Text>
              ) : null}
            </View>
            <View
              style={[
                styles.px2,
                styles.py1,
                styles.roundedFull,
                stop.is_completed ? styles.bgGreen100 : styles.bgYellow100
              ]}
            >
              <Text
                style={[
                  styles.textXs,
                  styles.fontSemibold,
                  stop.is_completed ? { color: '#166534' } : { color: '#854D0E' }
                ]}
              >
                {stop.is_completed ? 'Collected' : 'Pending'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={[styles.flexRow, styles.mt4, styles.gap2]}>
          <TouchableOpacity
            style={[
              styles.flex1,
              styles.roundedLg,
              styles.py2,
              styles.flexRow,
              styles.itemsCenter,
              styles.justifyCenter,
              stop.is_completed ? styles.bgGray200 : styles.bgGreen600
            ]}
            disabled={stop.is_completed}
            onPress={() => handleOpenScanner(stop)}
          >
            <CameraIcon size={16} color={stop.is_completed ? '#6B7280' : '#ffffff'} />
            <Text
              style={[
                styles.ml1,
                styles.fontSemibold,
                stop.is_completed ? styles.textGray600 : styles.textWhite
              ]}
            >
              {stop.is_completed ? 'Collected' : 'Scan QR'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.flex1,
              styles.roundedLg,
              styles.py2,
              styles.flexRow,
              styles.itemsCenter,
              styles.justifyCenter,
              manualDisabled ? styles.bgGray200 : styles.bgEmerald600
            ]}
            disabled={manualDisabled}
            onPress={() => handleMarkAsCollected(stop)}
          >
            {stopActionLoading === stop.id ? (
              <ActivityIndicator size="small" color={manualDisabled ? '#6B7280' : '#ffffff'} />
            ) : (
              <CheckCircleIcon size={16} color={manualDisabled ? '#6B7280' : '#ffffff'} />
            )}
            <Text
              style={[
                styles.ml1,
                styles.fontSemibold,
                manualDisabled ? styles.textGray600 : styles.textWhite
              ]}
            >
              {stop.is_completed ? 'Collected' : 'Mark as Collected'}
            </Text>
          </TouchableOpacity>
        </View>
        {!stop.bin_id && !stop.is_completed ? (
          <Text style={[styles.textXs, styles.textAmber600, styles.mt2]}>
            Link this stop to a bin to enable manual collection.
          </Text>
        ) : null}
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={[styles.flex1, styles.itemsCenter, styles.justifyCenter]}>
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={[styles.flex1, styles.itemsCenter, styles.justifyCenter, styles.px6]}>
          <AlertTriangleIcon size={40} color="#DC2626" />
          <Text style={[styles.textRed600, styles.fontSemibold, styles.textBase, styles.mt3]}>{error}</Text>
          <TouchableOpacity
            style={[styles.mt4, styles.px6, styles.py3, styles.bgRed600, styles.roundedLg]}
            onPress={fetchDetails}
          >
            <Text style={[styles.textWhite, styles.fontSemibold]}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView style={styles.flex1}>
        <View style={[styles.bgWhite, styles.rounded2xl, styles.p4, styles.shadowSm, styles.border, { borderColor: '#F3F4F6' }]}>
          <Text style={[styles.textLg, styles.fontSemibold, styles.textGray900]}>
            {assignmentData?.route?.name}
          </Text>
          <Text style={[styles.textSm, styles.textGray500, styles.mt1]}>
            {assignmentData?.route?.barangay} • {assignmentData?.route?.total_stops} stops
          </Text>
          <View style={styles.mt4}>
            <View style={[styles.flexRow, styles.justifyBetween]}>
              <Text style={[styles.textSm, styles.textGray500]}>Progress</Text>
              <Text style={[styles.textSm, styles.fontSemibold, styles.textGray900]}>
                {progress.completed}/{progress.total} ({progress.percentage}%)
              </Text>
            </View>
            <View style={[styles.wFull, styles.h3, styles.bgGray100, styles.roundedFull, styles.mt2, styles.overflowHidden]}>
              <View
                style={[styles.hFull, styles.bgGreen500, styles.roundedFull, { width: `${progress.percentage}%` }]}
              />
            </View>
          </View>
        </View>

        {renderToggle()}

        {activeView === VIEW_MODES.LIST ? (
          <View style={styles.mt4}>{stops.map(renderStopCard)}</View>
        ) : (
          renderMap()
        )}

        <View style={styles.h6} />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.flex1, styles.bgGray50]}>
      <View style={[styles.flexRow, styles.itemsCenter, styles.px4, { paddingVertical: 12 }, styles.bgWhite, styles.borderB, { borderColor: '#F3F4F6' }]}>
        <TouchableOpacity
          style={[styles.w10, styles.h10, styles.roundedFull, styles.bgGray100, styles.itemsCenter, styles.justifyCenter, styles.mr3]}
          onPress={() => router.back()}
        >
          <ArrowLeftIcon size={20} color="#111827" />
        </TouchableOpacity>
        <View>
          <Text style={[styles.textXs, styles.textGray500, styles.uppercase]}>Route Details</Text>
          <Text style={[styles.textBase, styles.fontSemibold, styles.textGray900]}>
            Assignment #{assignmentId}
          </Text>
        </View>
      </View>

      {renderContent()}

      <Modal visible={detailModalVisible} animationType="slide" onRequestClose={closeStopDetail}>
        <SafeAreaView style={[styles.flex1, styles.bgGray50]}>
          <View style={[styles.flexRow, styles.itemsCenter, styles.justifyBetween, styles.px4, { paddingVertical: 12 }, styles.bgWhite, styles.borderB, styles.borderGray200]}>
            <View style={[styles.flex1, styles.pr4]}>
              <Text style={[styles.textXs, styles.textGray500, styles.uppercase]}>Stop Details</Text>
              <Text style={[styles.textBase, styles.fontSemibold, styles.textGray900]} numberOfLines={1}>
                {detailStop ? `Stop #${detailStop.stop_order}` : ''}
              </Text>
            </View>
            <Pressable onPress={closeStopDetail}>
              <Text style={[styles.textGreen600, styles.fontSemibold]}>Close</Text>
            </Pressable>
          </View>

          {detailStop ? (
            <ScrollView style={[styles.flex1, styles.px4, { paddingVertical: 16 }]}>
              <View style={[styles.bgWhite, styles.roundedXl, styles.p4, styles.border, { borderColor: '#F3F4F6' }, styles.mb4]}>
                <Text style={[styles.textSm, styles.textGray500]}>Address</Text>
                <Text style={[styles.textBase, styles.fontSemibold, styles.textGray900, styles.mt1]}>
                  {detailStop.address ?? 'No address provided'}
                </Text>

                <Text style={[styles.textSm, styles.textGray500, styles.mt4]}>Bin Owner</Text>
                <Text style={[styles.textBase, styles.fontSemibold, styles.textGray900, styles.mt1]}>
                  {detailStop.bin_owner_name ??
                    detailStop.resident_name ??
                    detailStop.resident_full_name ??
                    'Not specified'}
                </Text>
                {detailStop.bin_owner_contact ? (
                  <Text style={[styles.textSm, styles.textGray600, styles.mt1]}>
                    Contact: {detailStop.bin_owner_contact}
                  </Text>
                ) : null}
                {detailStop.bin_owner_address ? (
                  <Text style={[styles.textSm, styles.textGray600, styles.mt1]}>
                    {detailStop.bin_owner_address}
                  </Text>
                ) : null}

                {detailStop.notes ? (
                  <>
                    <Text style={[styles.textSm, styles.textGray500, styles.mt4]}>Notes</Text>
                    <Text style={[styles.textSm, { color: '#1F2937' }, styles.mt1]}>
                      {detailStop.notes}
                    </Text>
                  </>
                ) : null}

                <View style={[styles.mt4, styles.borderT, { borderColor: '#F3F4F6', paddingTop: 12 }]}>
                  <Text style={[styles.textSm, styles.textGray500]}>Bin Information</Text>
                  <Text style={[styles.textSm, styles.textGray900, styles.mt1]}>
                    Type: {detailStop.bin_type ?? 'Not specified'}
                  </Text>
                  {detailStop.last_collected_at ? (
                    <Text style={[styles.textXs, styles.textGray500, styles.mt1]}>
                      Last collected: {detailStop.last_collected_at}
                    </Text>
                  ) : null}
                  <Text style={[styles.textXs, styles.fontSemibold, styles.mt2, detailStop.is_completed ? styles.textGreen600 : styles.textAmber600]}>
                    Status: {detailStop.is_completed ? 'Collected' : 'Pending'}
                  </Text>
                </View>
              </View>

              {RouteMapViewComponent ? (
                (() => {
                  const DetailMap = RouteMapViewComponent;
                  return (
                    <DetailMap
                      stops={[detailStop]}
                      selectedStop={detailStop}
                      onStopSelect={() => {}}
                      mapRegion={detailRegion ?? mapRegion}
                      routeCoordinates={detailCoordinates}
                      onFitToStops={() => {}}
                    />
                  );
                })()
              ) : (
                <View style={[styles.mt2, styles.rounded2xl, styles.overflowHidden, styles.border, styles.borderGray200, styles.bgGray100, { height: Math.min(height * 0.55, 500) }]}>
                  <View style={[styles.flex1, styles.itemsCenter, styles.justifyCenter, styles.p6]}>
                    <ActivityIndicator size="large" color="#16A34A" />
                    <Text style={[styles.textGray500, styles.textCenter, styles.mt4]}>
                      Loading map...
                    </Text>
                  </View>
                </View>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </Modal>

      <Modal visible={scannerVisible} animationType="slide" onRequestClose={closeScanner}>
        <SafeAreaView style={[styles.flex1, styles.bgBlack]}>
          <View style={[styles.flexRow, styles.itemsCenter, styles.justifyBetween, styles.px4, { paddingVertical: 12 }]}>
            <Text style={[styles.textWhite, styles.fontSemibold, { fontSize: 18 }]}>Scan QR Code</Text>
            <Pressable onPress={closeScanner}>
              <Text style={[{ color: '#E5E7EB' }, styles.textSm]}>Close</Text>
            </Pressable>
          </View>

          <View style={[styles.flex1, styles.itemsCenter, styles.justifyCenter]}>
            {!cameraPermission?.granted ? (
              <Text style={[styles.textWhite, styles.px6, styles.textCenter]}>
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

            <View style={[{ marginTop: 24 }, styles.px4, styles.wFull]}>
              {scanProcessing ? (
                <View style={[styles.flexRow, styles.itemsCenter, styles.justifyCenter, styles.gap2]}>
                  <ActivityIndicator color="#ffffff" />
                  <Text style={[styles.textWhite, styles.textSm]}>Processing scan...</Text>
                </View>
              ) : null}
              {scanSuccess ? (
                <Text style={[{ color: '#4ADE80' }, styles.textCenter, styles.mt3]}>{scanSuccess}</Text>
              ) : null}
              {scanError ? (
                <Text style={[{ color: '#F87171' }, styles.textCenter, styles.mt3]}>{scanError}</Text>
              ) : null}
              {selectedStop ? (
                <Text style={[{ color: '#E5E7EB' }, styles.textCenter, styles.mt4, styles.textSm]}>
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

