import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import collectorRoutesService from '@/services/collectorRoutesService';

export default function History() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchCollections = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      
      // When filter is 'all', don't pass status (API defaults to 'collected' and 'completed')
      // For other statuses, pass the status filter
      const statusParam = filterStatus === 'all' ? null : filterStatus;
      const searchParam = searchTerm.trim() || null;
      
      const response = await collectorRoutesService.getCollectionHistory({
        status: statusParam,
        search: searchParam,
        per_page: 100, // Get more items for better history view
      });
      
      // Handle paginated response - extract data array from pagination object
      let collectionsData = [];
      if (response) {
        if (Array.isArray(response)) {
          collectionsData = response;
        } else if (response.data && Array.isArray(response.data)) {
          collectionsData = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          collectionsData = response.data.data;
        }
      }
      
      setCollections(collectionsData);
    } catch (err) {
      console.error('Error fetching collections:', err);
      setError(err?.response?.data?.message || 'Failed to load collection history');
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchTerm]);

  useEffect(() => {
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      fetchCollections();
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(timeoutId);
  }, [fetchCollections]);

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
      <ScrollView style={styles.flex1}>

        {/* Search and Filter */}
        <View style={[styles.bgWhite, styles.p4, styles.borderB, styles.borderGray200]}>
          <View style={[styles.flexRow, styles.itemsCenter, styles.bgGray100, styles.roundedLg, styles.px3, styles.py2]}>
            <Ionicons name="search-outline" size={20} color="#6B7280" />
            <TextInput
              placeholder="Search by waste type or QR code..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              style={[styles.flex1, styles.ml2, styles.textBase]}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={[styles.flexRow, styles.itemsCenter, styles.mt4]}>
            <View style={[styles.flexRow, styles.itemsCenter, styles.mr2]}>
              <Ionicons name="filter-outline" size={16} color="#6B7280" />
              <Text style={[styles.textSm, styles.textGray500, styles.ml1]}>Filter:</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.flex1}>
              <TouchableOpacity
                style={[
                  styles.px3,
                  styles.py1,
                  styles.roundedFull,
                  styles.mr2,
                  filterStatus === 'all' ? styles.bgGreen100 : styles.bgGray100
                ]}
                onPress={() => setFilterStatus('all')}
              >
                <Text style={[
                  styles.textSm,
                  filterStatus === 'all' ? [styles.textGreen700, styles.fontMedium] : styles.textGray600
                ]}>
                  All
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.px3,
                  styles.py1,
                  styles.roundedFull,
                  styles.mr2,
                  filterStatus === 'completed' ? styles.bgGreen100 : styles.bgGray100
                ]}
                onPress={() => setFilterStatus('completed')}
              >
                <Text style={[
                  styles.textSm,
                  filterStatus === 'completed' ? [styles.textGreen700, styles.fontMedium] : styles.textGray600
                ]}>
                  Completed
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.px3,
                  styles.py1,
                  styles.roundedFull,
                  styles.mr2,
                  filterStatus === 'pending' ? styles.bgYellow100 : styles.bgGray100
                ]}
                onPress={() => setFilterStatus('pending')}
              >
                <Text style={[
                  styles.textSm,
                  filterStatus === 'pending' ? [{ color: '#A16207' }, styles.fontMedium] : styles.textGray600
                ]}>
                  Pending
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.px3,
                  styles.py1,
                  styles.roundedFull,
                  filterStatus === 'skipped' ? styles.bgRed100 : styles.bgGray100
                ]}
                onPress={() => setFilterStatus('skipped')}
              >
                <Text style={[
                  styles.textSm,
                  filterStatus === 'skipped' ? [{ color: '#B91C1C' }, styles.fontMedium] : styles.textGray600
                ]}>
                  Skipped
                </Text>
              </TouchableOpacity>
            </ScrollView>
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
                onPress={fetchCollections}
                activeOpacity={0.8}
              >
                <Text style={[styles.textWhite, styles.fontMedium]}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : collections.length === 0 ? (
            <View style={[styles.itemsCenter, styles.py12, styles.bgWhite, styles.roundedLg, styles.border, styles.borderGray200]}>
              <Ionicons name="file-tray-outline" size={48} color="#9CA3AF" />
              <Text style={[styles.textGray500, styles.mt3, styles.textBase]}>No collection history found</Text>
            </View>
          ) : (
            <View>
              {collections.map((collection, index) => (
                <View
                  key={collection.id}
                  style={[styles.bgWhite, styles.border, styles.borderGray200, styles.roundedLg, styles.p4, index > 0 && styles.mt3]}
                >
                  <View style={[styles.flexRow, styles.justifyBetween]}>
                    <View style={styles.flex1}>
                      <View style={[styles.flexRow, styles.itemsCenter]}>
                        <View style={[styles.p2, styles.roundedFull, styles.bgGreen100]}>
                          <Ionicons name="trash-outline" size={18} color="#16A34A" />
                        </View>
                        <View style={[styles.ml3, styles.flex1]}>
                          <Text style={[styles.fontSemibold, styles.textGray900, styles.textBase]}>
                            {collection.waste_type || 'Mixed Waste'}
                          </Text>
                          <Text style={[styles.textSm, styles.textGray600, { marginTop: 2 }]}>
                            QR: {collection.qr_code}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.flexRow, styles.mt3, { gap: 16 }]}>
                        <View style={[styles.flexRow, styles.itemsCenter]}>
                          <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                          <Text style={[styles.textSm, styles.textGray500, styles.ml1]}>
                            {collection.collection_date || formatDate(collection.collection_timestamp)}
                          </Text>
                        </View>
                        <View style={[styles.flexRow, styles.itemsCenter]}>
                          <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                          <Text style={[styles.textSm, styles.textGray500, styles.ml1]}>
                            {collection.collection_time || formatTime(collection.collection_timestamp)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={[styles.itemsEnd, styles.ml2]}>
                      <View style={[styles.px3, styles.py1, styles.roundedFull, ...getStatusStyle(collection.collection_status)]}>
                        <Text style={[styles.textXs, styles.fontSemibold, styles.uppercase]}>
                          {collection.collection_status}
                        </Text>
                      </View>
                      
                      <Text style={[styles.textSm, styles.textGray700, styles.mt2, styles.fontMedium]}>
                        {collection.waste_weight} kg
                      </Text>

                      <View style={styles.mt2}>
                        {collection.is_verified ? (
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
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
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
});