import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { MapIcon, CalendarIcon, ChevronRightIcon, SearchIcon, AlertTriangleIcon } from 'lucide-react-native';
import { api } from '@/config/api';

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
      const response = await api.get('v1/collector/routes/all', {
        params: {
          per_page: 50,
        },
      });

      const payload = response?.data?.data;
      const items = payload?.data ?? [];

      setAssignments(items);
      setPagination({
        currentPage: payload?.current_page ?? 1,
        lastPage: payload?.last_page ?? 1,
        total: payload?.total ?? items.length,
      });
    } catch (err) {
      console.error('Error fetching routes:', err);
      const message = err?.response?.data?.message ?? 'Unable to load assigned routes. Please try again.';
      setError(message);
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
      const routeName = assignment?.route?.route_name ?? '';
      const barangay = assignment?.route?.barangay ?? '';
      return (
        routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        barangay.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  );

  const handleRouteClick = (assignment) => {
    router.push({
      pathname: '/(tabs)/route-detail',
      params: {
        assignmentId: assignment?.id,
        routeId: assignment?.route?.id,
      },
    });
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
        return 'bg-green-100';
      case 'in-progress':
      case 'in_progress':
        return 'bg-blue-100';
      default:
        return 'bg-yellow-100';
    }
  };

  const getStatusTextStyle = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-800';
      case 'in-progress':
      case 'in_progress':
        return 'text-blue-800';
      default:
        return 'text-yellow-800';
    }
  };

  const renderStatusLabel = (status) => {
    if (!status) return 'pending';
    return status.replace(/[_-]/g, ' ');
  };

  return (
    <View className="flex-1 bg-gray-50">

      {/* Search */}
      <View className="bg-white p-4 shadow-sm">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <SearchIcon size={18} color="#6B7280" />
          <TextInput
            className="flex-1 ml-2 text-gray-900"
            placeholder="Search routes..."
            placeholderTextColor="#9CA3AF"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      </View>

      {/* Routes List */}
      <ScrollView 
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <View className="flex justify-center items-center h-40">
            <ActivityIndicator size="large" color="#059669" />
          </View>
        ) : error ? (
          <View className="bg-white rounded-lg shadow-sm p-6 border border-red-100">
            <View className="flex-row items-center mb-3">
              <AlertTriangleIcon size={20} color="#DC2626" />
              <Text className="text-base font-medium text-red-700 ml-2">Unable to load routes</Text>
            </View>
            <Text className="text-sm text-red-600">{error}</Text>
            <TouchableOpacity
              className="mt-4 px-4 py-2 bg-red-600 rounded-lg"
              onPress={loadAssignments}
            >
              <Text className="text-white text-center font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredAssignments.length === 0 ? (
          <View className="bg-white rounded-lg shadow-sm py-8 border border-gray-200">
            <Text className="text-center text-gray-500">No routes assigned</Text>
            <Text className="text-center text-gray-400 text-sm mt-2">
              Try adjusting your search or check back later.
            </Text>
          </View>
        ) : (
          <View>
            {filteredAssignments.map(assignment => (
              <TouchableOpacity
                key={assignment.id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mb-4"
                onPress={() => handleRouteClick(assignment)}
                activeOpacity={0.7}
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 pr-3">
                    <Text className="font-medium text-gray-900">
                      {assignment?.route?.route_name ?? 'Unnamed Route'}
                    </Text>
                    <Text className="text-sm text-gray-600 mt-1">
                      {assignment?.route?.barangay ?? 'No barangay'} • {assignment?.route?.total_stops ?? 0} stops
                    </Text>
                    <View className="flex-row items-center mt-2">
                      {!!assignment?.route?.estimated_duration && (
                        <View className="flex-row items-center mr-4">
                          <MapIcon size={14} color="#059669" />
                          <Text className="text-sm text-gray-500 ml-1">
                            {assignment.route.estimated_duration} mins
                          </Text>
                        </View>
                      )}
                      {!!assignment?.assignment_date && (
                        <View className="flex-row items-center">
                          <CalendarIcon size={14} color="#059669" />
                          <Text className="text-sm text-gray-500 ml-1">
                            {formatDate(assignment.assignment_date)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <ChevronRightIcon size={20} color="#9CA3AF" />
                </View>

                {/* Status Badge */}
                <View className="mt-3 flex-row justify-end">
                  <View className={`px-2 py-1 rounded ${getStatusStyle(assignment.status)}`}>
                    <Text className={`text-xs font-medium uppercase ${getStatusTextStyle(assignment.status)}`}>
                      {renderStatusLabel(assignment.status)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            {pagination?.total > filteredAssignments.length && (
              <Text className="text-center text-xs text-gray-400 mt-2">
                Showing {filteredAssignments.length} of {pagination.total} assignments
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};