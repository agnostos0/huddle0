import React, { useState } from 'react'
import api from '../lib/api.js'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import confetti from 'canvas-confetti'
import Navbar from '../components/Navbar.jsx'

export default function CreateTeam() {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    
    if (!user) {
      setError('Please login to create a team')
      navigate('/login')
      return
    }
    
    try {
      await api.post('/teams', { name })
      
      // Trigger confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#059669', '#047857', '#065F46', '#064E3B']
      })
      
      navigate('/teams')
    } catch (e) {
      if (e.response?.status === 401) {
        setError('Please login to create a team')
        navigate('/login')
      } else {
        setError('Failed to create team')
      }
    }
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-4">Please login to create a team</p>
          <button 
            onClick={() => navigate('/login')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />
      <div className="flex items-center justify-center p-6 min-h-screen">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🚀</span>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Create Amazing Team
          </h2>
          <p className="text-gray-600 mt-2">Build your dream team!</p>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}
        
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Team Name</label>
            <input 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300" 
              placeholder="Enter team name" 
              value={name} 
              onChange={(e)=>setName(e.target.value)} 
              required
            />
          </div>
          
          <button 
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg font-semibold rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300" 
            type="submit"
          >
            🚀 Create Team
          </button>
        </form>
      </div>
      </div>
    </div>
  )
}


