import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../lib/api.js';
import Navbar from '../components/Navbar.jsx';
import NoticeModal from '../components/NoticeModal.jsx';

export default function AttendeeDashboard() {
  const { user } = useAuth();
  const [joinedEvents, setJoinedEvents] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events');
  const [showNotice, setShowNotice] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    fetchData();
    checkForNotice();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventsRes, teamsRes] = await Promise.all([
        api.get(`/users/${user.id}/joined`),
        api.get(`/users/${user.id}/teams`)
      ]);

      setJoinedEvents(eventsRes.data);
      setMyTeams(teamsRes.data);
    } catch (error) {
      console.error('Error fetching attendee data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForNotice = async () => {
    try {
      const response = await api.get('/users/profile');
      const hasNotice = response.data.notice && 
                       response.data.notice.trim() !== '' && 
                       !response.data.noticeAcknowledged &&
                       response.data.isActive !== false; // Don't show if user is deactivated
      
      // Also check if this specific notice was already acknowledged in this session
      const noticeAlreadyAcknowledged = response.data.notice && 
                                       localStorage.getItem(`notice_acknowledged_${response.data.notice}`) === 'true';
      
      if (hasNotice && !noticeAlreadyAcknowledged) {
        setNotice(response.data);
        setShowNotice(true);
        console.log('Notice found and displayed');
      } else {
        setNotice(null);
        setShowNotice(false);
        console.log('No active notice to display or notice already acknowledged');
      }
    } catch (error) {
      console.error('Error checking for notice:', error);
      setNotice(null);
      setShowNotice(false);
    }
  };

  const handleAcknowledgeNotice = async () => {
    try {
      // Mark notice as acknowledged in backend
      await api.post('/users/notice/acknowledge');
      
      // Store in localStorage to prevent showing again in this session
      if (notice && notice.notice) {
        localStorage.setItem(`notice_acknowledged_${notice.notice}`, 'true');
      }
      
      // Update local state immediately
      setShowNotice(false);
      setNotice(null);
      
      // Also update the user context to reflect the change
      const { setUser } = useAuth();
      if (setUser) {
        const response = await api.get('/users/profile');
        setUser(response.data);
      }
      
      console.log('Notice acknowledged and permanently dismissed');
    } catch (error) {
      console.error('Error acknowledging notice:', error);
      // Still close the modal even if backend call fails
      setShowNotice(false);
      setNotice(null);
    }
  };

  const leaveEvent = async (eventId) => {
    if (!confirm('Are you sure you want to leave this event?')) {
      return;
    }

    try {
      await api.post(`/events/${eventId}/leave`);
      setJoinedEvents(joinedEvents.filter(event => event._id !== eventId));
      alert('Successfully left the event!');
    } catch (error) {
      console.error('Error leaving event:', error);
      alert('Failed to leave event');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 ${showNotice && notice ? 'blur-sm' : ''}`}>
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">👤</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Attendee Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Welcome back, {user.name}! Here's your activity overview.</p>
          <div className="mt-4 inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            Attendee
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('events')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'events'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Joined Events ({joinedEvents.length})
              </button>
              <button
                onClick={() => setActiveTab('teams')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'teams'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Teams ({myTeams.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Joined Events Tab */}
            {activeTab === 'events' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Events You've Joined</h3>
                  <Link
                    to="/events"
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                  >
                    Browse Events
                  </Link>
                </div>

                {joinedEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No events joined yet</h3>
                    <p className="text-gray-600 mb-6">Join events to start participating and building teams!</p>
                    <Link
                      to="/events"
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                    >
                      Browse Events
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {joinedEvents.map((event) => (
                      <div key={event._id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
                              <p className="text-gray-600 text-sm mb-2">{event.description}</p>
                              <div className="flex items-center text-sm text-gray-500 mb-2">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {new Date(event.date).toLocaleDateString()}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {event.location}
                              </div>
                            </div>
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Joined
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <Link
                              to={`/event/${event._id}`}
                              className="flex-1 px-4 py-2 bg-purple-600 text-white text-center rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              View Details
                            </Link>
                            <button
                              onClick={() => leaveEvent(event._id)}
                              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              Leave
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* My Teams Tab */}
            {activeTab === 'teams' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Teams You're Part Of</h3>
                  <Link
                    to="/teams"
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                  >
                    Browse Teams
                  </Link>
                </div>

                {myTeams.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
                    <p className="text-gray-600 mb-6">Join teams or create your own to participate in events!</p>
                    <Link
                      to="/teams"
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                    >
                      Browse Teams
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myTeams.map((team) => (
                      <div key={team._id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">{team.name}</h3>
                              <p className="text-gray-600 text-sm mb-2">{team.description}</p>
                              <div className="flex items-center text-sm text-gray-500 mb-2">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {team.members?.length || 0} members
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Created {new Date(team.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            {team.owner?._id === user.id && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                Owner
                              </span>
                            )}
                          </div>
                          <Link
                            to={`/teams/${team._id}`}
                            className="w-full px-4 py-2 bg-purple-600 text-white text-center rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            View Team
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notice Modal */}
      {showNotice && notice && (
        <NoticeModal 
          notice={notice} 
          onAcknowledge={handleAcknowledgeNotice} 
        />
      )}
    </div>
  );
}
