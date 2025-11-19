import React, { useEffect, useState, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../_layout';

// Mock Data
const mockRoutes = [
  {
    id: 1,
    route_name: "Downtown Route A",
    barangay: "Barangay San Miguel",
    total_stops: 15,
    estimated_duration: 120,
    status: "active",
  },
  {
    id: 2,
    route_name: "Residential Route B",
    barangay: "Barangay Santa Cruz",
    total_stops: 20,
    estimated_duration: 150,
    status: "active",
  },
  {
    id: 3,
    route_name: "Market District Route",
    barangay: "Barangay Centro",
    total_stops: 12,
    estimated_duration: 90,
    status: "active",
  },
];

const mockRouteAssignments = [
  {
    id: 1,
    route_id: 1,
    collector_id: 1,
    assignment_date: new Date().toISOString().split('T')[0], // Today
    status: "pending",
  },
  {
    id: 2,
    route_id: 2,
    collector_id: 1,
    assignment_date: new Date().toISOString().split('T')[0], // Today
    status: "pending",
  },
];

export default function Home() {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [todayAssignments, setTodayAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const today = new Date().toISOString().split('T')[0];
        
        const assignments = mockRouteAssignments.filter(
          assignment => assignment.assignment_date === today
        );
        
        const assignmentsWithRouteDetails = assignments.map(assignment => {
          const route = mockRoutes.find(route => route.id === assignment.route_id);
          return {
            ...assignment,
            route
          };
        });
        
        setTodayAssignments(assignmentsWithRouteDetails);
      } catch (error) {
        console.error('Error fetching assignments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
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
          onPress={() => router.push('/routes')}
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
          ) : todayAssignments.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 mt-3 text-base">No routes scheduled for today</Text>
              <TouchableOpacity 
                className="mt-4 px-6 py-2 border border-gray-300 rounded-lg active:bg-gray-50"
                onPress={() => router.push('/routes')}
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
                        {assignment.route?.route_name}
                      </Text>
                      <Text className="text-sm text-gray-600 mt-1">
                        {assignment.route?.barangay} • {assignment.route?.total_stops} stops
                      </Text>
                      <View className="flex-row items-center mt-2">
                        <Ionicons name="time-outline" size={14} color="#6B7280" />
                        <Text className="text-sm text-gray-500 ml-1">
                          Est. {assignment.route?.estimated_duration} mins
                        </Text>
                      </View>
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
                      onPress={() => startCollection(assignment.route_id)}
                    >
                      <Ionicons name="play-circle-outline" size={18} color="#ffffff" />
                      <Text className="text-white font-semibold ml-2">Start Collection</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      className="px-4 border border-gray-300 rounded-lg py-3 items-center justify-center active:bg-gray-50"
                      onPress={() => router.push(`/routes/${assignment.route_id}`)}
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
              <Text className="text-3xl font-bold text-green-600">12</Text>
            </View>
            
            <View className="flex-1 bg-blue-50 rounded-lg p-4 items-center border border-blue-100">
              <Text className="text-sm text-gray-600 mb-1">Weekly Total</Text>
              <Text className="text-3xl font-bold text-blue-600">48</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}