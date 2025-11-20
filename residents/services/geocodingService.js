const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search';

const userAgent =
  'GreenSyncResidentsApp/1.0 (contact@greensync.local)'; // Update with real contact if available

export const geocodeAddress = async (address) => {
  if (!address || !address.trim()) {
    return {
      success: false,
      error: 'Address is missing. Please complete your profile address first.',
      data: null,
    };
  }

  const query = new URLSearchParams({
    format: 'json',
    q: address,
    limit: '1',
    addressdetails: '0',
  });

  try {
    const response = await fetch(`${NOMINATIM_ENDPOINT}?${query.toString()}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': userAgent,
      },
    });

    if (!response.ok) {
      const message =
        response.status === 429
          ? 'Geocoding service rate limit reached. Please try again in a minute.'
          : 'Failed to reach geocoding service. Please try again.';
      return {
        success: false,
        error: message,
        data: null,
      };
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return {
        success: false,
        error: 'No coordinates found for your address. Please review your profile details.',
        data: null,
      };
    }

    const [result] = data;
    return {
      success: true,
      data: {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        displayName: result.display_name,
      },
    };
  } catch (error) {
    console.error('Error geocoding address:', error);
    return {
      success: false,
      error: 'Unable to get coordinates right now. Please check your connection and try again.',
      data: null,
    };
  }
};


