import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import api from '../lib/api.js';
import Navbar from '../components/Navbar.jsx';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom event marker icon
const eventIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDkuNzRMMTIgMTZMMTAuOTEgOS43NEw0IDlMMTAuOTEgOC4yNkwxMiAyWiIgZmlsbD0iI0Y1OTkyQSIvPgo8L3N2Zz4K',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

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

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/events');
      // Filter events that have coordinates
      const eventsWithCoords = response.data.filter(event => 
        event.coordinates && event.coordinates.lat && event.coordinates.lng
      );
      setEvents(eventsWithCoords);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

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
          setIsDetectingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsDetectingLocation(false);
          alert('Unable to detect your location. Please try again.');
        }
      );
    } else {
      setIsDetectingLocation(false);
      alert('Geolocation is not supported by this browser.');
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

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || event.category === filterCategory;
    
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

  const categories = ['all', 'technology', 'business', 'social', 'education', 'entertainment', 'sports'];
  
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
    { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 }
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
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
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
                    icon={eventIcon}
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
                          to={`/events/${event._id}`}
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
                      event.category === 'technology' ? 'bg-blue-100 text-blue-800' :
                      event.category === 'business' ? 'bg-green-100 text-green-800' :
                      event.category === 'social' ? 'bg-pink-100 text-pink-800' :
                      event.category === 'education' ? 'bg-yellow-100 text-yellow-800' :
                      event.category === 'entertainment' ? 'bg-purple-100 text-purple-800' :
                      event.category === 'sports' ? 'bg-red-100 text-red-800' :
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
                      to={`/events/${event._id}`}
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
