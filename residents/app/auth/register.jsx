import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Animated
} from "react-native";
import { useState, useRef, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from "expo-router";
import { api } from '@/config/api';
import AddressDropdown from '@/components/AddressDropdown';
import {
  fetchRegions,
  fetchProvincesByRegion,
  fetchCitiesByProvince,
  fetchBarangaysByCity
} from '@/services/philippineAddressService';

const Register = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef(null);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Address fields - new structure with IDs
  const [houseNo, setHouseNo] = useState("");
  const [street, setStreet] = useState("");
  const [regionId, setRegionId] = useState(null);
  const [provinceId, setProvinceId] = useState(null);
  const [cityId, setCityId] = useState(null);
  const [barangayId, setBarangayId] = useState(null);
  const [postalCode, setPostalCode] = useState("");
  const [profileImage, setProfileImage] = useState(null);

  // Address options for dropdowns
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  // Loading states for address dropdowns
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingBarangays, setLoadingBarangays] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // Animation for banners
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (generalError || successMessage) {
      // Scroll to top when error or success message appears
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [generalError, successMessage]);

  // Fetch regions on component mount
  useEffect(() => {
    const loadRegions = async () => {
      setLoadingRegions(true);
      const result = await fetchRegions();
      console.log('Regions fetch result:', result);
      if (result.success) {
        console.log('Setting regions:', result.data);
        setRegions(result.data);
      } else {
        console.error('Failed to fetch regions:', result.error);
        setGeneralError(`Failed to load regions: ${result.error}`);
      }
      setLoadingRegions(false);
    };
    loadRegions();
  }, []);

  // Fetch provinces when region is selected
  useEffect(() => {
    if (regionId) {
      const loadProvinces = async () => {
        setLoadingProvinces(true);
        setProvinces([]);
        setCities([]);
        setBarangays([]);
        setProvinceId(null);
        setCityId(null);
        setBarangayId(null);
        const result = await fetchProvincesByRegion(regionId);
        if (result.success) {
          setProvinces(result.data);
        }
        setLoadingProvinces(false);
      };
      loadProvinces();
    } else {
      setProvinces([]);
      setProvinceId(null);
    }
  }, [regionId]);

  // Fetch cities when province is selected
  useEffect(() => {
    if (provinceId) {
      const loadCities = async () => {
        setLoadingCities(true);
        setCities([]);
        setBarangays([]);
        setCityId(null);
        setBarangayId(null);
        const result = await fetchCitiesByProvince(provinceId);
        if (result.success) {
          setCities(result.data);
        }
        setLoadingCities(false);
      };
      loadCities();
    } else {
      setCities([]);
      setCityId(null);
    }
  }, [provinceId]);

  // Fetch barangays when city is selected
  useEffect(() => {
    if (cityId) {
      const loadBarangays = async () => {
        setLoadingBarangays(true);
        setBarangays([]);
        setBarangayId(null);
        const result = await fetchBarangaysByCity(cityId);
        if (result.success) {
          setBarangays(result.data);
        }
        setLoadingBarangays(false);
      };
      loadBarangays();
    } else {
      setBarangays([]);
      setBarangayId(null);
    }
  }, [cityId]);

  const validateForm = () => {
    const newErrors = {};

    // Required fields - must match backend validation
    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }
    
    // Password validation - must be at least 6 characters to match backend
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    // Address fields - new structure validation
    if (!regionId) newErrors.region_id = "Region is required";
    if (!provinceId) newErrors.province_id = "Province is required";
    if (!cityId) newErrors.city_id = "City is required";
    if (!barangayId) newErrors.barangay_id = "Barangay is required";

    // Phone number validation (max 20 chars if provided)
    if (phoneNumber.trim() && phoneNumber.length > 20) {
      newErrors.phoneNumber = "Phone number must not exceed 20 characters";
    }

    // Postal code validation (max 20 chars if provided)
    if (postalCode.trim() && postalCode.length > 20) {
      newErrors.postalCode = "Postal code must not exceed 20 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  

  const handleSelectProfileImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.status !== "granted") {
          setGeneralError("Media library permission is required to select a profile image.");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.length) {
        setProfileImage(result.assets[0]);
        clearError('profile_image');
      }
    } catch (error) {
      console.error("Image picker error:", error);
      setGeneralError(error?.message ?? "Unable to select image. Please try again.");
    }
  };

  function getMimeType(uri) {
    const ext = uri.split('.').pop().toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      default:
        return 'image/jpeg';
    }
  }
  
  const handleRegister = async () => {
    // Clear previous messages
    setGeneralError("");
    setSuccessMessage("");
    
    if (!validateForm()) {
      setGeneralError("Please fill in all required fields correctly.");
      return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim().toLowerCase());
      formData.append('password', password);
      formData.append('region_id', String(regionId));
      formData.append('province_id', String(provinceId));
      formData.append('city_id', String(cityId));
      formData.append('barangay_id', String(barangayId));

      if (phoneNumber.trim()) formData.append('phone_number', phoneNumber.trim());
      if (houseNo.trim()) formData.append('house_no', houseNo.trim());
      if (street.trim()) formData.append('street', street.trim());
      if (postalCode.trim()) formData.append('postal_code', postalCode.trim());

      if (profileImage) {
        const fileType = getMimeType(profileImage.uri);
        const fileExtension = fileType.split('/')[1] || 'jpeg';
        const fileName = profileImage.fileName || `profile_${Date.now()}.${fileExtension}`;

        if (Platform.OS === "web") {
          const response = await fetch(profileImage.uri);
          const blob = await response.blob();
          const typedBlob =
            blob.type && blob.type !== 'application/octet-stream'
              ? blob
              : new Blob([blob], { type: fileType });
          const file =
            typeof File !== "undefined"
              ? new File([typedBlob], fileName, { type: fileType })
              : typedBlob;
          formData.append('profile_image', file, fileName);
        } else {
          formData.append('profile_image', {
            uri: profileImage.uri,
            name: fileName,
            type: fileType,
          });
        }
      }
      
      const response = await api.post('v1/resident/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
      });

      if (response.data) {
        setSuccessMessage("Account created successfully! Redirecting to login...");
        
        // Clear form
        setName("");
        setEmail("");
        setPhoneNumber("");
        setPassword("");
        setConfirmPassword("");
        setHouseNo("");
        setStreet("");
        setRegionId(null);
        setProvinceId(null);
        setCityId(null);
        setBarangayId(null);
        setPostalCode("");
        setProfileImage(null);
        setErrors({});
        
        // Navigate to login after 2 seconds
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    } catch (error) {
      console.error("Registration error:", error);
      
      let errorMessage = "An error occurred during registration. Please try again.";
      const fieldErrors = {};
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (data?.errors) {
          // Laravel validation errors - map to specific fields
          Object.keys(data.errors).forEach(key => {
            fieldErrors[key] = data.errors[key][0];
          });
          setErrors(fieldErrors);
          
          // Create user-friendly general error message
          const errorCount = Object.keys(fieldErrors).length;
          errorMessage = `Please correct ${errorCount} ${errorCount === 1 ? 'error' : 'errors'} in the form.`;
        } else if (data?.message) {
          errorMessage = data.message;
        } else if (status === 422) {
          errorMessage = "The provided information is invalid. Please check your inputs.";
        } else if (status === 409) {
          errorMessage = "An account with this email already exists.";
        } else if (status >= 500) {
          errorMessage = "Our server is having issues. Please try again in a moment.";
        }
      } else if (error.request) {
        errorMessage = "Unable to reach the server. Please check your internet connection and try again.";
      }
      
      setGeneralError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field) => {
    if (errors[field]) {
      setErrors({...errors, [field]: null});
    }
    if (generalError) {
      setGeneralError("");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ paddingVertical: 40, paddingHorizontal: 24 }}
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center">

          <View className="items-center mb-8">
            <Image
              source={require("@/assets/logo/whitebg.png")}
              style={{ width: 3000, height: 150, resizeMode: "contain" }}
            />
            <Text className="text-gray-600 text-lg font-medium mt-2">
              Smart Waste Management
            </Text>
          </View>

          <View className="w-full max-w-sm">
            {/* Success Message Banner */}
            {successMessage ? (
              <Animated.View 
                style={{ opacity: fadeAnim }}
                className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4"
              >
                <View className="flex-row items-start">
                  <View className="bg-green-100 rounded-full p-1 mr-3">
                    <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-green-900 text-base font-semibold mb-1">
                      Registration Successful!
                    </Text>
                    <Text className="text-green-800 text-sm leading-5">
                      {successMessage}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            ) : null}

            {/* Error Message Banner */}
            {generalError ? (
              <Animated.View 
                style={{ opacity: fadeAnim }}
                className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
              >
                <View className="flex-row items-start">
                  <View className="bg-red-100 rounded-full p-1 mr-3">
                    <Ionicons name="alert-circle" size={24} color="#DC2626" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-red-900 text-base font-semibold mb-1">
                      Registration Failed
                    </Text>
                    <Text className="text-red-800 text-sm leading-5">
                      {generalError}
                    </Text>
                    {Object.keys(errors).length > 0 && (
                      <Text className="text-red-700 text-xs mt-2 italic">
                        Check the highlighted fields below for details.
                      </Text>
                    )}
                  </View>
                  <Pressable onPress={() => setGeneralError("")} className="ml-2">
                    <Ionicons name="close" size={20} color="#DC2626" />
                  </Pressable>
                </View>
              </Animated.View>
            ) : null}

            {/* Personal Information Section */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Ionicons name="person-outline" size={20} color="#374151" style={{ marginRight: 6 }} />
                <Text className="text-lg font-bold text-gray-800">
                  Personal Information
                </Text>
              </View>
              
              <View className="mb-4">
                <Text className="text-gray-700 mb-1 font-medium">
                  Full Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  placeholder="Enter your full name"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    clearError('name');
                  }}
                  className={`border ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'} w-full rounded-lg p-3 text-base`}
                />
                {errors.name && (
                  <View className="flex-row items-center mt-1 bg-red-50 p-2 rounded">
                    <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                    <Text className="text-red-600 text-xs flex-1">{errors.name}</Text>
                  </View>
                )}
              </View>

              <View className="mb-4">
                <Text className="text-gray-700 mb-1 font-medium">
                  Email <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    clearError('email');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className={`border ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'} w-full rounded-lg p-3 text-base`}
                />
                {errors.email && (
                  <View className="flex-row items-center mt-1 bg-red-50 p-2 rounded">
                    <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                    <Text className="text-red-600 text-xs flex-1">{errors.email}</Text>
                  </View>
                )}
              </View>

              <View className="mb-4">
                <Text className="text-gray-700 mb-1 font-medium">Phone Number</Text>
                <TextInput
                  placeholder="e.g., +63 912 345 6789 (Optional)"
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    clearError('phone_number');
                  }}
                  keyboardType="phone-pad"
                  maxLength={20}
                  className={`border ${errors.phone_number ? 'border-red-500 bg-red-50' : 'border-gray-300'} w-full rounded-lg p-3 text-base`}
                />
                {errors.phone_number && (
                  <View className="flex-row items-center mt-1 bg-red-50 p-2 rounded">
                    <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                    <Text className="text-red-600 text-xs flex-1">{errors.phone_number}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Address Information Section */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Ionicons name="location-outline" size={20} color="#374151" style={{ marginRight: 6 }} />
                <Text className="text-lg font-bold text-gray-800">
                  Address Information
                </Text>
              </View>

              <View className="flex-row mb-4 gap-2">
                <View className="flex-1">
                  <Text className="text-gray-700 mb-1 font-medium">House No.</Text>
                  <TextInput
                    placeholder="Optional"
                    value={houseNo}
                    onChangeText={(text) => {
                      setHouseNo(text);
                      clearError('house_no');
                    }}
                    maxLength={50}
                    className={`border ${errors.house_no ? 'border-red-500 bg-red-50' : 'border-gray-300'} w-full rounded-lg p-3 text-base`}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-700 mb-1 font-medium">Street</Text>
                  <TextInput
                    placeholder="Optional"
                    value={street}
                    onChangeText={(text) => {
                      setStreet(text);
                      clearError('street');
                    }}
                    className={`border ${errors.street ? 'border-red-500 bg-red-50' : 'border-gray-300'} w-full rounded-lg p-3 text-base`}
                  />
                </View>
              </View>

              {/* Region Dropdown */}
              <AddressDropdown
                label="Region"
                value={regionId}
                options={regions}
                onSelect={(id) => {
                  setRegionId(id);
                  clearError('region_id');
                }}
                placeholder="Select region"
                error={errors.region_id}
                loading={loadingRegions}
                required
              />

              {/* Province Dropdown */}
              <AddressDropdown
                label="Province"
                value={provinceId}
                options={provinces}
                onSelect={(id) => {
                  setProvinceId(id);
                  clearError('province_id');
                }}
                placeholder={regionId ? "Select province" : "Select region first"}
                error={errors.province_id}
                loading={loadingProvinces}
                required
                disabled={!regionId}
              />

              {/* City Dropdown */}
              <AddressDropdown
                label="City/Municipality"
                value={cityId}
                options={cities}
                onSelect={(id) => {
                  setCityId(id);
                  clearError('city_id');
                }}
                placeholder={provinceId ? "Select city" : "Select province first"}
                error={errors.city_id}
                loading={loadingCities}
                required
                disabled={!provinceId}
              />

              {/* Barangay Dropdown */}
              <AddressDropdown
                label="Barangay"
                value={barangayId}
                options={barangays}
                onSelect={(id) => {
                  setBarangayId(id);
                  clearError('barangay_id');
                }}
                placeholder={cityId ? "Select barangay" : "Select city first"}
                error={errors.barangay_id}
                loading={loadingBarangays}
                required
                disabled={!cityId}
              />

              {/* Postal Code */}
              <View className="mb-4">
                <Text className="text-gray-700 mb-1 font-medium">Postal Code</Text>
                <TextInput
                  placeholder="Optional"
                  value={postalCode}
                  onChangeText={(text) => {
                    setPostalCode(text);
                    clearError('postal_code');
                  }}
                  keyboardType="number-pad"
                  maxLength={20}
                  className={`border ${errors.postal_code ? 'border-red-500 bg-red-50' : 'border-gray-300'} w-full rounded-lg p-3 text-base`}
                />
                {errors.postal_code && (
                  <View className="flex-row items-center mt-1 bg-red-50 p-2 rounded">
                    <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                    <Text className="text-red-600 text-xs flex-1">{errors.postal_code}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Profile Image Section */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Ionicons name="image-outline" size={20} color="#374151" style={{ marginRight: 6 }} />
                <Text className="text-lg font-bold text-gray-800">
                  Profile Photo
                </Text>
              </View>

              <View className="items-center">
                <View className="w-28 h-28 rounded-full bg-gray-100 border border-dashed border-gray-300 overflow-hidden mb-3 justify-center items-center">
                  {profileImage ? (
                    <Image
                      source={{ uri: profileImage.uri }}
                      style={{ width: '100%', height: '100%' }}
                    />
                  ) : (
                    <Ionicons name="person-circle-outline" size={64} color="#9CA3AF" />
                  )}
                </View>

                <TouchableOpacity
                  className="px-4 py-2 bg-white border border-gray-300 rounded-full flex-row items-center"
                  onPress={handleSelectProfileImage}
                >
                  <Ionicons name="cloud-upload-outline" size={18} color="#16A34A" style={{ marginRight: 6 }} />
                  <Text className="text-green-600 font-medium">
                    {profileImage ? "Change Photo" : "Upload Photo (Optional)"}
                  </Text>
                </TouchableOpacity>

                {errors.profile_image && (
                  <View className="flex-row items-center mt-2 bg-red-50 p-2 rounded">
                    <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                    <Text className="text-red-600 text-xs flex-1">{errors.profile_image}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Security Section */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Ionicons name="lock-closed-outline" size={20} color="#374151" style={{ marginRight: 6 }} />
                <Text className="text-lg font-bold text-gray-800">
                  Security
                </Text>
              </View>

              <View className="mb-4">
                <Text className="text-gray-700 mb-1 font-medium">
                  Password <Text className="text-red-500">*</Text>
                </Text>
                <View className="relative">
                  <TextInput
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      clearError('password');
                    }}
                    secureTextEntry={!showPassword}
                    className={`border ${errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'} w-full rounded-lg p-3 text-base pr-12`}
                  />
                  <Pressable 
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-0 bottom-0 justify-center"
                  >
                    <Ionicons 
                      name={showPassword ? "eye-outline" : "eye-off-outline"} 
                      size={24} 
                      color="gray" 
                    />
                  </Pressable>
                </View>
                {errors.password ? (
                  <View className="flex-row items-center mt-1 bg-red-50 p-2 rounded">
                    <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                    <Text className="text-red-600 text-xs flex-1">{errors.password}</Text>
                  </View>
                ) : (
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="information-circle-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
                    <Text className="text-xs text-gray-500">
                      Must be at least 6 characters
                    </Text>
                  </View>
                )}
              </View>

              <View className="mb-6">
                <Text className="text-gray-700 mb-1 font-medium">
                  Confirm Password <Text className="text-red-500">*</Text>
                </Text>
                <View className="relative">
                  <TextInput
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      clearError('confirmPassword');
                    }}
                    secureTextEntry={!showConfirmPassword}
                    className={`border ${errors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-gray-300'} w-full rounded-lg p-3 text-base pr-12`}
                  />
                  <Pressable 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-0 bottom-0 justify-center"
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                      size={24} 
                      color="gray" 
                    />
                  </Pressable>
                </View>
                {errors.confirmPassword && (
                  <View className="flex-row items-center mt-1 bg-red-50 p-2 rounded">
                    <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                    <Text className="text-red-600 text-xs flex-1">{errors.confirmPassword}</Text>
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity 
              className={`p-4 rounded-lg ${loading ? 'bg-green-400' : 'bg-green-500 active:bg-green-600'} shadow-md`}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <View className="flex-row justify-center items-center">
                  <ActivityIndicator color="white" />
                  <Text className="text-white text-center text-base font-semibold ml-2">
                    Creating Account...
                  </Text>
                </View>
              ) : (
                <View className="flex-row justify-center items-center">
                  <Ionicons name="checkmark-circle-outline" size={20} color="white" style={{ marginRight: 6 }} />
                  <Text className="text-white text-center text-base font-semibold">
                    Create Account
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-6 mb-4">
              <Text className="text-gray-600">Already have an account? </Text>
              <Link href={'/auth/login'}>
                <Text className="text-green-600 font-medium">Login</Text>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Register;