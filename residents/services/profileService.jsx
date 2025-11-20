import { api } from '@/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

const setAuthHeader = async () => {
  const token = await getAuthToken();
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

export const fetchResidentProfile = async () => {
  try {
    await setAuthHeader();
    const response = await api.get('v1/resident/profile');

    return {
      success: true,
      data: response.data.resident,
      message: response.data.message || 'Profile fetched successfully',
    };
  } catch (error) {
    console.error('Error fetching resident profile:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch profile',
      data: null,
    };
  }
};


