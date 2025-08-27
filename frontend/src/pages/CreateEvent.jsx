import { useState } from 'react'
import api from '../lib/api.js'
import { useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import Navbar from '../components/Navbar.jsx'
import LocationPicker from '../components/LocationPicker.jsx'
import PhotoUpload from '../components/PhotoUpload.jsx'
import TagInput from '../components/TagInput.jsx'

export default function CreateEvent() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    coordinates: null,
    category: 'General',
    tags: [],
    photos: [],
    coverPhoto: '',
    maxParticipants: 0,
    price: 0,
    currency: 'USD',
    eventType: 'in-person',
    virtualMeetingLink: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    socialLinks: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: ''
    }
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

  const handleLocationChange = (location) => {
    setForm(prev => ({ ...prev, location }))
  }

  const handleCoordinatesChange = (coordinates) => {
    setForm(prev => ({ ...prev, coordinates }))
  }

  const handlePhotosChange = (photos) => {
    const photoUrls = photos.map(photo => photo.url)
    const coverPhoto = photos.find(p => p.isCover)?.url || photoUrls[0] || ''
    setForm(prev => ({ 
      ...prev, 
      photos: photoUrls,
      coverPhoto
    }))
  }

  const handleTagsChange = (tags) => {
    setForm(prev => ({ ...prev, tags }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const payload = { 
        ...form, 
        date: new Date(form.date).toISOString(),
        // Convert photos array to URLs
        photos: form.photos,
        coverPhoto: form.coverPhoto
      }
      
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
      setError(err.response?.data?.message || 'Failed to create event')
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
                    placeholder="Enter event title" 
                    value={form.title} 
                    onChange={(e)=>setForm({...form, title:e.target.value})} 
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    value={form.category}
                    onChange={(e) => setForm({...form, category: e.target.value})}
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 resize-none" 
                  placeholder="Describe your event..." 
                  rows="4"
                  value={form.description} 
                  onChange={(e)=>setForm({...form, description:e.target.value})} 
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time *</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
                    type="datetime-local" 
                    value={form.date} 
                    onChange={(e)=>setForm({...form, date:e.target.value})} 
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    value={form.eventType}
                    onChange={(e) => setForm({...form, eventType: e.target.value})}
                  >
                    {eventTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Location & Details
              </h3>
              
              <LocationPicker
                location={form.location}
                coordinates={form.coordinates}
                onLocationChange={handleLocationChange}
                onCoordinatesChange={handleCoordinatesChange}
                placeholder="Enter event location or click on map"
              />
              
              {form.eventType === 'virtual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Virtual Meeting Link</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
                    placeholder="https://meet.google.com/..." 
                    value={form.virtualMeetingLink} 
                    onChange={(e)=>setForm({...form, virtualMeetingLink:e.target.value})} 
                  />
                </div>
              )}
            </div>

            {/* Photos */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Event Photos
              </h3>
              
              <PhotoUpload
                photos={form.photos.map((url, index) => ({ id: index, url, name: `Photo ${index + 1}` }))}
                onPhotosChange={handlePhotosChange}
                maxPhotos={5}
              />
            </div>

            {/* Tags */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Tags
              </h3>
              
              <TagInput
                tags={form.tags}
                onTagsChange={handleTagsChange}
                placeholder="Add tags to help people find your event..."
              />
            </div>

            {/* Additional Details */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Additional Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Participants</label>
                  <input 
                    type="number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
                    placeholder="0 for unlimited" 
                    value={form.maxParticipants} 
                    onChange={(e)=>setForm({...form, maxParticipants: parseInt(e.target.value) || 0})} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
                    placeholder="0 for free" 
                    value={form.price} 
                    onChange={(e)=>setForm({...form, price: parseFloat(e.target.value) || 0})} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    value={form.currency}
                    onChange={(e) => setForm({...form, currency: e.target.value})}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                  <input 
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
                    placeholder="contact@example.com" 
                    value={form.contactEmail} 
                    onChange={(e)=>setForm({...form, contactEmail:e.target.value})} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                  <input 
                    type="tel"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
                    placeholder="+1 234 567 8900" 
                    value={form.contactPhone} 
                    onChange={(e)=>setForm({...form, contactPhone:e.target.value})} 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <input 
                  type="url"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
                  placeholder="https://example.com" 
                  value={form.website} 
                  onChange={(e)=>setForm({...form, website:e.target.value})} 
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Social Links
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
                  <input 
                    type="url"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
                    placeholder="https://facebook.com/..." 
                    value={form.socialLinks.facebook} 
                    onChange={(e)=>setForm({...form, socialLinks: {...form.socialLinks, facebook: e.target.value}})} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
                  <input 
                    type="url"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
                    placeholder="https://twitter.com/..." 
                    value={form.socialLinks.twitter} 
                    onChange={(e)=>setForm({...form, socialLinks: {...form.socialLinks, twitter: e.target.value}})} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                  <input 
                    type="url"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
                    placeholder="https://instagram.com/..." 
                    value={form.socialLinks.instagram} 
                    onChange={(e)=>setForm({...form, socialLinks: {...form.socialLinks, instagram: e.target.value}})} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                  <input 
                    type="url"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
                    placeholder="https://linkedin.com/..." 
                    value={form.socialLinks.linkedin} 
                    onChange={(e)=>setForm({...form, socialLinks: {...form.socialLinks, linkedin: e.target.value}})} 
                  />
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="pt-6">
              <button 
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 transform ${
                  !isSubmitting
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg hover:scale-105'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating Event...
                  </div>
                ) : (
                  'Create Event'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


