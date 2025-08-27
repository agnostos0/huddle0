import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleImpersonate = (userId) => {
    // Store current admin session
    localStorage.setItem('adminToken', token)
    localStorage.setItem('adminUser', JSON.stringify(user))
    
    // Open impersonation in new tab
    window.open(`/admin/impersonate/${userId}`, '_blank')
  }

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Eventify
            </span>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link to="/" className="text-gray-700 hover:text-purple-600 transition-colors duration-300">
              Home
            </Link>
            
            <Link to="/events" className="text-gray-700 hover:text-purple-600 transition-colors duration-300">
              Events
            </Link>
            
            <Link to="/explore" className="text-gray-700 hover:text-purple-600 transition-colors duration-300">
              Explore
            </Link>
            
            {token ? (
              <>
                <Link to="/dashboard" className="text-gray-700 hover:text-purple-600 transition-colors duration-300">
                  Dashboard
                </Link>
                
                <Link to="/create" className="text-gray-700 hover:text-purple-600 transition-colors duration-300">
                  Create Event
                </Link>
                
                <Link to="/teams" className="text-gray-700 hover:text-purple-600 transition-colors duration-300">
                  My Teams
                </Link>
                
                {/* Admin Access */}
                {user?.email === 'admin@eventify.com' && (
                  <Link 
                    to="/admin" 
                    className="text-red-600 hover:text-red-700 font-semibold transition-colors duration-300"
                  >
                    Admin Panel
                  </Link>
                )}
                
                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition-colors duration-300"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                      {user?.profilePicture ? (
                        <img 
                          src={user.profilePicture} 
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-sm font-semibold">
                          {user?.name?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>Profile Settings</span>
                        </div>
                      </Link>
                      
                      {user?.email === 'admin@eventify.com' && (
                        <div className="border-t border-gray-100 pt-2">
                          <p className="px-4 py-1 text-xs text-gray-500 font-medium">Admin Actions</p>
                          <button
                            onClick={() => {
                              setShowProfileDropdown(false)
                              // Add admin impersonation logic here
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 transition-colors"
                          >
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 6v6m-4-6h8m-8 0H4" />
                              </svg>
                              <span>Login as User</span>
                            </div>
                          </button>
                        </div>
                      )}
                      
                      <div className="border-t border-gray-100 pt-2">
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false)
                            handleLogout()
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Logout</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-purple-600 transition-colors duration-300">
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Click outside to close dropdown */}
      {showProfileDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowProfileDropdown(false)}
        />
      )}
    </nav>
  )
}


