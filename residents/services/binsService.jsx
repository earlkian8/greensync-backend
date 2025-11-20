import { api } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get authentication token
const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Set authorization header
const setAuthHeader = async () => {
  const token = await getAuthToken();
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

/**
 * Fetch all bins for the authenticated resident
 */
export const fetchBins = async () => {
  try {
    await setAuthHeader();
    const response = await api.get('/v1/resident/bins');
    return {
      success: true,
      data: response.data.bins,
      message: response.data.message
    };
  } catch (error) {
    console.error('Error fetching bins:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch bins',
      data: []
    };
  }
};

/**
 * Get specific bin details by ID
 */
export const fetchBinDetails = async (binId) => {
  try {
    await setAuthHeader();
    const response = await api.get(`/v1/resident/bins/${binId}`);
    return {
      success: true,
      data: response.data.bin,
      message: response.data.message
    };
  } catch (error) {
    console.error('Error fetching bin details:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch bin details',
      data: null
    };
  }
};

/**
 * Register a new bin
 */
export const createBin = async (binData) => {
  try {
    await setAuthHeader();
    const response = await api.post('/v1/resident/bins', {
      name: binData.name,
      qr_code: binData.qr_code,
      bin_type: binData.bin_type.toLowerCase().replace(' ', '-'), // Convert to backend format
      status: binData.status.toLowerCase()
    });
    return {
      success: true,
      data: response.data.bin,
      message: response.data.message
    };
  } catch (error) {
    console.error('Error creating bin:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.response?.data?.errors || 'Failed to create bin',
      data: null
    };
  }
};

/**
 * Update bin information
 */
export const updateBin = async (binId, binData) => {
  try {
    await setAuthHeader();
    const updateData = {};
    if (binData.name) {
      updateData.name = binData.name;
    }
    if (binData.bin_type) {
      updateData.bin_type = binData.bin_type.toLowerCase().replace(' ', '-');
    }
    if (binData.status) {
      updateData.status = binData.status.toLowerCase();
    }
    
    const response = await api.put(`/v1/resident/bins/${binId}`, updateData);
    return {
      success: true,
      data: response.data.bin,
      message: response.data.message
    };
  } catch (error) {
    console.error('Error updating bin:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update bin',
      data: null
    };
  }
};

/**
 * Delete/unregister a bin
 */
export const deleteBin = async (binId) => {
  try {
    await setAuthHeader();
    const response = await api.delete(`/v1/resident/bins/${binId}`);
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    console.error('Error deleting bin:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to delete bin'
    };
  }
};

/**
 * Get bin by QR code
 */
export const fetchBinByQrCode = async (qrCode) => {
  try {
    await setAuthHeader();
    const response = await api.get('/v1/resident/bins/qr', {
      params: { qr_code: qrCode }
    });
    return {
      success: true,
      data: response.data.bin,
      message: response.data.message
    };
  } catch (error) {
    console.error('Error fetching bin by QR code:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch bin',
      data: null
    };
  }
};

/**
 * Format bin data from API to match component format
 */
export const formatBinData = (bin) => {
  if (!bin) return null;
  
  return {
    id: bin.id,
    name: bin.name.charAt(0).toUpperCase() + bin.name.slice(1),
    status: bin.status.charAt(0).toUpperCase() + bin.status.slice(1),
    qrCode: bin.qr_code,
    lastCollected: bin.last_collected 
      ? new Date(bin.last_collected).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })
      : 'Never',
    binType: bin.bin_type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '),
    registeredAt: bin.registered_at 
      ? new Date(bin.registered_at).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })
      : 'Unknown'
  };
};

/**
 * Format bin type for API submission
 */
export const formatBinTypeForApi = (binType) => {
  const typeMap = {
    'General Waste': 'non-biodegradable',
    'Recyclable': 'recyclable',
    'Organic': 'biodegradable',
    'Hazardous': 'hazardous'
  };
  return typeMap[binType] || binType.toLowerCase();
};