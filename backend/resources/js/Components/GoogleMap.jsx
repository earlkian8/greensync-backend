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

    // Load Google Maps API script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = initializeMap;
    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script if component unmounts
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, [latitude, longitude, apiKey]);

  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const location = { lat: parseFloat(latitude), lng: parseFloat(longitude) };

    // Initialize map
    const map = new window.google.maps.Map(mapRef.current, {
      center: location,
      zoom: 15,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    mapInstanceRef.current = map;

    // Add marker
    const marker = new window.google.maps.Marker({
      position: location,
      map: map,
      title: 'Collection Request Location',
      animation: window.google.maps.Animation.DROP,
    });

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

    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });
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

