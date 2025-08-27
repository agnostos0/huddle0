import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import confetti from 'canvas-confetti'
import Navbar from '../components/Navbar.jsx'

export default function Teams() {
  const { user } = useAuth()
  const [teams, setTeams] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [showManualForm, setShowManualForm] = useState(false)
  const [showAutoMatchForm, setShowAutoMatchForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteUsername, setInviteUsername] = useState('')
  const [inviteReason, setInviteReason] = useState('')
  const [inviteMethod, setInviteMethod] = useState('email')
  const [pendingInvites, setPendingInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('my-teams')
  const [searchResults, setSearchResults] = useState([])
  const [autoMatchUsers, setAutoMatchUsers] = useState([])
  const [manualForm, setManualForm] = useState({ 
    name: '', 
    email: '', 
    bio: '', 
    socialLinks: { linkedin: '', twitter: '', github: '', website: '' } 
  })

  async function load() {
    try {
      setLoading(true)
      const { data } = await api.get('/teams/mine')
      setTeams(data)
    } catch (e) {
      setError('Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  async function loadTeamDetails(teamId) {
    try {
      const { data } = await api.get(`/teams/${teamId}`)
      setSelectedTeam(data)
      
      // Load pending invites for this team
      try {
        const invitesResponse = await api.get(`/invites/teams/${teamId}/invites`)
        setPendingInvites(invitesResponse.data)
      } catch (e) {
        console.log('No pending invites or error loading invites')
        setPendingInvites([])
      }

      // Load auto-match users
      await loadAutoMatchUsers(teamId)
    } catch (e) {
      setError('Failed to load team details')
    }
  }

  async function inviteMember(teamId) {
    if (!user) {
      setError('Please login to invite members')
      return
    }
    
    try {
      await api.post(`/invites/teams/${teamId}/invite`, { 
        email: inviteEmail, 
        invitedName: inviteName || inviteEmail.split('@')[0] 
      })
      setInviteEmail('')
      setInviteName('')
      setShowInviteForm(false)
      setSuccess('Invitation sent successfully!')
      setError('')
      
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8B5CF6', '#3B82F6', '#10B981']
      })
      
      await loadTeamDetails(teamId)
    } catch (e) {
      if (e.response?.status === 401) {
        setError('Please login to invite members')
      } else {
        setError(e.response?.data?.message || 'Failed to send invitation')
      }
      setSuccess('')
    }
  }

  async function addManualMember(teamId) {
    if (!user) {
      setError('Please login to add members')
      return
    }
    
    try {
      await api.post(`/teams/${teamId}/members/manual`, manualForm)
      setManualForm({ name: '', email: '', bio: '', socialLinks: { linkedin: '', twitter: '', github: '', website: '' } })
      setShowManualForm(false)
      setSuccess('Member added successfully!')
      setError('')
      
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#EF4444', '#8B5CF6']
      })
      
      await loadTeamDetails(teamId)
      await load()
    } catch (e) {
      if (e.response?.status === 401) {
        setError('Please login to add members')
      } else {
        setError('Failed to add member')
      }
      setSuccess('')
    }
  }

  async function removeMember(teamId, userId) {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await api.delete(`/teams/${teamId}/members/${userId}`)
        setSuccess('Member removed successfully!')
        setError('')
        await loadTeamDetails(teamId)
        await load()
      } catch (e) {
        setError('Failed to remove member')
        setSuccess('')
      }
    }
  }

  async function resendInvite(inviteId) {
    try {
      const response = await api.post(`/invites/${inviteId}/resend`)
      setSuccess(response.data.warning ? 
        `Invitation resent successfully! (${response.data.warning})` : 
        'Invitation resent successfully!'
      )
      setError('')
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to resend invitation')
      setSuccess('')
    }
  }

  async function deleteInvite(inviteId) {
    if (!window.confirm('Are you sure you want to delete this invitation?')) {
      return
    }
    
    try {
      await api.delete(`/invites/${inviteId}`)
      setSuccess('Invitation deleted successfully!')
      setError('')
      await loadTeamDetails(selectedTeam._id)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete invitation')
      setSuccess('')
    }
  }

  async function searchUsersByUsername(username) {
    if (username.length < 2) {
      setSearchResults([])
      return
    }
    
    try {
      const response = await api.get(`/teams/search-users/${username}?teamId=${selectedTeam?._id || ''}`)
      setSearchResults(response.data)
    } catch (e) {
      console.error('Error searching users:', e)
      setSearchResults([])
    }
  }

  async function loadAutoMatchUsers(teamId) {
    try {
      const response = await api.get(`/users/auto-match/${teamId}`)
      setAutoMatchUsers(response.data)
    } catch (e) {
      console.error('Error loading auto-match users:', e)
      setAutoMatchUsers([])
    }
  }

  async function inviteUserByUsername(teamId) {
    if (!inviteUsername || !inviteReason) {
      setError('Please provide both username and reason')
      return
    }
    
    try {
      await api.post(`/teams/${teamId}/invite-by-username`, {
        username: inviteUsername,
        reason: inviteReason
      })
      
      setInviteUsername('')
      setInviteReason('')
      setShowInviteForm(false)
      setSearchResults([])
      setSuccess('Invitation sent successfully!')
      setError('')
      
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8B5CF6', '#3B82F6', '#10B981']
      })
      
      await loadTeamDetails(teamId)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to send invitation')
      setSuccess('')
    }
  }

  async function addUserToTeam(teamId, userId) {
    try {
      await api.post(`/teams/${teamId}/members`, { userId })
      
      setSuccess('User added to team successfully!')
      setError('')
      
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#3B82F6', '#8B5CF6']
      })
      
      await loadTeamDetails(teamId)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to add user to team')
      setSuccess('')
    }
  }

  async function deleteTeam(teamId) {
    if (window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      try {
        await api.delete(`/teams/${teamId}`)
        setSuccess('Team deleted successfully!')
        setError('')
        setSelectedTeam(null)
        await load()
      } catch (e) {
        setError('Failed to delete team')
        setSuccess('')
      }
    }
  }

  useEffect(() => { 
    load() 
  }, [])

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-4">Please login to manage teams</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading your teams...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
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

      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Team Management
            </h1>
            <p className="text-gray-600 mt-1">Manage your teams and collaborate with others</p>
          </div>
          {user ? (
            <Link 
              to="/teams/create" 
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              + Create Team
            </Link>
          ) : (
            <button 
              onClick={() => window.location.href = '/login'}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              + Create Team (Login Required)
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {success}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-1 shadow-xl border border-white/20 mb-6">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('my-teams')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'my-teams'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              My Teams ({teams.length})
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'invitations'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Pending Invitations
            </button>
          </div>
        </div>

        {activeTab === 'my-teams' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Teams List */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Teams</h2>
                
                {teams.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No Teams Yet</h3>
                    <p className="text-gray-600 mb-4">Create your first team to start collaborating</p>
                    <Link 
                      to="/teams/create"
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Create Team
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {teams.map((team) => (
                      <div
                        key={team._id}
                        onClick={() => loadTeamDetails(team._id)}
                        className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                          selectedTeam?._id === team._id
                            ? 'bg-purple-100 border-2 border-purple-300'
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-800">{team.name}</h3>
                            <p className="text-sm text-gray-600">
                              {team.members?.length || 0} members
                            </p>
                          </div>
                          {team.owner?._id === user?.id && (
                            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                              Owner
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Team Details */}
            <div className="lg:col-span-2">
              {selectedTeam ? (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{selectedTeam.name}</h2>
                      <p className="text-gray-600">Created by {selectedTeam.owner?.name}</p>
                    </div>
                    {selectedTeam.owner?._id === user?.id && (
                      <button
                        onClick={() => deleteTeam(selectedTeam._id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Delete Team
                      </button>
                    )}
                  </div>

                  {/* Team Members */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Team Members</h3>
                      {selectedTeam.owner?._id === user?.id && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setShowInviteForm(true)}
                            className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 transition-colors"
                          >
                            Invite by Email
                          </button>
                          <button
                            onClick={() => {
                              setInviteMethod('username')
                              setShowInviteForm(true)
                            }}
                            className="bg-purple-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-purple-700 transition-colors"
                          >
                            Invite by Username
                          </button>
                          <button
                            onClick={() => setShowAutoMatchForm(true)}
                            className="bg-orange-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-orange-700 transition-colors"
                          >
                            Auto-Match
                          </button>
                          <button
                            onClick={() => setShowManualForm(true)}
                            className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                          >
                            Add Manually
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTeam.members?.map((member) => (
                        <div key={member._id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold">
                                  {member.name?.charAt(0) || 'U'}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800">{member.name}</h4>
                                <p className="text-sm text-gray-600">{member.email}</p>
                              </div>
                            </div>
                            {selectedTeam.owner?._id === user?.id && member._id !== user?.id && (
                              <button
                                onClick={() => removeMember(selectedTeam._id, member._id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pending Invitations */}
                  {pendingInvites.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Pending Invitations</h3>
                      <div className="space-y-3">
                        {pendingInvites.map((invite) => {
                          const expiresAt = new Date(invite.expiresAt)
                          const isExpired = expiresAt < new Date()
                          const timeLeft = expiresAt - new Date()
                          const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24))
                          
                          return (
                            <div key={invite._id} className={`border rounded-lg p-4 ${
                              isExpired 
                                ? 'bg-red-50 border-red-200' 
                                : 'bg-yellow-50 border-yellow-200'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-semibold text-gray-800">{invite.invitedName}</h4>
                                  <p className="text-sm text-gray-600">{invite.email}</p>
                                  <p className="text-xs text-gray-500">
                                    Sent {new Date(invite.createdAt).toLocaleDateString()}
                                  </p>
                                  <p className={`text-xs ${
                                    isExpired ? 'text-red-600' : 'text-yellow-600'
                                  }`}>
                                    {isExpired 
                                      ? 'Expired' 
                                      : `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`
                                    }
                                  </p>
                                </div>
                                <div className="flex space-x-2">
                                  {!isExpired && (
                                    <button
                                      onClick={() => resendInvite(invite._id)}
                                      className="bg-yellow-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-yellow-700 transition-colors"
                                    >
                                      Resend
                                    </button>
                                  )}
                                  <button
                                    onClick={() => deleteInvite(invite._id)}
                                    className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700 transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Select a Team</h3>
                  <p className="text-gray-600">Choose a team from the list to view details and manage members</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'invitations' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Pending Invitations</h2>
            <p className="text-gray-600 mb-6">You don't have any pending team invitations.</p>
          </div>
        )}
      </div>

      {/* Unified Invite Member Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Invite Team Member</h3>
            
            {/* Invitation Method Tabs */}
            <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setInviteMethod('email')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  inviteMethod === 'email' 
                    ? 'bg-white text-purple-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                📧 Invite by Email
              </button>
              <button
                onClick={() => setInviteMethod('username')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  inviteMethod === 'username' 
                    ? 'bg-white text-purple-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                👤 Invite by Username
              </button>
            </div>

            {/* Email Invitation Form */}
            {inviteMethod === 'email' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name (Optional)</label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invitation Message (Optional)</label>
                  <textarea
                    value={inviteReason}
                    onChange={(e) => setInviteReason(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Tell them why you want them to join your team..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Username Invitation Form */}
            {inviteMethod === 'username' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search Username</label>
                  <input
                    type="text"
                    value={inviteUsername}
                    onChange={(e) => {
                      setInviteUsername(e.target.value)
                      if (e.target.value.length >= 2) {
                        searchUsersByUsername(e.target.value)
                      } else {
                        setSearchResults([])
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter username to search..."
                  />
                </div>
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                    {searchResults.map((user) => (
                      <div
                        key={user._id}
                        className="p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-800">@{user.username}</div>
                            <div className="text-sm text-gray-600">{user.name}</div>
                            {user.bio && (
                              <div className="text-xs text-gray-500 mt-1">{user.bio}</div>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => addUserToTeam(selectedTeam._id, user._id)}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Add Directly
                            </button>
                            <button
                              onClick={() => {
                                setInviteUsername(user.username)
                                setInviteReason('')
                              }}
                              className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              Send Invite
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {inviteUsername && searchResults.length === 0 && inviteUsername.length >= 2 && (
                  <div className="text-center py-4 text-gray-500">
                    No users found with that username
                  </div>
                )}

                {inviteUsername && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invitation Message (Optional)</label>
                    <textarea
                      value={inviteReason}
                      onChange={(e) => setInviteReason(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Tell them why you want them to join your team..."
                      rows={3}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowInviteForm(false)
                  setInviteEmail('')
                  setInviteName('')
                  setInviteUsername('')
                  setInviteReason('')
                  setSearchResults([])
                  setInviteMethod('email')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (inviteMethod === 'email') {
                    inviteMember(selectedTeam._id)
                  } else {
                    inviteUserByUsername(selectedTeam._id)
                  }
                }}
                disabled={
                  (inviteMethod === 'email' && !inviteEmail) ||
                  (inviteMethod === 'username' && !inviteUsername)
                }
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Manual Member Modal */}

      {/* Auto-Match Modal */}
      {showAutoMatchForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Auto-Match Teammates</h3>
            <p className="text-gray-600 mb-4">Find potential teammates from our community</p>
            
            {autoMatchUsers.length > 0 ? (
              <div className="space-y-3">
                {autoMatchUsers.map((user) => (
                  <div key={user._id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {user.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">@{user.username}</h4>
                          <p className="text-sm text-gray-600">{user.name}</p>
                          {user.bio && (
                            <p className="text-xs text-gray-500 mt-1">{user.bio}</p>
                          )}
                        </div>
                      </div>
                                              <button
                          onClick={() => {
                            setInviteUsername(user.username)
                            setInviteMethod('username')
                            setShowAutoMatchForm(false)
                            setShowInviteForm(true)
                          }}
                          className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 transition-colors"
                        >
                          Invite
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Users Found</h3>
                <p className="text-gray-600">Try inviting by username or email instead</p>
              </div>
            )}
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAutoMatchForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {showManualForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Add Team Member</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={manualForm.name}
                  onChange={(e) => setManualForm({...manualForm, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={manualForm.email}
                  onChange={(e) => setManualForm({...manualForm, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={manualForm.bio}
                  onChange={(e) => setManualForm({...manualForm, bio: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter bio"
                  rows="3"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowManualForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => addManualMember(selectedTeam._id)}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
