import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api.js'

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      // Try to get all events (including pending) for testing
      let response;
      try {
        response = await api.get('/events/admin/all');
      } catch (err) {
        // Fallback to public events if admin route fails
        response = await api.get('/events');
      }
      
      setEvents(response.data);
      console.log('Fetched events for list view:', response.data.length, response.data);
    } catch (err) {
      setError('Failed to load events')
      console.error('Error fetching events:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || 
                           event.category?.toLowerCase() === filterCategory.toLowerCase()
    return matchesSearch && matchesCategory
  })

  const categories = ['all', 'technology', 'business', 'social', 'education', 'entertainment', 'sports', 'food']

  const handleEventClick = async (eventId) => {
    // Track view when user clicks on event
    try {
      await api.post(`/events/${eventId}/view`)
    } catch (e) {
      console.log('Failed to track view:', e)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading amazing events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Huddle
              </span>
            </Link>
            <div className="flex space-x-4">
              <Link 
                to="/explore" 
                className="px-4 py-2 text-gray-700 hover:text-purple-600 transition-colors duration-300"
              >
                Explore
              </Link>
              <Link 
                to="/events/map" 
                className="px-4 py-2 text-gray-700 hover:text-purple-600 transition-colors duration-300"
              >
                Map View
              </Link>
              <Link 
                to="/login" 
                className="px-4 py-2 text-gray-700 hover:text-purple-600 transition-colors duration-300"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="text-center py-16 px-6">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Discover Amazing Events
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Explore events happening around you. From tech meetups to social gatherings, 
          find your next adventure and connect with amazing people.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setFilterCategory(category)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-300 ${
                    filterCategory === category
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category === 'all' ? 'All Events' : category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        {error && (
          <div className="text-center py-8">
            <div className="text-red-600 text-lg">{error}</div>
            <button 
              onClick={fetchEvents}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {filteredEvents.length === 0 && !loading && !error && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No events found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
            <Link
              to="/register"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Create the First Event
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.map((event) => (
            <div
              key={event._id}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              {/* Event Image Placeholder */}
              <div className="w-full h-48 bg-gradient-to-br from-purple-400 to-blue-500 rounded-xl mb-4 flex items-center justify-center">
                <span className="text-4xl">🎉</span>
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

                <div className="pt-4">
                  <Link
                    to={`/events/${event._id}`}
                    onClick={() => handleEventClick(event._id)}
                    className="w-full block text-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
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
              to="/login"
              className="px-8 py-4 border-2 border-purple-600 text-purple-600 text-lg font-semibold rounded-xl hover:bg-purple-600 hover:text-white transform hover:scale-105 transition-all duration-300"
            >
              Already have an account?
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
