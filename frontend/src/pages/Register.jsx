import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Register() {
  const { setToken, setUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [validation, setValidation] = useState({
    username: { isValid: false, message: '' },
    password: { isValid: false, message: '' },
    email: { isValid: false, message: '' }
  })
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)

  // Username validation
  useEffect(() => {
    const validateUsername = async () => {
      if (form.username.length < 3) {
        setValidation(prev => ({
          ...prev,
          username: { isValid: false, message: 'Username must be at least 3 characters' }
        }))
        return
      }
      
      if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
        setValidation(prev => ({
          ...prev,
          username: { isValid: false, message: 'Username can only contain letters, numbers, and underscores' }
        }))
        return
      }

      // Check if username is available
      setIsCheckingUsername(true)
      try {
        const response = await api.get(`/auth/check-username/${form.username}`)
        setValidation(prev => ({
          ...prev,
          username: { 
            isValid: response.data.available, 
            message: response.data.message 
          }
        }))
      } catch (err) {
        setValidation(prev => ({
          ...prev,
          username: { isValid: false, message: 'Error checking username availability' }
        }))
      } finally {
        setIsCheckingUsername(false)
      }
    }

    if (form.username) {
      const timeoutId = setTimeout(validateUsername, 500)
      return () => clearTimeout(timeoutId)
    } else {
      setValidation(prev => ({
        ...prev,
        username: { isValid: false, message: '' }
      }))
    }
  }, [form.username])

  // Password validation
  useEffect(() => {
    const validatePassword = () => {
      const hasMinLength = form.password.length >= 6
      const hasUpperCase = /[A-Z]/.test(form.password)
      const hasLowerCase = /[a-z]/.test(form.password)
      const hasNumber = /\d/.test(form.password)
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(form.password)

      const isValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber
      const message = isValid 
        ? 'Password is strong' 
        : 'Password must be at least 6 characters with uppercase, lowercase, and number'

      setValidation(prev => ({
        ...prev,
        password: { isValid, message }
      }))
    }

    if (form.password) {
      validatePassword()
    } else {
      setValidation(prev => ({
        ...prev,
        password: { isValid: false, message: '' }
      }))
    }
  }, [form.password])

  // Email validation
  useEffect(() => {
    const validateEmail = () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const isValid = emailRegex.test(form.email)
      const message = isValid ? 'Email is valid' : 'Please enter a valid email address'

      setValidation(prev => ({
        ...prev,
        email: { isValid, message }
      }))
    }

    if (form.email) {
      validateEmail()
    } else {
      setValidation(prev => ({
        ...prev,
        email: { isValid: false, message: '' }
      }))
    }
  }, [form.email])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    
    // Check if all validations pass
    if (!validation.username.isValid || !validation.password.isValid || !validation.email.isValid) {
      setError('Please fix the validation errors before submitting')
      return
    }

    try {
      const { data } = await api.post('/auth/register', form)
      setToken(data.token)
      setUser(data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    }
  }

  const CheckmarkIcon = ({ isValid, isChecking }) => {
    if (isChecking) {
      return (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
      )
    }
    
    if (isValid) {
      return (
        <div className="animate-bounce">
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )
    }
    
    return null
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 mt-10 rounded shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Create Account</h2>
      {error && <div className="text-red-600 mb-4 p-3 bg-red-50 rounded border border-red-200">{error}</div>}
      
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input 
            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            placeholder="Enter your full name" 
            value={form.name} 
            onChange={(e)=>setForm({...form, name:e.target.value})} 
            required
          />
        </div>

        {/* Username Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <div className="relative">
            <input 
              className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                validation.username.isValid ? 'border-green-500' : 
                form.username && !validation.username.isValid ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Choose a username" 
              value={form.username} 
              onChange={(e)=>setForm({...form, username:e.target.value})} 
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <CheckmarkIcon isValid={validation.username.isValid} isChecking={isCheckingUsername} />
            </div>
          </div>
          {validation.username.message && (
            <p className={`text-xs mt-1 ${
              validation.username.isValid ? 'text-green-600' : 'text-red-600'
            }`}>
              {validation.username.message}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <div className="relative">
            <input 
              className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                validation.email.isValid ? 'border-green-500' : 
                form.email && !validation.email.isValid ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your email" 
              type="email" 
              value={form.email} 
              onChange={(e)=>setForm({...form, email:e.target.value})} 
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <CheckmarkIcon isValid={validation.email.isValid} isChecking={false} />
            </div>
          </div>
          {validation.email.message && (
            <p className={`text-xs mt-1 ${
              validation.email.isValid ? 'text-green-600' : 'text-red-600'
            }`}>
              {validation.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <div className="relative">
            <input 
              className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                validation.password.isValid ? 'border-green-500' : 
                form.password && !validation.password.isValid ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Create a password" 
              type="password" 
              value={form.password} 
              onChange={(e)=>setForm({...form, password:e.target.value})} 
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <CheckmarkIcon isValid={validation.password.isValid} isChecking={false} />
            </div>
          </div>
          {validation.password.message && (
            <p className={`text-xs mt-1 ${
              validation.password.isValid ? 'text-green-600' : 'text-red-600'
            }`}>
              {validation.password.message}
            </p>
          )}
        </div>

        <button 
          className={`w-full py-2 rounded-lg font-medium transition-all duration-200 ${
            validation.username.isValid && validation.password.isValid && validation.email.isValid && form.name
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              : 'bg-gray-400 text-gray-600 cursor-not-allowed'
          }`} 
          type="submit"
          disabled={!validation.username.isValid || !validation.password.isValid || !validation.email.isValid || !form.name}
        >
          Create Account
        </button>
      </form>
      
      <p className="mt-6 text-sm text-center text-gray-600">
        Already have an account? <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">Sign In</Link>
      </p>
    </div>
  )
}


