import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapIcon, CalendarIcon, ChevronRightIcon, SearchIcon, AlertTriangleIcon } from 'lucide-react-native';
import collectorRoutesService from '@/services/collectorRoutesService';

export default function RoutesPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  });

  const loadAssignments = useCallback(async () => {
    setError(null);
    if (!refreshing) {
      setLoading(true);
    }

    try {
      const response = await collectorRoutesService.getAllAssignments({
        per_page: 50,
      });

      // Handle paginated response structure
      let items = [];
      let paginationData = {
        currentPage: 1,
        lastPage: 1,
        total: 0,
      };

      if (response) {
        if (Array.isArray(response)) {
          items = response;
          paginationData.total = response.length;
        } else if (response.data && Array.isArray(response.data)) {
          items = response.data;
          paginationData = {
            currentPage: response.current_page ?? 1,
            lastPage: response.last_page ?? 1,
            total: response.total ?? items.length,
          };
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          items = response.data.data;
          paginationData = {
            currentPage: response.data.current_page ?? 1,
            lastPage: response.data.last_page ?? 1,
            total: response.data.total ?? items.length,
          };
        }
      }

      setAssignments(items);
      setPagination(paginationData);
    } catch (err) {
      console.error('Error fetching routes:', err);
      const message = err?.response?.data?.message ?? 'Unable to load assigned routes. Please try again.';
      setError(message);
      setAssignments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAssignments();
  };

  const filteredAssignments = assignments.filter(
    assignment => {
      if (!assignment) return false;
      const routeName = assignment?.route?.route_name ?? assignment?.route?.name ?? '';
      const barangay = assignment?.route?.barangay ?? '';
      return (
        routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        barangay.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  );

  const handleRouteClick = (assignment) => {
    if (!assignment?.id) {
      console.warn('Cannot navigate: assignment ID is missing');
      return;
    }
    
    try {
      router.push({
        pathname: '/route-detail',
        params: {
          assignmentId: String(assignment.id),
          routeId: assignment?.route?.id ? String(assignment.route.id) : undefined,
        },
      });
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return styles.bgGreen100;
      case 'in-progress':
      case 'in_progress':
        return styles.bgBlue100;
      default:
        return styles.bgYellow100;
    }
  };

  const getStatusTextStyle = (status) => {
    switch (status) {
      case 'completed':
        return { color: '#166534' };
      case 'in-progress':
      case 'in_progress':
        return { color: '#1E40AF' };
      default:
        return { color: '#854D0E' };
    }
  };

  const renderStatusLabel = (status) => {
    if (!status) return 'pending';
    return status.replace(/[_-]/g, ' ');
  };

  return (
    <>

      {/* Search */}
      <View style={[styles.bgWhite, styles.p4, styles.shadowSm]}>
        <View style={[styles.flexRow, styles.itemsCenter, styles.bgGray100, styles.roundedLg, styles.px3, styles.py2]}>
          <SearchIcon size={18} color="#6B7280" />
          <TextInput
            style={[styles.flex1, styles.ml2, styles.textGray900]}
            placeholder="Search routes..."
            placeholderTextColor="#9CA3AF"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      </View>

      {/* Routes List */}
      <ScrollView 
        style={[styles.flex1, styles.p4]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <View style={[styles.justifyCenter, styles.itemsCenter, { height: 160 }]}>
            <ActivityIndicator size="large" color="#059669" />
          </View>
        ) : error ? (
          <View style={[styles.bgWhite, styles.roundedLg, styles.shadowSm, { padding: 24 }, styles.border, { borderColor: '#FEE2E2' }]}>
            <View style={[styles.flexRow, styles.itemsCenter, styles.mb3]}>
              <AlertTriangleIcon size={20} color="#DC2626" />
              <Text style={[styles.textBase, styles.fontMedium, { color: '#B91C1C' }, styles.ml2]}>Unable to load routes</Text>
            </View>
            <Text style={[styles.textSm, styles.textRed600]}>{error}</Text>
            <TouchableOpacity
              style={[styles.mt4, styles.px4, styles.py2, styles.bgRed600, styles.roundedLg]}
              onPress={loadAssignments}
            >
              <Text style={[styles.textWhite, styles.textCenter, styles.fontSemibold]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredAssignments.length === 0 ? (
          <View style={[styles.bgWhite, styles.roundedLg, styles.shadowSm, { paddingVertical: 32 }, styles.border, styles.borderGray200]}>
            <Text style={[styles.textCenter, styles.textGray500]}>No routes assigned</Text>
            <Text style={[styles.textCenter, { color: '#9CA3AF' }, styles.textSm, styles.mt2]}>
              Try adjusting your search or check back later.
            </Text>
          </View>
        ) : (
          <View>
            {filteredAssignments.map(assignment => (
              <TouchableOpacity
                key={assignment.id}
                style={[styles.bgWhite, styles.border, styles.borderGray200, styles.roundedLg, styles.p4, styles.shadowSm, styles.mb4]}
                onPress={() => handleRouteClick(assignment)}
                activeOpacity={0.7}
              >
                <View style={[styles.flexRow, styles.justifyBetween, styles.itemsStart]}>
                  <View style={[styles.flex1, styles.pr3]}>
                    <Text style={[styles.fontMedium, styles.textGray900]}>
                      {assignment?.route?.route_name ?? assignment?.route?.name ?? 'Unnamed Route'}
                    </Text>
                    <Text style={[styles.textSm, styles.textGray600, styles.mt1]}>
                      {assignment?.route?.barangay ?? 'No barangay'} • {assignment?.route?.total_stops ?? 0} stops
                    </Text>
                    <View style={[styles.flexRow, styles.itemsCenter, styles.mt2]}>
                      {!!assignment?.route?.estimated_duration && (
                        <View style={[styles.flexRow, styles.itemsCenter, styles.mr4]}>
                          <MapIcon size={14} color="#059669" />
                          <Text style={[styles.textSm, styles.textGray500, styles.ml1]}>
                            {assignment.route.estimated_duration} mins
                          </Text>
                        </View>
                      )}
                      {!!assignment?.assignment_date && (
                        <View style={[styles.flexRow, styles.itemsCenter]}>
                          <CalendarIcon size={14} color="#059669" />
                          <Text style={[styles.textSm, styles.textGray500, styles.ml1]}>
                            {formatDate(assignment.assignment_date)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <ChevronRightIcon size={20} color="#9CA3AF" />
                </View>

                {/* Status Badge */}
                <View style={[styles.mt3, styles.flexRow, styles.justifyEnd]}>
                  <View style={[styles.px2, styles.py1, styles.rounded, getStatusStyle(assignment.status)]}>
                    <Text style={[styles.textXs, styles.fontMedium, styles.uppercase, getStatusTextStyle(assignment.status)]}>
                      {renderStatusLabel(assignment.status)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            {pagination?.total > filteredAssignments.length && (
              <Text style={[styles.textCenter, styles.textXs, { color: '#9CA3AF' }, styles.mt2]}>
                Showing {filteredAssignments.length} of {pagination.total} assignments
              </Text>
            )}
          </View>
        )}
      </ScrollView>
      </>
  );
};

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
  itemsStart: {
    alignItems: 'flex-start',
  },
  justifyCenter: {
    justifyContent: 'center',
  },
  justifyBetween: {
    justifyContent: 'space-between',
  },
  justifyEnd: {
    justifyContent: 'flex-end',
  },
  px2: {
    paddingHorizontal: 8,
  },
  px3: {
    paddingHorizontal: 12,
  },
  px4: {
    paddingHorizontal: 16,
  },
  py1: {
    paddingVertical: 4,
  },
  py2: {
    paddingVertical: 8,
  },
  p4: {
    padding: 16,
  },
  p6: {
    padding: 24,
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
  mb3: {
    marginBottom: 12,
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
  mr2: {
    marginRight: 8,
  },
  mr4: {
    marginRight: 16,
  },
  pr3: {
    paddingRight: 12,
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
  bgBlue100: {
    backgroundColor: '#DBEAFE',
  },
  bgYellow100: {
    backgroundColor: '#FEF3C7',
  },
  bgRed600: {
    backgroundColor: '#DC2626',
  },
  textGray500: {
    color: '#6B7280',
  },
  textGray600: {
    color: '#4B5563',
  },
  textGray900: {
    color: '#111827',
  },
  textRed600: {
    color: '#DC2626',
  },
  textWhite: {
    color: '#FFFFFF',
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
  rounded: {
    borderRadius: 4,
  },
  roundedLg: {
    borderRadius: 8,
  },
  border: {
    borderWidth: 1,
  },
  borderGray200: {
    borderColor: '#E5E7EB',
  },
  shadowSm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textCenter: {
    textAlign: 'center',
  },
  uppercase: {
    textTransform: 'uppercase',
  },
});