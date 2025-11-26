import { useEffect, useRef } from 'react';

const GoogleMap = ({ latitude, longitude, apiKey, className = '' }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!latitude || !longitude || !apiKey) return;

    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    // Load Google Maps API script with recommended loading=async parameter
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = initializeMap;
    script.onerror = () => {
      console.error('Failed to load Google Maps API. Please check your API key configuration.');
      if (mapRef.current) {
        mapRef.current.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 100%; padding: 20px; text-align: center;">
            <div>
              <p style="color: #DC2626; font-weight: 500; margin-bottom: 8px;">Google Maps API Error</p>
              <p style="color: #6B7280; font-size: 14px;">Failed to load Google Maps. Please check your API key configuration in the .env file.</p>
              <p style="color: #6B7280; font-size: 12px; margin-top: 8px;">Make sure GOOGLE_MAPS_API_KEY is set and the Maps JavaScript API is enabled.</p>
            </div>
          </div>
        `;
      }
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script if component unmounts
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, [latitude, longitude, apiKey]);

  const initializeMap = async () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      const location = { lat: parseFloat(latitude), lng: parseFloat(longitude) };

      // Initialize map
      // Note: mapId is optional but recommended for AdvancedMarkerElement
      // If you have a custom Map ID from Google Cloud Console, use it here
      const mapOptions = {
        center: location,
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      };

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
              <p style="color: #6B7280; font-size: 12px; margin-top: 8px;">Add GOOGLE_MAPS_API_KEY=AIzaSyB9Z95Q-GkCc-MPi4oYD4Leg54EbAQVaxI to your backend/.env file</p>
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

