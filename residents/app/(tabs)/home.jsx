import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useState, useEffect } from "react";
import { useRouter } from "expo-router";
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AuthContext } from "../_layout";
import ScheduleCard from "@/components/ScheduleCard";
import { api } from "@/config/api";
import AsyncStorage from '@react-native-async-storage/async-storage';

const Home = () => {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);
  const [wasteBins, setWasteBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch dashboard data from backend
  const fetchDashboardData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Ensure auth token is set
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      // Fetch dashboard data
      const response = await api.get(`v1/resident/home/${user.id}`);

      if (response.data && response.data.data) {
        const { upcoming_schedules, waste_bins } = response.data.data;
        
        setUpcomingSchedules(upcoming_schedules || []);
        setWasteBins(waste_bins || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.response?.data?.message || 'Failed to fetch dashboard data');
      // Set empty arrays on error to show empty state
      setUpcomingSchedules([]);
      setWasteBins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#16A34A" />
          <Text className="text-gray-600 mt-4">Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={async () => {
              setRefreshing(true);
              await fetchDashboardData();
              setRefreshing(false);
            }} 
          />
        }
      >
        <View className="p-5">
          {/* Error Message */}
          {error && (
            <View className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3">
              <Text className="text-red-800 text-sm">{error}</Text>
              <Pressable onPress={fetchDashboardData} className="mt-2">
                <Text className="text-red-600 text-sm font-semibold">Try again</Text>
              </Pressable>
            </View>
          )}

          {/* Welcome Section */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900">
              Welcome, {user?.name?.split(' ')[0] || 'User'}!
            </Text>
            <Text className="text-gray-600 mt-1">
              Let's keep our community clean together.
            </Text>
          </View>

          {/* Quick Actions */}
          <View className="flex-row gap-3 mb-6">
            <Pressable 
              onPress={() => router.push('/(tabs)/request')}
              className="flex-1 bg-green-600 rounded-xl p-4 items-center justify-center shadow-sm active:bg-green-700"
            >
              <Feather name="plus" size={24} color="white" />
              <Text className="text-white text-sm font-semibold mt-2">
                Request Collection
              </Text>
            </Pressable>

            <Pressable 
              onPress={() => router.push('/(tabs)/bins')}
              className="flex-1 bg-green-100 rounded-xl p-4 items-center justify-center shadow-sm active:bg-green-200"
            >
              <Feather name="trash-2" size={24} color="#15803D" />
              <Text className="text-green-800 text-sm font-semibold mt-2">
                My Waste Bins
              </Text>
            </Pressable>
          </View>

          {/* Upcoming Collections */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <Feather name="calendar" size={18} color="#16A34A" />
                <Text className="text-base font-bold text-gray-800 ml-2">
                  Upcoming Collections
                </Text>
              </View>
              <Pressable onPress={() => router.push('/(tabs)/request')}>
                <Text className="text-sm text-green-600 font-semibold">View all</Text>
              </Pressable>
            </View>

            {upcomingSchedules.length > 0 ? (
              <View>
                {upcomingSchedules.map((schedule) => (
                  <ScheduleCard key={schedule.id} schedule={schedule} />
                ))}
              </View>
            ) : (
              <View className="bg-gray-100 rounded-xl py-8 items-center">
                <Text className="text-gray-500">No upcoming collections scheduled</Text>
              </View>
            )}
          </View>

          {/* Waste Bins Status */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <Feather name="trash-2" size={18} color="#16A34A" />
                <Text className="text-base font-bold text-gray-800 ml-2">
                  Waste Bins Status
                </Text>
              </View>
              <Pressable onPress={() => router.push('/(tabs)/bins')}>
                <Text className="text-sm text-green-600 font-semibold">View all</Text>
              </Pressable>
            </View>

            <View className="bg-white rounded-xl shadow-sm p-4">
              <View className="flex-row flex-wrap gap-3">
                {wasteBins.map((bin) => (
                  <Pressable
                    key={bin.id}
                    onPress={() => console.log("Bin details:", bin.id)}
                    className={`flex-1 min-w-[30%] p-3 rounded-lg items-center ${
                      (bin.status && bin.status.toLowerCase() === 'active') 
                        ? 'bg-green-100' 
                        : 'bg-red-100'
                    }`}
                  >
                    <Text className={`text-xs mb-1 ${
                      (bin.status && bin.status.toLowerCase() === 'active') 
                        ? 'text-green-800' 
                        : 'text-red-800'
                    }`}>
                      {bin.bin_type.split(' ')[0]}
                    </Text>
                    <Text className={`font-semibold text-sm ${
                      (bin.status && bin.status.toLowerCase() === 'active') 
                        ? 'text-green-800' 
                        : 'text-red-800'
                    }`}>
                      {bin.status || 'Inactive'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;