import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import confetti from 'canvas-confetti'

// Checkmark Icon Component
const CheckmarkIcon = ({ isValid, isChecking }) => {
  if (isChecking) {
    return (
      <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
    )
  }
  return isValid ? (
    <svg className="w-5 h-5 text-green-500 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ) : null
}

// Password Checklist Item Component
const PasswordChecklistItem = ({ isValid, text, delay = 0 }) => {
  return (
    <div 
      className={`flex items-center space-x-2 transition-all duration-500 transform ${
        isValid ? 'opacity-100 translate-x-0' : 'opacity-60 translate-x-2'
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
        isValid 
          ? 'bg-green-500 border-green-500 scale-110' 
          : 'border-gray-300 bg-white'
      }`}>
        {isValid && (
          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      <span className={`text-sm transition-colors duration-300 ${
        isValid ? 'text-green-600 font-medium' : 'text-gray-500'
      }`}>
        {text}
      </span>
    </div>
  )
}

export default function Register() {
  const { setToken, setUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [validation, setValidation] = useState({
    username: { isValid: false, message: '', isChecking: false },
    password: { isValid: false, message: '' },
    email: { isValid: false, message: '' }
  })
  const [passwordCriteria, setPasswordCriteria] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  })

  // Username validation with better error handling
  useEffect(() => {
    const validateUsername = async () => {
      if (!form.username) {
        setValidation(prev => ({
          ...prev,
          username: { isValid: false, message: '', isChecking: false }
        }))
        return
      }

      if (form.username.length < 3) {
        setValidation(prev => ({
          ...prev,
          username: { isValid: false, message: 'Username must be at least 3 characters', isChecking: false }
        }))
        return
      }

      if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
        setValidation(prev => ({
          ...prev,
          username: { isValid: false, message: 'Username can only contain letters, numbers, and underscores', isChecking: false }
        }))
        return
      }

      // Check if username is available
      setValidation(prev => ({
        ...prev,
        username: { ...prev.username, isChecking: true }
      }))

      try {
        const response = await api.get(`/auth/check-username/${form.username}`)
        console.log('Username check response:', response.data) // Debug log
        setValidation(prev => ({
          ...prev,
          username: {
            isValid: response.data.available,
            message: response.data.message,
            isChecking: false
          }
        }))
      } catch (err) {
        console.error('Username check error details:', err) // Debug log
        let errorMessage = 'Unable to check username availability. Please try again.'
        
        if (err.response) {
          // Server responded with error status
          if (err.response.status === 404) {
            errorMessage = 'Username check service not available'
          } else if (err.response.status >= 500) {
            errorMessage = 'Server error. Please try again later.'
          } else if (err.response.data && err.response.data.message) {
            errorMessage = err.response.data.message
          }
        } else if (err.request) {
          // Network error - allow registration but warn user
          errorMessage = 'Network error. Username availability will be checked during registration.'
          setValidation(prev => ({
            ...prev,
            username: {
              isValid: true, // Allow registration even if check fails
              message: errorMessage,
              isChecking: false
            }
          }))
          return
        }
        
        setValidation(prev => ({
          ...prev,
          username: {
            isValid: false,
            message: errorMessage,
            isChecking: false
          }
        }))
      }
    }

    const timeoutId = setTimeout(validateUsername, 800)
    return () => clearTimeout(timeoutId)
  }, [form.username])

  // Password validation with detailed criteria
  useEffect(() => {
    const validatePassword = () => {
      if (!form.password) {
        setValidation(prev => ({
          ...prev,
          password: { isValid: false, message: '' }
        }))
        setPasswordCriteria({
          minLength: false,
          hasUpperCase: false,
          hasLowerCase: false,
          hasNumber: false,
          hasSpecialChar: false
        })
        return
      }

      const criteria = {
        minLength: form.password.length >= 8,
        hasUpperCase: /[A-Z]/.test(form.password),
        hasLowerCase: /[a-z]/.test(form.password),
        hasNumber: /\d/.test(form.password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(form.password)
      }

      setPasswordCriteria(criteria)

      const isValid = criteria.minLength && criteria.hasUpperCase && criteria.hasLowerCase && criteria.hasNumber
      let message = ''

      if (isValid) {
        message = 'Password is strong'
      } else {
        const requirements = []
        if (!criteria.minLength) requirements.push('at least 8 characters')
        if (!criteria.hasUpperCase) requirements.push('one uppercase letter')
        if (!criteria.hasLowerCase) requirements.push('one lowercase letter')
        if (!criteria.hasNumber) requirements.push('one number')
        message = `Password needs: ${requirements.join(', ')}`
      }

      setValidation(prev => ({
        ...prev,
        password: { isValid, message }
      }))
    }

    validatePassword()
  }, [form.password])

  // Email validation
  useEffect(() => {
    const validateEmail = () => {
      if (!form.email) {
        setValidation(prev => ({
          ...prev,
          email: { isValid: false, message: '' }
        }))
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const isValid = emailRegex.test(form.email)
      const message = isValid ? 'Email format is valid' : 'Please enter a valid email address'

      setValidation(prev => ({
        ...prev,
        email: { isValid, message }
      }))
    }

    validateEmail()
  }, [form.email])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await api.post('/auth/register', form)
      setToken(response.data.token)
      setUser(response.data.user)
      
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
      
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = form.name && form.username && form.email && form.password && 
                     validation.password.isValid && validation.email.isValid && 
                     (validation.username.isValid || validation.username.message.includes('Network error'))

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 animate-float">
          <div className="w-4 h-4 bg-purple-400 rounded-full opacity-60"></div>
        </div>
        <div className="absolute top-40 right-20 animate-float animation-delay-1000">
          <div className="w-6 h-6 bg-blue-400 rounded-full opacity-60"></div>
        </div>
        <div className="absolute bottom-40 left-20 animate-float animation-delay-2000">
          <div className="w-3 h-3 bg-pink-400 rounded-full opacity-60"></div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Eventify
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
          <p className="text-gray-600">Join thousands of event organizers and start creating amazing experiences</p>
        </div>

        {/* Registration Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="Enter your full name"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm ${
                    validation.username.isValid ? 'border-green-500 focus:ring-green-500' :
                    validation.username.message && !validation.username.isValid ? 'border-red-500 focus:ring-red-500' :
                    'border-gray-300 focus:ring-purple-500'
                  }`}
                  placeholder="Choose a unique username"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {validation.username.isValid && <CheckmarkIcon isValid={true} />}
                  {validation.username.isChecking && <CheckmarkIcon isValid={false} isChecking={true} />}
                </div>
              </div>
              {validation.username.message && (
                <p className={`mt-2 text-sm ${
                  validation.username.isValid ? 'text-green-600' : 'text-red-600'
                }`}>
                  {validation.username.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm ${
                    validation.email.isValid ? 'border-green-500 focus:ring-green-500' :
                    validation.email.message && !validation.email.isValid ? 'border-red-500 focus:ring-red-500' :
                    'border-gray-300 focus:ring-purple-500'
                  }`}
                  placeholder="Enter your email address"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {validation.email.isValid && <CheckmarkIcon isValid={true} />}
                </div>
              </div>
              {validation.email.message && (
                <p className={`mt-2 text-sm ${
                  validation.email.isValid ? 'text-green-600' : 'text-red-600'
                }`}>
                  {validation.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm ${
                    validation.password.isValid ? 'border-green-500 focus:ring-green-500' :
                    validation.password.message && !validation.password.isValid ? 'border-red-500 focus:ring-red-500' :
                    'border-gray-300 focus:ring-purple-500'
                  }`}
                  placeholder="Create a strong password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Password Checklist */}
              {form.password && (
                <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Password Requirements:</h4>
                  <div className="space-y-2">
                    <PasswordChecklistItem 
                      isValid={passwordCriteria.minLength} 
                      text="At least 8 characters long" 
                      delay={0}
                    />
                    <PasswordChecklistItem 
                      isValid={passwordCriteria.hasUpperCase} 
                      text="Contains uppercase letter (A-Z)" 
                      delay={100}
                    />
                    <PasswordChecklistItem 
                      isValid={passwordCriteria.hasLowerCase} 
                      text="Contains lowercase letter (a-z)" 
                      delay={200}
                    />
                    <PasswordChecklistItem 
                      isValid={passwordCriteria.hasNumber} 
                      text="Contains number (0-9)" 
                      delay={300}
                    />
                    <PasswordChecklistItem 
                      isValid={passwordCriteria.hasSpecialChar} 
                      text="Contains special character (!@#$%^&*)" 
                      delay={400}
                    />
                  </div>
                  {validation.password.isValid && (
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-green-700 font-medium">Password meets all requirements!</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {validation.password.message && !form.password && (
                <p className={`mt-2 text-sm ${
                  validation.password.isValid ? 'text-green-600' : 'text-red-600'
                }`}>
                  {validation.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-300 transform ${
                isFormValid && !isLoading
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg hover:scale-105'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                validation.username.message && validation.username.message.includes('Network error') 
                  ? 'Create Account (Username check unavailable)'
                  : 'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-600 hover:text-purple-700 font-semibold transition-colors duration-200">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-6 text-gray-500 text-sm">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Secure
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Privacy
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}


