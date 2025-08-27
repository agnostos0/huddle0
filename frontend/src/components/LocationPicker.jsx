import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Loader } from '@googlemaps/js-api-loader';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom location marker
const locationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyYzAgNS41MiA0LjQ4IDEwIDEwIDEwczEwLTQuNDggMTAtMTBDMjIgNi40OCAxNy41MiAyIDEyIDJ6bTAgMThjLTQuNDEgMC04LTMuNTktOC04czMuNTktOCA4LTggOCAzLjU5IDggOC0zLjU5IDgtOCA4eiIgZmlsbD0iIzM4NEY1NiIvPgo8cGF0aCBkPSJNMTIgN2MtMi43NiAwLTUgMi4yNC01IDVzMi4yNCA1IDUgNSA1LTIuMjQgNS01LTIuMjQtNS01LTV6bTAgOGMtMS42NiAwLTMtMS4zNC0zLTMsMC0xLjY2LDEuMzQtMyAzLTMsMS42NiAwIDMgMS4zNCAzIDNDMTUgMTMuNjYgMTMuNjYgMTUgMTIgMTV6IiBmaWxsPSIjMzg0RjU2Ii8+Cjwvc3ZnPgo=',
  iconSize: [25, 25],
  iconAnchor: [12, 25],
  popupAnchor: [0, -25]
});

// Map click handler component
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng);
    },
  });
  return null;
}

export default function LocationPicker({ 
  location, 
  coordinates, 
  onLocationChange, 
  onCoordinatesChange,
  placeholder = "Enter event location or click on map"
}) {
  const [searchTerm, setSearchTerm] = useState(location || '');
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState(coordinates || null);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const searchTimeoutRef = useRef(null);
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize Google Maps
  useEffect(() => {
    const initGoogleMaps = async () => {
      try {
        const loader = new Loader({
          apiKey: 'AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg', // Replace with your Google Maps API key
          version: 'weekly',
          libraries: ['places']
        });

        await loader.load();
        
        // Initialize autocomplete
        if (inputRef.current) {
          autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
            types: ['establishment', 'geocode'],
            componentRestrictions: { country: ['us', 'in', 'gb', 'ca', 'au'] }
          });

          autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry) {
              const coords = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              };
              handleLocationSelect(place.formatted_address, coords);
            }
          });
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    initGoogleMaps();
  }, []);

  // Detect user location
  const detectUserLocation = () => {
    setIsDetectingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(coords);
          reverseGeocode(coords);
          setIsDetectingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsDetectingLocation(false);
          alert('Unable to detect your location. Please enter manually.');
        }
      );
    } else {
      setIsDetectingLocation(false);
      alert('Geolocation is not supported by this browser.');
    }
  };

  const reverseGeocode = async (coords) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=10`
      );
      const data = await response.json();
      if (data.display_name) {
        const locationName = data.display_name.split(',').slice(0, 3).join(',');
        setSearchTerm(locationName);
        onLocationChange(locationName);
        setSelectedCoords(coords);
        onCoordinatesChange(coords);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  const handleLocationSelect = (locationData, coords = null) => {
    if (typeof locationData === 'string') {
      // String location (from search)
      setSearchTerm(locationData);
      onLocationChange(locationData);
      
      if (coords) {
        setSelectedCoords(coords);
        onCoordinatesChange(coords);
      }
    } else {
      // Coordinates from map click
      setSelectedCoords(locationData);
      onCoordinatesChange(locationData);
      
      // Reverse geocode to get location name
      reverseGeocode(locationData);
    }
    setIsMapOpen(false);
  };

  const handleMapClick = (latlng) => {
    handleLocationSelect(latlng);
  };

  return (
    <div className="space-y-4">
      {/* Location Input with Google Places Autocomplete */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
        />
        
        {/* Action Buttons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          {/* Detect Location Button */}
          <button
            type="button"
            onClick={detectUserLocation}
            disabled={isDetectingLocation}
            className="p-2 text-gray-500 hover:text-purple-600 transition-colors"
            title="Detect my location"
          >
            {isDetectingLocation ? (
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
          
          {/* Map Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMapOpen(!isMapOpen)}
            className="p-2 text-gray-500 hover:text-purple-600 transition-colors"
            title="Open map"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Location Detection Status */}
      {isDetectingLocation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-blue-800">Detecting your location...</span>
          </div>
        </div>
      )}

      {/* User Location Display */}
      {userLocation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-green-800">Location detected successfully</span>
            </div>
            <button
              type="button"
              onClick={() => setUserLocation(null)}
              className="text-green-600 hover:text-green-800 text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
          <span className="ml-2 text-sm text-gray-600">Searching locations...</span>
        </div>
      )}

      {/* Map */}
      {isMapOpen && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Select Location on Map</h3>
            <p className="text-sm text-gray-600">Click anywhere on the map to set the event location</p>
          </div>
          <div className="h-64 w-full">
            <MapContainer
              center={selectedCoords || userLocation || [40.7128, -74.0060]}
              zoom={10}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <MapClickHandler onLocationSelect={handleMapClick} />
              
              {selectedCoords && (
                <Marker position={[selectedCoords.lat, selectedCoords.lng]} icon={locationIcon}>
                </Marker>
              )}
              
              {userLocation && (
                <Marker 
                  position={[userLocation.lat, userLocation.lng]} 
                  icon={new L.Icon({
                    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyYzAgNS41MiA0LjQ4IDEwIDEwIDEwczEwLTQuNDggMTAtMTBDMjIgNi40OCAxNy41MiAyIDEyIDJ6bTAgMThjLTQuNDEgMC04LTMuNTktOC04czMuNTktOCA4LTggOCAzLjU5IDggOC0zLjU5IDgtOCA4eiIgZmlsbD0iIzEwQjk4MSIvPgo8cGF0aCBkPSJNMTIgN2MtMi43NiAwLTUgMi4yNC01IDVzMi4yNCA1IDUgNSA1LTIuMjQgNS01LTIuMjQtNS01LTV6bTAgOGMtMS42NiAwLTMtMS4zNC0zLTMsMC0xLjY2LDEuMzQtMyAzLTMsMS42NiAwIDMgMS4zNCAzIDNDMTUgMTMuNjYgMTMuNjYgMTUgMTIgMTV6IiBmaWxsPSIjMTBCOTgxIi8+Cjwvc3ZnPgo=',
                    iconSize: [20, 20],
                    iconAnchor: [10, 20],
                    popupAnchor: [0, -20]
                  })}
                >
                </Marker>
              )}
            </MapContainer>
          </div>
        </div>
      )}

      {/* Selected Coordinates Display */}
      {selectedCoords && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-green-800">
              Location set: {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
