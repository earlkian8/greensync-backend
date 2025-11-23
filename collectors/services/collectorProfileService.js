import { api } from "@/config/api";
import AsyncStorage from '@react-native-async-storage/async-storage';

const collectorProfileService = {
  async updateProfile(formData) {
    const response = await api.put('v1/collector/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getImageUrl(path) {
    if (!path) return null;
    // Get token from storage
    const token = await AsyncStorage.getItem('auth_token');
    // Encode the path to handle special characters and slashes
    const encodedPath = path.split('/').map(segment => encodeURIComponent(segment)).join('/');
    // Append token as query parameter for authenticated image requests
    const url = `${api.defaults.baseURL}/v1/collector/images/${encodedPath}`;
    return token ? `${url}?token=${encodeURIComponent(token)}` : url;
  },
};

export default collectorProfileService;

