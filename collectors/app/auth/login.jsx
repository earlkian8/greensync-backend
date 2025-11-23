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
  ActivityIndicator
} from "react-native";
import { useContext, useState } from "react";
import { AuthContext } from "../_layout";
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from "expo-router";
import { api } from '@/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  
  const { setIsAuthenticated, setUser } = useContext(AuthContext);
  const router = useRouter();

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    // Clear previous errors
    setGeneralError("");
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('v1/collector/login', {
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (response.data) {
        const { token, collector, message } = response.data;

        // Store token and user data
        await AsyncStorage.setItem('auth_token', token);
        await AsyncStorage.setItem('user_data', JSON.stringify(collector));

        // Set the token in API configuration
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Update context
        setIsAuthenticated(true);
        setUser(collector);

        // Navigate to home
        router.replace('/home');
      }
    } catch (error) {
      
      let errorMessage = "An error occurred during login. Please try again.";
      
      if (error.response) {
        if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data?.errors) {
          // Laravel validation errors
          const validationErrors = error.response.data.errors;
          
          // Set field-specific errors
          const fieldErrors = {};
          Object.keys(validationErrors).forEach(key => {
            fieldErrors[key] = validationErrors[key][0]; // Get first error for each field
          });
          setErrors(fieldErrors);
          
          // Set general error with all messages
          errorMessage = Object.values(validationErrors).flat().join('. ');
        } else if (error.response.status === 401) {
          errorMessage = "Invalid email or password. Please try again.";
        } else if (error.response.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        }
      } else if (error.request) {
        errorMessage = "Unable to connect to server. Please check your internet connection.";
      }
      
      setGeneralError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (  
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={{ paddingVertical: 40, paddingHorizontal: 24, flexGrow: 1, justifyContent: 'center' }}
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center">

          <View className="items-center mb-12">
            <Image
              source={require("@/assets/logo/whitebg.png")}
              style={{ width: 3000, height: 150, resizeMode: "contain" }}
            />
            <Text className="text-gray-600 text-lg font-medium mt-2">
              Collector Application
            </Text>
          </View>

          <View className="w-full max-w-sm">
            {/* General Error Banner */}
            {generalError ? (
              <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex-row">
                <Ionicons name="alert-circle" size={20} color="#DC2626" style={{ marginRight: 8, marginTop: 2 }} />
                <View className="flex-1">
                  <Text className="text-red-800 text-sm font-medium mb-1">Login Failed</Text>
                  <Text className="text-red-700 text-sm">{generalError}</Text>
                </View>
                <Pressable onPress={() => setGeneralError("")} className="ml-2">
                  <Ionicons name="close" size={20} color="#DC2626" />
                </Pressable>
              </View>
            ) : null}

            <View className="mb-4">
              <Text className="text-gray-700 mb-1 font-medium">Email</Text>
              <TextInput
                placeholder="Enter your email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({...errors, email: null});
                  if (generalError) setGeneralError("");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                style={{
                  borderWidth: 1,
                  borderColor: errors.email ? '#EF4444' : '#D1D5DB',
                  width: '100%',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: '#1F2937',
                }}
              />
              {errors.email && (
                <View className="flex-row items-center mt-1">
                  <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                  <Text className="text-red-500 text-xs">{errors.email}</Text>
                </View>
              )}
            </View>

            <View className="mb-2">
              <Text className="text-gray-700 mb-1 font-medium">Password</Text>
              <View className="relative">
                <TextInput
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({...errors, password: null});
                    if (generalError) setGeneralError("");
                  }}
                  secureTextEntry={!showPassword}
                  style={{
                    borderWidth: 1,
                    borderColor: errors.password ? '#EF4444' : '#D1D5DB',
                    width: '100%',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    paddingRight: 48,
                    color: '#1F2937',
                  }}
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
              {errors.password && (
                <View className="flex-row items-center mt-1">
                  <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                  <Text className="text-red-500 text-xs">{errors.password}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity 
              className="self-end mt-1"
              onPress={() => router.push('/auth/forgot-password')}
            >
              <Text className="text-green-600 text-sm font-medium">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className={`p-4 rounded-lg mt-6 ${loading ? 'bg-green-400' : 'bg-green-500 active:bg-green-600'}`}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <View className="flex-row justify-center items-center">
                  <ActivityIndicator color="white" />
                  <Text className="text-white text-center text-base font-semibold ml-2">
                    Logging in...
                  </Text>
                </View>
              ) : (
                <Text className="text-white text-center text-base font-semibold">
                  Login
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;