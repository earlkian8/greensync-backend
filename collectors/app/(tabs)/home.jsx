import React, { useEffect, useState, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, StyleSheet, Modal, Pressable, Dimensions, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../_layout';
import collectorRoutesService from '@/services/collectorRoutesService';

const { width } = Dimensions.get('window');

export default function Home() {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [todayAssignments, setTodayAssignments] = useState([]);
  const [collectionStats, setCollectionStats] = useState({
    today: 0,
    weekly: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scanProcessing, setScanProcessing] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [scanSuccess, setScanSuccess] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHomeData = async () => {
    try {
      setError(null);
      if (!refreshing) {
        setLoading(true);
      }
      
      // Fetch dashboard data (includes assignments and stats)
      const dashboardData = await collectorRoutesService.getDashboardData();
      
      // Extract today's assignments
      if (dashboardData?.today_assignments) {
        const assignments = Array.isArray(dashboardData.today_assignments)
          ? dashboardData.today_assignments.map(assignment => ({
              id: assignment.id,
              route_id: assignment.route?.id,
              assignment_date: assignment.assignment_date,
              status: assignment.status,
              route: {
                id: assignment.route?.id,
                route_name: assignment.route?.name || assignment.route?.route_name,
                barangay: assignment.route?.barangay,
                total_stops: assignment.route?.total_stops,
                estimated_duration: assignment.route?.estimated_duration,
              },
            }))
          : [];
        setTodayAssignments(assignments);
      } else {
        setTodayAssignments([]);
      }
      
      // Extract collection stats
      if (dashboardData?.collection_stats) {
        setCollectionStats({
          today: dashboardData.collection_stats.today || 0,
          weekly: dashboardData.collection_stats.weekly || 0,
        });
      } else {
        setCollectionStats({
          today: 0,
          weekly: 0,
        });
      }
    } catch (err) {
      console.error('Error fetching home data:', err);
      const errorMessage = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to load home data';
      setError(errorMessage);
      setTodayAssignments([]);
      setCollectionStats({ today: 0, weekly: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  const startCollection = (routeId) => {
    router.push(`/collection/active/${routeId}`);
  };

  const openQRScanner = async () => {
    setScanError(null);
    setScanSuccess(null);
    if (!cameraPermission?.granted) {
      const permissionResult = await requestCameraPermission();
      if (!permissionResult?.granted) {
        Alert.alert('Camera Permission', 'Camera permission is required to scan QR codes.');
        return;
      }
    }
    setScannerVisible(true);
  };

  const handleBarcodeScanned = async ({ data: qrCode }) => {
    if (scanProcessing) return;
    setScanProcessing(true);
    setScanError(null);

    try {
      // Try to find an active assignment for today
      const assignments = await collectorRoutesService.getTodayAssignments();
      let assignmentsData = assignments;
      if (assignments && !Array.isArray(assignments) && assignments.data) {
        assignmentsData = assignments.data;
      }

      if (!Array.isArray(assignmentsData) || assignmentsData.length === 0) {
        throw new Error('No active assignments found. Please start a route first.');
      }

      // Use the first assignment
      const assignment = assignmentsData[0];
      const assignmentId = assignment.id;

      // Scan the QR code
      const scanResult = await collectorRoutesService.scanBinQr({
        assignmentId,
        qrCode,
      });

      const binId = scanResult?.bin?.id;
      if (!binId) {
        throw new Error('Bin not found for scanned code.');
      }

      // Record collection
      await collectorRoutesService.recordCollection({
        assignmentId,
        binId,
        qrCode,
        latitude: 0,
        longitude: 0,
        wasteType: 'mixed',
      });

      setScanSuccess('Collection recorded successfully!');
      setTimeout(() => {
        setScannerVisible(false);
        setScanSuccess(null);
        fetchHomeData(); // Refresh data
      }, 1500);
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
    setScanProcessing(false);
    setScanError(null);
    setScanSuccess(null);
  };

  const formatDate = () => {
    const date = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >

      {/* Date Banner */}
      <View style={[styles.bgWhite, styles.p4, styles.borderB, styles.borderGray200]}>
        <View style={[styles.flexRow, styles.itemsCenter]}>
          <Ionicons name="calendar-outline" size={20} color="#16A34A" />
          <View style={styles.ml2}>
            <Text style={[styles.textSm, styles.textGray600]}>Today's Date</Text>
            <Text style={[styles.fontMedium, styles.textGray900]}>{formatDate()}</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={[styles.flexRow, styles.p4, styles.gap4]}>
        <TouchableOpacity 
          style={[styles.flex1, styles.h20, styles.bgGreen600, styles.roundedLg, styles.itemsCenter, styles.justifyCenter]}
          onPress={() => router.push('/(tabs)/routesPage')}
          activeOpacity={0.8}
        >
          <Ionicons name="map-outline" size={24} color="#ffffff" />
          <Text style={[styles.textLg, styles.fontSemibold, styles.textWhite, styles.mt1]}>My Routes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.flex1, styles.h20, styles.bgGray200, styles.roundedLg, styles.itemsCenter, styles.justifyCenter]}
          onPress={openQRScanner}
          activeOpacity={0.8}
        >
          <Ionicons name="qr-code-outline" size={24} color="#374151" />
          <Text style={[styles.textLg, styles.fontSemibold, styles.textGray700, styles.mt1]}>Scan QR</Text>
        </TouchableOpacity>
      </View>

      {/* Today's Schedule */}
      <View style={[styles.px4, styles.pb4]}>
        <View style={[styles.bgWhite, styles.roundedLg, styles.p4, styles.border, styles.borderGray200]}>
          <View style={[styles.flexRow, styles.itemsCenter, styles.mb4]}>
            <Ionicons name="time-outline" size={20} color="#16A34A" />
            <Text style={[styles.textLg, styles.fontSemibold, styles.textGray800, styles.ml2]}>
              Today's Schedule
            </Text>
          </View>

          {loading ? (
            <View style={[styles.itemsCenter, styles.justifyCenter, styles.py12]}>
              <ActivityIndicator size="large" color="#16A34A" />
            </View>
          ) : error ? (
            <View style={[styles.itemsCenter, styles.py8]}>
              <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
              <Text style={[styles.textRed600, styles.mt3, styles.textBase]}>{error}</Text>
              <TouchableOpacity 
                style={[styles.mt4, styles.px6, styles.py2, styles.bgRed600, styles.roundedLg]}
                onPress={() => {
                  setLoading(true);
                  fetchHomeData();
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.textWhite, styles.fontMedium]}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : todayAssignments.length === 0 ? (
            <View style={[styles.itemsCenter, styles.py8]}>
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
              <Text style={[styles.textGray500, styles.mt3, styles.textBase]}>No routes scheduled for today</Text>
              <TouchableOpacity 
                style={[styles.mt4, styles.px6, styles.py2, styles.border, styles.borderGray300, styles.roundedLg]}
                onPress={() => router.push('/(tabs)/routesPage')}
                activeOpacity={0.8}
              >
                <Text style={[styles.textGray700, styles.fontMedium]}>View All Routes</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {todayAssignments.map((assignment, index) => (
                <View 
                  key={assignment.id} 
                  style={[styles.border, styles.borderGray200, styles.roundedLg, styles.p4, index > 0 && styles.mt3]}
                >
                  <View style={[styles.flexRow, styles.justifyBetween, styles.itemsStart, styles.mb3]}>
                    <View style={[styles.flex1, { paddingRight: 8 }]}>
                      <Text style={[styles.fontSemibold, styles.textGray900, styles.textBase]}>
                        {assignment.route?.route_name || assignment.route?.name}
                      </Text>
                      <Text style={[styles.textSm, styles.textGray600, styles.mt1]}>
                        {assignment.route?.barangay} • {assignment.route?.total_stops} stops
                      </Text>
                      {assignment.route?.estimated_duration && (
                        <View style={[styles.flexRow, styles.itemsCenter, styles.mt2]}>
                          <Ionicons name="time-outline" size={14} color="#6B7280" />
                          <Text style={[styles.textSm, styles.textGray500, styles.ml1]}>
                            Est. {assignment.route.estimated_duration} mins
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={[styles.bgYellow100, styles.px3, styles.py1, styles.roundedFull]}>
                      <Text style={[styles.textXs, styles.fontSemibold, styles.textYellow800, styles.uppercase]}>
                        {assignment.status}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.flexRow, styles.gap2]}>
                    <TouchableOpacity 
                      style={[styles.flex1, styles.bgGreen600, styles.roundedLg, { paddingVertical: 12 }, styles.flexRow, styles.itemsCenter, styles.justifyCenter]}
                      onPress={() => startCollection(assignment.route_id || assignment.route?.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="play-circle-outline" size={18} color="#ffffff" />
                      <Text style={[styles.textWhite, styles.fontSemibold, styles.ml2]}>Start Collection</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[{ paddingHorizontal: 16 }, styles.border, styles.borderGray300, styles.roundedLg, { paddingVertical: 12 }, styles.itemsCenter, styles.justifyCenter]}
                      onPress={() =>
                        router.push({
                          pathname: '/route-detail',
                          params: {
                            assignmentId: assignment.id,
                            routeId: assignment.route_id || assignment.route?.id,
                          },
                        })
                      }
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.textGray700, styles.fontMedium]}>View</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Collection Stats */}
        <View style={[styles.bgWhite, styles.roundedLg, styles.p4, styles.mt4, styles.border, styles.borderGray200]}>
          <View style={[styles.flexRow, styles.itemsCenter, styles.mb4]}>
            <Ionicons name="stats-chart-outline" size={20} color="#16A34A" />
            <Text style={[styles.textLg, styles.fontSemibold, styles.textGray800, styles.ml2]}>
              Collection Stats
            </Text>
          </View>
          
          <View style={[styles.flexRow, styles.gap3]}>
            <View style={[styles.flex1, styles.bgGreen50, styles.roundedLg, styles.p4, styles.itemsCenter, styles.border, { borderColor: '#DCFCE7' }]}>
              <Text style={[styles.textSm, styles.textGray600, { marginBottom: 4 }]}>Today's Collections</Text>
              <Text style={[styles.text3xl, styles.fontBold, styles.textGreen600]}>{collectionStats.today}</Text>
            </View>
            
            <View style={[styles.flex1, styles.bgBlue50, styles.roundedLg, styles.p4, styles.itemsCenter, styles.border, { borderColor: '#DBEAFE' }]}>
              <Text style={[styles.textSm, styles.textGray600, { marginBottom: 4 }]}>Weekly Total</Text>
              <Text style={[styles.text3xl, styles.fontBold, styles.textBlue600]}>{collectionStats.weekly}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* QR Scanner Modal */}
      <Modal visible={scannerVisible} animationType="slide" onRequestClose={closeScanner}>
        <SafeAreaView style={[styles.flex1, { backgroundColor: '#000000' }]}>
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
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

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
  px4: {
    paddingHorizontal: 16,
  },
  px6: {
    paddingHorizontal: 24,
  },
  py2: {
    paddingVertical: 8,
  },
  py3: {
    paddingVertical: 12,
  },
  py8: {
    paddingVertical: 32,
  },
  py12: {
    paddingVertical: 48,
  },
  p4: {
    padding: 16,
  },
  pb4: {
    paddingBottom: 16,
  },
  mt1: {
    marginTop: 4,
  },
  mt2: {
    marginTop: 8,
  },
  mt3: {
    marginTop: 12,
  },
  mt4: {
    marginTop: 16,
  },
  ml1: {
    marginLeft: 4,
  },
  ml2: {
    marginLeft: 8,
  },
  mr2: {
    marginRight: 8,
  },
  mb4: {
    marginBottom: 16,
  },
  gap3: {
    gap: 12,
  },
  gap4: {
    gap: 16,
  },
  bgWhite: {
    backgroundColor: '#FFFFFF',
  },
  bgGray50: {
    backgroundColor: '#F9FAFB',
  },
  bgGray100: {
    backgroundColor: '#F3F4F6',
  },
  bgGray200: {
    backgroundColor: '#E5E7EB',
  },
  bgGray300: {
    backgroundColor: '#D1D5DB',
  },
  bgGreen50: {
    backgroundColor: '#F0FDF4',
  },
  bgGreen100: {
    backgroundColor: '#DCFCE7',
  },
  bgGreen600: {
    backgroundColor: '#16A34A',
  },
  bgGreen700: {
    backgroundColor: '#15803D',
  },
  bgBlue50: {
    backgroundColor: '#EFF6FF',
  },
  bgBlue100: {
    backgroundColor: '#DBEAFE',
  },
  bgRed600: {
    backgroundColor: '#DC2626',
  },
  bgRed700: {
    backgroundColor: '#B91C1C',
  },
  bgYellow100: {
    backgroundColor: '#FEF3C7',
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
  textBlue600: {
    color: '#2563EB',
  },
  textRed600: {
    color: '#DC2626',
  },
  textYellow800: {
    color: '#854D0E',
  },
  textSm: {
    fontSize: 14,
  },
  textBase: {
    fontSize: 16,
  },
  textLg: {
    fontSize: 18,
  },
  text3xl: {
    fontSize: 30,
  },
  fontMedium: {
    fontWeight: '500',
  },
  fontSemibold: {
    fontWeight: '600',
  },
  fontBold: {
    fontWeight: '700',
  },
  roundedLg: {
    borderRadius: 8,
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
  borderGray300: {
    borderColor: '#D1D5DB',
  },
  borderRed200: {
    borderColor: '#FECACA',
  },
  borderB: {
    borderBottomWidth: 1,
  },
  borderT: {
    borderTopWidth: 1,
  },
  h20: {
    height: 80,
  },
  wFull: {
    width: '100%',
  },
  uppercase: {
    textTransform: 'uppercase',
  },
  shadowSm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});