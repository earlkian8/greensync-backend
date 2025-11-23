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
  StyleSheet
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
      const response = await api.post('v1/resident/login', {
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (response.data) {
        const { token, resident, message } = response.data;

        // Store token and user data
        await AsyncStorage.setItem('auth_token', token);
        await AsyncStorage.setItem('user_data', JSON.stringify(resident));

        // Set the token in API configuration
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Update context
        setIsAuthenticated(true);
        setUser(resident);

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
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
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
            {/* General Error Banner */}
            {generalError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" style={{ marginRight: 8, marginTop: 2 }} />
                <View style={styles.errorBannerContent}>
                  <Text style={styles.errorBannerTitle}>Login Failed</Text>
                  <Text style={styles.errorBannerText}>{generalError}</Text>
                </View>
                <Pressable onPress={() => setGeneralError("")} style={styles.errorBannerClose}>
                  <Ionicons name="close" size={20} color="#DC2626" />
                </Pressable>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
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
                style={[
                  styles.input,
                  errors.email && styles.inputError
                ]}
              />
              {errors.email && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                  <Text style={styles.errorText}>{errors.email}</Text>
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({...errors, password: null});
                    if (generalError) setGeneralError("");
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
              {errors.password && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                  <Text style={styles.errorText}>{errors.password}</Text>
                </View>
              )}
            </View>

            <Pressable 
              onPress={() => router.push('/auth/forgot-password')}
              style={styles.forgotPasswordButton}
            >
              <Text style={styles.forgotPasswordText}>
                Forgot Password?
              </Text>
            </Pressable>

            <TouchableOpacity 
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loginButtonContent}>
                  <ActivityIndicator color="white" />
                  <Text style={styles.loginButtonText}>
                    Logging in...
                  </Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>
                  Login
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.registerLinkContainer}>
              <Text style={styles.registerLinkText}>Don't have an account? </Text>
              <Link href={'/auth/register'}>
                <Text style={styles.registerLink}>Create Account</Text>
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
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
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
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
  },
  errorBannerContent: {
    flex: 1,
  },
  errorBannerTitle: {
    color: '#991B1B',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 14,
  },
  errorBannerClose: {
    marginLeft: 8,
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
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    width: '100%',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#EF4444',
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
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgotPasswordText: {
    color: '#16A34A',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    backgroundColor: '#16A34A',
  },
  loginButtonDisabled: {
    backgroundColor: '#86EFAC',
  },
  loginButtonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  registerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerLinkText: {
    color: '#4B5563',
  },
  registerLink: {
    color: '#16A34A',
    fontWeight: '500',
  },
});

export default Login;
