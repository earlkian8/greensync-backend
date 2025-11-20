import { api } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// === AUTH SETUP ===
const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return token;
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

// === COLLECTION REQUESTS SERVICE ===

/**
 * Fetch all collection requests for the authenticated resident
 */
export const fetchCollectionRequests = async () => {
  try {
    await setAuthHeader();
    const response = await api.get('v1/resident/collection-requests');
    return {
      success: true,
      data: response.data.collection_requests,
      message: response.data.message || 'Fetched successfully',
    };
  } catch (error) {
    console.error('Error fetching collection requests:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch collection requests',
      data: [],
    };
  }
};

/**
 * Fetch details of a specific collection request by ID
 */
export const fetchCollectionRequestDetails = async (requestId) => {
  try {
    await setAuthHeader();
    const response = await api.get(`v1/resident/collection-requests/${requestId}`);
    return {
      success: true,
      data: response.data.collection_request,
      message: response.data.message || 'Fetched successfully',
    };
  } catch (error) {
    console.error('Error fetching collection request details:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch collection request details',
      data: null,
    };
  }
};

/**
 * Create a new collection request
 */
import dayjs from 'dayjs'; // install: npm install dayjs

export const createCollectionRequest = async (requestData) => {
  try {
    await setAuthHeader();

    const formattedTime = dayjs(requestData.preferred_time).format('HH:mm'); // <-- ensures 24h format

    const payload = {
      bin_id: requestData.bin_id,
      request_type: requestData.request_type,
      description: requestData.description || null,
      preferred_date: dayjs(requestData.preferred_date).format('YYYY-MM-DD'),
      preferred_time: formattedTime,
      waste_type: requestData.waste_type,
      image_url: requestData.image_url || null,
      priority: requestData.priority || 'medium',
      latitude: requestData.latitude,
      longitude: requestData.longitude,
    };

    const response = await api.post('v1/resident/collection-requests', payload);

    return {
      success: true,
      data: response.data.collection_request,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Error creating collection request:', error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.response?.data?.errors ||
        'Failed to create collection request',
      data: null,
    };
  }
};


// === OPTIONAL HELPERS ===

/**
 * Format collection request data for display
 */
export const formatCollectionRequestData = (req) => {
  if (!req) return null;

  return {
    id: req.id,
    binId: req.bin_id,
    type: req.request_type.charAt(0).toUpperCase() + req.request_type.slice(1),
    wasteType: req.waste_type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    priority: req.priority.charAt(0).toUpperCase() + req.priority.slice(1),
    status: req.status.charAt(0).toUpperCase() + req.status.slice(1),
    preferredDate: req.preferred_date
      ? new Date(req.preferred_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'Not set',
    preferredTime: req.preferred_time || 'Not set',
    description: req.description || 'No description',
    createdAt: new Date(req.created_at).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
};
