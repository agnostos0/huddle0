import React, { useEffect, useState } from 'react'
import api from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Link, useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import Navbar from '../components/Navbar.jsx'
import ConfirmationDialog from '../components/ConfirmationDialog.jsx'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [myEvents, setMyEvents] = useState([])
  const [joinedEvents, setJoinedEvents] = useState([])
  const [allEvents, setAllEvents] = useState([])
  const [myTeams, setMyTeams] = useState([])
  const [pendingInvites, setPendingInvites] = useState([])
  const [analytics, setAnalytics] = useState({
    totalEvents: 0,
    totalParticipants: 0,
    totalViews: 0,
    totalTeams: 0,
    recentActivity: []
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isImpersonating, setIsImpersonating] = useState(false)

  useEffect(() => {
    // Check if this is an admin impersonating a user
    const adminToken = localStorage.getItem('adminToken')
    if (adminToken && user?.email !== 'admin@huddle.com') {
      setIsImpersonating(true)
    }
  }, [user])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        // Try to get all events (including pending) for testing
        let allEventsResponse;
        try {
          allEventsResponse = await api.get('/events/admin/all');
        } catch (err) {
          // Fallback to public events if admin route fails
          allEventsResponse = await api.get('/events');
        }

        const [mine, joined, teams, invites, stats] = await Promise.all([
          api.get(`/users/${user.id}/events`),
          api.get(`/users/${user.id}/joined`),
          api.get(`/users/${user.id}/teams`),
          api.get(`/users/${user.id}/invites`),
          api.get(`/users/${user.id}/analytics`)
        ])
        
        const all = allEventsResponse;
        setMyEvents(mine.data)
        setJoinedEvents(joined.data)
        setAllEvents(all.data)
        setMyTeams(teams.data)
        setPendingInvites(invites.data)
        setAnalytics(stats.data)
      } catch (e) {
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    if (user?.id) fetchData()
  }, [user])

  const triggerConfetti = (type = 'default') => {
    const colors = {
      join: ['#4F46E5', '#7C3AED', '#EC4899'],
      team: ['#10B981', '#059669', '#047857'],
      event: ['#F59E0B', '#D97706', '#B45309'],
      default: ['#3B82F6', '#1D4ED8', '#1E40AF']
    }
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors[type] || colors.default
    })
  }

  async function joinEvent(eventId) {
    try {
      await api.post(`/events/${eventId}/join`)
      
      // Try to get all events (including pending) for testing
      let allEventsResponse;
      try {
        allEventsResponse = await api.get('/events/admin/all');
      } catch (err) {
        // Fallback to public events if admin route fails
        allEventsResponse = await api.get('/events');
      }

      const [joined] = await Promise.all([
        api.get(`/users/${user.id}/joined`),
      ])
      
      setJoinedEvents(joined.data)
      setAllEvents(allEventsResponse.data)
      triggerConfetti('join')
    } catch (e) {
      setError('Failed to join event')
      throw e
    }
  }

  async function leaveEvent(eventId) {
    try {
      await api.post(`/events/${eventId}/leave`)
      
      // Try to get all events (including pending) for testing
      let allEventsResponse;
      try {
        allEventsResponse = await api.get('/events/admin/all');
      } catch (err) {
        // Fallback to public events if admin route fails
        allEventsResponse = await api.get('/events');
      }

      const [joined] = await Promise.all([
        api.get(`/users/${user.id}/joined`),
      ])
      
      setJoinedEvents(joined.data)
      setAllEvents(allEventsResponse.data)
    } catch (e) {
      setError('Failed to leave event')
      throw e
    }
  }

  async function acceptTeamInvite(inviteId) {
    try {
      await api.post(`/invites/${inviteId}/accept`)
      const [teams, invites] = await Promise.all([
        api.get(`/users/${user.id}/teams`),
        api.get(`/users/${user.id}/invites`)
      ])
      setMyTeams(teams.data)
      setPendingInvites(invites.data)
      triggerConfetti('team')
    } catch (e) {
      setError('Failed to accept team invite')
    }
  }

  const handleJoinClick = (event) => {
    setSelectedEvent(event)
    setShowJoinDialog(true)
  }

  const handleLeaveClick = (event) => {
    setSelectedEvent(event)
    setShowLeaveDialog(true)
  }

  const handleReturnToAdmin = () => {
    // Restore admin token and user
    const adminToken = localStorage.getItem('adminToken')
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}')
    
    if (adminToken && adminUser.email === 'admin@huddle.com') {
      localStorage.setItem('token', adminToken)
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminUser')
      window.location.reload()
    } else {
      logout()
      navigate('/login')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Navbar />
      
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">
                Admin Mode: Currently logged in as <strong>{user?.name}</strong> ({user?.email})
              </span>
            </div>
            <button
              onClick={handleReturnToAdmin}
              className="px-4 py-2 bg-white text-orange-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Return to Admin
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Welcome back, {user.name}! 👋
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Here's what's happening with your events and teams</p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Link
                to="/create-event"
                className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-sm sm:text-base text-center"
              >
                + Create Event
              </Link>
              <Link
                to="/teams/create"
                className="px-4 sm:px-6 py-2 sm:py-3 border-2 border-purple-600 text-purple-600 rounded-xl hover:bg-purple-600 hover:text-white transform hover:scale-105 transition-all duration-300 text-sm sm:text-base text-center"
              >
                + Create Team
              </Link>
              {user.email === 'admin@huddle.com' && (
                <Link
                  to="/admin"
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-red-600 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-sm sm:text-base text-center"
                >
                  🔧 Admin Panel
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Events</p>
                <p className="text-3xl font-bold text-purple-600">{analytics.totalEvents}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🎉</span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Participants</p>
                <p className="text-3xl font-bold text-blue-600">{analytics.totalParticipants}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Views</p>
                <p className="text-3xl font-bold text-green-600">{analytics.totalViews}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">👁️</span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">My Teams</p>
                <p className="text-3xl font-bold text-indigo-600">{analytics.totalTeams}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🚀</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Pending Team Invites</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingInvites.map((invite) => (
                <div key={invite._id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-500 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">T</span>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                      Pending
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{invite.team?.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">Invited by {invite.invitedBy?.name}</p>
                  <button
                    onClick={() => acceptTeamInvite(invite._id)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                  >
                    Accept Invite
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Teams */}
        {myTeams.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">My Teams</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myTeams.map((team) => (
                <div key={team._id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">T</span>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                      Active
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{team.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{team.members?.length || 0} members</p>
                  <button
                    onClick={() => setSelectedTeam(team)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                  >
                    View Team
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Events */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">My Events</h2>
              <Link
                to="/create-event"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                + New Event
              </Link>
            </div>
            <div className="space-y-4">
              {myEvents.map(ev => (
                <div key={ev._id} className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">
                        <Link to={`/event/${ev._id}`} className="hover:text-purple-600 transition-colors">
                          {ev.title}
                        </Link>
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(ev.date).toLocaleDateString()} • {ev.location}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {ev.participants?.length || 0} participants
                      </p>
                    </div>
                    <div className="ml-4 flex flex-col items-end space-y-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        ev.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        ev.status === 'approved' ? 'bg-green-100 text-green-800' :
                        ev.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        ev.status === 'edited_pending' ? 'bg-blue-100 text-blue-800' :
                        new Date(ev.date) > new Date() ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {ev.status === 'pending' ? 'Pending Approval' :
                         ev.status === 'approved' ? 'Approved' :
                         ev.status === 'rejected' ? 'Rejected' :
                         ev.status === 'edited_pending' ? 'Edit Pending' :
                         new Date(ev.date) > new Date() ? 'Upcoming' : 'Past'}
                      </span>
                      {ev.status === 'rejected' && ev.rejectionReason && (
                        <span className="text-xs text-red-600 max-w-xs truncate" title={ev.rejectionReason}>
                          Reason: {ev.rejectionReason}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {myEvents.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🎉</div>
                  <p className="text-gray-600 mb-4">You haven't created any events yet</p>
                  <Link
                    to="/create-event"
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                  >
                    Create Your First Event
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* Joined Events */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Joined Events</h2>
            <div className="space-y-4">
              {joinedEvents.map(ev => (
                <div key={ev._id} className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">
                        <Link to={`/event/${ev._id}`} className="hover:text-purple-600 transition-colors">
                          {ev.title}
                        </Link>
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Organizer: {ev.organizer?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(ev.date).toLocaleDateString()} • {ev.location}
                      </p>
                    </div>
                    <button
                      onClick={() => handleLeaveClick(ev)}
                      className="ml-4 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Leave
                    </button>
                  </div>
                </div>
              ))}
              {joinedEvents.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">👥</div>
                  <p className="text-gray-600">You haven't joined any events yet</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* All Events */}
        <section className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Discover Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allEvents
              .filter(ev => ev.organizer?._id !== user.id && ev.organizer !== user.id)
              .map(ev => {
                const isJoined = joinedEvents.some(j => j._id === ev._id)
                return (
                  <div key={ev._id} className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        ev.category?.toLowerCase() === 'technology' ? 'bg-blue-100 text-blue-800' :
                        ev.category?.toLowerCase() === 'business' ? 'bg-green-100 text-green-800' :
                        ev.category?.toLowerCase() === 'social' ? 'bg-pink-100 text-pink-800' :
                        ev.category?.toLowerCase() === 'education' ? 'bg-yellow-100 text-yellow-800' :
                        ev.category?.toLowerCase() === 'entertainment' ? 'bg-purple-100 text-purple-800' :
                        ev.category?.toLowerCase() === 'sports' ? 'bg-red-100 text-red-800' :
                        ev.category?.toLowerCase() === 'food' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ev.category}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(ev.date).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-800 mb-2">
                      <Link to={`/event/${ev._id}`} className="hover:text-purple-600 transition-colors">
                        {ev.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {ev.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">
                            {ev.organizer?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {ev.organizer?.name || 'Anonymous'}
                        </span>
                      </div>
                      <button
                        onClick={() => isJoined ? handleLeaveClick(ev) : handleJoinClick(ev)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                          isJoined
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg transform hover:scale-105'
                        }`}
                      >
                        {isJoined ? 'Joined' : 'Join'}
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>
          {allEvents.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🎉</div>
              <p className="text-gray-600">No events available yet</p>
            </div>
          )}
        </section>
      </div>

      {/* Team Details Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">{selectedTeam.name}</h3>
              <button
                onClick={() => setSelectedTeam(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Team Members</h4>
                <div className="space-y-2">
                  {selectedTeam.members?.map((member) => (
                    <div key={member._id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {member.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t">
                <Link
                  to={`/teams/${selectedTeam._id}`}
                  className="w-full block text-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  Manage Team
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={showJoinDialog}
        onClose={() => setShowJoinDialog(false)}
        onConfirm={() => joinEvent(selectedEvent?._id)}
        title="Join Event"
        message="Are you sure you want to join this event? You'll be added to the participant list and may receive updates from the organizer."
        confirmText="Join Event"
        type="join"
        eventTitle={selectedEvent?.title}
        showConsent={true}
      />

      <ConfirmationDialog
        isOpen={showLeaveDialog}
        onClose={() => setShowLeaveDialog(false)}
        onConfirm={() => leaveEvent(selectedEvent?._id)}
        title="Leave Event"
        message="Are you sure you want to leave this event? You'll be removed from the participant list and won't receive further updates."
        confirmText="Leave Event"
        type="leave"
        eventTitle={selectedEvent?.title}
        showConsent={false}
      />
    </div>
  )
}


