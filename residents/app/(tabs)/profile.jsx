import { View, Text, ScrollView, Pressable, TextInput, Image, ActivityIndicator, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useContext, useRef, useEffect } from "react";
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AuthContext } from "../_layout";
import { api } from '@/config/api';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
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
    barangay: user?.barangay || '',
    city: user?.city || '',
    province: user?.province || '',
    country: user?.country || '',
    postal_code: user?.postal_code || ''
  });

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
    if (!formData.barangay.trim()) newErrors.barangay = "Barangay is required";
    if (!formData.city.trim()) newErrors.city = "City is required";

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
        barangay: formData.barangay.trim(),
        city: formData.city.trim(),
        province: formData.province.trim() || null,
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
      barangay: user?.barangay || '',
      city: user?.city || '',
      province: user?.province || '',
      country: user?.country || '',
      postal_code: user?.postal_code || ''
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Profile Header */}
        <View className="items-center py-6 bg-white mb-4">
          <View className="relative mb-3">
            <View className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
              {user?.profile_image ? (
                <Image 
                  source={{ uri: user.profile_image }} 
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full flex items-center justify-center bg-green-100">
                  <Feather name="user" size={40} color="#16A34A" />
                </View>
              )}
            </View>
            <Pressable className="absolute bottom-0 right-0 bg-green-600 p-1.5 rounded-full active:bg-green-700">
              <Feather name="camera" size={16} color="white" />
            </Pressable>
          </View>
          <Text className="text-xl font-bold text-gray-800">{formData.name || 'User'}</Text>
          <Text className="text-gray-600 text-sm mt-1">
            {formData.barangay ? `${formData.barangay}, ${formData.city}` : 'No address set'}
          </Text>
          {!isEditing && (
            <Pressable
              onPress={() => setIsEditing(true)}
              className="mt-3 border border-green-600 rounded-lg py-2 px-6 active:bg-green-50"
            >
              <Text className="text-green-600 font-medium text-sm">Edit Profile</Text>
            </Pressable>
          )}
        </View>

        <View className="px-5">
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
                  <Text className="text-green-900 text-base font-semibold mb-1">Success!</Text>
                  <Text className="text-green-800 text-sm">{successMessage}</Text>
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
              style={{ opacity: fadeAnim }}
              className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
            >
              <View className="flex-row items-start">
                <View className="bg-red-100 rounded-full p-1 mr-3">
                  <Ionicons name="alert-circle" size={24} color="#DC2626" />
                </View>
                <View className="flex-1">
                  <Text className="text-red-900 text-base font-semibold mb-1">Error</Text>
                  <Text className="text-red-800 text-sm">{errorMessage}</Text>
                </View>
                <Pressable onPress={() => setErrorMessage("")}>
                  <Ionicons name="close" size={20} color="#DC2626" />
                </Pressable>
              </View>
            </Animated.View>
          ) : null}

          {isEditing ? (
            <View className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <View className="flex-row items-center mb-4">
                <Ionicons name="person-outline" size={20} color="#374151" style={{ marginRight: 6 }} />
                <Text className="font-semibold text-base text-gray-800">Edit Profile</Text>
              </View>
              
              <View className="space-y-4">
                {/* Full Name */}
                <View className="mb-4">
                  <Text className="text-sm text-gray-700 mb-1.5">
                    Full Name <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    value={formData.name}
                    onChangeText={(value) => handleChange('name', value)}
                    className={`border ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-lg px-4 py-3 text-gray-800`}
                  />
                  {errors.name && (
                    <View className="flex-row items-center mt-1 bg-red-50 p-2 rounded">
                      <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                      <Text className="text-red-600 text-xs flex-1">{errors.name}</Text>
                    </View>
                  )}
                </View>

                {/* Email */}
                <View className="mb-4">
                  <Text className="text-sm text-gray-700 mb-1.5">
                    Email <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    value={formData.email}
                    onChangeText={(value) => handleChange('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className={`border ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-lg px-4 py-3 text-gray-800`}
                  />
                  {errors.email && (
                    <View className="flex-row items-center mt-1 bg-red-50 p-2 rounded">
                      <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                      <Text className="text-red-600 text-xs flex-1">{errors.email}</Text>
                    </View>
                  )}
                </View>

                {/* Phone Number */}
                <View className="mb-4">
                  <Text className="text-sm text-gray-700 mb-1.5">Phone Number</Text>
                  <TextInput
                    value={formData.phone_number}
                    onChangeText={(value) => handleChange('phone_number', value)}
                    keyboardType="phone-pad"
                    maxLength={20}
                    placeholder="Optional"
                    className={`border ${errors.phone_number ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-lg px-4 py-3 text-gray-800`}
                  />
                  {errors.phone_number && (
                    <View className="flex-row items-center mt-1 bg-red-50 p-2 rounded">
                      <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                      <Text className="text-red-600 text-xs flex-1">{errors.phone_number}</Text>
                    </View>
                  )}
                </View>

                {/* House No & Street */}
                <View className="flex-row gap-3 mb-4">
                  <View className="flex-1">
                    <Text className="text-sm text-gray-700 mb-1.5">House No</Text>
                    <TextInput
                      value={formData.house_no}
                      onChangeText={(value) => handleChange('house_no', value)}
                      maxLength={50}
                      placeholder="Optional"
                      className="border border-gray-200 rounded-lg px-4 py-3 text-gray-800"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-gray-700 mb-1.5">Street</Text>
                    <TextInput
                      value={formData.street}
                      onChangeText={(value) => handleChange('street', value)}
                      placeholder="Optional"
                      className="border border-gray-200 rounded-lg px-4 py-3 text-gray-800"
                    />
                  </View>
                </View>

                {/* Barangay */}
                <View className="mb-4">
                  <Text className="text-sm text-gray-700 mb-1.5">
                    Barangay <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    value={formData.barangay}
                    onChangeText={(value) => handleChange('barangay', value)}
                    className={`border ${errors.barangay ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-lg px-4 py-3 text-gray-800`}
                  />
                  {errors.barangay && (
                    <View className="flex-row items-center mt-1 bg-red-50 p-2 rounded">
                      <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                      <Text className="text-red-600 text-xs flex-1">{errors.barangay}</Text>
                    </View>
                  )}
                </View>

                {/* City & Province */}
                <View className="flex-row gap-3 mb-4">
                  <View className="flex-1">
                    <Text className="text-sm text-gray-700 mb-1.5">
                      City <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      value={formData.city}
                      onChangeText={(value) => handleChange('city', value)}
                      className={`border ${errors.city ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-lg px-4 py-3 text-gray-800`}
                    />
                    {errors.city && (
                      <View className="flex-row items-center mt-1 bg-red-50 p-2 rounded">
                        <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                        <Text className="text-red-600 text-xs flex-1">{errors.city}</Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-gray-700 mb-1.5">Province</Text>
                    <TextInput
                      value={formData.province}
                      onChangeText={(value) => handleChange('province', value)}
                      placeholder="Optional"
                      className="border border-gray-200 rounded-lg px-4 py-3 text-gray-800"
                    />
                  </View>
                </View>

                {/* Country & Postal Code */}
                <View className="flex-row gap-3 mb-4">
                  <View className="flex-1">
                    <Text className="text-sm text-gray-700 mb-1.5">Country</Text>
                    <TextInput
                      value={formData.country}
                      onChangeText={(value) => handleChange('country', value)}
                      placeholder="Optional"
                      className="border border-gray-200 rounded-lg px-4 py-3 text-gray-800"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-gray-700 mb-1.5">Postal Code</Text>
                    <TextInput
                      value={formData.postal_code}
                      onChangeText={(value) => handleChange('postal_code', value)}
                      keyboardType="number-pad"
                      maxLength={20}
                      placeholder="Optional"
                      className="border border-gray-200 rounded-lg px-4 py-3 text-gray-800"
                    />
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3 mt-6">
                <Pressable
                  onPress={handleCancel}
                  disabled={loading}
                  className="flex-1 border border-gray-300 rounded-lg py-3 active:bg-gray-50"
                >
                  <Text className="text-gray-700 text-center font-medium">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  disabled={loading}
                  className={`flex-1 ${loading ? 'bg-green-400' : 'bg-green-600 active:bg-green-700'} rounded-lg py-3`}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white text-center font-semibold">Save Changes</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            <View className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <View className="flex-row items-center mb-3">
                <Ionicons name="information-circle-outline" size={20} color="#374151" style={{ marginRight: 6 }} />
                <Text className="font-semibold text-base text-gray-800">Personal Information</Text>
              </View>
              
              <View className="space-y-3">
                {/* Email */}
                <View className="flex-row items-center py-2">
                  <Feather name="mail" size={18} color="#6B7280" />
                  <View className="ml-3">
                    <Text className="text-xs text-gray-500">Email</Text>
                    <Text className="text-sm text-gray-800">{formData.email || 'Not set'}</Text>
                  </View>
                </View>

                {/* Phone */}
                <View className="flex-row items-center py-2">
                  <Feather name="phone" size={18} color="#6B7280" />
                  <View className="ml-3">
                    <Text className="text-xs text-gray-500">Phone</Text>
                    <Text className="text-sm text-gray-800">{formData.phone_number || 'Not set'}</Text>
                  </View>
                </View>

                {/* Address */}
                <View className="flex-row items-start py-2">
                  <Feather name="map-pin" size={18} color="#6B7280" style={{ marginTop: 2 }} />
                  <View className="ml-3 flex-1">
                    <Text className="text-xs text-gray-500">Address</Text>
                    <Text className="text-sm text-gray-800">
                      {[formData.house_no, formData.street, formData.barangay, formData.city]
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
            className={`flex-row items-center justify-center py-4 rounded-lg ${logoutLoading ? 'bg-red-50' : 'active:bg-red-50'}`}
          >
            {logoutLoading ? (
              <>
                <ActivityIndicator size="small" color="#DC2626" />
                <Text className="text-red-600 font-semibold ml-2">Logging out...</Text>
              </>
            ) : (
              <>
                <Feather name="log-out" size={18} color="#DC2626" />
                <Text className="text-red-600 font-semibold ml-2">Logout</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;