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
import { useState, useRef } from "react";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { sendVerificationCode, generateVerificationCode } from '@/services/collectorEmailService';
import { verifyEmailExists } from '@/services/collectorPasswordService';
import { resetPassword } from '@/services/collectorPasswordService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ForgotPassword = () => {
  const router = useRouter();
  
  // Step management
  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: Password
  
  // Form data
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  
  // State management
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [generalSuccess, setGeneralSuccess] = useState("");

  // OTP input refs
  const otpRefs = useRef([]);

  // Step 1: Send verification code
  const handleSendCode = async () => {
    setGeneralError("");
    setGeneralSuccess("");
    setErrors({});

    // Validate email
    if (!email.trim()) {
      setErrors({ email: "Email is required" });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: "Email is invalid" });
      return;
    }

    setLoading(true);

    try {
      // Verify email exists
      const emailCheck = await verifyEmailExists(email);
      
      if (!emailCheck.success || !emailCheck.exists) {
        setGeneralError("This email is not registered. Please check your email address.");
        setLoading(false);
        return;
      }

      // Generate and send verification code
      const generatedCode = generateVerificationCode();
      
      // Store code in AsyncStorage for verification
      await AsyncStorage.setItem('reset_code', generatedCode);
      await AsyncStorage.setItem('reset_email', email.trim().toLowerCase());
      await AsyncStorage.setItem('reset_code_expiry', (Date.now() + 15 * 60 * 1000).toString()); // 15 minutes

      const emailResult = await sendVerificationCode(email.trim().toLowerCase(), generatedCode);

      if (emailResult.success) {
        setGeneralSuccess("Verification code sent to your email!");
        setTimeout(() => {
          setStep(2);
          setGeneralSuccess("");
        }, 1500);
      } else {
        setGeneralError(emailResult.message || "Failed to send verification code. Please try again.");
      }
    } catch (error) {
      console.error('Send code error:', error);
      setGeneralError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // Create array from current code, padding to 6 characters
    const codeArray = code.split('');
    while (codeArray.length < 6) {
      codeArray.push('');
    }
    
    if (numericValue.length > 0) {
      // Update the specific index
      codeArray[index] = numericValue.slice(-1);
      
      // Clear errors
      if (errors.code) setErrors({...errors, code: null});
      if (generalError) setGeneralError("");

      // Auto-focus next input if not the last one
      if (index < 5) {
        setTimeout(() => {
          otpRefs.current[index + 1]?.focus();
        }, 0);
      }
    } else {
      // Clear current input
      codeArray[index] = '';
    }
    
    const updatedCode = codeArray.join('').slice(0, 6);
    setCode(updatedCode);
  };

  // Handle OTP key press (for backspace)
  const handleOtpKeyPress = (index, key) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handleOtpPaste = (text) => {
    const numericValue = text.replace(/[^0-9]/g, '').slice(0, 6);
    if (numericValue.length > 0) {
      setCode(numericValue);
      // Focus the input after the last filled digit, or the last input
      const focusIndex = Math.min(numericValue.length - 1, 5);
      setTimeout(() => {
        otpRefs.current[focusIndex]?.focus();
      }, 0);
      if (errors.code) setErrors({...errors, code: null});
      if (generalError) setGeneralError("");
    }
  };

  // Step 2: Verify code
  const handleVerifyCode = async () => {
    setGeneralError("");
    setErrors({});

    if (!code.trim()) {
      setErrors({ code: "Verification code is required" });
      return;
    }

    if (code.length !== 6) {
      setErrors({ code: "Verification code must be 6 digits" });
      return;
    }

    try {
      // Check stored code
      const storedCode = await AsyncStorage.getItem('reset_code');
      const storedEmail = await AsyncStorage.getItem('reset_email');
      const expiry = await AsyncStorage.getItem('reset_code_expiry');

      if (!storedCode || !storedEmail || !expiry) {
        setGeneralError("Verification code expired. Please request a new one.");
        setStep(1);
        return;
      }

      if (Date.now() > parseInt(expiry)) {
        setGeneralError("Verification code expired. Please request a new one.");
        await AsyncStorage.multiRemove(['reset_code', 'reset_email', 'reset_code_expiry']);
        setStep(1);
        return;
      }

      if (storedCode !== code.trim()) {
        setErrors({ code: "Invalid verification code. Please try again." });
        return;
      }

      // Code verified successfully
      setStep(3);
    } catch (error) {
      console.error('Verify code error:', error);
      setGeneralError("An error occurred. Please try again.");
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async () => {
    setGeneralError("");
    setErrors({});

    // Validate form
    const newErrors = {};
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!passwordConfirmation) {
      newErrors.passwordConfirmation = "Password confirmation is required";
    } else if (password !== passwordConfirmation) {
      newErrors.passwordConfirmation = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const storedEmail = await AsyncStorage.getItem('reset_email');
      const storedCode = await AsyncStorage.getItem('reset_code');

      if (!storedEmail || !storedCode) {
        setGeneralError("Session expired. Please start over.");
        await AsyncStorage.multiRemove(['reset_code', 'reset_email', 'reset_code_expiry']);
        setStep(1);
        setLoading(false);
        return;
      }

      const result = await resetPassword(storedEmail, storedCode, password, passwordConfirmation);

      if (result.success) {
        // Clear stored data
        await AsyncStorage.multiRemove(['reset_code', 'reset_email', 'reset_code_expiry']);
        
        setGeneralSuccess("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          router.replace('/auth/login');
        }, 2000);
      } else {
        setGeneralError(result.message || "Failed to reset password. Please try again.");
        if (result.errors) {
          setErrors(result.errors);
        }
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setGeneralError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setGeneralError("");
      setGeneralSuccess("");
      setErrors({});
    } else {
      router.back();
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
          {/* Back Button */}
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </Pressable>

          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/logo/whitebg.png")}
              style={styles.logo}
            />
            <Text style={styles.title}>
              {step === 1 && "Forgot Password?"}
              {step === 2 && "Enter Verification Code"}
              {step === 3 && "Reset Password"}
            </Text>
            <Text style={styles.subtitle}>
              {step === 1 && "Enter your email address and we'll send you a verification code"}
              {step === 2 && "We've sent a 6-digit code to your email"}
              {step === 3 && "Enter your new password"}
            </Text>
          </View>

          <View style={styles.formContainer}>
            {/* General Error Banner */}
            {generalError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" style={{ marginRight: 8, marginTop: 2 }} />
                <View style={styles.errorBannerContent}>
                  <Text style={styles.errorBannerText}>{generalError}</Text>
                </View>
                <Pressable onPress={() => setGeneralError("")} style={styles.errorBannerClose}>
                  <Ionicons name="close" size={20} color="#DC2626" />
                </Pressable>
              </View>
            ) : null}

            {/* Success Banner */}
            {generalSuccess ? (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={20} color="#16A34A" style={{ marginRight: 8, marginTop: 2 }} />
                <View style={styles.successBannerContent}>
                  <Text style={styles.successBannerText}>{generalSuccess}</Text>
                </View>
                <Pressable onPress={() => setGeneralSuccess("")} style={styles.successBannerClose}>
                  <Ionicons name="close" size={20} color="#16A34A" />
                </Pressable>
              </View>
            ) : null}

            {/* Step 1: Email Input */}
            {step === 1 && (
              <>
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

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSendCode}
                  disabled={loading}
                >
                  {loading ? (
                    <View style={styles.buttonContent}>
                      <ActivityIndicator color="white" />
                      <Text style={styles.buttonText}>Sending...</Text>
                    </View>
                  ) : (
                    <Text style={styles.buttonText}>Send Code</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* Step 2: Code Verification */}
            {step === 2 && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Verification Code</Text>
                  <View style={styles.otpContainer}>
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => (otpRefs.current[index] = ref)}
                        value={code[index] || ''}
                        onChangeText={(text) => handleOtpChange(index, text)}
                        onKeyPress={({ nativeEvent }) => handleOtpKeyPress(index, nativeEvent.key)}
                        onPaste={(e) => {
                          const pastedText = e.nativeEvent.text || '';
                          handleOtpPaste(pastedText);
                        }}
                        keyboardType="number-pad"
                        maxLength={1}
                        style={[
                          styles.otpInput,
                          index === 0 && styles.otpInputFirst,
                          index === 5 && styles.otpInputLast,
                          errors.code && styles.otpInputError,
                          code[index] && styles.otpInputFilled
                        ]}
                        selectTextOnFocus
                        textAlign="center"
                        autoFocus={index === 0}
                      />
                    ))}
                  </View>
                  {errors.code && (
                    <View style={styles.errorRow}>
                      <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                      <Text style={styles.errorText}>{errors.code}</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleVerifyCode}
                  disabled={loading}
                >
                  {loading ? (
                    <View style={styles.buttonContent}>
                      <ActivityIndicator color="white" />
                      <Text style={styles.buttonText}>Verifying...</Text>
                    </View>
                  ) : (
                    <Text style={styles.buttonText}>Verify Code</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleSendCode}
                  disabled={loading}
                >
                  <Text style={styles.resendText}>Resend Code</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Step 3: Password Reset */}
            {step === 3 && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      placeholder="Enter new password"
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

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      placeholder="Confirm new password"
                      value={passwordConfirmation}
                      onChangeText={(text) => {
                        setPasswordConfirmation(text);
                        if (errors.passwordConfirmation) setErrors({...errors, passwordConfirmation: null});
                        if (generalError) setGeneralError("");
                      }}
                      secureTextEntry={!showPasswordConfirmation}
                      style={[
                        styles.input,
                        styles.passwordInput,
                        errors.passwordConfirmation && styles.inputError
                      ]}
                    />
                    <Pressable
                      onPress={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                      style={styles.passwordToggle}
                    >
                      <Ionicons
                        name={showPasswordConfirmation ? "eye-outline" : "eye-off-outline"}
                        size={24}
                        color="#6B7280"
                      />
                    </Pressable>
                  </View>
                  {errors.passwordConfirmation && (
                    <View style={styles.errorRow}>
                      <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                      <Text style={styles.errorText}>{errors.passwordConfirmation}</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <View style={styles.buttonContent}>
                      <ActivityIndicator color="white" />
                      <Text style={styles.buttonText}>Resetting...</Text>
                    </View>
                  ) : (
                    <Text style={styles.buttonText}>Reset Password</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginLinkText}>Remember your password? </Text>
              <Pressable onPress={() => router.replace('/auth/login')}>
                <Text style={styles.loginLink}>Login</Text>
              </Pressable>
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
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    padding: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 250,
    height: 125,
    resizeMode: "contain",
  },
  title: {
    color: '#1F2937',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
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
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 14,
  },
  errorBannerClose: {
    marginLeft: 8,
  },
  successBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
  },
  successBannerContent: {
    flex: 1,
  },
  successBannerText: {
    color: '#166534',
    fontSize: 14,
  },
  successBannerClose: {
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  otpInput: {
    flex: 1,
    height: 56,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    marginRight: 8,
  },
  otpInputFirst: {
    marginLeft: 0,
  },
  otpInputLast: {
    marginRight: 0,
  },
  otpInputFilled: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  otpInputError: {
    borderColor: '#EF4444',
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
  button: {
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: '#16A34A',
  },
  buttonDisabled: {
    backgroundColor: '#86EFAC',
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resendButton: {
    alignSelf: 'center',
    marginTop: 16,
    padding: 8,
  },
  resendText: {
    color: '#16A34A',
    fontSize: 14,
    fontWeight: '500',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginLinkText: {
    color: '#4B5563',
  },
  loginLink: {
    color: '#16A34A',
    fontWeight: '500',
  },
});

export default ForgotPassword;

