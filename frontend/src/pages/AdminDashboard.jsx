import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import confetti from 'canvas-confetti';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({});
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [organizerRequests, setOrganizerRequests] = useState([]);
  const [teams, setTeams] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [selectedUserForNotice, setSelectedUserForNotice] = useState(null);
  const [noticeText, setNoticeText] = useState('');
  const [impersonateLoading, setImpersonateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState({});
  const [noticeLoading, setNoticeLoading] = useState(false);
  const [showOrganizerApprovalModal, setShowOrganizerApprovalModal] = useState(false);
  const [selectedOrganizerRequest, setSelectedOrganizerRequest] = useState(null);
  const [organizerApprovalStep, setOrganizerApprovalStep] = useState(1); // 1: Review, 2: Confirm

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, usersRes, eventsRes, pendingEventsRes, organizerRequestsRes, teamsRes, invitesRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/users'),
        api.get('/admin/events'),
        api.get('/admin/events/pending'),
        api.get('/admin/organizer-requests'),
        api.get('/admin/teams'),
        api.get('/admin/invites')
      ]);

      setAnalytics(analyticsRes.data);
      setUsers(usersRes.data);
      setEvents(eventsRes.data);
      setPendingEvents(pendingEventsRes.data);
      setOrganizerRequests(organizerRequestsRes.data);
      setTeams(teamsRes.data);
      setInvites(invitesRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async (userId) => {
    try {
      setImpersonateLoading(true);
      const response = await api.post(`/admin/impersonate/${userId}`);
      
      // Store the impersonated user's token
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Show confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF6347']
      });

      // Open in new tab
      window.open('/dashboard', '_blank');
      setShowImpersonateModal(false);
    } catch (error) {
      console.error('Error impersonating user:', error);
      alert('Failed to impersonate user');
    } finally {
      setImpersonateLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleteLoading(prev => ({ ...prev, [userId]: true }));
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter(user => user._id !== userId));
      alert('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    } finally {
      setDeleteLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleteLoading(prev => ({ ...prev, [eventId]: true }));
      await api.delete(`/admin/events/${eventId}`);
      setEvents(events.filter(event => event._id !== eventId));
      alert('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    } finally {
      setDeleteLoading(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const handleDeleteInvite = async (inviteId) => {
    if (!confirm('Are you sure you want to delete this invitation?')) {
      return;
    }

    try {
      setDeleteLoading(prev => ({ ...prev, [inviteId]: true }));
      await api.delete(`/admin/invites/${inviteId}`);
      setInvites(invites.filter(invite => invite._id !== inviteId));
      alert('Invitation deleted successfully');
    } catch (error) {
      console.error('Error deleting invitation:', error);
      alert('Failed to delete invitation');
    } finally {
      setDeleteLoading(prev => ({ ...prev, [inviteId]: false }));
    }
  };

  const handleWithdrawInvite = async (inviteId) => {
    try {
      setDeleteLoading(prev => ({ ...prev, [inviteId]: true }));
      await api.post(`/admin/invites/${inviteId}/withdraw`);
      setInvites(invites.map(invite => 
        invite._id === inviteId ? { ...invite, status: 'withdrawn' } : invite
      ));
      alert('Invitation withdrawn successfully');
    } catch (error) {
      console.error('Error withdrawing invitation:', error);
      alert('Failed to withdraw invitation');
    } finally {
      setDeleteLoading(prev => ({ ...prev, [inviteId]: false }));
    }
  };

  const handleSendNotice = async () => {
    if (!noticeText.trim()) {
      alert('Please enter a notice message');
      return;
    }

    try {
      setNoticeLoading(true);
      await api.post(`/admin/users/${selectedUserForNotice._id}/notice`, {
        notice: noticeText,
        deactivateAccount: true
      });
      
      // Update user status in the list
      setUsers(users.map(user => 
        user._id === selectedUserForNotice._id 
          ? { ...user, isActive: false, notice: noticeText }
          : user
      ));
      
      setNoticeText('');
      setShowNoticeModal(false);
      setSelectedUserForNotice(null);
      alert('Notice sent and account deactivated successfully');
    } catch (error) {
      console.error('Error sending notice:', error);
      alert('Failed to send notice');
    } finally {
      setNoticeLoading(false);
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (!confirm('Are you sure you want to deactivate this user account?')) {
      return;
    }

    try {
      setDeleteLoading(prev => ({ ...prev, [userId]: true }));
      await api.post(`/admin/users/${userId}/deactivate`);
      setUsers(users.map(user => 
        user._id === userId ? { ...user, isActive: false } : user
      ));
      alert('User account deactivated successfully');
    } catch (error) {
      console.error('Error deactivating user:', error);
      alert('Failed to deactivate user account');
    } finally {
      setDeleteLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleApproveEvent = async (eventId) => {
    if (!confirm('Are you sure you want to approve this event? It will be visible to all users.')) {
      return;
    }

    try {
      setDeleteLoading(prev => ({ ...prev, [eventId]: true }));
      await api.post(`/admin/events/${eventId}/approve`);
      
      // Remove from pending events and add to approved events
      setPendingEvents(pendingEvents.filter(event => event._id !== eventId));
      const approvedEvent = pendingEvents.find(event => event._id === eventId);
      if (approvedEvent) {
        approvedEvent.status = 'approved';
        setEvents([approvedEvent, ...events]);
      }
      
      alert('Event approved successfully!');
    } catch (error) {
      console.error('Error approving event:', error);
      alert('Failed to approve event');
    } finally {
      setDeleteLoading(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const handleRejectEvent = async (eventId) => {
    const reason = prompt('Please provide a reason for rejecting this event:');
    if (!reason || reason.trim() === '') {
      alert('Rejection reason is required');
      return;
    }

    try {
      setDeleteLoading(prev => ({ ...prev, [eventId]: true }));
      await api.post(`/admin/events/${eventId}/reject`, { reason });
      
      // Remove from pending events
      setPendingEvents(pendingEvents.filter(event => event._id !== eventId));
      
      alert('Event rejected successfully!');
    } catch (error) {
      console.error('Error rejecting event:', error);
      alert('Failed to reject event');
    } finally {
      setDeleteLoading(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const handleApproveAllEvents = async () => {
    if (!confirm('Are you sure you want to approve ALL pending events? This will make them visible to all users.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/admin/events/approve-all');
      
      alert(`Successfully approved ${response.data.modifiedCount} events!`);
      
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error approving all events:', error);
      alert('Failed to approve all events');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOrganizer = async (userId) => {
    if (!confirm('Are you sure you want to approve this organizer request? The user will be able to create events.')) {
      return;
    }

    try {
      setDeleteLoading(prev => ({ ...prev, [userId]: true }));
      await api.post(`/admin/organizer-requests/${userId}/approve`);
      
      // Remove from organizer requests
      setOrganizerRequests(organizerRequests.filter(req => req._id !== userId));
      
      alert('Organizer request approved successfully!');
    } catch (error) {
      console.error('Error approving organizer request:', error);
      alert('Failed to approve organizer request');
    } finally {
      setDeleteLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleRejectOrganizer = async (userId) => {
    const reason = prompt('Please provide a reason for rejecting this organizer request:');
    if (!reason || reason.trim() === '') {
      alert('Rejection reason is required');
      return;
    }

    try {
      setDeleteLoading(prev => ({ ...prev, [userId]: true }));
      await api.post(`/admin/organizer-requests/${userId}/reject`, { reason });
      
      // Remove from organizer requests
      setOrganizerRequests(organizerRequests.filter(req => req._id !== userId));
      
      alert('Organizer request rejected successfully!');
    } catch (error) {
      console.error('Error rejecting organizer request:', error);
      alert('Failed to reject organizer request');
    } finally {
      setDeleteLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handlePromoteUser = async (userId, newRole) => {
    if (!confirm(`Are you sure you want to promote this user to ${newRole}?`)) {
      return;
    }

    try {
      setDeleteLoading(prev => ({ ...prev, [userId]: true }));
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      
      // Update user in the list
      setUsers(users.map(user => 
        user._id === userId 
          ? { ...user, role: newRole }
          : user
      ));
      
      alert(`User promoted to ${newRole} successfully!`);
    } catch (error) {
      console.error('Error promoting user:', error);
      alert('Failed to promote user');
    } finally {
      setDeleteLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleDemoteUser = async (userId, newRole) => {
    if (!confirm(`Are you sure you want to demote this user to ${newRole}?`)) {
      return;
    }

    try {
      setDeleteLoading(prev => ({ ...prev, [userId]: true }));
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      
      // Update user in the list
      setUsers(users.map(user => 
        user._id === userId 
          ? { ...user, role: newRole }
          : user
      ));
      
      alert(`User demoted to ${newRole} successfully!`);
    } catch (error) {
      console.error('Error demoting user:', error);
      alert('Failed to demote user');
    } finally {
      setDeleteLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      setDeleteLoading(prev => ({ ...prev, [userId]: true }));
      await api.post(`/admin/users/${userId}/activate`);
      setUsers(users.map(user => 
        user._id === userId ? { ...user, isActive: true } : user
      ));
      alert('User account activated successfully');
    } catch (error) {
      console.error('Error activating user:', error);
      alert('Failed to activate user account');
    } finally {
      setDeleteLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading Admin Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-yellow-400">🔐 Admin Dashboard</h1>
              <p className="text-gray-400 mt-1 text-sm sm:text-base">Welcome Prince Sir - Master Control Panel</p>
            </div>
            <div className="flex space-x-2 sm:space-x-4">
              <button
                onClick={() => navigate('/')}
                className="px-3 sm:px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors text-sm sm:text-base"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-blue-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">{analytics.totalUsers || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-green-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Total Events</p>
                <p className="text-2xl font-bold text-white">{analytics.totalEvents || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-purple-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Total Teams</p>
                <p className="text-2xl font-bold text-white">{analytics.totalTeams || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Pending Invites</p>
                <p className="text-2xl font-bold text-white">{analytics.totalInvites || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 mb-6 sm:mb-8">
          <div className="border-b border-gray-700">
            <nav className="flex flex-wrap space-x-2 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'users' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Users ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'events' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Events ({events.length})
              </button>
              <button
                onClick={() => setActiveTab('pending-events')}
                className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'pending-events' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Pending Events ({pendingEvents.length})
              </button>
              <button
                onClick={() => setActiveTab('organizer-requests')}
                className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'organizer-requests' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Organizer Requests ({organizerRequests.length})
              </button>
              <button
                onClick={() => setActiveTab('send-notice')}
                className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'send-notice' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Send Notice
              </button>
              <button
                onClick={() => setActiveTab('teams')}
                className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'teams' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Teams ({teams.length})
              </button>
              <button
                onClick={() => setActiveTab('invites')}
                className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'invites' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Invitations ({invites.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-yellow-400 mb-4">User Management</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700" style={{ minWidth: '900px' }}>
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Notice</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {users.map((user) => (
                        <tr key={user._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center">
                                  <span className="text-sm font-medium text-white">
                                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-white">{user.name}</div>
                                <div className="text-sm text-gray-400">@{user.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'organizer' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role === 'admin' ? 'Admin' :
                               user.role === 'organizer' ? 'Organizer' :
                               'Attendee'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {user.notice ? (
                              <div className="max-w-xs">
                                <div className="text-yellow-400 font-medium">Notice Sent</div>
                                <div className="text-xs text-gray-400 truncate" title={user.notice}>
                                  {user.notice}
                                </div>
                                {user.noticeDate && (
                                  <div className="text-xs text-gray-500">
                                    {new Date(user.noticeDate).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500">No notice</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => handleImpersonate(user._id)}
                              disabled={impersonateLoading}
                              className="text-blue-400 hover:text-blue-300 disabled:opacity-50"
                            >
                              {impersonateLoading ? 'Loading...' : 'Login As'}
                            </button>
                            
                            {/* Role Management - Only for non-admin users */}
                            {user.role !== 'admin' && (
                              <>
                                {user.role === 'user' && (
                                  <button
                                    onClick={() => handlePromoteUser(user._id, 'organizer')}
                                    disabled={deleteLoading[user._id]}
                                    className="text-green-400 hover:text-green-300 disabled:opacity-50"
                                  >
                                    {deleteLoading[user._id] ? 'Promoting...' : 'Promote to Organizer'}
                                  </button>
                                )}
                                {user.role === 'organizer' && (
                                  <button
                                    onClick={() => handleDemoteUser(user._id, 'user')}
                                    disabled={deleteLoading[user._id]}
                                    className="text-orange-400 hover:text-orange-300 disabled:opacity-50"
                                  >
                                    {deleteLoading[user._id] ? 'Demoting...' : 'Demote to Attendee'}
                                  </button>
                                )}
                              </>
                            )}
                            {user.email !== 'admin@huddle.com' ? (
                              <button
                                onClick={() => {
                                  setSelectedUserForNotice(user);
                                  setShowNoticeModal(true);
                                }}
                                className="text-orange-400 hover:text-orange-300"
                              >
                                Notice
                              </button>
                            ) : (
                              <span className="text-gray-500 text-xs">Protected</span>
                            )}
                            {user.isActive ? (
                              user.email !== 'admin@huddle.com' ? (
                                <button
                                  onClick={() => handleDeactivateUser(user._id)}
                                  disabled={deleteLoading[user._id]}
                                  className="text-yellow-400 hover:text-yellow-300 disabled:opacity-50"
                                >
                                  {deleteLoading[user._id] ? 'Deactivating...' : 'Deactivate'}
                                </button>
                              ) : (
                                <span className="text-gray-500 text-xs">Protected</span>
                              )
                            ) : (
                              <button
                                onClick={() => handleActivateUser(user._id)}
                                disabled={deleteLoading[user._id]}
                                className="text-green-400 hover:text-green-300 disabled:opacity-50"
                              >
                                {deleteLoading[user._id] ? 'Activating...' : 'Activate'}
                              </button>
                            )}
                            {user.email !== 'admin@huddle.com' && (
                              <button
                                onClick={() => handleDeleteUser(user._id)}
                                disabled={deleteLoading[user._id]}
                                className="text-red-400 hover:text-red-300 disabled:opacity-50"
                              >
                                {deleteLoading[user._id] ? 'Deleting...' : 'Delete'}
                              </button>
                            )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-yellow-400 mb-4">Event Management</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Event</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Organizer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {events.map((event) => (
                        <tr key={event._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">{event.title}</div>
                            <div className="text-sm text-gray-400">{event.location}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {event.organizer?.name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {new Date(event.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleDeleteEvent(event._id)}
                              disabled={deleteLoading[event._id]}
                              className="text-red-400 hover:text-red-300 disabled:opacity-50"
                            >
                              {deleteLoading[event._id] ? 'Deleting...' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pending Events Tab */}
            {activeTab === 'pending-events' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-yellow-400">Pending Event Approvals</h3>
                  {pendingEvents.length > 0 && (
                    <button
                      onClick={handleApproveAllEvents}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
                    >
                      {loading ? 'Approving...' : `Approve All (${pendingEvents.length})`}
                    </button>
                  )}
                </div>
                {pendingEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No pending events to approve</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Event</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Organizer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {pendingEvents.map((event) => (
                          <tr key={event._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-white">{event.title}</div>
                              <div className="text-sm text-gray-400">{event.location}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {event.organizer?.name || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {event.category}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {new Date(event.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => handleApproveEvent(event._id)}
                                disabled={deleteLoading[event._id]}
                                className="text-green-400 hover:text-green-300 disabled:opacity-50"
                              >
                                {deleteLoading[event._id] ? 'Approving...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleRejectEvent(event._id)}
                                disabled={deleteLoading[event._id]}
                                className="text-red-400 hover:text-red-300 disabled:opacity-50"
                              >
                                {deleteLoading[event._id] ? 'Rejecting...' : 'Reject'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Organizer Requests Tab */}
            {activeTab === 'organizer-requests' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-yellow-400 mb-4">Organizer Request Approvals</h3>
                {organizerRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No pending organizer requests</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Organization</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Contact</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Reason</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Requested</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {organizerRequests.map((request) => (
                          <tr key={request._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-white">{request.name}</div>
                              <div className="text-sm text-gray-400">{request.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-300">{request.organizerProfile?.organization}</div>
                              <div className="text-xs text-gray-400 max-w-xs truncate">
                                {request.organizerProfile?.description}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-300">{request.organizerProfile?.contactEmail || request.email}</div>
                              <div className="text-xs text-gray-400">
                                {request.organizerProfile?.contactPhone || request.contactNumber}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-300 max-w-xs truncate">
                                {request.organizerProfile?.organizerRequestReason}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {new Date(request.organizerProfile?.organizerRequestDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => handleApproveOrganizer(request._id)}
                                disabled={deleteLoading[request._id]}
                                className="text-green-400 hover:text-green-300 disabled:opacity-50"
                              >
                                {deleteLoading[request._id] ? 'Approving...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleRejectOrganizer(request._id)}
                                disabled={deleteLoading[request._id]}
                                className="text-red-400 hover:text-red-300 disabled:opacity-50"
                              >
                                {deleteLoading[request._id] ? 'Rejecting...' : 'Reject'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Teams Tab */}
            {activeTab === 'teams' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-yellow-400 mb-4">Team Management</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Team</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Owner</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Members</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {teams.map((team) => (
                        <tr key={team._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">{team.name}</div>
                            <div className="text-sm text-gray-400">{team.description}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {team.owner?.name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {team.members?.length || 0} members
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {new Date(team.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Invites Tab */}
            {activeTab === 'invites' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-yellow-400 mb-4">Invitation Management</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Team</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Invited By</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {invites.map((invite) => (
                        <tr key={invite._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            {invite.team?.name || 'Unknown Team'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {invite.invitedBy?.name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{invite.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              invite.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              invite.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {invite.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {invite.status === 'pending' && (
                              <button
                                onClick={() => handleWithdrawInvite(invite._id)}
                                disabled={deleteLoading[invite._id]}
                                className="text-orange-400 hover:text-orange-300 disabled:opacity-50"
                              >
                                {deleteLoading[invite._id] ? 'Withdrawing...' : 'Withdraw'}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteInvite(invite._id)}
                              disabled={deleteLoading[invite._id]}
                              className="text-red-400 hover:text-red-300 disabled:opacity-50"
                            >
                              {deleteLoading[invite._id] ? 'Deleting...' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Send Notice Tab */}
            {activeTab === 'send-notice' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-yellow-400 mb-4">Send Notice to Users</h3>
                <div className="bg-gray-700 rounded-lg p-6">
                  <div className="mb-6">
                    <h4 className="text-lg font-medium text-white mb-2">Select User to Send Notice</h4>
                    <p className="text-gray-400 text-sm mb-4">
                      Choose a user from the list below to send them a legal notice. This will also deactivate their account.
                    </p>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-600">
                      <thead className="bg-gray-600">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Current Notice</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-gray-800 divide-y divide-gray-600">
                        {users.map((user) => (
                          <tr key={user._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center">
                                    <span className="text-sm font-medium text-white">
                                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-white">{user.name}</div>
                                  <div className="text-sm text-gray-400">@{user.username}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                user.role === 'organizer' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role === 'admin' ? 'Admin' :
                                 user.role === 'organizer' ? 'Organizer' :
                                 'Attendee'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {user.notice ? (
                                <div className="max-w-xs">
                                  <div className="text-yellow-400 font-medium">Notice Sent</div>
                                  <div className="text-xs text-gray-400 truncate" title={user.notice}>
                                    {user.notice}
                                  </div>
                                  {user.noticeDate && (
                                    <div className="text-xs text-gray-500">
                                      {new Date(user.noticeDate).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-500">No notice</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => {
                                  setSelectedUserForNotice(user);
                                  setShowNoticeModal(true);
                                }}
                                disabled={!user.isActive}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Send Notice
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notice Modal */}
      {showNoticeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 border border-gray-700">
            <h3 className="text-xl font-semibold text-yellow-400 mb-4">
              Send Legal Notice
            </h3>
            <div className="mb-4">
              <p className="text-gray-300 text-sm mb-2">
                Sending notice to: <span className="font-semibold text-white">{selectedUserForNotice?.name}</span>
              </p>
              <p className="text-gray-400 text-xs">
                This will send a notice and deactivate the user's account.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notice Message
                </label>
                <textarea
                  value={noticeText}
                  onChange={(e) => setNoticeText(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="Enter the legal notice message..."
                  rows={4}
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowNoticeModal(false);
                  setSelectedUserForNotice(null);
                  setNoticeText('');
                }}
                className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNotice}
                disabled={noticeLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {noticeLoading ? 'Sending...' : 'Send Notice & Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
