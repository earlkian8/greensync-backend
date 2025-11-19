import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MapIcon, CalendarIcon, ChevronRightIcon, SearchIcon } from 'lucide-react-native';

// Mock Data
const mockRoutes = [
  {
    id: 1,
    route_name: 'Route A - Downtown',
    barangay: 'Barangay Tetuan',
    total_stops: 15,
    estimated_duration: 45
  },
  {
    id: 2,
    route_name: 'Route B - Coastal',
    barangay: 'Barangay Rio Hondo',
    total_stops: 12,
    estimated_duration: 38
  },
  {
    id: 3,
    route_name: 'Route C - Hills',
    barangay: 'Barangay Guiwan',
    total_stops: 18,
    estimated_duration: 52
  },
  {
    id: 4,
    route_name: 'Route D - Market',
    barangay: 'Barangay Zone 1',
    total_stops: 20,
    estimated_duration: 60
  }
];

const mockRouteAssignments = [
  {
    id: 1,
    route_id: 1,
    assignment_date: '2024-01-15',
    status: 'completed'
  },
  {
    id: 2,
    route_id: 2,
    assignment_date: '2024-01-16',
    status: 'in_progress'
  },
  {
    id: 3,
    route_id: 3,
    assignment_date: '2024-01-17',
    status: 'pending'
  },
  {
    id: 4,
    route_id: 4,
    assignment_date: '2024-01-18',
    status: 'pending'
  }
];

export default function RoutesPage() {
  const navigation = useNavigation();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Combine routes with their assignments
        const routesWithAssignments = mockRoutes.map(route => {
          const assignments = mockRouteAssignments.filter(
            assignment => assignment.route_id === route.id
          );
          return {
            ...route,
            assignments
          };
        });
        setRoutes(routesWithAssignments);
      } catch (error) {
        console.error('Error fetching routes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  const filteredRoutes = routes.filter(
    route =>
      route.route_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.barangay.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRouteClick = (routeId) => {
    navigation.navigate('RouteDetail', { routeId });
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
      case 'in_progress':
        return 'text-blue-800';
      default:
        return 'text-yellow-800';
    }
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
      <ScrollView className="flex-1 p-4">
        {loading ? (
          <View className="flex justify-center items-center h-40">
            <ActivityIndicator size="large" color="#059669" />
          </View>
        ) : filteredRoutes.length === 0 ? (
          <View className="bg-white rounded-lg shadow-sm py-8">
            <Text className="text-center text-gray-500">No routes found</Text>
          </View>
        ) : (
          <View>
            {filteredRoutes.map(route => (
              <TouchableOpacity
                key={route.id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mb-4"
                onPress={() => handleRouteClick(route.id)}
                activeOpacity={0.7}
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">
                      {route.route_name}
                    </Text>
                    <Text className="text-sm text-gray-600 mt-1">
                      {route.barangay} • {route.total_stops} stops
                    </Text>
                    <View className="flex-row items-center mt-2">
                      <View className="flex-row items-center mr-4">
                        <MapIcon size={14} color="#059669" />
                        <Text className="text-sm text-gray-500 ml-1">
                          {route.estimated_duration} mins
                        </Text>
                      </View>
                      {route.assignments && route.assignments.length > 0 && (
                        <View className="flex-row items-center">
                          <CalendarIcon size={14} color="#059669" />
                          <Text className="text-sm text-gray-500 ml-1">
                            {formatDate(route.assignments[0].assignment_date)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <ChevronRightIcon size={20} color="#9CA3AF" />
                </View>

                {/* Status Badge */}
                {route.assignments && route.assignments.length > 0 && (
                  <View className="mt-3 flex-row justify-end">
                    <View className={`px-2 py-1 rounded ${getStatusStyle(route.assignments[0].status)}`}>
                      <Text className={`text-xs font-medium uppercase ${getStatusTextStyle(route.assignments[0].status)}`}>
                        {route.assignments[0].status}
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};