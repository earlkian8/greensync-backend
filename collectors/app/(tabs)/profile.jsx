import React, { useState, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../_layout';

export default function Profile() {
  const { user, logout } = useContext(AuthContext);
  const [isActive, setIsActive] = useState(user?.is_active || false);

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
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Profile Info */}
      <View className="p-4">
        <View className="bg-white rounded-lg p-6 border border-gray-200">
          <View className="items-center">
            {user.profile_image ? (
              <Image
                source={{ uri: user.profile_image }}
                className="h-24 w-24 rounded-full border-4 border-green-100"
              />
            ) : (
              <View className="h-24 w-24 rounded-full bg-green-100 items-center justify-center border-4 border-green-50">
                <Text className="text-3xl font-bold text-green-600">
                  {user.name?.charAt(0) || 'C'}
                </Text>
              </View>
            )}

            <Text className="mt-4 text-xl font-bold text-gray-900">
              {user.name || 'Collector'}
            </Text>
            <Text className="text-gray-600 mt-1">{user.email || 'No email provided'}</Text>

            <View className="flex-row items-center mt-2">
              <Ionicons name="card-outline" size={16} color="#16A34A" />
              <Text className="text-sm text-gray-600 ml-1">
                Employee ID: {user.employee_id || 'N/A'}
              </Text>
            </View>

            <TouchableOpacity
              className="w-full mt-6 border border-gray-300 rounded-lg py-3 flex-row items-center justify-center active:bg-gray-50"
              onPress={handleEditProfile}
            >
              <Ionicons name="create-outline" size={18} color="#374151" />
              <Text className="text-gray-700 font-medium ml-2">Edit Profile</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-8 pt-6 border-t border-gray-200">
            <Text className="font-semibold text-gray-800 mb-4 text-base">
              Collector Information
            </Text>

            <View className="space-y-4">
              {/* License Number */}
              <View className="flex-row items-center justify-between py-3">
                <View className="flex-row items-center flex-1">
                  <Ionicons name="document-text-outline" size={18} color="#6B7280" />
                  <View className="ml-3 flex-1">
                    <Text className="text-sm text-gray-500">License Number</Text>
                    <Text className="font-medium text-gray-900">
                      {user.license_number || 'Not provided'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Vehicle */}
              <View className="flex-row items-center justify-between py-3">
                <View className="flex-row items-center flex-1">
                  <Ionicons name="car-outline" size={18} color="#6B7280" />
                  <View className="ml-3 flex-1">
                    <Text className="text-sm text-gray-500">Vehicle</Text>
                    <Text className="font-medium text-gray-900">
                      {user.vehicle_type || 'Not assigned'}
                    </Text>
                    {user.vehicle_plate_number && (
                      <Text className="text-xs text-gray-500 mt-0.5">
                        Plate: {user.vehicle_plate_number}
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Verification Status */}
              <View className="flex-row items-center justify-between py-3">
                <View className="flex-row items-center flex-1">
                  <Ionicons name="shield-checkmark-outline" size={18} color="#6B7280" />
                  <View className="ml-3 flex-1">
                    <Text className="text-sm text-gray-500">Verification Status</Text>
                    <View className="flex-row items-center mt-1">
                      {user.is_verified ? (
                        <>
                          <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                          <Text className="text-green-600 font-medium">Verified</Text>
                        </>
                      ) : (
                        <>
                          <View className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
                          <Text className="text-yellow-600 font-medium">Pending</Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View className="mt-8 pt-4">
            <TouchableOpacity
              className="w-full border border-red-300 rounded-lg py-3 flex-row items-center justify-center active:bg-red-50"
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={18} color="#DC2626" />
              <Text className="text-red-600 font-medium ml-2">Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}