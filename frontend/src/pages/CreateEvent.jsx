import { useState } from 'react'
import api from '../lib/api.js'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import confetti from 'canvas-confetti'
import Navbar from '../components/Navbar.jsx'

export default function CreateEvent() {
  const navigate = useNavigate()
  const { user, token, logout } = useAuth()
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    category: 'General',
    maxParticipants: 0,
    price: 0,
    eventType: 'in-person',
    contactEmail: '',
    contactPhone: ''
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const categories = [
    'General', 'Technology', 'Business', 'Social', 'Education', 
    'Entertainment', 'Sports', 'Health', 'Food', 'Music', 'Art'
  ]

  const eventTypes = [
    { value: 'in-person', label: 'In-Person Event' },
    { value: 'virtual', label: 'Virtual Event' },
    { value: 'hybrid', label: 'Hybrid Event' }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      console.log('CreateEvent: Starting event creation...')
      console.log('CreateEvent: User:', user)
      console.log('CreateEvent: Token:', token)
      console.log('CreateEvent: Form data:', form)
      
      // Check if user and token are valid
      if (!user || !token) {
        throw new Error('User or token not found')
      }
      
      const payload = { 
        ...form, 
        date: new Date(form.date).toISOString()
      }
      
      console.log('CreateEvent: Sending payload:', payload)
      console.log('CreateEvent: About to make API call...')
      
      const { data } = await api.post('/events', payload)
      console.log('CreateEvent: Event created successfully:', data)
      
      // Trigger confetti celebration
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']
      })
      
      navigate(`/event/${data._id}`)
    } catch (err) {
      console.error('CreateEvent error:', err);
      console.error('CreateEvent error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        config: err.config
      });
      
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        console.log('CreateEvent: 401 error - session expired');
      } else if (err.response?.status === 403) {
        setError('Access denied. You may not have permission to create events.');
        console.log('CreateEvent: 403 error - access denied');
      } else if (err.code === 'NETWORK_ERROR') {
        setError('Network error. Please check your connection.');
        console.log('CreateEvent: Network error');
      } else {
        setError(err.response?.data?.message || 'Failed to create event. Please try again.');
        console.log('CreateEvent: Other error');
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">🎉</span>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Create Amazing Event
            </h2>
            <p className="text-gray-600 mt-2">Share your event with the world!</p>
          </div>

          {/* Debug Info */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <h3 className="font-semibold text-blue-800 mb-2">Debug Info:</h3>
            <p className="text-sm text-blue-700">User: {user ? user.name : 'None'}</p>
            <p className="text-sm text-blue-700">Token: {token ? 'Present' : 'None'}</p>
            <p className="text-sm text-blue-700">User ID: {user ? user.id : 'None'}</p>
          </div>
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
          
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Title *</label>
                  <input 
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
                    placeholder="Enter event title" 
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea 
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 resize-none" 
                  placeholder="Describe your event..." 
                  rows="4"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time *</label>
                  <input 
                    type="datetime-local"
                    name="date"
                    value={form.date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                  <input 
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
                    placeholder="Enter event location"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Event Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                  <select
                    name="eventType"
                    value={form.eventType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  >
                    {eventTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Participants</label>
                  <input 
                    type="number"
                    name="maxParticipants"
                    value={form.maxParticipants}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
                    placeholder="0 for unlimited"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (USD)</label>
                  <input 
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
                    placeholder="0 for free"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                  <input 
                    type="email"
                    name="contactEmail"
                    value={form.contactEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
                    placeholder="contact@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                  <input 
                    type="tel"
                    name="contactPhone"
                    value={form.contactPhone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-6 space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Event...</span>
                  </div>
                ) : (
                  'Create Event'
                )}
              </button>
              
              <button
                type="button"
                onClick={async () => {
                  console.log('CreateEvent: Testing simple event creation...')
                  console.log('CreateEvent: Current user:', user)
                  console.log('CreateEvent: Current token:', token)
                  
                  try {
                    const testPayload = {
                      title: 'Test Event',
                      description: 'Test Description',
                      date: new Date().toISOString(),
                      location: 'Test Location',
                      category: 'General'
                    }
                    console.log('CreateEvent: Test payload:', testPayload)
                    console.log('CreateEvent: About to make API call...')
                    
                    const { data } = await api.post('/events', testPayload)
                    console.log('CreateEvent: Test event created:', data)
                    alert('Test event created successfully!')
                  } catch (err) {
                    console.error('CreateEvent: Test event failed:', err)
                    console.error('CreateEvent: Test error details:', {
                      message: err.message,
                      status: err.response?.status,
                      data: err.response?.data
                    });
                    alert('Test event failed: ' + err.message)
                  }
                }}
                className="px-8 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transform hover:scale-105 transition-all duration-300"
              >
                Test Create
              </button>

              <button
                type="button"
                onClick={() => {
                  console.log('CreateEvent: Manual logout test')
                  logout()
                }}
                className="px-8 py-4 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transform hover:scale-105 transition-all duration-300"
              >
                Test Logout
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


