import { View, Text, ScrollView, Pressable, TextInput, Image, ActivityIndicator, Animated, RefreshControl, StyleSheet } from "react-native";
import { useState, useContext, useRef, useEffect } from "react";
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AuthContext } from "../_layout";
import { api } from '@/config/api';
import AddressDropdown from '@/components/AddressDropdown';
import { fetchResidentProfile } from '@/services/profileService';
import {
  fetchRegions,
  fetchProvincesByRegion,
  fetchCitiesByProvince,
  fetchBarangaysByCity
} from '@/services/philippineAddressService';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    house_no: user?.house_no || '',
    street: user?.street || '',
    region_id: user?.region_id || null,
    province_id: user?.province_id || null,
    city_id: user?.city_id || null,
    barangay_id: user?.barangay_id || null,
    country: user?.country || '',
    postal_code: user?.postal_code || ''
  });

  // Address dropdown states
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingBarangays, setLoadingBarangays] = useState(false);

  useEffect(() => {
    if (successMessage || errorMessage) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [successMessage, errorMessage]);

  // Load regions on mount
  useEffect(() => {
    const loadRegions = async () => {
      setLoadingRegions(true);
      const result = await fetchRegions();
      if (result.success) {
        setRegions(result.data);
      }
      setLoadingRegions(false);
    };
    loadRegions();
  }, []);

  // Load user profile data when editing starts
  useEffect(() => {
    if (isEditing) {
      loadUserProfile();
    } else {
      // Reset dropdowns when not editing
      setProvinces([]);
      setCities([]);
      setBarangays([]);
    }
  }, [isEditing]);


  // Track previous region to detect changes
  const prevRegionIdRef = useRef(user?.region_id || null);
  const prevProvinceIdRef = useRef(user?.province_id || null);
  const prevCityIdRef = useRef(user?.city_id || null);
  
  // Fetch provinces when region is selected
  useEffect(() => {
    if (formData.region_id && isEditing) {
      const regionChanged = prevRegionIdRef.current !== null && prevRegionIdRef.current !== formData.region_id;
      prevRegionIdRef.current = formData.region_id;
      
      const loadProvinces = async () => {
        setLoadingProvinces(true);
        const result = await fetchProvincesByRegion(formData.region_id);
        if (result.success) {
          setProvinces(result.data);
          // Only reset if region actually changed
          if (regionChanged) {
            setFormData(prev => ({ ...prev, province_id: null, city_id: null, barangay_id: null }));
            setCities([]);
            setBarangays([]);
          }
        }
        setLoadingProvinces(false);
      };
      loadProvinces();
    } else if (!formData.region_id) {
      setProvinces([]);
    }
  }, [formData.region_id, isEditing]);

  // Fetch cities when province is selected
  useEffect(() => {
    if (formData.province_id && isEditing) {
      const provinceChanged = prevProvinceIdRef.current !== null && prevProvinceIdRef.current !== formData.province_id;
      prevProvinceIdRef.current = formData.province_id;
      
      const loadCities = async () => {
        setLoadingCities(true);
        const result = await fetchCitiesByProvince(formData.province_id);
        if (result.success) {
          setCities(result.data);
          // Only reset if province actually changed
          if (provinceChanged) {
            setFormData(prev => ({ ...prev, city_id: null, barangay_id: null }));
            setBarangays([]);
          }
        }
        setLoadingCities(false);
      };
      loadCities();
    } else if (!formData.province_id) {
      setCities([]);
    }
  }, [formData.province_id, isEditing]);

  // Fetch barangays when city is selected
  useEffect(() => {
    if (formData.city_id && isEditing) {
      const cityChanged = prevCityIdRef.current !== null && prevCityIdRef.current !== formData.city_id;
      prevCityIdRef.current = formData.city_id;
      
      const loadBarangays = async () => {
        setLoadingBarangays(true);
        const result = await fetchBarangaysByCity(formData.city_id);
        if (result.success) {
          setBarangays(result.data);
          // Only reset if city actually changed
          if (cityChanged) {
            setFormData(prev => ({ ...prev, barangay_id: null }));
          }
        }
        setLoadingBarangays(false);
      };
      loadBarangays();
    } else if (!formData.city_id) {
      setBarangays([]);
    }
  }, [formData.city_id, isEditing]);

  const loadUserProfile = async () => {
    const result = await fetchResidentProfile();
    if (result.success && result.data) {
      const profile = result.data;
      const newRegionId = profile.region_id || null;
      const newProvinceId = profile.province_id || null;
      const newCityId = profile.city_id || null;
      const newBarangayId = profile.barangay_id || null;
      
      setFormData(prev => ({
        ...prev,
        name: profile.name || '',
        email: profile.email || '',
        phone_number: profile.phone_number || '',
        house_no: profile.house_no || '',
        street: profile.street || '',
        region_id: newRegionId,
        province_id: newProvinceId,
        city_id: newCityId,
        barangay_id: newBarangayId,
        country: profile.country || '',
        postal_code: profile.postal_code || ''
      }));

      // Reset refs for change detection
      prevRegionIdRef.current = newRegionId;
      prevProvinceIdRef.current = newProvinceId;
      prevCityIdRef.current = newCityId;

      // Load dropdowns based on existing IDs
      if (newRegionId) {
        const provincesResult = await fetchProvincesByRegion(newRegionId);
        if (provincesResult.success) {
          setProvinces(provincesResult.data);
          
          if (newProvinceId) {
            const citiesResult = await fetchCitiesByProvince(newProvinceId);
            if (citiesResult.success) {
              setCities(citiesResult.data);
              
              if (newCityId) {
                const barangaysResult = await fetchBarangaysByCity(newCityId);
                if (barangaysResult.success) {
                  setBarangays(barangaysResult.data);
                }
              }
            }
          }
        }
      }
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await api.post('v1/resident/logout');
      // Call the logout function from context which handles token removal and navigation
      await logout();
    } catch (error) {
      // Even if API call fails, logout locally
      await logout();
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear field error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.region_id) newErrors.region_id = "Region is required";
    if (!formData.province_id) newErrors.province_id = "Province is required";
    if (!formData.city_id) newErrors.city_id = "City is required";
    if (!formData.barangay_id) newErrors.barangay_id = "Barangay is required";

    if (formData.phone_number.trim() && formData.phone_number.length > 20) {
      newErrors.phone_number = "Phone number must not exceed 20 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    setSuccessMessage("");
    setErrorMessage("");

    if (!validateForm()) {
      setErrorMessage("Please fill in all required fields correctly.");
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone_number: formData.phone_number.trim() || null,
        house_no: formData.house_no.trim() || null,
        street: formData.street.trim() || null,
        region_id: formData.region_id || null,
        province_id: formData.province_id || null,
        city_id: formData.city_id || null,
        barangay_id: formData.barangay_id || null,
        country: formData.country.trim() || null,
        postal_code: formData.postal_code.trim() || null
      };

      const response = await api.put('v1/resident/profile', updateData);

      if (response.data) {
        setSuccessMessage("Profile updated successfully!");
        setIsEditing(false);
        // Update user context if you have setUser function
        // setUser(response.data.resident);
      }
    } catch (error) {
      
      let errMsg = "Failed to update profile. Please try again.";
      
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const fieldErrors = {};
        Object.keys(validationErrors).forEach(key => {
          fieldErrors[key] = validationErrors[key][0];
        });
        setErrors(fieldErrors);
        errMsg = "Please correct the errors in the form.";
      } else if (error.response?.data?.message) {
        errMsg = error.response.data.message;
      }
      
      setErrorMessage(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    setSuccessMessage("");
    setErrorMessage("");
    // Reset form data to original user data
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone_number: user?.phone_number || '',
      house_no: user?.house_no || '',
      street: user?.street || '',
      region_id: user?.region_id || null,
      province_id: user?.province_id || null,
      city_id: user?.city_id || null,
      barangay_id: user?.barangay_id || null,
      country: user?.country || '',
      postal_code: user?.postal_code || ''
    });
    // Reset dropdowns
    setProvinces([]);
    setCities([]);
    setBarangays([]);
    // Reset refs
    prevRegionIdRef.current = user?.region_id || null;
    prevProvinceIdRef.current = user?.province_id || null;
    prevCityIdRef.current = user?.city_id || null;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const result = await fetchResidentProfile();
    if (result.success && result.data) {
      const profile = result.data;
      setFormData(prev => ({
        ...prev,
        name: profile.name || '',
        email: profile.email || '',
        phone_number: profile.phone_number || '',
        house_no: profile.house_no || '',
        street: profile.street || '',
        region_id: profile.region_id || null,
        province_id: profile.province_id || null,
        city_id: profile.city_id || null,
        barangay_id: profile.barangay_id || null,
        country: profile.country || '',
        postal_code: profile.postal_code || ''
      }));
    }
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh} 
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {user?.profile_image ? (
                <Image 
                  source={{ uri: user.profile_image }} 
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Feather name="user" size={40} color="#16A34A" />
                </View>
              )}
            </View>
            <Pressable style={styles.cameraButton}>
              <Feather name="camera" size={16} color="white" />
            </Pressable>
          </View>
          <Text style={styles.profileName}>{formData.name || 'User'}</Text>
          <Text style={styles.profileLocation}>
            {user?.barangay_relation?.name || user?.barangay 
              ? `${user?.barangay_relation?.name || user?.barangay}, ${user?.city_relation?.name || user?.city}` 
              : 'No address set'}
          </Text>
          {!isEditing && (
            <Pressable
              onPress={() => setIsEditing(true)}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.content}>
          {/* Success Message Banner */}
          {successMessage ? (
            <Animated.View 
              style={[styles.successBanner, { opacity: fadeAnim }]}
            >
              <View style={styles.bannerContent}>
                <View style={styles.successIconContainer}>
                  <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
                </View>
                <View style={styles.bannerTextContainer}>
                  <Text style={styles.successBannerTitle}>Success!</Text>
                  <Text style={styles.successBannerText}>{successMessage}</Text>
                </View>
                <Pressable onPress={() => setSuccessMessage("")}>
                  <Ionicons name="close" size={20} color="#16A34A" />
                </Pressable>
              </View>
            </Animated.View>
          ) : null}

          {/* Error Message Banner */}
          {errorMessage ? (
            <Animated.View 
              style={[styles.errorBanner, { opacity: fadeAnim }]}
            >
              <View style={styles.bannerContent}>
                <View style={styles.errorIconContainer}>
                  <Ionicons name="alert-circle" size={24} color="#DC2626" />
                </View>
                <View style={styles.bannerTextContainer}>
                  <Text style={styles.errorBannerTitle}>Error</Text>
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
                <Pressable onPress={() => setErrorMessage("")}>
                  <Ionicons name="close" size={20} color="#DC2626" />
                </Pressable>
              </View>
            </Animated.View>
          ) : null}

          {isEditing ? (
            <View style={styles.editCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person-outline" size={20} color="#374151" style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>Edit Profile</Text>
              </View>
              
              <View style={styles.formFields}>
                {/* Full Name */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    Full Name <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    value={formData.name}
                    onChangeText={(value) => handleChange('name', value)}
                    style={[
                      styles.input,
                      errors.name && styles.inputError
                    ]}
                  />
                  {errors.name && (
                    <View style={styles.errorBox}>
                      <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                      <Text style={styles.errorBoxText}>{errors.name}</Text>
                    </View>
                  )}
                </View>

                {/* Email */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    Email <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    value={formData.email}
                    onChangeText={(value) => handleChange('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[
                      styles.input,
                      errors.email && styles.inputError
                    ]}
                  />
                  {errors.email && (
                    <View style={styles.errorBox}>
                      <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                      <Text style={styles.errorBoxText}>{errors.email}</Text>
                    </View>
                  )}
                </View>

                {/* Phone Number */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    value={formData.phone_number}
                    onChangeText={(value) => handleChange('phone_number', value)}
                    keyboardType="phone-pad"
                    maxLength={20}
                    placeholder="Optional"
                    style={[
                      styles.input,
                      errors.phone_number && styles.inputError
                    ]}
                  />
                  {errors.phone_number && (
                    <View style={styles.errorBox}>
                      <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                      <Text style={styles.errorBoxText}>{errors.phone_number}</Text>
                    </View>
                  )}
                </View>

                {/* House No & Street */}
                <View style={styles.rowInputs}>
                  <View style={styles.halfInput}>
                    <Text style={styles.label}>House No</Text>
                    <TextInput
                      value={formData.house_no}
                      onChangeText={(value) => handleChange('house_no', value)}
                      maxLength={50}
                      placeholder="Optional"
                      style={styles.input}
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <Text style={styles.label}>Street</Text>
                    <TextInput
                      value={formData.street}
                      onChangeText={(value) => handleChange('street', value)}
                      placeholder="Optional"
                      style={styles.input}
                    />
                  </View>
                </View>

                {/* Region Dropdown */}
                <AddressDropdown
                  label="Region"
                  value={formData.region_id}
                  options={regions}
                  onSelect={(id) => {
                    handleChange('region_id', id);
                    if (errors.region_id) {
                      setErrors(prev => ({ ...prev, region_id: null }));
                    }
                  }}
                  placeholder="Select region"
                  error={errors.region_id}
                  loading={loadingRegions}
                  required
                />

                {/* Province Dropdown */}
                <AddressDropdown
                  label="Province"
                  value={formData.province_id}
                  options={provinces}
                  onSelect={(id) => {
                    handleChange('province_id', id);
                    if (errors.province_id) {
                      setErrors(prev => ({ ...prev, province_id: null }));
                    }
                  }}
                  placeholder={formData.region_id ? "Select province" : "Select region first"}
                  error={errors.province_id}
                  loading={loadingProvinces}
                  required
                  disabled={!formData.region_id}
                />

                {/* City Dropdown */}
                <AddressDropdown
                  label="City/Municipality"
                  value={formData.city_id}
                  options={cities}
                  onSelect={(id) => {
                    handleChange('city_id', id);
                    if (errors.city_id) {
                      setErrors(prev => ({ ...prev, city_id: null }));
                    }
                  }}
                  placeholder={formData.province_id ? "Select city" : "Select province first"}
                  error={errors.city_id}
                  loading={loadingCities}
                  required
                  disabled={!formData.province_id}
                />

                {/* Barangay Dropdown */}
                <AddressDropdown
                  label="Barangay"
                  value={formData.barangay_id}
                  options={barangays}
                  onSelect={(id) => {
                    handleChange('barangay_id', id);
                    if (errors.barangay_id) {
                      setErrors(prev => ({ ...prev, barangay_id: null }));
                    }
                  }}
                  placeholder={formData.city_id ? "Select barangay" : "Select city first"}
                  error={errors.barangay_id}
                  loading={loadingBarangays}
                  required
                  disabled={!formData.city_id}
                />

                {/* Country & Postal Code */}
                <View style={styles.rowInputs}>
                  <View style={styles.halfInput}>
                    <Text style={styles.label}>Country</Text>
                    <TextInput
                      value={formData.country}
                      onChangeText={(value) => handleChange('country', value)}
                      placeholder="Optional"
                      style={styles.input}
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <Text style={styles.label}>Postal Code</Text>
                    <TextInput
                      value={formData.postal_code}
                      onChangeText={(value) => handleChange('postal_code', value)}
                      keyboardType="number-pad"
                      maxLength={20}
                      placeholder="Optional"
                      style={styles.input}
                    />
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <Pressable
                  onPress={handleCancel}
                  disabled={loading}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  disabled={loading}
                  style={[
                    styles.saveButton,
                    loading && styles.saveButtonDisabled
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.infoCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="information-circle-outline" size={20} color="#374151" style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>Personal Information</Text>
              </View>
              
              <View style={styles.infoFields}>
                {/* Email */}
                <View style={styles.infoRow}>
                  <Feather name="mail" size={18} color="#6B7280" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{formData.email || 'Not set'}</Text>
                  </View>
                </View>

                {/* Phone */}
                <View style={styles.infoRow}>
                  <Feather name="phone" size={18} color="#6B7280" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>{formData.phone_number || 'Not set'}</Text>
                  </View>
                </View>

                {/* Address */}
                <View style={styles.infoRow}>
                  <Feather name="map-pin" size={18} color="#6B7280" style={{ marginTop: 2 }} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Address</Text>
                    <Text style={styles.infoValue}>
                      {[
                        formData.house_no,
                        formData.street,
                        user?.barangay_relation?.name || user?.barangay,
                        user?.city_relation?.name || user?.city,
                        user?.province_relation?.name || user?.province
                      ]
                        .filter(Boolean)
                        .join(', ') || 'Not set'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Logout Button */}
          <Pressable
            onPress={handleLogout}
            disabled={logoutLoading}
            style={[
              styles.logoutButton,
              logoutLoading && styles.logoutButtonDisabled
            ]}
          >
            {logoutLoading ? (
              <>
                <ActivityIndicator size="small" color="#DC2626" />
                <Text style={styles.logoutButtonText}>Logging out...</Text>
              </>
            ) : (
              <>
                <Feather name="log-out" size={18} color="#DC2626" />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 9999,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#16A34A',
    padding: 6,
    borderRadius: 9999,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  profileLocation: {
    color: '#4B5563',
    fontSize: 14,
    marginTop: 4,
  },
  editButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#16A34A',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  editButtonText: {
    color: '#16A34A',
    fontWeight: '500',
    fontSize: 14,
  },
  content: {
    paddingHorizontal: 20,
  },
  successBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  successIconContainer: {
    backgroundColor: '#D1FAE5',
    borderRadius: 9999,
    padding: 4,
    marginRight: 12,
  },
  errorIconContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 9999,
    padding: 4,
    marginRight: 12,
  },
  bannerTextContainer: {
    flex: 1,
  },
  successBannerTitle: {
    color: '#166534',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  successBannerText: {
    color: '#15803D',
    fontSize: 14,
  },
  errorBannerTitle: {
    color: '#991B1B',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 14,
  },
  editCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: 16,
    color: '#1F2937',
  },
  formFields: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#1F2937',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 4,
  },
  errorBoxText: {
    color: '#DC2626',
    fontSize: 12,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#16A34A',
    borderRadius: 8,
    paddingVertical: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#86EFAC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoFields: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoContent: {
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  logoutButtonDisabled: {
    backgroundColor: '#FEF2F2',
  },
  logoutButtonText: {
    color: '#DC2626',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default Profile;
