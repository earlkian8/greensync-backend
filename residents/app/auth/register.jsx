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
  Animated,
  StyleSheet
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
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/logo/whitebg.png")}
              style={styles.logo}
            />
            <Text style={styles.subtitle}>
              Smart Waste Management
            </Text>
          </View>

          <View style={styles.formContainer}>
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
                    <Text style={styles.successBannerTitle}>
                      Registration Successful!
                    </Text>
                    <Text style={styles.successBannerText}>
                      {successMessage}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            ) : null}

            {/* Error Message Banner */}
            {generalError ? (
              <Animated.View 
                style={[styles.errorBanner, { opacity: fadeAnim }]}
              >
                <View style={styles.bannerContent}>
                  <View style={styles.errorIconContainer}>
                    <Ionicons name="alert-circle" size={24} color="#DC2626" />
                  </View>
                  <View style={styles.bannerTextContainer}>
                    <Text style={styles.errorBannerTitle}>
                      Registration Failed
                    </Text>
                    <Text style={styles.errorBannerText}>
                      {generalError}
                    </Text>
                    {Object.keys(errors).length > 0 && (
                      <Text style={styles.errorBannerHint}>
                        Check the highlighted fields below for details.
                      </Text>
                    )}
                  </View>
                  <Pressable onPress={() => setGeneralError("")} style={styles.bannerClose}>
                    <Ionicons name="close" size={20} color="#DC2626" />
                  </Pressable>
                </View>
              </Animated.View>
            ) : null}

            {/* Personal Information Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person-outline" size={20} color="#374151" style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>
                  Personal Information
                </Text>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Full Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  placeholder="Enter your full name"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    clearError('name');
                  }}
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

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Email <Text style={styles.required}>*</Text>
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

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  placeholder="e.g., +63 912 345 6789 (Optional)"
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    clearError('phone_number');
                  }}
                  keyboardType="phone-pad"
                  maxLength={20}
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
            </View>

            {/* Address Information Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location-outline" size={20} color="#374151" style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>
                  Address Information
                </Text>
              </View>

              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>House No.</Text>
                  <TextInput
                    placeholder="Optional"
                    value={houseNo}
                    onChangeText={(text) => {
                      setHouseNo(text);
                      clearError('house_no');
                    }}
                    maxLength={50}
                    style={[
                      styles.input,
                      errors.house_no && styles.inputError
                    ]}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Street</Text>
                  <TextInput
                    placeholder="Optional"
                    value={street}
                    onChangeText={(text) => {
                      setStreet(text);
                      clearError('street');
                    }}
                    style={[
                      styles.input,
                      errors.street && styles.inputError
                    ]}
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
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Postal Code</Text>
                <TextInput
                  placeholder="Optional"
                  value={postalCode}
                  onChangeText={(text) => {
                    setPostalCode(text);
                    clearError('postal_code');
                  }}
                  keyboardType="number-pad"
                  maxLength={20}
                  style={[
                    styles.input,
                    errors.postal_code && styles.inputError
                  ]}
                />
                {errors.postal_code && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                    <Text style={styles.errorBoxText}>{errors.postal_code}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Profile Image Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="image-outline" size={20} color="#374151" style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>
                  Profile Photo
                </Text>
              </View>

              <View style={styles.profileImageContainer}>
                <View style={styles.profileImagePlaceholder}>
                  {profileImage ? (
                    <Image
                      source={{ uri: profileImage.uri }}
                      style={styles.profileImage}
                    />
                  ) : (
                    <Ionicons name="person-circle-outline" size={64} color="#9CA3AF" />
                  )}
                </View>

                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handleSelectProfileImage}
                >
                  <Ionicons name="cloud-upload-outline" size={18} color="#16A34A" style={{ marginRight: 6 }} />
                  <Text style={styles.uploadButtonText}>
                    {profileImage ? "Change Photo" : "Upload Photo (Optional)"}
                  </Text>
                </TouchableOpacity>

                {errors.profile_image && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                    <Text style={styles.errorBoxText}>{errors.profile_image}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Security Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="lock-closed-outline" size={20} color="#374151" style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>
                  Security
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Password <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      clearError('password');
                    }}
                    secureTextEntry={!showPassword}
                    style={[
                      styles.input,
                      styles.passwordInput,
                      errors.password && styles.inputError
                    ]}
                  />
                  <Pressable 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-outline" : "eye-off-outline"} 
                      size={24} 
                      color="#6B7280" 
                    />
                  </Pressable>
                </View>
                {errors.password ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                    <Text style={styles.errorBoxText}>{errors.password}</Text>
                  </View>
                ) : (
                  <View style={styles.helperRow}>
                    <Ionicons name="information-circle-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
                    <Text style={styles.helperText}>
                      Must be at least 6 characters
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Confirm Password <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      clearError('confirmPassword');
                    }}
                    secureTextEntry={!showConfirmPassword}
                    style={[
                      styles.input,
                      styles.passwordInput,
                      errors.confirmPassword && styles.inputError
                    ]}
                  />
                  <Pressable 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.passwordToggle}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                      size={24} 
                      color="#6B7280" 
                    />
                  </Pressable>
                </View>
                {errors.confirmPassword && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                    <Text style={styles.errorBoxText}>{errors.confirmPassword}</Text>
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity 
              style={[
                styles.registerButton,
                loading && styles.registerButtonDisabled
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.registerButtonContent}>
                  <ActivityIndicator color="white" />
                  <Text style={styles.registerButtonText}>
                    Creating Account...
                  </Text>
                </View>
              ) : (
                <View style={styles.registerButtonContent}>
                  <Ionicons name="checkmark-circle-outline" size={20} color="white" style={{ marginRight: 6 }} />
                  <Text style={styles.registerButtonText}>
                    Create Account
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginLinkText}>Already have an account? </Text>
              <Link href={'/auth/login'}>
                <Text style={styles.loginLink}>Login</Text>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 300,
    height: 150,
    resizeMode: "contain",
  },
  subtitle: {
    color: '#4B5563',
    fontSize: 18,
    fontWeight: '500',
    marginTop: 8,
  },
  formContainer: {
    width: '100%',
    maxWidth: 384,
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
    lineHeight: 20,
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
    lineHeight: 20,
  },
  errorBannerHint: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  bannerClose: {
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: '#374151',
    marginBottom: 4,
    fontWeight: '500',
    fontSize: 14,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    width: '100%',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  rowInputs: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  halfInput: {
    flex: 1,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
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
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
  },
  profileImageContainer: {
    alignItems: 'center',
  },
  profileImagePlaceholder: {
    width: 112,
    height: 112,
    borderRadius: 9999,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    overflow: 'hidden',
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  uploadButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#16A34A',
    fontWeight: '500',
  },
  registerButton: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#16A34A',
    marginBottom: 24,
  },
  registerButtonDisabled: {
    backgroundColor: '#86EFAC',
  },
  registerButtonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loginLinkText: {
    color: '#4B5563',
  },
  loginLink: {
    color: '#16A34A',
    fontWeight: '500',
  },
});

export default Register;
