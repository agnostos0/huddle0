import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { token, user, setToken, setUser } = useAuth()
  const navigate = useNavigate()

  function logout() {
    setToken(null)
    setUser(null)
    navigate('/login')
  }

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-white/20">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
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
              
              <button 
                onClick={logout} 
                className="text-gray-700 hover:text-red-600 transition-colors duration-300"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="text-gray-700 hover:text-purple-600 transition-colors duration-300"
              >
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
    </nav>
  )
}


