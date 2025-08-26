import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { setToken, setUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ emailOrUsername: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    try {
      const { data } = await api.post('/auth/login', form)
      setToken(data.token)
      setUser(data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 mt-10 rounded shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Welcome Back</h2>
      {error && <div className="text-red-600 mb-4 p-3 bg-red-50 rounded border border-red-200">{error}</div>}
      
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email or Username</label>
          <input 
            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            placeholder="Enter your email or username" 
            type="text" 
            value={form.emailOrUsername} 
            onChange={(e)=>setForm({...form, emailOrUsername:e.target.value})} 
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input 
            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            placeholder="Enter your password" 
            type="password" 
            value={form.password} 
            onChange={(e)=>setForm({...form, password:e.target.value})} 
            required
          />
        </div>
        
        <button 
          className={`w-full py-2 rounded-lg font-medium transition-all duration-200 ${
            isLoading 
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
          }`} 
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Signing In...
            </div>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
      
      <p className="mt-6 text-sm text-center text-gray-600">
        Don't have an account? <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium">Create Account</Link>
      </p>
    </div>
  )
}


