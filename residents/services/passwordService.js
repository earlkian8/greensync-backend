import { api } from '../config/api';

/**
 * Reset password after code verification
 * @param {string} email - User email
 * @param {string} code - Verification code
 * @param {string} password - New password
 * @param {string} passwordConfirmation - Password confirmation
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const resetPassword = async (email, code, password, passwordConfirmation) => {
  try {
    const response = await api.post('v1/resident/reset-password', {
      email: email.trim().toLowerCase(),
      verification_code: code,
      password: password,
      password_confirmation: passwordConfirmation,
    });

    return {
      success: true,
      message: response.data?.message || 'Password reset successfully',
    };
  } catch (error) {
    console.error('Password reset error:', error);
    
    let errorMessage = 'Failed to reset password. Please try again.';
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.errors) {
      const validationErrors = error.response.data.errors;
      const firstError = Object.values(validationErrors).flat()[0];
      errorMessage = firstError || errorMessage;
    }
    
    return {
      success: false,
      message: errorMessage,
      errors: error.response?.data?.errors || {},
    };
  }
};

/**
 * Verify if email exists in the system
 * @param {string} email - User email
 * @returns {Promise<{success: boolean, exists: boolean, message: string}>}
 */
export const verifyEmailExists = async (email) => {
  try {
    const response = await api.post('v1/resident/verify-email', {
      email: email.trim().toLowerCase(),
    });

    return {
      success: true,
      exists: response.data?.exists || false,
      message: response.data?.message || '',
    };
  } catch (error) {
    console.error('Email verification error:', error);
    return {
      success: false,
      exists: false,
      message: error.response?.data?.message || 'Failed to verify email',
    };
  }
};

