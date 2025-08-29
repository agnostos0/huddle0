import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../lib/api.js'
import confetti from 'canvas-confetti'
import Navbar from '../components/Navbar.jsx'

export default function UserProfile() {
  const { user, setUser, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    profilePicture: '',
    socialLinks: {
      linkedin: '',
      twitter: '',
      github: '',
      website: ''
    }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('profile')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [organizerRequest, setOrganizerRequest] = useState({
    organization: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    reason: ''
  })
  const [organizerStatus, setOrganizerStatus] = useState(null)

  useEffect(() => {
    fetchProfile()
    fetchOrganizerStatus()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users/profile')
      setProfile(response.data)
    } catch (err) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrganizerStatus = async () => {
    try {
      const response = await api.get('/users/organizer-request-status')
      setOrganizerStatus(response.data)
    } catch (err) {
      console.error('Failed to fetch organizer status:', err)
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await api.put('/users/profile', profile)
      setUser(response.data)
      setSuccess('Profile updated successfully!')
      triggerConfetti()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match')
      setSaving(false)
      return
    }

    try {
      await api.put('/users/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      setSuccess('Password changed successfully!')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      triggerConfetti()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const handleOrganizerRequest = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await api.post('/users/request-organizer', organizerRequest)
      setSuccess('Organizer request submitted successfully! Admin will review your request.')
      setOrganizerStatus(response.data.request)
      triggerConfetti()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit organizer request')
    } finally {
      setSaving(false)
    }
  }

  const handleAccountDelete = async () => {
    if (!deletePassword) {
      setError('Please enter your password to confirm deletion')
      return
    }

    try {
      await api.delete('/users/account', { data: { password: deletePassword } })
      logout()
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account')
    }
  }

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10B981', '#059669', '#047857']
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Navbar />
      
      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-6 py-6">
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

      <div className="max-w-4xl mx-auto px-6 pb-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
            {success}
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 mb-8">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {profile.profilePicture ? (
                <img 
                  src={profile.profilePicture} 
                  alt={profile.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                profile.name?.charAt(0) || 'U'
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{profile.name}</h1>
              <p className="text-gray-600">@{profile.username}</p>
              <p className="text-gray-500">{profile.email}</p>
              {profile.bio && (
                <p className="text-gray-700 mt-2">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Profile Settings
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'password'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Change Password
              </button>
              {user && user.role === 'user' && (
                <button
                  onClick={() => setActiveTab('organizer')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'organizer'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Request Organizer Status
                </button>
              )}
              <button
                onClick={() => setActiveTab('danger')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'danger'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Danger Zone
              </button>
            </nav>
          </div>

          <div className="p-8">
            {/* Profile Settings Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Picture URL
                    </label>
                    <input
                      type="url"
                      value={profile.profilePicture || ''}
                      onChange={(e) => setProfile({ ...profile, profilePicture: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profile.bio || ''}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Social Links</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        LinkedIn
                      </label>
                      <input
                        type="url"
                        value={profile.socialLinks?.linkedin || ''}
                        onChange={(e) => setProfile({
                          ...profile,
                          socialLinks: { ...profile.socialLinks, linkedin: e.target.value }
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Twitter
                      </label>
                      <input
                        type="url"
                        value={profile.socialLinks?.twitter || ''}
                        onChange={(e) => setProfile({
                          ...profile,
                          socialLinks: { ...profile.socialLinks, twitter: e.target.value }
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="https://twitter.com/username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GitHub
                      </label>
                      <input
                        type="url"
                        value={profile.socialLinks?.github || ''}
                        onChange={(e) => setProfile({
                          ...profile,
                          socialLinks: { ...profile.socialLinks, github: e.target.value }
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="https://github.com/username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        value={profile.socialLinks?.website || ''}
                        onChange={(e) => setProfile({
                          ...profile,
                          socialLinks: { ...profile.socialLinks, website: e.target.value }
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                      saving
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg transform hover:scale-105'
                    }`}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* Change Password Tab */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                      saving
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg transform hover:scale-105'
                    }`}
                  >
                    {saving ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            )}

            {/* Organizer Request Tab */}
            {activeTab === 'organizer' && (
              <div className="space-y-6">
                {organizerStatus && (
                  <div className="mb-6">
                    {organizerStatus.isOrganizer ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-green-800 font-medium">You are already an organizer!</span>
                        </div>
                      </div>
                    ) : organizerStatus.hasRequested ? (
                      <div className={`border rounded-lg p-4 ${
                        organizerStatus.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
                        organizerStatus.status === 'approved' ? 'bg-green-50 border-green-200' :
                        'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center mb-2">
                          <span className={`font-medium ${
                            organizerStatus.status === 'pending' ? 'text-yellow-800' :
                            organizerStatus.status === 'approved' ? 'text-green-800' :
                            'text-red-800'
                          }`}>
                            Request Status: {organizerStatus.status.charAt(0).toUpperCase() + organizerStatus.status.slice(1)}
                          </span>
                        </div>
                        {organizerStatus.status === 'pending' && (
                          <p className="text-yellow-700 text-sm">
                            Your request is under review. You'll be notified once the admin makes a decision.
                          </p>
                        )}
                        {organizerStatus.status === 'rejected' && organizerStatus.rejectionReason && (
                          <p className="text-red-700 text-sm">
                            <strong>Reason:</strong> {organizerStatus.rejectionReason}
                          </p>
                        )}
                        {organizerStatus.status === 'approved' && (
                          <p className="text-green-700 text-sm">
                            Congratulations! You can now create events.
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}

                {(!organizerStatus || (!organizerStatus.hasRequested && !organizerStatus.isOrganizer)) && (
                  <form onSubmit={handleOrganizerRequest} className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <h3 className="text-blue-800 font-medium">Request Organizer Status</h3>
                          <p className="text-blue-700 text-sm mt-1">
                            Become an organizer to create and manage events. Your request will be reviewed by an admin.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Organization Name *
                        </label>
                        <input
                          type="text"
                          value={organizerRequest.organization}
                          onChange={(e) => setOrganizerRequest({ ...organizerRequest, organization: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                          placeholder="Your organization or company name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Email
                        </label>
                        <input
                          type="email"
                          value={organizerRequest.contactEmail}
                          onChange={(e) => setOrganizerRequest({ ...organizerRequest, contactEmail: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="contact@yourorganization.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Organization Description *
                      </label>
                      <textarea
                        value={organizerRequest.description}
                        onChange={(e) => setOrganizerRequest({ ...organizerRequest, description: e.target.value })}
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                        placeholder="Describe your organization and what type of events you plan to host"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={organizerRequest.contactPhone}
                        onChange={(e) => setOrganizerRequest({ ...organizerRequest, contactPhone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="+91-9876543210"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason for Request *
                      </label>
                      <textarea
                        value={organizerRequest.reason}
                        onChange={(e) => setOrganizerRequest({ ...organizerRequest, reason: e.target.value })}
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                        placeholder="Explain why you want to become an organizer and what events you plan to create"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                          saving
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg transform hover:scale-105'
                        }`}
                      >
                        {saving ? 'Submitting...' : 'Submit Request'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-red-800 mb-2">Delete Account</h3>
                  <p className="text-red-700 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Account
                  </button>
                </div>

                {/* Organizer Request Section for Attendees */}
                {user && user.role === 'user' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-blue-800 mb-2">Want to Create Events?</h3>
                    <p className="text-blue-700 mb-4">
                      Request organizer status to create and manage your own events.
                    </p>
                    <button
                      onClick={() => setActiveTab('organizer')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Request Organizer Status
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Delete Account</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm text-red-800 font-medium">This action cannot be undone</p>
                    <p className="text-sm text-red-700 mt-1">
                      This will permanently delete your account and remove all your data from our servers.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAccountDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
