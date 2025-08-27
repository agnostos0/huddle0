import React, { useEffect, useState } from 'react'
import api from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Link, useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import Navbar from '../components/Navbar.jsx'
import ConfirmationDialog from '../components/ConfirmationDialog.jsx'

export default function AttendeeDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [joinedEvents, setJoinedEvents] = useState([])
  const [allEvents, setAllEvents] = useState([])
  const [myTeams, setMyTeams] = useState([])
  const [pendingInvites, setPendingInvites] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [joined, all, teams, invites] = await Promise.all([
          api.get(`/users/${user.id}/joined`),
          api.get(`/events`),
          api.get(`/users/${user.id}/teams`),
          api.get(`/users/${user.id}/invites`)
        ])
        setJoinedEvents(joined.data)
        setAllEvents(all.data)
        setMyTeams(teams.data)
        setPendingInvites(invites.data)
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
      const [joined, all] = await Promise.all([
        api.get(`/users/${user.id}/joined`),
        api.get(`/events`),
      ])
      setJoinedEvents(joined.data)
      setAllEvents(all.data)
      triggerConfetti('join')
    } catch (e) {
      setError('Failed to join event')
      throw e
    }
  }

  async function leaveEvent(eventId) {
    try {
      await api.post(`/events/${eventId}/leave`)
      const [joined, all] = await Promise.all([
        api.get(`/users/${user.id}/joined`),
        api.get(`/events`),
      ])
      setJoinedEvents(joined.data)
      setAllEvents(all.data)
    } catch (e) {
      setError('Failed to leave event')
      throw e
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Navbar />
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendee Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.name}! Discover and join amazing events.</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/organizer-dashboard')}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Switch to Organizer Mode
              </button>
              <button
                onClick={() => navigate('/explore')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Explore Events
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Events */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">My Events</h2>
                <Link to="/explore" className="text-purple-600 hover:text-purple-700 font-medium">
                  Browse More Events
                </Link>
              </div>
              
              {joinedEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {joinedEvents.map(event => (
                    <div key={event._id} className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
                      <h3 className="font-semibold text-gray-900 mb-2">{event.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{event.location}</p>
                      <p className="text-xs text-gray-500 mb-3">
                        {new Date(event.date).toLocaleDateString()}
                      </p>
                      <div className="flex space-x-2">
                        <Link
                          to={`/event/${event._id}`}
                          className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedEvent(event)
                            setShowLeaveDialog(true)
                          }}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Leave
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">🎉</div>
                  <p className="text-gray-600 mb-4">You haven't joined any events yet.</p>
                  <Link
                    to="/explore"
                    className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Discover Events
                  </Link>
                </div>
              )}
            </div>

            {/* My Teams */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">My Teams</h2>
                <Link to="/teams" className="text-purple-600 hover:text-purple-700 font-medium">
                  Manage Teams
                </Link>
              </div>
              
              {myTeams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myTeams.map(team => (
                    <div key={team._id} className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
                      <h3 className="font-semibold text-gray-900 mb-2">{team.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{team.description}</p>
                      <p className="text-xs text-gray-500 mb-3">
                        {team.members?.length || 0} members
                      </p>
                      <Link
                        to="/teams"
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        View Team
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">👥</div>
                  <p className="text-gray-600 mb-4">You haven't joined any teams yet.</p>
                  <Link
                    to="/teams"
                    className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Create or Join Teams
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Events Joined</span>
                  <span className="font-semibold text-gray-900">{joinedEvents.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Teams</span>
                  <span className="font-semibold text-gray-900">{myTeams.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pending Invites</span>
                  <span className="font-semibold text-gray-900">{pendingInvites.length}</span>
                </div>
              </div>
            </div>

            {/* Pending Invites */}
            {pendingInvites.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Invites</h3>
                <div className="space-y-3">
                  {pendingInvites.slice(0, 3).map(invite => (
                    <div key={invite._id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm font-medium text-gray-900">{invite.team?.name}</p>
                      <p className="text-xs text-gray-600">Invited by {invite.inviter?.name}</p>
                    </div>
                  ))}
                  {pendingInvites.length > 3 && (
                    <p className="text-sm text-gray-500">+{pendingInvites.length - 3} more invites</p>
                  )}
                </div>
                <Link
                  to="/teams"
                  className="mt-4 inline-block w-full text-center bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                >
                  View All Invites
                </Link>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/explore"
                  className="block w-full text-center bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Explore Events
                </Link>
                <Link
                  to="/teams"
                  className="block w-full text-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Manage Teams
                </Link>
                <Link
                  to="/profile"
                  className="block w-full text-center bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Edit Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={showJoinDialog}
        onClose={() => setShowJoinDialog(false)}
        onConfirm={() => {
          joinEvent(selectedEvent._id)
          setShowJoinDialog(false)
        }}
        title="Join Event"
        message={`Are you sure you want to join "${selectedEvent?.title}"?`}
        confirmText="Join Event"
        type="join"
        eventTitle={selectedEvent?.title}
        showConsent={true}
      />

      <ConfirmationDialog
        isOpen={showLeaveDialog}
        onClose={() => setShowLeaveDialog(false)}
        onConfirm={() => {
          leaveEvent(selectedEvent._id)
          setShowLeaveDialog(false)
        }}
        title="Leave Event"
        message={`Are you sure you want to leave "${selectedEvent?.title}"?`}
        confirmText="Leave Event"
        type="leave"
        eventTitle={selectedEvent?.title}
        showConsent={false}
      />
    </div>
  )
}
