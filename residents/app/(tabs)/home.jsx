import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, StyleSheet } from "react-native";
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
  const [binCounts, setBinCounts] = useState({});
  const [fullBinsCount, setFullBinsCount] = useState(0);
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
        const { upcoming_schedules, waste_bins, bin_counts, full_bins_count } = response.data.data;
        
        setUpcomingSchedules(upcoming_schedules || []);
        setWasteBins(waste_bins || []);
        setBinCounts(bin_counts || {});
        setFullBinsCount(full_bins_count || 0);
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
      <View style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16A34A" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
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

          {/* Full Bins Alert */}
          {fullBinsCount > 0 && (
            <View style={styles.alertContainer}>
              <MaterialIcons name="warning" size={20} color="#D97706" />
              <Text style={styles.alertText}>
                You have {fullBinsCount} {fullBinsCount === 1 ? 'bin' : 'bins'} that {fullBinsCount === 1 ? 'is' : 'are'} full and needs collection
              </Text>
            </View>
          )}

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
              {/* Bin Counts by Type */}
              {Object.keys(binCounts).length > 0 && (
                <View style={styles.binCountsSection}>
                  {Object.entries(binCounts).map(([binType, counts]) => {
                    const binTypeFormatted = binType.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ');
                    const hasFullBins = counts.full > 0;
                    
                    return (
                      <View key={binType} style={[
                        styles.binCountCard,
                        hasFullBins && styles.binCountCardFull
                      ]}>
                        <View style={styles.binCountHeader}>
                          <Text style={[
                            styles.binCountType,
                            hasFullBins && styles.binCountTypeFull
                          ]}>
                            {binTypeFormatted}
                          </Text>
                          {hasFullBins && (
                            <View style={styles.fullBadge}>
                              <MaterialIcons name="warning" size={14} color="#D97706" />
                              <Text style={styles.fullBadgeText}>{counts.full} Full</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.binCountStats}>
                          <View style={styles.binCountStat}>
                            <Text style={styles.binCountLabel}>Total</Text>
                            <Text style={styles.binCountValue}>{counts.total}</Text>
                          </View>
                          <View style={styles.binCountStat}>
                            <Text style={[styles.binCountLabel, styles.binCountLabelActive]}>Active</Text>
                            <Text style={[styles.binCountValue, styles.binCountValueActive]}>{counts.active}</Text>
                          </View>
                          {counts.full > 0 && (
                            <View style={styles.binCountStat}>
                              <Text style={[styles.binCountLabel, styles.binCountLabelFull]}>Full</Text>
                              <Text style={[styles.binCountValue, styles.binCountValueFull]}>{counts.full}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Individual Bins Grid */}
              {wasteBins.length > 0 && (
                <View style={styles.binsGrid}>
                  {wasteBins.map((bin) => {
                    const statusLower = (bin.status || 'Active').toLowerCase();
                    const isFull = statusLower === 'full';
                    const isActive = statusLower === 'active';
                    const isDamaged = statusLower === 'damaged';
                    const isInactive = statusLower === 'inactive';
                    
                    let cardStyle = styles.binCard;
                    let typeStyle = styles.binTypeText;
                    let statusStyle = styles.binStatusText;
                    
                    if (isFull) {
                      cardStyle = styles.binCardFull;
                      typeStyle = styles.binTypeTextFull;
                      statusStyle = styles.binStatusTextFull;
                    } else if (isActive) {
                      cardStyle = styles.binCardActive;
                      typeStyle = styles.binTypeTextActive;
                      statusStyle = styles.binStatusTextActive;
                    } else if (isDamaged) {
                      cardStyle = styles.binCardDamaged;
                      typeStyle = styles.binTypeTextDamaged;
                      statusStyle = styles.binStatusTextDamaged;
                    } else {
                      cardStyle = styles.binCardInactive;
                      typeStyle = styles.binTypeTextInactive;
                      statusStyle = styles.binStatusTextInactive;
                    }
                    
                    return (
                      <Pressable
                        key={bin.id}
                        onPress={() => console.log("Bin details:", bin.id)}
                        style={[styles.binCard, cardStyle]}
                      >
                        <Text style={[styles.binTypeText, typeStyle]}>
                          {bin.bin_type}
                        </Text>
                        <Text style={[styles.binStatusText, statusStyle]}>
                          {bin.status || 'Inactive'}
                        </Text>
                        {isFull && (
                          <View style={styles.fullIndicator}>
                            <MaterialIcons name="warning" size={12} color="#D97706" />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}
              
              {wasteBins.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No waste bins registered</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
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
    textTransform: 'capitalize',
  },
  viewAllLink: {
    fontSize: 14,
    color: '#16A34A',
    fontWeight: '600',
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    gap: 10,
  },
  alertText: {
    flex: 1,
    color: '#92400E',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  binsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  binCountsSection: {
    marginBottom: 16,
    gap: 12,
  },
  binCountCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  binCountCardFull: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  binCountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  binCountType: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  binCountTypeFull: {
    color: '#92400E',
  },
  fullBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  fullBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  binCountStats: {
    flexDirection: 'row',
    gap: 16,
  },
  binCountStat: {
    alignItems: 'flex-start',
  },
  binCountLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  binCountLabelActive: {
    color: '#059669',
  },
  binCountLabelFull: {
    color: '#D97706',
  },
  binCountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  binCountValueActive: {
    color: '#059669',
  },
  binCountValueFull: {
    color: '#D97706',
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
    position: 'relative',
  },
  binCardActive: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  binCardFull: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#FCD34D',
  },
  binCardDamaged: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  binCardInactive: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  binTypeText: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  binTypeTextActive: {
    color: '#166534',
  },
  binTypeTextFull: {
    color: '#92400E',
  },
  binTypeTextDamaged: {
    color: '#991B1B',
  },
  binTypeTextInactive: {
    color: '#6B7280',
  },
  binStatusText: {
    fontWeight: '600',
    fontSize: 13,
    textTransform: 'capitalize',
  },
  binStatusTextActive: {
    color: '#166534',
  },
  binStatusTextFull: {
    color: '#D97706',
  },
  binStatusTextDamaged: {
    color: '#991B1B',
  },
  binStatusTextInactive: {
    color: '#6B7280',
  },
  fullIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
});

export default Home;
