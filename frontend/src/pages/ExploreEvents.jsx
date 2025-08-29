import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../lib/api.js';
import Navbar from '../components/Navbar.jsx';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Function to create event marker icon based on category
const createEventIcon = (category) => {
  const colors = {
    technology: '#3B82F6', // Blue
    business: '#10B981',   // Green
    social: '#EC4899',     // Pink
    education: '#F59E0B',  // Yellow
    entertainment: '#8B5CF6', // Purple
    sports: '#EF4444',     // Red
    food: '#F97316',       // Orange
    default: '#F59E0B'     // Default orange
  };
  
  const color = colors[category?.toLowerCase()] || colors.default;
  
  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2c-9.94 0-18 8.06-18 18 0 13.25 18 20 18 20s18-6.75 18-20C38 10.06 29.94 2 20 2z" fill="${color}"/>
        <circle cx="20" cy="14" r="6" fill="white"/>
        <path d="M18 12c0-1.1 0.9-2 2-2s2 0.9 2 2-2 2-2 2-2-0.9-2-2z" fill="${color}"/>
        <path d="M16 16c0-1.1 0.9-2 2-2h4c1.1 0 2 0.9 2 2v4c0 1.1-0.9 2-2 2h-4c-1.1 0-2-0.9-2-2z" fill="white"/>
        <path d="M18 14c0-0.6 0.4-1 1-1h2c0.6 0 1 0.4 1 1v2c0 0.6-0.4 1-1 1h-2c-0.6 0-1-0.4-1-1v-2z" fill="${color}"/>
      </svg>
    `)}`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

// User location marker
const userLocationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyYzAgNS41MiA0LjQ4IDEwIDEwIDEwczEwLTQuNDggMTAtMTBDMjIgNi40OCAxNy41MiAyIDEyIDJ6bTAgMThjLTQuNDEgMC04LTMuNTktOC04czMuNTktOCA4LTggOCAzLjU5IDggOC0zLjU5IDgtOCA4eiIgZmlsbD0iIzEwQjk4MSIvPgo8cGF0aCBkPSJNMTIgN2MtMi43NiAwLTUgMi4yNC01IDVzMi4yNCA1IDUgNSA1LTIuMjQgNS01LTIuMjQtNS01LTV6bTAgOGMtMS42NiAwLTMtMS4zNC0zLTMsMC0xLjY2LDEuMzQtMyAzLTMsMS42NiAwIDMgMS4zNCAzIDNDMTUgMTMuNjYgMTMuNjYgMTUgMTIgMTV6IiBmaWxsPSIjMTBCOTgxIi8+Cjwvc3ZnPgo=',
  iconSize: [25, 25],
  iconAnchor: [12, 25],
  popupAnchor: [0, -25]
});

export default function ExploreEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [radius, setRadius] = useState(10); // km
  const [showNearbyOnly, setShowNearbyOnly] = useState(false);
  const [mapView, setMapView] = useState(true);
  const [selectedCity, setSelectedCity] = useState('');
  const [cityCoordinates, setCityCoordinates] = useState(null);
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [manualLocation, setManualLocation] = useState({ lat: '', lng: '' });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Try to get all events (including pending) for testing
      let response;
      try {
        response = await api.get('/events/admin/all');
      } catch (err) {
        // Fallback to public events if admin route fails
        response = await api.get('/events');
      }
      
      // Filter events that have coordinates
      const eventsWithCoords = response.data.filter(event => 
        event.coordinates && event.coordinates.lat && event.coordinates.lng
      );
      setEvents(eventsWithCoords);
      console.log('Fetched events:', eventsWithCoords.length, eventsWithCoords);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const detectUserLocation = () => {
    setIsDetectingLocation(true);
    console.log('Attempting to detect user location...');
    
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      };
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Location detected successfully:', position);
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(coords);
          setIsDetectingLocation(false);
          setShowNearbyOnly(true); // Automatically enable nearby events
          
          // Find and set the nearest city
          const nearestCityInfo = findNearestCity(coords.lat, coords.lng);
          if (nearestCityInfo.city && nearestCityInfo.distance < 50) { // Within 50km
            setSelectedCity(nearestCityInfo.city.name);
            setCityCoordinates(nearestCityInfo.city);
            console.log(`Nearest city: ${nearestCityInfo.city.name} (${nearestCityInfo.distance.toFixed(1)}km away)`);
          }
          
          console.log('User location set to:', coords);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsDetectingLocation(false);
          
          let errorMessage = 'Unable to detect your location. ';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Please allow location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Location request timed out.';
              break;
            default:
              errorMessage += 'An unknown error occurred.';
          }
          
          alert(errorMessage);
        },
        options
      );
    } else {
      setIsDetectingLocation(false);
      alert('Geolocation is not supported by this browser. Please use a modern browser.');
    }
  };

  // Calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Find nearest city to user location
  const findNearestCity = (userLat, userLng) => {
    let nearestCity = null;
    let shortestDistance = Infinity;

    popularCities.forEach(city => {
      const distance = calculateDistance(userLat, userLng, city.lat, city.lng);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestCity = city;
      }
    });

    return { city: nearestCity, distance: shortestDistance };
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || 
                           event.category?.toLowerCase() === filterCategory.toLowerCase();
    
    let matchesLocation = true;
    if (showNearbyOnly) {
      let referenceLocation = userLocation;
      if (selectedCity && cityCoordinates) {
        referenceLocation = cityCoordinates;
      }
      
      if (referenceLocation) {
        const distance = calculateDistance(
          referenceLocation.lat, referenceLocation.lng,
          event.coordinates.lat, event.coordinates.lng
        );
        matchesLocation = distance <= radius;
      }
    }
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const categories = ['all', 'technology', 'business', 'social', 'education', 'entertainment', 'sports', 'food'];
  
  // Popular cities with coordinates
  const popularCities = [
    { name: 'New York', lat: 40.7128, lng: -74.0060 },
    { name: 'London', lat: 51.5074, lng: -0.1278 },
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
    { name: 'Paris', lat: 48.8566, lng: 2.3522 },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { name: 'Delhi', lat: 28.7041, lng: 77.1025 },
    { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
    { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
    { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
    { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
    { name: 'Pune', lat: 18.5204, lng: 73.8567 },
    { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
    { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
    { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
    { name: 'Kanpur', lat: 26.4499, lng: 80.3319 },
    { name: 'Nagpur', lat: 21.1458, lng: 79.0882 },
    { name: 'Indore', lat: 22.7196, lng: 75.8577 },
    { name: 'Thane', lat: 19.2183, lng: 72.9781 },
    { name: 'Bhopal', lat: 23.2599, lng: 77.4126 },
    { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
    // Gujarat Cities
    { name: 'Surat', lat: 21.1702, lng: 72.8311 },
    { name: 'Vadodara', lat: 22.3072, lng: 73.1812 },
    { name: 'Rajkot', lat: 22.3039, lng: 70.8022 },
    { name: 'Bhavnagar', lat: 21.7645, lng: 72.1519 },
    { name: 'Jamnagar', lat: 22.4707, lng: 70.0577 },
    { name: 'Gandhinagar', lat: 23.2156, lng: 72.6369 },
    { name: 'Anand', lat: 22.5645, lng: 72.9289 },
    { name: 'Bharuch', lat: 21.7051, lng: 72.9959 },
    { name: 'Junagadh', lat: 21.5222, lng: 70.4579 },
    { name: 'Navsari', lat: 20.9517, lng: 72.9324 },
    { name: 'Surendranagar', lat: 22.7275, lng: 71.6836 },
    { name: 'Gandhidham', lat: 23.0833, lng: 70.1333 },
    { name: 'Veraval', lat: 20.9159, lng: 70.3629 },
    { name: 'Porbandar', lat: 21.6422, lng: 69.6093 },
    { name: 'Bhuj', lat: 23.2540, lng: 69.6693 },
    { name: 'Palanpur', lat: 24.1724, lng: 72.4346 },
    { name: 'Himmatnagar', lat: 23.5986, lng: 72.9662 },
    { name: 'Godhra', lat: 22.7772, lng: 73.6203 },
    { name: 'Morbi', lat: 22.8173, lng: 70.8372 },
    { name: 'Valsad', lat: 20.6104, lng: 72.9342 },
    { name: 'Dahod', lat: 22.8312, lng: 74.2535 },
    { name: 'Nadiad', lat: 22.6939, lng: 72.8616 },
    { name: 'Patan', lat: 23.8507, lng: 72.1147 },
    { name: 'Botad', lat: 22.1692, lng: 71.6664 },
    { name: 'Amreli', lat: 21.6225, lng: 71.2215 },
    { name: 'Deesa', lat: 24.2676, lng: 72.1797 },
    { name: 'Jetpur', lat: 21.7489, lng: 70.6234 },
    { name: 'Gondal', lat: 21.9607, lng: 70.8029 },
    { name: 'Ankleshwar', lat: 21.6225, lng: 72.9905 },
    { name: 'Sidhpur', lat: 23.9121, lng: 72.3728 },
    { name: 'Mahuva', lat: 21.0833, lng: 71.7667 },
    { name: 'Wadhwan', lat: 22.7000, lng: 71.6833 },
    { name: 'Lunawada', lat: 23.1284, lng: 73.6103 },
    { name: 'Santrampur', lat: 23.1722, lng: 73.3277 },
    { name: 'Kapadvanj', lat: 23.0230, lng: 73.0713 },
    { name: 'Modasa', lat: 23.4625, lng: 73.2986 },
    { name: 'Vapi', lat: 20.3714, lng: 72.9047 },
    { name: 'Bardoli', lat: 21.1229, lng: 72.9714 },
    { name: 'Vyara', lat: 21.1104, lng: 73.3938 },
    { name: 'Songadh', lat: 21.1697, lng: 73.5636 },
    { name: 'The Dangs', lat: 20.7500, lng: 73.7500 },
    { name: 'Navsari', lat: 20.9517, lng: 72.9324 },
    { name: 'Valsad', lat: 20.6104, lng: 72.9342 },
    { name: 'Tapi', lat: 21.1200, lng: 73.4000 }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Navbar />
      
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Hero Section */}
      <div className="text-center py-8 px-6">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Explore Events Near You
        </h1>
        <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
          Discover amazing events happening around you. Use your location to find nearby events or explore globally.
        </p>
        
        {/* Location Detection */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div className="md:w-48">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:w-48">
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    const city = e.target.value;
                    setSelectedCity(city);
                    if (city) {
                      const cityData = popularCities.find(c => c.name === city);
                      setCityCoordinates(cityData);
                      setShowNearbyOnly(true);
                    } else {
                      setCityCoordinates(null);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select City</option>
                  {popularCities.map(city => (
                    <option key={city.name} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={detectUserLocation}
                disabled={isDetectingLocation}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isDetectingLocation
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
              >
                {isDetectingLocation ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Detecting...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    Use My Location
                  </div>
                )}
              </button>
            </div>

            {/* Location Status */}
            {userLocation && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-center mb-2">
                  <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Location detected: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                  </div>
                </div>
              </div>
            )}

            {/* Manual Location Input */}
            {!userLocation && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <button
                    onClick={() => setShowManualLocation(!showManualLocation)}
                    className="text-sm text-purple-600 hover:text-purple-700 underline"
                  >
                    {showManualLocation ? 'Hide' : 'Add'} Manual Location
                  </button>
                  
                  {showManualLocation && (
                    <div className="flex flex-col md:flex-row gap-2 items-center">
                      <input
                        type="number"
                        step="any"
                        placeholder="Latitude"
                        value={manualLocation.lat}
                        onChange={(e) => setManualLocation({ ...manualLocation, lat: e.target.value })}
                        className="px-3 py-1 border border-gray-300 rounded text-sm w-24"
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="Longitude"
                        value={manualLocation.lng}
                        onChange={(e) => setManualLocation({ ...manualLocation, lng: e.target.value })}
                        className="px-3 py-1 border border-gray-300 rounded text-sm w-24"
                      />
                      <button
                        onClick={() => {
                          if (manualLocation.lat && manualLocation.lng) {
                            setUserLocation({
                              lat: parseFloat(manualLocation.lat),
                              lng: parseFloat(manualLocation.lng)
                            });
                            setShowNearbyOnly(true);
                            setShowManualLocation(false);
                          }
                        }}
                        className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                      >
                        Set Location
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Nearby Events Filter */}
            {(userLocation || selectedCity) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showNearbyOnly}
                      onChange={(e) => setShowNearbyOnly(e.target.checked)}
                      className="mr-2 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">
                      Show only nearby events
                      {selectedCity && ` (${selectedCity})`}
                      {userLocation && !selectedCity && ' (Your Location)'}
                    </span>
                  </label>
                  
                  {showNearbyOnly && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Within:</span>
                      <select
                        value={radius}
                        onChange={(e) => setRadius(parseInt(e.target.value))}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value={5}>5 km</option>
                        <option value={10}>10 km</option>
                        <option value={25}>25 km</option>
                        <option value={50}>50 km</option>
                        <option value={100}>100 km</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <div className="flex justify-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-1 shadow-lg border border-white/20">
            <button
              onClick={() => setMapView(true)}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                mapView
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Map View
            </button>
            <button
              onClick={() => setMapView(false)}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                !mapView
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              List View
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {mapView ? (
          /* Map View */
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden relative">
            {/* Map Legend */}
            <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-white/20">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Event Categories</h4>
              <div className="space-y-1">
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  <span>Technology</span>
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span>Business</span>
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded-full bg-pink-500 mr-2"></div>
                  <span>Social</span>
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                  <span>Education</span>
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                  <span>Entertainment</span>
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <span>Sports</span>
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                  <span>Food</span>
                </div>
              </div>
            </div>
            
            <div className="h-[600px] w-full">
              <MapContainer
                center={userLocation || [20, 0]}
                zoom={userLocation ? 12 : 2}
                style={{ height: '100%', width: '100%' }}
                className="rounded-2xl"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {/* User Location */}
                {userLocation && (
                  <>
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-bold text-lg mb-2">Your Location</h3>
                          <p className="text-sm text-gray-600">
                            {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                    <Circle
                      center={[userLocation.lat, userLocation.lng]}
                      radius={radius * 1000}
                      pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
                    />
                  </>
                )}
                
                {/* Event Markers */}
                {filteredEvents.map((event) => (
                  <Marker
                    key={event._id}
                    position={[event.coordinates.lat, event.coordinates.lng]}
                    icon={createEventIcon(event.category)}
                    eventHandlers={{
                      click: () => setSelectedEvent(event),
                    }}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-bold text-lg mb-2">{event.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{event.location}</p>
                        <p className="text-sm text-gray-500 mb-3">
                          {new Date(event.date).toLocaleDateString()}
                        </p>
                        {userLocation && (
                          <p className="text-xs text-gray-500 mb-2">
                            {calculateDistance(
                              userLocation.lat, userLocation.lng,
                              event.coordinates.lat, event.coordinates.lng
                            ).toFixed(1)} km away
                          </p>
                        )}
                        <Link
                          to={`/event/${event._id}`}
                          className="inline-block bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
                        >
                          View Details
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event._id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                {/* Event Image */}
                <div className="w-full h-48 bg-gradient-to-br from-purple-400 to-blue-500 rounded-xl mb-4 flex items-center justify-center">
                  {event.coverPhoto ? (
                    <img src={event.coverPhoto} alt={event.title} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <span className="text-4xl">🎉</span>
                  )}
                </div>

                {/* Event Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      event.category?.toLowerCase() === 'technology' ? 'bg-blue-100 text-blue-800' :
                      event.category?.toLowerCase() === 'business' ? 'bg-green-100 text-green-800' :
                      event.category?.toLowerCase() === 'social' ? 'bg-pink-100 text-pink-800' :
                      event.category?.toLowerCase() === 'education' ? 'bg-yellow-100 text-yellow-800' :
                      event.category?.toLowerCase() === 'entertainment' ? 'bg-purple-100 text-purple-800' :
                      event.category?.toLowerCase() === 'sports' ? 'bg-red-100 text-red-800' :
                      event.category?.toLowerCase() === 'food' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {event.category}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 line-clamp-2">
                    {event.title}
                  </h3>

                  <p className="text-gray-600 line-clamp-3">
                    {event.description}
                  </p>

                  <div className="flex items-center justify-between pt-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {event.organizer?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {event.organizer?.name || 'Anonymous'}
                      </span>
                    </div>

                    <div className="text-sm text-gray-500">
                      {event.participants?.length || 0} participants
                    </div>
                  </div>

                  {userLocation && (
                    <div className="text-sm text-gray-500">
                      {calculateDistance(
                        userLocation.lat, userLocation.lng,
                        event.coordinates.lat, event.coordinates.lng
                      ).toFixed(1)} km away
                    </div>
                  )}

                  <div className="pt-4">
                    <Link
                      to={`/event/${event._id}`}
                      className="w-full block text-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event Stats */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{filteredEvents.length}</div>
            <div className="text-gray-600">Events Found</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {new Set(filteredEvents.map(e => e.category)).size}
            </div>
            <div className="text-gray-600">Categories</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {filteredEvents.reduce((sum, e) => sum + (e.participants?.length || 0), 0)}
            </div>
            <div className="text-gray-600">Total Participants</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {userLocation ? 'Active' : 'Global'}
            </div>
            <div className="text-gray-600">Location Filter</div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Ready to Create Your Own Event?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of event organizers and start creating unforgettable experiences today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-semibold rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              Get Started Free
            </Link>
            <Link
              to="/events"
              className="px-8 py-4 border-2 border-purple-600 text-purple-600 text-lg font-semibold rounded-xl hover:bg-purple-600 hover:text-white transition-all duration-300"
            >
              View All Events
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
