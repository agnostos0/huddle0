import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import ConfirmationDialog from '../components/ConfirmationDialog.jsx'

export default function EventDetails() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [teams, setTeams] = useState([])
  const [allTeams, setAllTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState('')
  const [showTeamPopup, setShowTeamPopup] = useState(false)
  const [selectedTeamDetails, setSelectedTeamDetails] = useState(null)
  const [showMemberPopup, setShowMemberPopup] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [showTeamJoinDialog, setShowTeamJoinDialog] = useState(false)
  const [joinMode, setJoinMode] = useState('') // 'solo', 'team', 'auto-match'
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredTeams, setFilteredTeams] = useState([])
  const [showTeamSearch, setShowTeamSearch] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showOTPDialog, setShowOTPDialog] = useState(false)
  const [mobileNumber, setMobileNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)

  async function load() {
    try {
      setLoading(true)
      setError('')
      setSuccess('')
      const { data } = await api.get(`/events/${id}`)
      setEvent(data)
      
      // Track view
      try {
        await api.post(`/events/${id}/view`)
      } catch (e) {
        console.log('Failed to track view:', e)
      }
    } catch (e) {
      setError('Failed to load event details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  // Load user's teams and all teams for search
  useEffect(() => { 
    (async () => { 
      try { 
        const [myTeamsRes, allTeamsRes] = await Promise.all([
          api.get('/teams/mine'),
          api.get('/teams')
        ])
        setTeams(myTeamsRes.data.userTeams || myTeamsRes.data)
        setAllTeams(allTeamsRes.data.allTeams || allTeamsRes.data)
      } catch (e) {
        console.log('Failed to load teams:', e)
      }
    })() 
  }, [])

  // Filter teams based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = allTeams.filter(team => 
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredTeams(filtered)
    } else {
      setFilteredTeams([])
    }
  }, [searchQuery, allTeams])

  async function join() {
    if (!user) {
      setError('Please login to join this event')
      navigate('/login')
      return
    }
    
    try { 
      await api.post(`/events/${id}/join`); 
      await load() 
    } catch (e) { 
      if (e.response?.status === 401) {
        setError('Please login to join this event')
        navigate('/login')
      } else {
        setError('Failed to join event. Please try again.') 
      }
      throw e
    }
  }
  
  async function leave() {
    if (!user) {
      setError('Please login to leave this event')
      navigate('/login')
      return
    }
    
    try { 
      await api.post(`/events/${id}/leave`); 
      await load() 
    } catch (e) { 
      if (e.response?.status === 401) {
        setError('Please login to leave this event')
        navigate('/login')
      } else {
        setError('Failed to leave event. Please try again.') 
      }
      throw e
    }
  }

  async function del() {
    try { await api.delete(`/events/${id}`); navigate('/dashboard') } catch (e) { setError('Failed to delete') }
  }

  async function sendOTP() {
    if (!mobileNumber) {
      setError('Please enter your mobile number')
      return
    }
    
    const mobileRegex = /^[0-9]{10,15}$/
    if (!mobileRegex.test(mobileNumber)) {
      setError('Please enter a valid mobile number')
      return
    }
    
    setOtpLoading(true)
    setError('')
    
    try {
      const purpose = selectedTeam ? 'team_join' : 'event_join'
      await api.post('/otp/send', {
        mobileNumber,
        purpose,
        eventId: id,
        teamId: selectedTeam
      })
      
      setOtpSent(true)
      setSuccess('OTP sent to your mobile number')
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to send OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  async function resendOTP() {
    setOtpLoading(true)
    setError('')
    
    try {
      const purpose = selectedTeam ? 'team_join' : 'event_join'
      await api.post('/otp/resend', {
        mobileNumber,
        purpose,
        eventId: id,
        teamId: selectedTeam
      })
      
      setSuccess('OTP resent successfully')
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to resend OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  async function joinAsTeam() {
    if (!user) {
      setError('Please login to join this event')
      navigate('/login')
      return
    }
    
    if (!selectedTeam) return
    
    setJoinLoading(true)
    setError('')
    
    try { 
      await api.post(`/events/${id}/join`, { 
        teamId: selectedTeam,
        mobileNumber,
        otp
      }); 
      
      setSuccess('Successfully joined event with team!')
      setShowOTPDialog(false)
      setMobileNumber('')
      setOtp('')
      setOtpSent(false)
      setSelectedTeam('')
      await load() 
    } catch (e) { 
      if (e.response?.status === 401) {
        setError('Please login to join this event')
        navigate('/login')
      } else {
        setError(e.response?.data?.message || 'Failed to join as team. Please try again.') 
      }
    } finally {
      setJoinLoading(false)
    }
  }

  async function joinAsIndividual() {
    if (!user) {
      setError('Please login to join this event')
      navigate('/login')
      return
    }
    
    setJoinLoading(true)
    setError('')
    
    try { 
      await api.post(`/events/${id}/join`, { 
        mobileNumber,
        otp
      }); 
      
      setSuccess('Successfully joined event!')
      setShowOTPDialog(false)
      setMobileNumber('')
      setOtp('')
      setOtpSent(false)
      await load() 
    } catch (e) { 
      if (e.response?.status === 401) {
        setError('Please login to join this event')
        navigate('/login')
      } else {
        setError(e.response?.data?.message || 'Failed to join event. Please try again.') 
      }
    } finally {
      setJoinLoading(false)
    }
  }



  async function showTeamDetails(teamId) {
    try {
      const { data } = await api.get(`/teams/${teamId}`)
      setSelectedTeamDetails(data)
      setShowTeamPopup(true)
    } catch (e) {
      setError('Failed to load team details')
    }
  }

  function showMemberDetails(member) {
    setSelectedMember(member)
    setShowMemberPopup(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-4">The event you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={() => navigate('/explore')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Explore Other Events
          </button>
        </div>
      </div>
    )
  }

  const isOwner = event.organizer?._id === user?.id || event.organizer === user?.id
  const isParticipant = event.participants?.some(p => (p._id || p) === user?.id)
  const currentParticipants = event.participants?.length || 0
  const isFull = event.maxParticipants && currentParticipants >= event.maxParticipants

  // Group participants by team
  const participantsByTeam = {}
  const individualParticipants = []
  
  event.participants?.forEach(participant => {
    const team = teams.find(t => t.members?.some(m => m._id === participant._id || m === participant._id))
    if (team) {
      if (!participantsByTeam[team._id]) participantsByTeam[team._id] = { team, members: [] }
      participantsByTeam[team._id].members.push(participant)
    } else {
      individualParticipants.push(participant)
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-xl font-semibold text-gray-800">Event Details</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className={`mb-6 p-4 rounded-xl border ${
            error.includes('login') 
              ? 'bg-yellow-50 border-yellow-200 text-yellow-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
            {error.includes('login') && (
              <button 
                onClick={() => navigate('/login')} 
                className="mt-2 bg-yellow-600 text-white px-4 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
              >
                Go to Login
              </button>
            )}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl border bg-green-50 border-green-200 text-green-800">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{success}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Event Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Header */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      event.category === 'technology' ? 'bg-blue-100 text-blue-800' :
                      event.category === 'business' ? 'bg-green-100 text-green-800' :
                      event.category === 'social' ? 'bg-pink-100 text-pink-800' :
                      event.category === 'education' ? 'bg-yellow-100 text-yellow-800' :
                      event.category === 'entertainment' ? 'bg-purple-100 text-purple-800' :
                      event.category === 'sports' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {event.category?.charAt(0).toUpperCase() + event.category?.slice(1)}
                    </span>
                    {isFull && (
                      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                        Event Full
                      </span>
                    )}
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">{event.title}</h1>
                  <p className="text-lg text-gray-600 leading-relaxed">{event.description}</p>
                </div>
              </div>

              {/* Event Photos */}
              {(event.photos && event.photos.length > 0) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Photos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {event.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={photo} 
                          alt={`Event photo ${index + 1}`}
                          className="w-full h-48 object-cover rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div 
                          className="hidden w-full h-48 bg-gray-200 rounded-xl items-center justify-center"
                          style={{ display: 'none' }}
                        >
                          <div className="text-center text-gray-500">
                            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm">Image not available</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Event Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date & Time</p>
                      <p className="font-semibold text-gray-900">{new Date(event.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                      <p className="text-sm text-gray-600">{new Date(event.date).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-semibold text-gray-900">{event.location}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Participants</p>
                      <p className="font-semibold text-gray-900">
                        {currentParticipants}
                        {event.maxParticipants && ` / ${event.maxParticipants}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Organizer</p>
                      <p className="font-semibold text-gray-900">{event.organizer?.name || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Criteria */}
              {event.teamCriteria && (
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Team Participation Criteria
                  </h3>
                  <p className="text-blue-800">{event.teamCriteria}</p>
                </div>
              )}

              {/* Additional Details */}
              {event.additionalDetails && (
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2">Additional Information</h3>
                  <p className="text-gray-700">{event.additionalDetails}</p>
                </div>
              )}
            </div>

            {/* Participants Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Participants</h2>
              
              {/* Teams */}
              {Object.values(participantsByTeam).map(({ team, members }) => (
                <div key={team._id} className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-blue-900 cursor-pointer hover:underline flex items-center gap-2" onClick={() => showTeamDetails(team._id)}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {team.name} ({members.length} members)
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {members.map(member => (
                      <div key={member._id} className="p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors border border-white/50" onClick={() => showMemberDetails(member)}>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Individual participants */}
              {individualParticipants.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Individual Participants ({individualParticipants.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {individualParticipants.map(participant => (
                      <div key={participant._id} className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200" onClick={() => showMemberDetails(participant)}>
                        <p className="font-medium text-gray-900">{participant.name}</p>
                        <p className="text-sm text-gray-600">{participant.email}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!event.participants || event.participants.length === 0) && (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-6xl mb-4">👥</div>
                  <p className="text-gray-600">No participants yet. Be the first to join!</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Join Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Join This Event</h3>
              
              {isOwner ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-blue-800 font-medium">You are the organizer of this event</p>
                  </div>
                  <button 
                    onClick={del} 
                    className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Delete Event
                  </button>
                </div>
              ) : isParticipant ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-green-800 font-medium">You are already participating in this event</p>
                  </div>
                  <button 
                    onClick={() => setShowLeaveDialog(true)} 
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
                  >
                    Leave Event
                  </button>
                </div>
              ) : !user ? (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-yellow-800 font-medium">Login Required</span>
                    </div>
                    <p className="text-yellow-700 text-sm">Please login to join this event</p>
                  </div>
                  <button 
                    onClick={() => navigate('/login')} 
                    className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Login to Join
                  </button>
                </div>
              ) : isFull ? (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-red-800 font-medium">This event is full</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Solo Join */}
                  <button 
                    onClick={() => setShowOTPDialog(true)} 
                    className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    Join as Individual
                  </button>



                  {/* Team Join */}
                  <div className="space-y-3">
                    <button 
                      onClick={() => setShowTeamSearch(!showTeamSearch)} 
                      className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                      Join as Team
                    </button>

                    {showTeamSearch && (
                      <div className="space-y-3">
                        {/* User's Teams */}
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900 text-sm">Your Teams:</h4>
                          {teams.length > 0 ? (
                            teams.map(team => (
                              <div 
                                key={team._id}
                                className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                                  selectedTeam === team._id 
                                    ? 'bg-indigo-100 border-indigo-300' 
                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                }`}
                                onClick={() => setSelectedTeam(team._id)}
                              >
                                <p className="font-medium text-gray-900">{team.name}</p>
                                <p className="text-sm text-gray-600">{team.description}</p>
                                <p className="text-xs text-gray-500">{team.members?.length || 0} members</p>
                              </div>
                            ))
                          ) : (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-sm text-yellow-800">You don't have any teams yet.</p>
                              <button 
                                onClick={() => navigate('/teams/create')}
                                className="text-xs text-yellow-700 underline hover:no-underline mt-1"
                              >
                                Create a team first
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Search Other Teams */}
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900 text-sm">Search Other Teams:</h4>
                          <input
                            type="text"
                            placeholder="Search teams..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                          
                          {searchQuery && (
                            <div className="max-h-48 overflow-y-auto space-y-2">
                              {filteredTeams.map(team => (
                                <div 
                                  key={team._id}
                                  className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                                    selectedTeam === team._id 
                                      ? 'bg-indigo-100 border-indigo-300' 
                                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                  }`}
                                  onClick={() => setSelectedTeam(team._id)}
                                >
                                  <p className="font-medium text-gray-900">{team.name}</p>
                                  <p className="text-sm text-gray-600">{team.description}</p>
                                  <p className="text-xs text-gray-500">{team.members?.length || 0} members</p>
                                </div>
                              ))}
                              {filteredTeams.length === 0 && (
                                <p className="text-gray-500 text-sm">No teams found</p>
                              )}
                            </div>
                          )}
                        </div>

                        {selectedTeam && (
                          <button 
                            onClick={() => setShowOTPDialog(true)} 
                            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                          >
                            Join with Selected Team
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Event Stats */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Event Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Participants</span>
                  <span className="font-semibold text-gray-900">{currentParticipants}</span>
                </div>
                {event.maxParticipants && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Maximum Capacity</span>
                    <span className="font-semibold text-gray-900">{event.maxParticipants}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Teams Participating</span>
                  <span className="font-semibold text-gray-900">{Object.keys(participantsByTeam).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Individual Participants</span>
                  <span className="font-semibold text-gray-900">{individualParticipants.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Details Popup */}
      {showTeamPopup && selectedTeamDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">{selectedTeamDetails.name}</h2>
                <button onClick={() => setShowTeamPopup(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mt-2">Owner: {selectedTeamDetails.owner?.name}</p>
              {selectedTeamDetails.description && (
                <p className="text-gray-700 mt-2">{selectedTeamDetails.description}</p>
              )}
            </div>
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Team Members</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedTeamDetails.members?.map(member => (
                  <div key={member._id} className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200" onClick={() => showMemberDetails(member)}>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-600">{member.email}</p>
                    {member.bio && <p className="text-xs text-gray-500 mt-1">{member.bio.substring(0, 50)}...</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Details Popup */}
      {showMemberPopup && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{selectedMember.name}</h2>
                <button onClick={() => setShowMemberPopup(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{selectedMember.email}</p>
              </div>
              {selectedMember.bio && (
                <div>
                  <p className="text-sm text-gray-500">Bio</p>
                  <p className="text-gray-900">{selectedMember.bio}</p>
                </div>
              )}
              {selectedMember.socialLinks && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Social Links</p>
                  <div className="space-y-2">
                    {selectedMember.socialLinks.linkedin && (
                      <a href={selectedMember.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        LinkedIn
                      </a>
                    )}
                    {selectedMember.socialLinks.twitter && (
                      <a href={selectedMember.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:underline">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                        Twitter
                      </a>
                    )}
                    {selectedMember.socialLinks.github && (
                      <a href={selectedMember.socialLinks.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-900 hover:underline">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        GitHub
                      </a>
                    )}
                    {selectedMember.socialLinks.website && (
                      <a href={selectedMember.socialLinks.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-purple-600 hover:underline">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                        </svg>
                        Website
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Dialog */}
      {showOTPDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Mobile Verification</h2>
                <button onClick={() => setShowOTPDialog(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                {selectedTeam ? `Join "${event?.title}" with your team` : `Join "${event?.title}" as individual`}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="Enter your mobile number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={otpSent}
                />
              </div>

              {!otpSent ? (
                <button
                  onClick={sendOTP}
                  disabled={otpLoading || !mobileNumber}
                  className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {otpLoading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={selectedTeam ? joinAsTeam : joinAsIndividual}
                      disabled={joinLoading || !otp || otp.length !== 6}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {joinLoading ? 'Joining...' : 'Join Event'}
                    </button>
                    <button
                      onClick={resendOTP}
                      disabled={otpLoading}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {otpLoading ? '...' : 'Resend'}
                    </button>
                  </div>
                </>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-600 text-sm">{success}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={showJoinDialog}
        onClose={() => setShowJoinDialog(false)}
        onConfirm={join}
        title="Join Event"
        message="Are you sure you want to join this event? You'll be added to the participant list and may receive updates from the organizer."
        confirmText="Join Event"
        type="join"
        eventTitle={event?.title}
        showConsent={true}
      />

      <ConfirmationDialog
        isOpen={showLeaveDialog}
        onClose={() => setShowLeaveDialog(false)}
        onConfirm={leave}
        title="Leave Event"
        message="Are you sure you want to leave this event? You'll be removed from the participant list and won't receive further updates."
        confirmText="Leave Event"
        type="leave"
        eventTitle={event?.title}
        showConsent={false}
      />

      <ConfirmationDialog
        isOpen={showTeamJoinDialog}
        onClose={() => setShowTeamJoinDialog(false)}
        onConfirm={joinAsTeam}
        title="Join as Team"
        message={`Are you sure you want to join this event with your team? All team members will be added to the participant list.`}
        confirmText="Join as Team"
        type="join"
        eventTitle={event?.title}
        showConsent={true}
      />
    </div>
  )
}


