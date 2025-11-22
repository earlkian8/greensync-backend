import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, StyleSheet } from "react-native";
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
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16A34A" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
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
        <View style={styles.container}>
          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={fetchDashboardData} style={styles.errorButton}>
                <Text style={styles.errorButtonText}>Try again</Text>
              </Pressable>
            </View>
          )}

          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>
              Welcome, {user?.name?.split(' ')[0] || 'User'}!
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Let's keep our community clean together.
            </Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Pressable 
              onPress={() => router.push('/(tabs)/request')}
              style={styles.actionButtonPrimary}
            >
              <Feather name="plus" size={24} color="white" />
              <Text style={styles.actionButtonPrimaryText}>
                Request Collection
              </Text>
            </Pressable>

            <Pressable 
              onPress={() => router.push('/(tabs)/bins')}
              style={styles.actionButtonSecondary}
            >
              <Feather name="trash-2" size={24} color="#15803D" />
              <Text style={styles.actionButtonSecondaryText}>
                My Waste Bins
              </Text>
            </Pressable>
          </View>

          {/* Upcoming Collections */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Feather name="calendar" size={18} color="#16A34A" />
                <Text style={styles.sectionTitle}>
                  Upcoming Collections
                </Text>
              </View>
              <Pressable onPress={() => router.push('/(tabs)/request')}>
                <Text style={styles.viewAllLink}>View all</Text>
              </Pressable>
            </View>

            {upcomingSchedules.length > 0 ? (
              <View>
                {upcomingSchedules.map((schedule) => (
                  <ScheduleCard key={schedule.id} schedule={schedule} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No upcoming collections scheduled</Text>
              </View>
            )}
          </View>

          {/* Waste Bins Status */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Feather name="trash-2" size={18} color="#16A34A" />
                <Text style={styles.sectionTitle}>
                  Waste Bins Status
                </Text>
              </View>
              <Pressable onPress={() => router.push('/(tabs)/bins')}>
                <Text style={styles.viewAllLink}>View all</Text>
              </Pressable>
            </View>

            <View style={styles.binsContainer}>
              <View style={styles.binsGrid}>
                {wasteBins.map((bin) => {
                  const isActive = bin.status && bin.status.toLowerCase() === 'active';
                  return (
                    <Pressable
                      key={bin.id}
                      onPress={() => console.log("Bin details:", bin.id)}
                      style={[
                        styles.binCard,
                        isActive ? styles.binCardActive : styles.binCardInactive
                      ]}
                    >
                      <Text style={[
                        styles.binTypeText,
                        isActive ? styles.binTypeTextActive : styles.binTypeTextInactive
                      ]}>
                        {bin.bin_type.split(' ')[0]}
                      </Text>
                      <Text style={[
                        styles.binStatusText,
                        isActive ? styles.binStatusTextActive : styles.binStatusTextInactive
                      ]}>
                        {bin.status || 'Inactive'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#4B5563',
    marginTop: 16,
  },
  container: {
    padding: 20,
  },
  errorContainer: {
    marginBottom: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
  },
  errorButton: {
    marginTop: 8,
  },
  errorButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  welcomeSubtitle: {
    color: '#4B5563',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButtonPrimary: {
    flex: 1,
    backgroundColor: '#16A34A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  actionButtonSecondary: {
    flex: 1,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonSecondaryText: {
    color: '#15803D',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  viewAllLink: {
    fontSize: 14,
    color: '#16A34A',
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#6B7280',
  },
  binsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  binsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  binCard: {
    flex: 1,
    minWidth: '30%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  binCardActive: {
    backgroundColor: '#D1FAE5',
  },
  binCardInactive: {
    backgroundColor: '#FEE2E2',
  },
  binTypeText: {
    fontSize: 12,
    marginBottom: 4,
  },
  binTypeTextActive: {
    color: '#166534',
  },
  binTypeTextInactive: {
    color: '#991B1B',
  },
  binStatusText: {
    fontWeight: '600',
    fontSize: 14,
  },
  binStatusTextActive: {
    color: '#166534',
  },
  binStatusTextInactive: {
    color: '#991B1B',
  },
});

export default Home;
