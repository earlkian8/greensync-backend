import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet, RefreshControl, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MapPin } from 'lucide-react-native';
import collectorRoutesService from '@/services/collectorRoutesService';

export default function History() {
  const [routeStops, setRouteStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStop, setSelectedStop] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchRouteStops = useCallback(async () => {
    try {
      setError(null);
      if (!refreshing) {
        setLoading(true);
      }
      
      const searchParam = searchTerm.trim() || null;
      
      const response = await collectorRoutesService.getCollectionHistory({
        search: searchParam,
        per_page: 100,
      });
      
      // Handle paginated response
      let stopsData = [];
      if (response) {
        if (Array.isArray(response)) {
          stopsData = response;
        } else if (response.data && Array.isArray(response.data)) {
          stopsData = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          stopsData = response.data.data;
        }
      }
      
      setRouteStops(stopsData);
    } catch (err) {
      console.error('Error fetching route stops:', err);
      setError(err?.response?.data?.message || 'Failed to load route stops history');
      setRouteStops([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchTerm, refreshing]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRouteStops();
  };

  useEffect(() => {
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      fetchRouteStops();
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(timeoutId);
  }, [fetchRouteStops]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      // If API returns formatted time, use it directly
      if (typeof dateString === 'string' && dateString.includes(':')) {
        return dateString;
      }
      return '';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return [styles.bgGreen100, { color: '#166534' }];
      case 'pending':
        return [styles.bgYellow100, { color: '#854D0E' }];
      case 'skipped':
        return [styles.bgRed100, { color: '#991B1B' }];
      default:
        return [styles.bgGray100, { color: '#1F2937' }];
    }
  };

  return (
    <View style={[styles.flex1, styles.bgGray50]}>
      <ScrollView 
        style={styles.flex1}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >

        {/* Search */}
        <View style={[styles.bgWhite, styles.p4, styles.borderB, styles.borderGray200]}>
          <View style={[styles.flexRow, styles.itemsCenter, styles.bgGray100, styles.roundedLg, styles.px3, styles.py2]}>
            <Ionicons name="search-outline" size={20} color="#6B7280" />
            <TextInput
              placeholder="Search by route, address, or bin name..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              style={[styles.flex1, styles.ml2, styles.textBase]}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Collections List */}
        <View style={styles.p4}>
          {loading ? (
            <View style={[styles.itemsCenter, styles.justifyCenter, styles.py12]}>
              <ActivityIndicator size="large" color="#16A34A" />
            </View>
          ) : error ? (
            <View style={[styles.itemsCenter, styles.py12, styles.bgWhite, styles.roundedLg, styles.border, styles.borderRed200]}>
              <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
              <Text style={[styles.textRed600, styles.mt3, styles.textBase]}>{error}</Text>
              <TouchableOpacity 
                style={[styles.mt4, styles.px6, styles.py2, styles.bgRed600, styles.roundedLg]}
                onPress={fetchRouteStops}
                activeOpacity={0.8}
              >
                <Text style={[styles.textWhite, styles.fontMedium]}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : routeStops.length === 0 ? (
            <View style={[styles.itemsCenter, styles.py12, styles.bgWhite, styles.roundedLg, styles.border, styles.borderGray200]}>
              <Ionicons name="file-tray-outline" size={48} color="#9CA3AF" />
              <Text style={[styles.textGray500, styles.mt3, styles.textBase]}>No completed route stops found</Text>
            </View>
          ) : (
            <View>
              {routeStops.map((stop, index) => (
                <TouchableOpacity
                  key={stop.id}
                  style={[styles.bgWhite, styles.border, styles.borderGray200, styles.roundedLg, styles.p4, index > 0 && styles.mt3]}
                  onPress={() => {
                    setSelectedStop(stop);
                    setShowDetailsModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.flexRow, styles.justifyBetween]}>
                    <View style={styles.flex1}>
                      <View style={[styles.flexRow, styles.itemsCenter]}>
                        <View style={[styles.p2, styles.roundedFull, styles.bgGreen100]}>
                          <Ionicons name="location-outline" size={18} color="#16A34A" />
                        </View>
                        <View style={[styles.ml3, styles.flex1]}>
                          <Text style={[styles.fontSemibold, styles.textGray900, styles.textBase]}>
                            Stop #{stop.stop_order}
                          </Text>
                          {stop.route?.route_name && (
                            <Text style={[styles.textSm, styles.textGray700, { marginTop: 2 }]}>
                              {stop.route.route_name}
                            </Text>
                          )}
                          {stop.stop_address && (
                            <Text style={[styles.textXs, styles.textGray500, { marginTop: 2 }]} numberOfLines={1}>
                              {stop.stop_address}
                            </Text>
                          )}
                          {stop.bin?.name && (
                            <Text style={[styles.textXs, styles.textGray500, { marginTop: 2 }]}>
                              Bin: {stop.bin.name}
                            </Text>
                          )}
                        </View>
                      </View>

                      {stop.collection && (
                        <View style={[styles.flexRow, styles.mt3, { gap: 16 }]}>
                          <View style={[styles.flexRow, styles.itemsCenter]}>
                            <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                            <Text style={[styles.textSm, styles.textGray500, styles.ml1]}>
                              {stop.collection.collection_date}
                            </Text>
                          </View>
                          <View style={[styles.flexRow, styles.itemsCenter]}>
                            <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                            <Text style={[styles.textSm, styles.textGray500, styles.ml1]}>
                              {stop.collection.collection_time}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>

                    <View style={[styles.itemsEnd, styles.ml2]}>
                      {stop.collection && (
                        <>
                          <View style={[styles.px3, styles.py1, styles.roundedFull, ...getStatusStyle(stop.collection.collection_status)]}>
                            <Text style={[styles.textXs, styles.fontSemibold, styles.uppercase]}>
                              {stop.collection.collection_status}
                            </Text>
                          </View>
                          
                          {stop.collection.waste_weight != null && (
                            <Text style={[styles.textSm, styles.textGray700, styles.mt2, styles.fontMedium]}>
                              {stop.collection.waste_weight} kg
                            </Text>
                          )}

                          <View style={styles.mt2}>
                            {stop.collection.is_verified ? (
                              <View style={[styles.flexRow, styles.itemsCenter]}>
                                <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                                <Text style={[styles.textXs, styles.textGreen600, styles.ml1]}>Verified</Text>
                              </View>
                            ) : (
                              <View style={[styles.flexRow, styles.itemsCenter]}>
                                <Ionicons name="time-outline" size={14} color="#6B7280" />
                                <Text style={[styles.textXs, styles.textGray500, styles.ml1]}>Pending</Text>
                              </View>
                            )}
                          </View>
                        </>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.mb4]}>
              <Text style={[styles.textXl, styles.fontBold, styles.textGray900]}>Route Stop Details</Text>
              <TouchableOpacity
                onPress={() => setShowDetailsModal(false)}
                style={[styles.p2]}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedStop && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Route Stop Details (Primary) */}
                <View style={[styles.mb4]}>
                  <Text style={[styles.textSm, styles.fontSemibold, styles.textGray700, styles.mb2]}>Stop Information</Text>
                  <View style={[styles.bgGray50, styles.p3, styles.roundedLg]}>
                    <View style={[styles.flexRow, styles.itemsCenter, styles.mb2]}>
                      <Ionicons name="location-outline" size={16} color="#6B7280" />
                      <Text style={[styles.textBase, styles.fontMedium, styles.textGray900, styles.ml2]}>
                        Stop #{selectedStop.stop_order}
                      </Text>
                    </View>
                    {selectedStop.stop_address && (
                      <View style={[styles.flexRow, styles.mt2]}>
                        <MapPin size={14} color="#6B7280" style={styles.mt1} />
                        <Text style={[styles.textSm, styles.textGray600, styles.ml2, styles.flex1]}>
                          {selectedStop.stop_address}
                        </Text>
                      </View>
                    )}
                    {selectedStop.estimated_time && (
                      <Text style={[styles.textSm, styles.textGray600, styles.mt2, styles.ml6]}>
                        Estimated Time: {selectedStop.estimated_time}
                      </Text>
                    )}
                    {selectedStop.notes && (
                      <Text style={[styles.textSm, styles.textGray600, styles.mt2, styles.ml6]}>
                        {selectedStop.notes}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Route Information */}
                {selectedStop.route ? (
                  <View style={[styles.mb4]}>
                    <Text style={[styles.textSm, styles.fontSemibold, styles.textGray700, styles.mb2]}>Route Information</Text>
                    <View style={[styles.bgGray50, styles.p3, styles.roundedLg]}>
                      <View style={[styles.flexRow, styles.itemsCenter, styles.mb2]}>
                        <Ionicons name="map-outline" size={16} color="#6B7280" />
                        <Text style={[styles.textBase, styles.fontMedium, styles.textGray900, styles.ml2]}>
                          {selectedStop.route.route_name || 'N/A'}
                        </Text>
                      </View>
                      {selectedStop.route.barangay && (
                        <Text style={[styles.textSm, styles.textGray600, styles.ml6]}>
                          {selectedStop.route.barangay}
                        </Text>
                      )}
                      {selectedStop.route.total_stops != null && (
                        <Text style={[styles.textSm, styles.textGray600, styles.ml6, styles.mt1]}>
                          Total Stops: {selectedStop.route.total_stops}
                        </Text>
                      )}
                    </View>
                  </View>
                ) : null}

                {/* Bin Information */}
                {selectedStop.bin && (
                  <View style={[styles.mb4]}>
                    <Text style={[styles.textSm, styles.fontSemibold, styles.textGray700, styles.mb2]}>Bin Information</Text>
                    <View style={[styles.bgGray50, styles.p3, styles.roundedLg]}>
                      <View style={[styles.flexRow, styles.itemsCenter, styles.mb2]}>
                        <Ionicons name="trash-outline" size={16} color="#6B7280" />
                        <Text style={[styles.textBase, styles.fontMedium, styles.textGray900, styles.ml2]}>
                          {selectedStop.bin.name || 'N/A'}
                        </Text>
                      </View>
                      <Text style={[styles.textSm, styles.textGray600, styles.ml6]}>
                        Type: {selectedStop.bin.bin_type || 'N/A'}
                      </Text>
                      <Text style={[styles.textSm, styles.textGray600, styles.ml6]}>
                        QR Code: {selectedStop.bin.qr_code}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Resident Information */}
                {selectedStop.resident && (
                  <View style={[styles.mb4]}>
                    <Text style={[styles.textSm, styles.fontSemibold, styles.textGray700, styles.mb2]}>Resident Information</Text>
                    <View style={[styles.bgGray50, styles.p3, styles.roundedLg]}>
                      <View style={[styles.flexRow, styles.itemsCenter, styles.mb2]}>
                        <Ionicons name="person-outline" size={16} color="#6B7280" />
                        <Text style={[styles.textBase, styles.fontMedium, styles.textGray900, styles.ml2]}>
                          {selectedStop.resident.name}
                        </Text>
                      </View>
                      {selectedStop.resident.address && (
                        <Text style={[styles.textSm, styles.textGray600, styles.ml6]}>
                          {selectedStop.resident.address}
                        </Text>
                      )}
                      {selectedStop.resident.phone && (
                        <Text style={[styles.textSm, styles.textGray600, styles.ml6, styles.mt1]}>
                          Phone: {selectedStop.resident.phone}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Collection Details */}
                {selectedStop.collection ? (
                  <View style={[styles.mb4]}>
                    <Text style={[styles.textSm, styles.fontSemibold, styles.textGray700, styles.mb2]}>Collection Details</Text>
                    <View style={[styles.bgGray50, styles.p3, styles.roundedLg]}>
                      <View style={[styles.flexRow, styles.justifyBetween, styles.mb2]}>
                        <Text style={[styles.textSm, styles.textGray600]}>Date & Time</Text>
                        <Text style={[styles.textSm, styles.fontMedium, styles.textGray900]}>
                          {selectedStop.collection.collection_date} at {selectedStop.collection.collection_time}
                        </Text>
                      </View>
                      <View style={[styles.flexRow, styles.justifyBetween, styles.mb2]}>
                        <Text style={[styles.textSm, styles.textGray600]}>Waste Type</Text>
                        <Text style={[styles.textSm, styles.fontMedium, styles.textGray900]}>
                          {selectedStop.collection.waste_type ? selectedStop.collection.waste_type.charAt(0).toUpperCase() + selectedStop.collection.waste_type.slice(1) : 'Mixed'}
                        </Text>
                      </View>
                      {selectedStop.collection.waste_weight != null && (
                        <View style={[styles.flexRow, styles.justifyBetween, styles.mb2]}>
                          <Text style={[styles.textSm, styles.textGray600]}>Weight</Text>
                          <Text style={[styles.textSm, styles.fontMedium, styles.textGray900]}>
                            {selectedStop.collection.waste_weight} kg
                          </Text>
                        </View>
                      )}
                      <View style={[styles.flexRow, styles.justifyBetween, styles.mb2]}>
                        <Text style={[styles.textSm, styles.textGray600]}>Status</Text>
                        <View style={[styles.px3, styles.py1, styles.roundedFull, ...getStatusStyle(selectedStop.collection.collection_status)]}>
                          <Text style={[styles.textXs, styles.fontSemibold, styles.uppercase]}>
                            {selectedStop.collection.collection_status || 'Unknown'}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.flexRow, styles.justifyBetween]}>
                        <Text style={[styles.textSm, styles.textGray600]}>Verified</Text>
                        <View style={[styles.flexRow, styles.itemsCenter]}>
                          {selectedStop.collection.is_verified ? (
                            <>
                              <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                              <Text style={[styles.textSm, styles.textGreen600, styles.ml1]}>Yes</Text>
                            </>
                          ) : (
                            <>
                              <Ionicons name="time-outline" size={16} color="#6B7280" />
                              <Text style={[styles.textSm, styles.textGray500, styles.ml1]}>Pending</Text>
                            </>
                          )}
                        </View>
                      </View>
                      {selectedStop.collection.notes && (
                        <View style={[styles.mt2, styles.pt2, styles.borderT, styles.borderGray200]}>
                          <Text style={[styles.textSm, styles.textGray600, styles.mb1]}>Notes</Text>
                          <Text style={[styles.textSm, styles.textGray900]}>
                            {selectedStop.collection.notes}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ) : null}

                {/* Assignment Details */}
                {selectedStop.assignment && (
                  <View style={[styles.mb4]}>
                    <Text style={[styles.textSm, styles.fontSemibold, styles.textGray700, styles.mb2]}>Assignment Details</Text>
                    <View style={[styles.bgGray50, styles.p3, styles.roundedLg]}>
                      <View style={[styles.flexRow, styles.justifyBetween, styles.mb2]}>
                        <Text style={[styles.textSm, styles.textGray600]}>Assignment Date</Text>
                        <Text style={[styles.textSm, styles.fontMedium, styles.textGray900]}>
                          {selectedStop.assignment.assignment_date}
                        </Text>
                      </View>
                      {selectedStop.assignment.start_time && (
                        <View style={[styles.flexRow, styles.justifyBetween, styles.mb2]}>
                          <Text style={[styles.textSm, styles.textGray600]}>Start Time</Text>
                          <Text style={[styles.textSm, styles.fontMedium, styles.textGray900]}>
                            {new Date(selectedStop.assignment.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </Text>
                        </View>
                      )}
                      {selectedStop.assignment.end_time && (
                        <View style={[styles.flexRow, styles.justifyBetween]}>
                          <Text style={[styles.textSm, styles.textGray600]}>End Time</Text>
                          <Text style={[styles.textSm, styles.fontMedium, styles.textGray900]}>
                            {new Date(selectedStop.assignment.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </Text>
                        </View>
                      )}
                      {selectedStop.assignment.status && (
                        <View style={[styles.flexRow, styles.justifyBetween, styles.mt2]}>
                          <Text style={[styles.textSm, styles.textGray600]}>Status</Text>
                          <Text style={[styles.textSm, styles.fontMedium, styles.textGray900]}>
                            {selectedStop.assignment.status === 'completed' ? 'Completed' : selectedStop.assignment.status === 'in_progress' ? 'In Progress' : selectedStop.assignment.status}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  flexRow: {
    flexDirection: 'row',
  },
  itemsCenter: {
    alignItems: 'center',
  },
  itemsEnd: {
    alignItems: 'flex-end',
  },
  justifyCenter: {
    justifyContent: 'center',
  },
  px3: {
    paddingHorizontal: 12,
  },
  px6: {
    paddingHorizontal: 24,
  },
  py1: {
    paddingVertical: 4,
  },
  py2: {
    paddingVertical: 8,
  },
  py12: {
    paddingVertical: 48,
  },
  p2: {
    padding: 8,
  },
  p4: {
    padding: 16,
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
  ml3: {
    marginLeft: 12,
  },
  mr2: {
    marginRight: 8,
  },
  bgGray50: {
    backgroundColor: '#F9FAFB',
  },
  bgGray100: {
    backgroundColor: '#F3F4F6',
  },
  bgWhite: {
    backgroundColor: '#FFFFFF',
  },
  bgGreen100: {
    backgroundColor: '#DCFCE7',
  },
  bgYellow100: {
    backgroundColor: '#FEF3C7',
  },
  bgRed100: {
    backgroundColor: '#FEE2E2',
  },
  bgRed600: {
    backgroundColor: '#DC2626',
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
  textGray900: {
    color: '#111827',
  },
  textGreen600: {
    color: '#16A34A',
  },
  textGreen700: {
    color: '#15803D',
  },
  textRed600: {
    color: '#DC2626',
  },
  textSm: {
    fontSize: 14,
  },
  textBase: {
    fontSize: 16,
  },
  textXs: {
    fontSize: 12,
  },
  fontMedium: {
    fontWeight: '500',
  },
  fontSemibold: {
    fontWeight: '600',
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
  borderGray200: {
    borderColor: '#E5E7EB',
  },
  borderRed200: {
    borderColor: '#FECACA',
  },
  borderB: {
    borderBottomWidth: 1,
  },
  uppercase: {
    textTransform: 'uppercase',
  },
  justifyBetween: {
    justifyContent: 'space-between',
  },
  textXl: {
    fontSize: 20,
  },
  fontBold: {
    fontWeight: '700',
  },
  mb4: {
    marginBottom: 16,
  },
  mt1: {
    marginTop: 4,
  },
  p3: {
    padding: 12,
  },
  ml6: {
    marginLeft: 24,
  },
  borderT: {
    borderTopWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: 20,
    paddingBottom: 40,
  },
});