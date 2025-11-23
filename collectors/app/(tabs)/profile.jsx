import React, { useState, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../_layout';

export default function Profile() {
  const { user, logout } = useContext(AuthContext);
  const [isActive, setIsActive] = useState(user?.is_active || false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    // Refresh user data if needed
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const toggleActiveStatus = () => {
    setIsActive(!isActive);
    Alert.alert(
      'Status Updated',
      `Your status has been changed to ${!isActive ? 'Active' : 'Inactive'}`,
      [{ text: 'OK' }]
    );
  };

  const handleEditProfile = () => {
    Alert.alert(
      'Coming Soon',
      'Profile edit functionality will be available soon',
      [{ text: 'OK' }]
    );
  };

  if (!user) {
    return (
      <View style={[styles.flex1, styles.justifyCenter, styles.itemsCenter, styles.bgGray50]}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.flex1, styles.bgGray50]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Profile Info */}
      <View style={styles.p4}>
        <View style={[styles.bgWhite, styles.roundedLg, { padding: 24 }, styles.border, styles.borderGray200]}>
          <View style={styles.itemsCenter}>
            {user.profile_image ? (
              <Image
                source={{ uri: user.profile_image }}
                style={[styles.h24, styles.w24, styles.roundedFull, { borderWidth: 4, borderColor: '#DCFCE7' }]}
              />
            ) : (
              <View style={[styles.h24, styles.w24, styles.roundedFull, styles.bgGreen100, styles.itemsCenter, styles.justifyCenter, { borderWidth: 4, borderColor: '#F0FDF4' }]}>
                <Text style={[styles.text3xl, styles.fontBold, styles.textGreen600]}>
                  {user.name?.charAt(0) || 'C'}
                </Text>
              </View>
            )}

            <Text style={[styles.mt4, { fontSize: 20 }, styles.fontBold, styles.textGray900]}>
              {user.name || 'Collector'}
            </Text>
            <Text style={[styles.textGray600, styles.mt1]}>{user.email || 'No email provided'}</Text>

            <View style={[styles.flexRow, styles.itemsCenter, styles.mt2]}>
              <Ionicons name="card-outline" size={16} color="#16A34A" />
              <Text style={[styles.textSm, styles.textGray600, styles.ml1]}>
                Employee ID: {user.employee_id || 'N/A'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.wFull, styles.mt6, styles.border, styles.borderGray300, styles.roundedLg, { paddingVertical: 12 }, styles.flexRow, styles.itemsCenter, styles.justifyCenter]}
              onPress={handleEditProfile}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={18} color="#374151" />
              <Text style={[styles.textGray700, styles.fontMedium, styles.ml2]}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.mt8, { paddingTop: 24 }, styles.borderT, styles.borderGray200]}>
            <Text style={[styles.fontSemibold, styles.textGray800, styles.mb4, styles.textBase]}>
              Collector Information
            </Text>

            <View>
              {/* License Number */}
              <View style={[styles.flexRow, styles.itemsCenter, styles.justifyBetween, { paddingVertical: 12 }]}>
                <View style={[styles.flexRow, styles.itemsCenter, styles.flex1]}>
                  <Ionicons name="document-text-outline" size={18} color="#6B7280" />
                  <View style={[styles.ml3, styles.flex1]}>
                    <Text style={[styles.textSm, styles.textGray500]}>License Number</Text>
                    <Text style={[styles.fontMedium, styles.textGray900]}>
                      {user.license_number || 'Not provided'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Vehicle */}
              <View style={[styles.flexRow, styles.itemsCenter, styles.justifyBetween, { paddingVertical: 12 }]}>
                <View style={[styles.flexRow, styles.itemsCenter, styles.flex1]}>
                  <Ionicons name="car-outline" size={18} color="#6B7280" />
                  <View style={[styles.ml3, styles.flex1]}>
                    <Text style={[styles.textSm, styles.textGray500]}>Vehicle</Text>
                    <Text style={[styles.fontMedium, styles.textGray900]}>
                      {user.vehicle_type || 'Not assigned'}
                    </Text>
                    {user.vehicle_plate_number && (
                      <Text style={[styles.textXs, styles.textGray500, { marginTop: 2 }]}>
                        Plate: {user.vehicle_plate_number}
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Verification Status */}
              <View style={[styles.flexRow, styles.itemsCenter, styles.justifyBetween, { paddingVertical: 12 }]}>
                <View style={[styles.flexRow, styles.itemsCenter, styles.flex1]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#6B7280" />
                  <View style={[styles.ml3, styles.flex1]}>
                    <Text style={[styles.textSm, styles.textGray500]}>Verification Status</Text>
                    <View style={[styles.flexRow, styles.itemsCenter, styles.mt1]}>
                      {user.is_verified ? (
                        <>
                          <View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' }, styles.mr2]} />
                          <Text style={[styles.textGreen600, styles.fontMedium]}>Verified</Text>
                        </>
                      ) : (
                        <>
                          <View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EAB308' }, styles.mr2]} />
                          <Text style={[{ color: '#D97706' }, styles.fontMedium]}>Pending</Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.mt8, { paddingTop: 16 }]}>
            <TouchableOpacity
              style={[styles.wFull, styles.border, { borderColor: '#FCA5A5' }, styles.roundedLg, { paddingVertical: 12 }, styles.flexRow, styles.itemsCenter, styles.justifyCenter]}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={18} color="#DC2626" />
              <Text style={[styles.textRed600, styles.fontMedium, styles.ml2]}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
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
  justifyCenter: {
    justifyContent: 'center',
  },
  justifyBetween: {
    justifyContent: 'space-between',
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
  mt4: {
    marginTop: 16,
  },
  mt6: {
    marginTop: 24,
  },
  mt8: {
    marginTop: 32,
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
  ml3: {
    marginLeft: 12,
  },
  mr2: {
    marginRight: 8,
  },
  bgGray50: {
    backgroundColor: '#F9FAFB',
  },
  bgWhite: {
    backgroundColor: '#FFFFFF',
  },
  bgGreen100: {
    backgroundColor: '#DCFCE7',
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
  textGray800: {
    color: '#1F2937',
  },
  textGray900: {
    color: '#111827',
  },
  textGreen600: {
    color: '#16A34A',
  },
  textRed600: {
    color: '#DC2626',
  },
  textSm: {
    fontSize: 14,
  },
  textXs: {
    fontSize: 12,
  },
  textBase: {
    fontSize: 16,
  },
  text3xl: {
    fontSize: 30,
  },
  fontMedium: {
    fontWeight: '500',
  },
  fontSemibold: {
    fontWeight: '600',
  },
  fontBold: {
    fontWeight: '700',
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
  borderGray300: {
    borderColor: '#D1D5DB',
  },
  borderT: {
    borderTopWidth: 1,
  },
  h24: {
    height: 96,
  },
  w24: {
    width: 96,
  },
  wFull: {
    width: '100%',
  },
});