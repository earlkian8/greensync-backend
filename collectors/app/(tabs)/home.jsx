import React, { useEffect, useState, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../_layout';
import collectorRoutesService from '@/services/collectorRoutesService';

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

  const fetchHomeData = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Fetch today's assignments and performance stats in parallel
      const [assignmentsResponse, performanceResponse] = await Promise.all([
        collectorRoutesService.getTodayAssignments(),
        collectorRoutesService.getPerformanceSummary(),
      ]);
      
      // Transform assignments to match the expected format
      const assignments = Array.isArray(assignmentsResponse) 
        ? assignmentsResponse.map(assignment => ({
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
      
      // Extract stats from performance summary
      if (performanceResponse?.recent_activity) {
        setCollectionStats({
          today: performanceResponse.recent_activity.today || 0,
          weekly: performanceResponse.recent_activity.this_week || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching home data:', err);
      setError(err?.response?.data?.message || 'Failed to load home data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

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
    <ScrollView className="flex-1 bg-gray-50">

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
              <Text className="text-red-600 mt-3 text-base">{error}</Text>
              <TouchableOpacity 
                className="mt-4 px-6 py-2 bg-red-600 rounded-lg active:bg-red-700"
                onPress={() => {
                  setLoading(true);
                  fetchHomeData();
                }}
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
                        {assignment.route?.route_name || assignment.route?.name}
                      </Text>
                      <Text className="text-sm text-gray-600 mt-1">
                        {assignment.route?.barangay} • {assignment.route?.total_stops} stops
                      </Text>
                      {assignment.route?.estimated_duration && (
                        <View className="flex-row items-center mt-2">
                          <Ionicons name="time-outline" size={14} color="#6B7280" />
                          <Text className="text-sm text-gray-500 ml-1">
                            Est. {assignment.route.estimated_duration} mins
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className="bg-yellow-100 px-3 py-1 rounded-full">
                      <Text className="text-xs font-semibold text-yellow-800 uppercase">
                        {assignment.status}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2">
                    <TouchableOpacity 
                      className="flex-1 bg-green-600 rounded-lg py-3 flex-row items-center justify-center active:bg-green-700"
                      onPress={() => startCollection(assignment.route_id || assignment.route?.id)}
                    >
                      <Ionicons name="play-circle-outline" size={18} color="#ffffff" />
                      <Text className="text-white font-semibold ml-2">Start Collection</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      className="px-4 border border-gray-300 rounded-lg py-3 items-center justify-center active:bg-gray-50"
                      onPress={() =>
                        router.push({
                          pathname: '/route-detail',
                          params: {
                            assignmentId: assignment.id,
                            routeId: assignment.route_id || assignment.route?.id,
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
              <Text className="text-3xl font-bold text-green-600">{collectionStats.today}</Text>
            </View>
            
            <View className="flex-1 bg-blue-50 rounded-lg p-4 items-center border border-blue-100">
              <Text className="text-sm text-gray-600 mb-1">Weekly Total</Text>
              <Text className="text-3xl font-bold text-blue-600">{collectionStats.weekly}</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}