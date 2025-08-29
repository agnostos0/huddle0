import { useState, useRef } from 'react'
import api from '../lib/api.js'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import confetti from 'canvas-confetti'
import Navbar from '../components/Navbar.jsx'
import { compressImages } from '../utils/imageCompression.js'
import OrganizerRequestModal from '../components/OrganizerRequestModal.jsx'

export default function CreateEvent() {
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const fileInputRef = useRef(null)
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    googleLocationLink: '',
    category: 'General',
    maxParticipants: 0,
    teamRequirements: {
      girlsRequired: 0,
      boysRequired: 0
    },
    price: 0,
    pricing: {
      individual: 0,
      teamLeader: 0,
      teamMember: 0,
      malePrice: 0,
      femalePrice: 0
    },
    eventType: 'in-person',
    contactEmail: '',
    contactPhone: '',
    photos: []
  })
  
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [compressionProgress, setCompressionProgress] = useState('')
  const [showGoogleLink, setShowGoogleLink] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showOrganizerRequest, setShowOrganizerRequest] = useState(false)

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
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: parseInt(value) || 0
        }
      }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleLocationSearch = async (e) => {
    const value = e.target.value
    setForm(prev => ({ ...prev, location: value }))
    
    if (value.length > 2) {
      try {
        // Simulate Google Places API call (you'll need to implement this with actual Google Places API)
        const suggestions = [
          `${value} - City Center`,
          `${value} - Shopping Mall`,
          `${value} - Community Center`,
          `${value} - Park`,
          `${value} - Conference Hall`
        ]
        setLocationSuggestions(suggestions)
        setShowSuggestions(true)
      } catch (error) {
        console.error('Location search error:', error)
      }
    } else {
      setLocationSuggestions([])
      setShowSuggestions(false)
    }
  }

  const selectLocation = (location) => {
    setForm(prev => ({ ...prev, location }))
    setShowSuggestions(false)
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length === 0) {
      alert('Please select image files only.')
      return
    }
    
    // Limit file size to 2MB (will be compressed further)
    const validFiles = imageFiles.filter(file => file.size <= 2 * 1024 * 1024)
    
    if (validFiles.length !== imageFiles.length) {
      alert('Some files were too large. Maximum file size is 2MB.')
    }
    
    setIsUploadingImages(true)
    
    try {
      setCompressionProgress('Compressing images...')
      // Compress images very aggressively for smaller file sizes
      const compressedImages = await compressImages(validFiles, 400, 0.3)
      
      setForm(prev => ({
        ...prev,
        photos: [...prev.photos, ...compressedImages]
      }))
      
      console.log(`Added ${compressedImages.length} compressed images`)
      setCompressionProgress('Images compressed successfully!')
      setTimeout(() => setCompressionProgress(''), 2000)
    } catch (error) {
      console.error('Error processing images:', error)
      alert('Error processing images. Please try again.')
    } finally {
      setIsUploadingImages(false)
    }
  }

  const removePhoto = (index) => {
    setForm(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }))
  }

  const setCoverPhoto = (index) => {
    const photos = [...form.photos]
    const coverPhoto = photos.splice(index, 1)[0]
    setForm(prev => ({
      ...prev,
      photos: [coverPhoto, ...photos]
    }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (!user || !token) {
        throw new Error('User or token not found')
      }

      // Check if user is an organizer
      if (user.role !== 'organizer' && user.role !== 'admin') {
        setShowOrganizerRequest(true)
        setIsSubmitting(false)
        return
      }
      
      // Prepare payload with photos
      const payload = { 
        ...form, 
        date: new Date(form.date).toISOString(),
        photos: form.photos || [],
        coverPhoto: form.photos.length > 0 ? form.photos[0] : null
      }
      
      // Clean up teamRequirements - remove teamSize if present
      if (payload.teamRequirements && payload.teamRequirements.teamSize !== undefined) {
        delete payload.teamRequirements.teamSize;
      }
      
      console.log('Creating event with payload:', {
        ...payload,
        photos: payload.photos ? `${payload.photos.length} photos` : 'no photos',
        teamRequirements: payload.teamRequirements
      })
      
      const { data } = await api.post('/events', payload)
      
      // Trigger confetti celebration
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']
      })
      
      navigate(`/event/${data._id}`)
    } catch (err) {
      console.error('CreateEvent error:', err)
      console.error('Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      })
      
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.')
      } else if (err.code === 'NETWORK_ERROR') {
        setError('Network error. Please check your connection.')
      } else if (err.response?.status === 413) {
        setError('Images are too large. Please try with smaller images.')
      } else {
        setError(err.response?.data?.message || 'Failed to create event. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto p-6">
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
            {user && (user.role === 'organizer' || user.role === 'admin') && (
              <div className="mt-4 inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {user.role === 'admin' ? 'Admin' : 'Organizer'} - Can Create Events
              </div>
            )}
          </div>
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
          
          <form onSubmit={onSubmit} className="space-y-8">
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
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Location Details
              </h3>
              
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                  <input 
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleLocationSearch}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
                    placeholder="Search for a location..."
                    required
                  />
                  
                  {/* Location Suggestions */}
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {locationSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => selectLocation(suggestion)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center space-x-3">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{suggestion}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="showGoogleLink"
                    checked={showGoogleLink}
                    onChange={(e) => setShowGoogleLink(e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="showGoogleLink" className="text-sm text-gray-700">
                    Add Google Maps link
                  </label>
                </div>

                {showGoogleLink && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Google Maps Link</label>
                    <input 
                      type="url"
                      name="googleLocationLink"
                      value={form.googleLocationLink}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
                      placeholder="https://maps.google.com/..."
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Team Requirements */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Team Requirements
              </h3>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 mb-3">
                    <strong>Team Requirements:</strong> Set how many girls and boys are required for each team. 
                    The total team size will be calculated automatically.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Girls Required per Team
                      </label>
                      <input 
                        type="number"
                        name="teamRequirements.girlsRequired"
                        value={form.teamRequirements.girlsRequired}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Boys Required per Team
                      </label>
                      <input 
                        type="number"
                        name="teamRequirements.boysRequired"
                        value={form.teamRequirements.boysRequired}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Total Team Size:</strong> {form.teamRequirements.girlsRequired + form.teamRequirements.boysRequired} members
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Event Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">General Price (₹)</label>
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

            {/* Prize Pool Structure */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Prize Pool Structure (₹)
              </h3>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800 mb-3">
                  <strong>Prize Pool:</strong> Set the prize amounts for different positions. 
                  This will be distributed among winners.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">1st Place Prize (₹)</label>
                  <input 
                    type="number"
                    name="pricing.individual"
                    value={form.pricing.individual}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">2nd Place Prize (₹)</label>
                  <input 
                    type="number"
                    name="pricing.teamLeader"
                    value={form.pricing.teamLeader}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">3rd Place Prize (₹)</label>
                  <input 
                    type="number"
                    name="pricing.teamMember"
                    value={form.pricing.teamMember}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Consolation Prize 1 (₹)</label>
                  <input 
                    type="number"
                    name="pricing.malePrice"
                    value={form.pricing.malePrice}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Consolation Prize 2 (₹)</label>
                  <input 
                    type="number"
                    name="pricing.femalePrice"
                    value={form.pricing.femalePrice}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Photo Upload */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Event Photos
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Photos</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                                         <button
                       type="button"
                       onClick={() => fileInputRef.current?.click()}
                       disabled={isUploadingImages}
                       className="w-full disabled:opacity-50"
                     >
                                               {isUploadingImages ? (
                          <>
                            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">{compressionProgress || 'Processing images...'}</p>
                          </>
                        ) : (
                         <>
                           <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                           </svg>
                                                       <p className="text-gray-600">Click to upload photos or drag and drop</p>
                            <p className="text-sm text-gray-500 mt-1">PNG, JPG, GIF up to 2MB each (will be auto-compressed)</p>
                         </>
                       )}
                     </button>
                  </div>
                </div>

                {/* Photo Gallery */}
                {form.photos.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700">Uploaded Photos</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {form.photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={photo}
                            alt={`Event photo ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                            {index === 0 && (
                              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">Cover</span>
                            )}
                            <button
                              type="button"
                              onClick={() => setCoverPhoto(index)}
                              className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600"
                              title="Set as cover"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
                              title="Remove photo"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
            <div className="pt-6">
              <div className="flex justify-center">
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
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Organizer Request Modal */}
      <OrganizerRequestModal
        isOpen={showOrganizerRequest}
        onClose={() => setShowOrganizerRequest(false)}
        onSuccess={(message) => {
          alert(message);
          // Refresh user data to update role
          window.location.reload();
        }}
      />
    </div>
  )
}


