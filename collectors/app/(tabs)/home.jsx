import React, { useEffect, useState, useContext, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../_layout';
import collectorService from '@/services/collectorService';

export default function Home() {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [todayAssignments, setTodayAssignments] = useState([]);
  const [stats, setStats] = useState({
    todayCollections: 0,
    weeklyTotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      // Fetch today's assignments and performance summary in parallel
      const [assignmentsResponse, performanceResponse] = await Promise.all([
        collectorService.getTodayAssignments(),
        collectorService.getPerformanceSummary(),
      ]);

      // Set assignments
      if (assignmentsResponse) {
        setTodayAssignments(Array.isArray(assignmentsResponse) ? assignmentsResponse : []);
      }

      // Set stats from performance summary
      if (performanceResponse) {
        setStats({
          todayCollections: performanceResponse?.recent_activity?.today || 0,
          weeklyTotal: performanceResponse?.recent_activity?.this_week || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      
      // Handle different error types
      let errorMessage = 'Failed to load data. Please try again.';
      
      if (err?.response) {
        // Server responded with error
        errorMessage = err.response.data?.message || err.response.data?.error || errorMessage;
        
        // Handle 401 (Unauthenticated)
        if (err.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
        }
      } else if (err?.request) {
        // Request made but no response
        errorMessage = 'Cannot connect to server. Please check your connection.';
      } else {
        // Error setting up request
        errorMessage = err?.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData(true);
  };

  const startCollection = (routeId) => {
    router.push(`/collection/active/${routeId}`);
  };

  const openQRScanner = () => {
    router.push('/collection/scan');
  };

  const formatDate = () => {
    const date = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <ScrollView 
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >

      {/* Date Banner */}
      <View className="bg-white p-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <Ionicons name="calendar-outline" size={20} color="#16A34A" />
          <View className="ml-2">
            <Text className="text-sm text-gray-600">Today's Date</Text>
            <Text className="font-medium text-gray-900">{formatDate()}</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="flex-row p-4 gap-4">
        <TouchableOpacity 
          className="flex-1 h-20 bg-green-600 rounded-lg items-center justify-center active:bg-green-700"
          onPress={() => router.push('/(tabs)/routesPage')}
        >
          <Ionicons name="map-outline" size={24} color="#ffffff" />
          <Text className="text-lg font-semibold text-white mt-1">My Routes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="flex-1 h-20 bg-gray-200 rounded-lg items-center justify-center active:bg-gray-300"
          onPress={openQRScanner}
        >
          <Ionicons name="qr-code-outline" size={24} color="#374151" />
          <Text className="text-lg font-semibold text-gray-700 mt-1">Scan QR</Text>
        </TouchableOpacity>
      </View>

      {/* Today's Schedule */}
      <View className="px-4 pb-4">
        <View className="bg-white rounded-lg p-4 border border-gray-200">
          <View className="flex-row items-center mb-4">
            <Ionicons name="time-outline" size={20} color="#16A34A" />
            <Text className="text-lg font-semibold text-gray-800 ml-2">
              Today's Schedule
            </Text>
          </View>

          {loading ? (
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="large" color="#16A34A" />
            </View>
          ) : error ? (
            <View className="items-center py-8">
              <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
              <Text className="text-red-600 mt-3 text-base text-center">{error}</Text>
              <TouchableOpacity 
                className="mt-4 px-6 py-2 bg-red-600 rounded-lg active:bg-red-700"
                onPress={() => fetchData()}
              >
                <Text className="text-white font-medium">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : todayAssignments.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 mt-3 text-base">No routes scheduled for today</Text>
              <TouchableOpacity 
                className="mt-4 px-6 py-2 border border-gray-300 rounded-lg active:bg-gray-50"
                onPress={() => router.push('/(tabs)/routesPage')}
              >
                <Text className="text-gray-700 font-medium">View All Routes</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {todayAssignments.map((assignment, index) => (
                <View 
                  key={assignment.id} 
                  className={`border border-gray-200 rounded-lg p-4 ${index > 0 ? 'mt-3' : ''}`}
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1 pr-2">
                      <Text className="font-semibold text-gray-900 text-base">
                        {assignment.route?.name || assignment.route?.route_name}
                      </Text>
                      <Text className="text-sm text-gray-600 mt-1">
                        {assignment.route?.barangay} • {assignment.route?.total_stops || assignment.total_stops || 0} stops
                      </Text>
                      {assignment.completed_stops !== undefined && (
                        <View className="flex-row items-center mt-2">
                          <Ionicons name="checkmark-circle-outline" size={14} color="#16A34A" />
                          <Text className="text-sm text-green-600 ml-1">
                            {assignment.completed_stops || 0} / {assignment.total_stops || 0} completed
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className={`px-3 py-1 rounded-full ${
                      assignment.status === 'completed' ? 'bg-green-100' :
                      assignment.status === 'in-progress' || assignment.status === 'in_progress' ? 'bg-blue-100' :
                      'bg-yellow-100'
                    }`}>
                      <Text className={`text-xs font-semibold uppercase ${
                        assignment.status === 'completed' ? 'text-green-800' :
                        assignment.status === 'in-progress' || assignment.status === 'in_progress' ? 'text-blue-800' :
                        'text-yellow-800'
                      }`}>
                        {assignment.status || 'pending'}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2">
                    <TouchableOpacity 
                      className={`flex-1 rounded-lg py-3 flex-row items-center justify-center ${
                        assignment.status === 'completed' ? 'bg-gray-400' : 'bg-green-600 active:bg-green-700'
                      }`}
                      disabled={assignment.status === 'completed'}
                      onPress={() => startCollection(assignment.route?.id || assignment.route_id)}
                    >
                      <Ionicons name="play-circle-outline" size={18} color="#ffffff" />
                      <Text className="text-white font-semibold ml-2">
                        {assignment.status === 'completed' ? 'Completed' : 'Start Collection'}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      className="px-4 border border-gray-300 rounded-lg py-3 items-center justify-center active:bg-gray-50"
                      onPress={() =>
                        router.push({
                          pathname: '/(tabs)/route-detail',
                          params: {
                            assignmentId: assignment.id,
                            routeId: assignment.route?.id || assignment.route_id,
                          },
                        })
                      }
                    >
                      <Text className="text-gray-700 font-medium">View</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Collection Stats */}
        <View className="bg-white rounded-lg p-4 mt-4 border border-gray-200">
          <View className="flex-row items-center mb-4">
            <Ionicons name="stats-chart-outline" size={20} color="#16A34A" />
            <Text className="text-lg font-semibold text-gray-800 ml-2">
              Collection Stats
            </Text>
          </View>
          
          <View className="flex-row gap-3">
            <View className="flex-1 bg-green-50 rounded-lg p-4 items-center border border-green-100">
              <Text className="text-sm text-gray-600 mb-1">Today's Collections</Text>
              <Text className="text-3xl font-bold text-green-600">{stats.todayCollections}</Text>
            </View>
            
            <View className="flex-1 bg-blue-50 rounded-lg p-4 items-center border border-blue-100">
              <Text className="text-sm text-gray-600 mb-1">Weekly Total</Text>
              <Text className="text-3xl font-bold text-blue-600">{stats.weeklyTotal}</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}