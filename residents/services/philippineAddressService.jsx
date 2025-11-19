import { api } from '../config/api';

/**
 * Fetch all regions
 */
export const fetchRegions = async () => {
  try {
    console.log('Fetching regions from:', '/v1/addresses/regions');
    const response = await api.get('/v1/addresses/regions');
    console.log('Regions API Full Response:', JSON.stringify(response.data, null, 2));
    
    // Check if response indicates success
    const responseSuccess = response.data?.success !== false; // Default to true if not specified
    
    // Handle different response structures
    let data = response.data?.data;
    
    // If data is not directly in data property, check root level
    if (!data && Array.isArray(response.data)) {
      data = response.data;
    }
    
    // Ensure it's an array
    if (!Array.isArray(data)) {
      console.warn('Regions data is not an array:', data);
      data = [];
    }
    
    console.log('Parsed regions data:', data.length, 'items');
    if (data.length > 0) {
      console.log('First region:', data[0]);
    }
    
    return {
      success: responseSuccess && data.length > 0,
      data: data,
      message: response.data?.message || 'Regions fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching regions:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    console.error('Error message:', error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch regions',
      data: []
    };
  }
};

/**
 * Fetch provinces by region ID
 */
export const fetchProvincesByRegion = async (regionId) => {
  try {
    if (!regionId) {
      return {
        success: false,
        error: 'Region ID is required',
        data: []
      };
    }
    const response = await api.get(`/v1/addresses/provinces/region/${regionId}`);
    return {
      success: true,
      data: response.data.data || [],
      message: response.data.message
    };
  } catch (error) {
    console.error('Error fetching provinces:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch provinces',
      data: []
    };
  }
};

/**
 * Fetch cities by province ID
 */
export const fetchCitiesByProvince = async (provinceId) => {
  try {
    if (!provinceId) {
      return {
        success: false,
        error: 'Province ID is required',
        data: []
      };
    }
    const response = await api.get(`/v1/addresses/cities/province/${provinceId}`);
    return {
      success: true,
      data: response.data.data || [],
      message: response.data.message
    };
  } catch (error) {
    console.error('Error fetching cities:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch cities',
      data: []
    };
  }
};

/**
 * Fetch barangays by city ID
 */
export const fetchBarangaysByCity = async (cityId) => {
  try {
    if (!cityId) {
      return {
        success: false,
        error: 'City ID is required',
        data: []
      };
    }
    const response = await api.get(`/v1/addresses/barangays/city/${cityId}`);
    return {
      success: true,
      data: response.data.data || [],
      message: response.data.message
    };
  } catch (error) {
    console.error('Error fetching barangays:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch barangays',
      data: []
    };
  }
};

/**
 * Get a specific region by ID
 */
export const fetchRegion = async (regionId) => {
  try {
    const response = await api.get(`/v1/addresses/regions/${regionId}`);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error('Error fetching region:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch region',
      data: null
    };
  }
};

/**
 * Get a specific province by ID
 */
export const fetchProvince = async (provinceId) => {
  try {
    const response = await api.get(`/v1/addresses/provinces/${provinceId}`);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error('Error fetching province:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch province',
      data: null
    };
  }
};

/**
 * Get a specific city by ID
 */
export const fetchCity = async (cityId) => {
  try {
    const response = await api.get(`/v1/addresses/cities/${cityId}`);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error('Error fetching city:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch city',
      data: null
    };
  }
};

/**
 * Get a specific barangay by ID
 */
export const fetchBarangay = async (barangayId) => {
  try {
    const response = await api.get(`/v1/addresses/barangays/${barangayId}`);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error('Error fetching barangay:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch barangay',
      data: null
    };
  }
};

