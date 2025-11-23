import React, { useState, useContext, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, StyleSheet, RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../_layout';
import collectorProfileService from '@/services/collectorProfileService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Profile() {
  const { user, logout, setUser } = useContext(AuthContext);
  const [isActive, setIsActive] = useState(user?.is_active || false);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    license_number: '',
    vehicle_plate_number: '',
    vehicle_type: '',
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageUri, setImageUri] = useState(null);

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

  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          phone_number: user.phone_number || '',
          license_number: user.license_number || '',
          vehicle_plate_number: user.vehicle_plate_number || '',
          vehicle_type: user.vehicle_type || '',
        });
        // Set image URL if profile_image exists
        if (user.profile_image) {
          const imageUrl = await collectorProfileService.getImageUrl(user.profile_image);
          setImageUri(imageUrl);
        } else {
          setImageUri(null);
        }
      }
    };
    loadUserData();
  }, [user]);

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to select an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0]);
      setImageUri(result.assets[0].uri);
    }
  };

  const handleUpdateProfile = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert('Validation Error', 'Name and email are required.');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      if (formData.phone_number) {
        formDataToSend.append('phone_number', formData.phone_number);
      }
      if (formData.license_number) {
        formDataToSend.append('license_number', formData.license_number);
      }
      if (formData.vehicle_plate_number) {
        formDataToSend.append('vehicle_plate_number', formData.vehicle_plate_number);
      }
      if (formData.vehicle_type) {
        formDataToSend.append('vehicle_type', formData.vehicle_type);
      }

      if (selectedImage) {
        const filename = selectedImage.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        formDataToSend.append('profile_image', {
          uri: selectedImage.uri,
          name: filename,
          type: type,
        });
      }

      const response = await collectorProfileService.updateProfile(formDataToSend);
      
      // Update user in context and storage
      const updatedUser = response.collector;
      setUser(updatedUser);
      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
      
      Alert.alert('Success', 'Profile updated successfully!');
      setShowEditModal(false);
      setSelectedImage(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to update profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
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
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
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

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={[styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.mb4]}>
              <Text style={[styles.textXl, styles.fontBold, styles.textGray900]}>Edit Profile</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowEditModal(false);
                  setSelectedImage(null);
                }}
                style={[styles.p2]}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Profile Image */}
              <View style={[styles.itemsCenter, styles.mb4]}>
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={[styles.h20, styles.w20, styles.roundedFull, { borderWidth: 2, borderColor: '#DCFCE7' }]}
                  />
                ) : (
                  <View style={[styles.h20, styles.w20, styles.roundedFull, styles.bgGreen100, styles.itemsCenter, styles.justifyCenter]}>
                    <Text style={[styles.text2xl, styles.fontBold, styles.textGreen600]}>
                      {formData.name?.charAt(0) || 'C'}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  onPress={pickImage}
                  style={[styles.mt2, styles.px4, styles.py2, styles.bgGreen100, styles.roundedLg]}
                >
                  <Text style={[styles.textSm, styles.textGreen700, styles.fontMedium]}>
                    {imageUri ? 'Change Photo' : 'Select Photo'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Name */}
              <View style={styles.mb4}>
                <Text style={[styles.textSm, styles.fontMedium, styles.textGray700, styles.mb2]}>Name *</Text>
                <TextInput
                  style={[styles.input]}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter your name"
                />
              </View>

              {/* Email */}
              <View style={styles.mb4}>
                <Text style={[styles.textSm, styles.fontMedium, styles.textGray700, styles.mb2]}>Email *</Text>
                <TextInput
                  style={[styles.input]}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Phone Number */}
              <View style={styles.mb4}>
                <Text style={[styles.textSm, styles.fontMedium, styles.textGray700, styles.mb2]}>Phone Number</Text>
                <TextInput
                  style={[styles.input]}
                  value={formData.phone_number}
                  onChangeText={(text) => setFormData({ ...formData, phone_number: text })}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                />
              </View>

              {/* License Number */}
              <View style={styles.mb4}>
                <Text style={[styles.textSm, styles.fontMedium, styles.textGray700, styles.mb2]}>License Number</Text>
                <TextInput
                  style={[styles.input]}
                  value={formData.license_number}
                  onChangeText={(text) => setFormData({ ...formData, license_number: text })}
                  placeholder="Enter your license number"
                />
              </View>

              {/* Vehicle Plate Number */}
              <View style={styles.mb4}>
                <Text style={[styles.textSm, styles.fontMedium, styles.textGray700, styles.mb2]}>Vehicle Plate Number</Text>
                <TextInput
                  style={[styles.input]}
                  value={formData.vehicle_plate_number}
                  onChangeText={(text) => setFormData({ ...formData, vehicle_plate_number: text })}
                  placeholder="Enter vehicle plate number"
                />
              </View>

              {/* Vehicle Type */}
              <View style={styles.mb4}>
                <Text style={[styles.textSm, styles.fontMedium, styles.textGray700, styles.mb2]}>Vehicle Type</Text>
                <TextInput
                  style={[styles.input]}
                  value={formData.vehicle_type}
                  onChangeText={(text) => setFormData({ ...formData, vehicle_type: text })}
                  placeholder="Enter vehicle type"
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleUpdateProfile}
                disabled={loading}
                style={[
                  styles.wFull,
                  styles.py3,
                  styles.bgGreen600,
                  styles.roundedLg,
                  styles.itemsCenter,
                  loading && styles.opacity50,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={[styles.textWhite, styles.fontSemibold]}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  textXl: {
    fontSize: 20,
  },
  text2xl: {
    fontSize: 24,
  },
  h20: {
    height: 80,
  },
  w20: {
    width: 80,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: 20,
    paddingBottom: 40,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  bgGreen600: {
    backgroundColor: '#16A34A',
  },
  textWhite: {
    color: '#FFFFFF',
  },
  opacity50: {
    opacity: 0.5,
  },
  py3: {
    paddingVertical: 12,
  },
});