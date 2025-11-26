import { useEffect, useRef } from 'react';

const GoogleMap = ({ latitude, longitude, apiKey, className = '' }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Helper function to wait for Google Maps API to be fully loaded
  const waitForGoogleMaps = (callback, maxAttempts = 50) => {
    let attempts = 0;
    const checkInterval = setInterval(() => {
      attempts++;
      if (window.google && 
          window.google.maps && 
          typeof window.google.maps.Map === 'function' &&
          window.google.maps.Map.prototype &&
          typeof window.google.maps.Marker === 'function') {
        clearInterval(checkInterval);
        // Small delay to ensure everything is fully initialized
        setTimeout(callback, 50);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.error('Google Maps API failed to load after maximum attempts');
        const currentMapRef = mapRef.current;
        if (currentMapRef) {
          currentMapRef.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; padding: 20px; text-align: center;">
              <div>
                <p style="color: #DC2626; font-weight: 500; margin-bottom: 8px;">Google Maps API Error</p>
                <p style="color: #6B7280; font-size: 14px;">Google Maps API failed to initialize. Please refresh the page.</p>
              </div>
            </div>
          `;
        }
      }
    }, 100);
  };

  useEffect(() => {
    if (!latitude || !longitude || !apiKey) return;

    // Check if Google Maps API is already loaded and ready
    if (window.google && 
        window.google.maps && 
        typeof window.google.maps.Map === 'function') {
      // Wait a bit to ensure it's fully ready
      waitForGoogleMaps(initializeMap);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      // Script is loading, wait for it
      waitForGoogleMaps(initializeMap);
      return;
    }

    // Load Google Maps API script
    // Using callback parameter for better control instead of loading=async
    const callbackName = `initGoogleMap_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    window[callbackName] = () => {
      waitForGoogleMaps(initializeMap);
      delete window[callbackName];
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      console.error('Failed to load Google Maps API. Please check your API key configuration.');
      delete window[callbackName];
      if (mapRef.current) {
        mapRef.current.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 100%; padding: 20px; text-align: center;">
            <div>
              <p style="color: #DC2626; font-weight: 500; margin-bottom: 8px;">Google Maps API Error</p>
              <p style="color: #6B7280; font-size: 14px;">Failed to load Google Maps. Please check your API key configuration.</p>
              <p style="color: #6B7280; font-size: 12px; margin-top: 8px;">Make sure GOOGLE_MAPS_API_KEY is set and the Maps JavaScript API is enabled in Google Cloud Console.</p>
            </div>
          </div>
        `;
      }
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup callback if component unmounts before script loads
      if (window[callbackName]) {
        delete window[callbackName];
      }
    };
  }, [latitude, longitude, apiKey]);

  const initializeMap = async () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Double-check that Google Maps API is ready
    if (!window.google || 
        !window.google.maps || 
        typeof window.google.maps.Map !== 'function') {
      console.error('Google Maps API is not ready');
      if (mapRef.current) {
        mapRef.current.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 100%; padding: 20px; text-align: center;">
            <div>
              <p style="color: #DC2626; font-weight: 500; margin-bottom: 8px;">Google Maps API Error</p>
              <p style="color: #6B7280; font-size: 14px;">Google Maps API is not ready. Please refresh the page.</p>
            </div>
          </div>
        `;
      }
      return;
    }

    try {
      const location = { lat: parseFloat(latitude), lng: parseFloat(longitude) };

      // Initialize map
      const mapOptions = {
        center: location,
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      };

      // Verify Map constructor exists before using it
      if (typeof window.google.maps.Map !== 'function') {
        throw new Error('window.google.maps.Map is not a constructor. The API may not be fully loaded.');
      }

      const map = new window.google.maps.Map(mapRef.current, mapOptions);
      mapInstanceRef.current = map;

      // Use AdvancedMarkerElement (new recommended approach) if available, otherwise fallback to Marker
      let marker;
      try {
        // Try to use AdvancedMarkerElement if marker library is loaded
        if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
          // AdvancedMarkerElement requires a mapId, but we can use it without if needed
          // For now, we'll use the traditional Marker to avoid requiring a custom Map ID
          marker = new window.google.maps.Marker({
            position: location,
            map: map,
            title: 'Collection Request Location',
            animation: window.google.maps.Animation.DROP,
          });
        } else {
          // Use traditional Marker (deprecated but still works)
          marker = new window.google.maps.Marker({
            position: location,
            map: map,
            title: 'Collection Request Location',
            animation: window.google.maps.Animation.DROP,
          });
        }
      } catch (markerError) {
        // Fallback to traditional Marker if AdvancedMarkerElement fails
        console.warn('AdvancedMarkerElement not available, using traditional Marker:', markerError);
        marker = new window.google.maps.Marker({
          position: location,
          map: map,
          title: 'Collection Request Location',
          animation: window.google.maps.Animation.DROP,
        });
      }

      markerRef.current = marker;

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <strong>Collection Request Location</strong><br>
            <small>Lat: ${parseFloat(latitude).toFixed(6)}, Lng: ${parseFloat(longitude).toFixed(6)}</small>
          </div>
        `,
      });

      // Add click listener to marker
      if (marker.addListener) {
        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
      } else if (marker.addEventListener) {
        marker.addEventListener('click', () => {
          infoWindow.open(map, marker);
        });
      }
    } catch (error) {
      console.error('Error initializing Google Map:', error);
      
      // Check for specific API errors
      let errorMessage = 'Failed to load map. Please check your API key configuration.';
      if (error.message && error.message.includes('ApiNotActivatedMapError')) {
        errorMessage = 'Maps JavaScript API is not activated. Please enable it in Google Cloud Console and ensure GOOGLE_MAPS_API_KEY is set in your .env file.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Show error message in the map container
      if (mapRef.current) {
        mapRef.current.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 100%; padding: 20px; text-align: center;">
            <div>
              <p style="color: #DC2626; font-weight: 500; margin-bottom: 8px;">Google Maps Error</p>
              <p style="color: #6B7280; font-size: 14px;">${errorMessage}</p>
              <p style="color: #6B7280; font-size: 12px; margin-top: 8px;">Please ensure GOOGLE_MAPS_API_KEY is set in your .env file and the Maps JavaScript API is enabled in Google Cloud Console.</p>
            </div>
          </div>
        `;
      }
    }
  };

  if (!latitude || !longitude) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ minHeight: '300px' }}>
        <p className="text-gray-500 text-sm">No location coordinates available</p>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className={`flex items-center justify-center bg-yellow-50 border border-yellow-200 rounded-lg ${className}`} style={{ minHeight: '300px' }}>
        <p className="text-yellow-700 text-sm">Google Maps API key not configured</p>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className={`w-full rounded-lg overflow-hidden border border-gray-200 ${className}`}
      style={{ minHeight: '300px', height: '100%' }}
    />
  );
};

export default GoogleMap;

