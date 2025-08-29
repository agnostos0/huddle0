import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import confetti from 'canvas-confetti';
import Navbar from '../components/Navbar.jsx';
import ApiTest from '../components/ApiTest.jsx';
import api from '../lib/api.js';


export default function Register() {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    gender: 'male',
    role: 'user'
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordCriteria, setPasswordCriteria] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false
  });
  const [usernameCriteria, setUsernameCriteria] = useState({
    minLength: false,
    noSpaces: false,
    noCapital: false,
    validChars: false,
    isAvailable: false
  });
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  const testUsername = async () => {
    setDebugInfo('Testing username availability...')
    const result = await testUsernameAvailability('testuser')
    setDebugInfo(JSON.stringify(result, null, 2))
  }

  const testDebug = async () => {
    setDebugInfo('Testing debug usernames...')
    const result = await testDebugUsernames()
    setDebugInfo(JSON.stringify(result, null, 2))
  }

  const testApiCall = async () => {
    setDebugInfo('Testing API call...')
    try {
      const response = await api.get('/auth/check-username/testuser')
      setDebugInfo(`API call successful: ${JSON.stringify(response.data, null, 2)}`)
    } catch (error) {
      setDebugInfo(`API call failed: ${error.message}\n${JSON.stringify(error.response?.data, null, 2)}`)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setIsGoogleLoading(true)

    try {
      const result = await loginWithGoogle()
      
      if (result.success) {
        // Navigate based on user role
        if (result.user.role === 'admin') {
          navigate('/admin-dashboard')
        } else if (result.user.role === 'organizer') {
          navigate('/organizer-dashboard')
        } else {
          navigate('/dashboard')
        }
      } else {
        setError(result.message || 'Google sign-in failed')
      }
    } catch (err) {
      console.error('Google sign-in error:', err)
      setError(err.message || 'Google sign-in failed. Please try again.')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Update password criteria when password changes
    if (name === 'password') {
      setPasswordCriteria({
        minLength: value.length >= 8,
        hasUppercase: /[A-Z]/.test(value),
        hasLowercase: /[a-z]/.test(value),
        hasNumber: /\d/.test(value),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(value)
      });
    }
    
    // Update username criteria when username changes
    if (name === 'username') {
      const username = value.toLowerCase(); // Convert to lowercase
      setFormData(prev => ({ ...prev, username })); // Update with lowercase
      
      // Basic validation
      const isValid = username.length >= 3 && !/\s/.test(username) && /^[a-z0-9_]+$/.test(username);
      
      setUsernameCriteria(prev => ({
        minLength: username.length >= 3,
        noSpaces: !/\s/.test(username),
        noCapital: !/[A-Z]/.test(username),
        validChars: /^[a-z0-9_]+$/.test(username),
        isAvailable: prev.isAvailable // Keep previous availability status
      }));
      
      // Check username availability if basic criteria are met
      if (isValid) {
        checkUsernameAvailability(username);
      } else {
        // Reset availability if basic criteria are not met
        setUsernameCriteria(prev => ({
          ...prev,
          isAvailable: false
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!Object.values(passwordCriteria).every(Boolean)) {
      setError('Please meet all password requirements');
      return;
    }

    if (!usernameCriteria.isAvailable) {
      setError('Please choose an available username');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        gender: formData.gender,
        role: formData.role
      });

      if (result.success) {
        // Trigger confetti
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']
        });

        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkUsernameAvailability = async (username) => {
    if (username.length < 3) return;
    
    console.log('Checking username availability for:', username);
    setIsCheckingUsername(true);
    try {
      const response = await api.get(`/auth/check-username/${username}`);
      console.log('Username availability response:', response.data);
      
      setUsernameCriteria(prev => ({
        ...prev,
        isAvailable: response.data.available
      }));
    } catch (error) {
      console.error('Error checking username availability:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error message:', error.message);
      console.error('Error config:', error.config);
      
      // Only set as unavailable if it's a real error, not a network issue
      if (error.response && error.response.status === 409) {
        // Username is actually taken
        setUsernameCriteria(prev => ({
          ...prev,
          isAvailable: false
        }));
      } else {
        // Network error or other issue - don't assume unavailable
        console.log('Network error or other issue - not setting availability to false');
      }
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const UsernameChecklistItem = ({ met, text, loading = false }) => (
    <div className={`flex items-center space-x-2 text-sm ${met ? 'text-green-600' : 'text-gray-500'}`}>
      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
        met ? 'border-green-500 bg-green-500' : 'border-gray-300'
      }`}>
        {loading ? (
          <div className="w-2 h-2 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        ) : met ? (
          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : null}
      </div>
      <span>{text}</span>
    </div>
  );

  const PasswordChecklistItem = ({ met, text }) => (
    <div className={`flex items-center space-x-2 text-sm ${met ? 'text-green-600' : 'text-gray-500'}`}>
      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
        met ? 'border-green-500 bg-green-500' : 'border-gray-300'
      }`}>
        {met && (
          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      <span>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Navbar />
      
      <div className="max-w-md mx-auto pt-20 pb-10 px-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">🚀</span>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Join Huddle
            </h2>
            <p className="text-gray-600 mt-2">Create your account and start exploring events</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                required
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                placeholder="Choose a username (lowercase, no spaces)"
                required
              />
              
              {/* Username Availability Status */}
              {formData.username.length > 0 && (
                <div className="mt-3">
                  {isCheckingUsername ? (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Checking availability...</span>
                    </div>
                  ) : usernameCriteria.isAvailable ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium">Username is available! ✅</span>
                    </div>
                  ) : formData.username.length >= 3 && usernameCriteria.validChars && !usernameCriteria.isAvailable && !isCheckingUsername ? (
                    <div className="flex items-center space-x-2 text-red-600">
                      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium">Username is not available ❌</span>
                    </div>
                  ) : null}
                </div>
              )}
              
              {/* Username Requirements */}
              {formData.username.length > 0 && (
                <div className="mt-3 space-y-2">
                  <UsernameChecklistItem met={usernameCriteria.minLength} text="At least 3 characters" />
                  <UsernameChecklistItem met={usernameCriteria.noSpaces} text="No spaces" />
                  <UsernameChecklistItem met={usernameCriteria.noCapital} text="Lowercase only" />
                  <UsernameChecklistItem met={usernameCriteria.validChars} text="Letters, numbers, and underscores only" />
                  {formData.username.length >= 3 && usernameCriteria.validChars && (
                    <UsernameChecklistItem 
                      met={usernameCriteria.isAvailable} 
                      text="Username is available" 
                      loading={isCheckingUsername}
                    />
                  )}
                </div>
              )}
            </div>



            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  placeholder="Create a strong password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
              
              {/* Password Requirements */}
              <div className="mt-3 space-y-2">
                <PasswordChecklistItem met={passwordCriteria.minLength} text="At least 8 characters" />
                <PasswordChecklistItem met={passwordCriteria.hasUppercase} text="One uppercase letter" />
                <PasswordChecklistItem met={passwordCriteria.hasLowercase} text="One lowercase letter" />
                <PasswordChecklistItem met={passwordCriteria.hasNumber} text="One number" />
                <PasswordChecklistItem met={passwordCriteria.hasSpecial} text="One special character" />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
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
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform border-2 mt-4 ${
              !isGoogleLoading
                ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:shadow-lg hover:scale-105'
                : 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed'
            }`}
          >
            {isGoogleLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                Signing in with Google...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </div>
            )}
          </button>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="text-purple-600 hover:text-purple-700 font-medium">
                Sign in here
              </a>
            </p>
          </div>


        </div>
      </div>
    </div>
  );
}


