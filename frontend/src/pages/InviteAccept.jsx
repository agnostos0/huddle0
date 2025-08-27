import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../lib/api.js';

const InviteAccept = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, setToken, setUser, logout } = useAuth();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showTeamJoinForm, setShowTeamJoinForm] = useState(false);
  
  // Login form state
  const [loginForm, setLoginForm] = useState({ emailOrUsername: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Registration form state
  const [registrationForm, setRegistrationForm] = useState({ 
    name: '', 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    bio: '',
    socialLinks: { linkedin: '', twitter: '', github: '', website: '' }
  });
  const [registrationError, setRegistrationError] = useState('');
  const [registrationLoading, setRegistrationLoading] = useState(false);
  
  // Team join form state
  const [teamJoinForm, setTeamJoinForm] = useState({
    bio: '',
    socialLinks: { linkedin: '', twitter: '', github: '', website: '' }
  });
  const [teamJoinError, setTeamJoinError] = useState('');
  const [teamJoinLoading, setTeamJoinLoading] = useState(false);

  // Validation states
  const [validation, setValidation] = useState({
    username: { isValid: false, message: '' },
    password: { isValid: false, message: '' },
    email: { isValid: false, message: '' }
  });
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  useEffect(() => {
    fetchInvite();
  }, [token]);

  useEffect(() => {
    // If user is logged in and we have invite data, show team join form
    if (user && invite && !showTeamJoinForm) {
      setShowTeamJoinForm(true);
    }
  }, [user, invite]);

  const fetchInvite = async () => {
    try {
      const response = await api.get(`/invites/${token}`);
      setInvite(response.data.invite);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  // Username validation for registration
  useEffect(() => {
    const validateUsername = async () => {
      if (registrationForm.username.length < 3) {
        setValidation(prev => ({
          ...prev,
          username: { isValid: false, message: 'Username must be at least 3 characters' }
        }));
        return;
      }
      
      if (!/^[a-zA-Z0-9_]+$/.test(registrationForm.username)) {
        setValidation(prev => ({
          ...prev,
          username: { isValid: false, message: 'Username can only contain letters, numbers, and underscores' }
        }));
        return;
      }

      setIsCheckingUsername(true);
      try {
        const response = await api.get(`/auth/check-username/${registrationForm.username}`);
        setValidation(prev => ({
          ...prev,
          username: { 
            isValid: response.data.available, 
            message: response.data.message 
          }
        }));
      } catch (err) {
        setValidation(prev => ({
          ...prev,
          username: { isValid: false, message: 'Error checking username availability' }
        }));
      } finally {
        setIsCheckingUsername(false);
      }
    };

    if (registrationForm.username) {
      const timeoutId = setTimeout(validateUsername, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setValidation(prev => ({
        ...prev,
        username: { isValid: false, message: '' }
      }));
    }
  }, [registrationForm.username]);

  // Password validation
  useEffect(() => {
    const validatePassword = () => {
      const hasMinLength = registrationForm.password.length >= 6;
      const hasUpperCase = /[A-Z]/.test(registrationForm.password);
      const hasLowerCase = /[a-z]/.test(registrationForm.password);
      const hasNumber = /\d/.test(registrationForm.password);

      const isValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber;
      const message = isValid 
        ? 'Password is strong' 
        : 'Password must be at least 6 characters with uppercase, lowercase, and number';

      setValidation(prev => ({
        ...prev,
        password: { isValid, message }
      }));
    };

    if (registrationForm.password) {
      validatePassword();
    } else {
      setValidation(prev => ({
        ...prev,
        password: { isValid: false, message: '' }
      }));
    }
  }, [registrationForm.password]);

  // Email validation
  useEffect(() => {
    const validateEmail = () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(registrationForm.email);
      const message = isValid ? 'Email is valid' : 'Please enter a valid email address';

      setValidation(prev => ({
        ...prev,
        email: { isValid, message }
      }));
    };

    if (registrationForm.email) {
      validateEmail();
    } else {
      setValidation(prev => ({
        ...prev,
        email: { isValid: false, message: '' }
      }));
    }
  }, [registrationForm.email]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    
    try {
      const { data } = await api.post('/auth/login', loginForm);
      setToken(data.token);
      setUser(data.user);
      setShowLoginForm(false);
      setShowTeamJoinForm(true);
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegistration = async (e) => {
    e.preventDefault();
    setRegistrationError('');
    
    if (registrationForm.password !== registrationForm.confirmPassword) {
      setRegistrationError('Passwords do not match');
      return;
    }

    if (!validation.username.isValid || !validation.password.isValid || !validation.email.isValid) {
      setRegistrationError('Please fix the validation errors before submitting');
      return;
    }

    setRegistrationLoading(true);

    try {
      const { data } = await api.post('/auth/register', {
        name: registrationForm.name,
        username: registrationForm.username,
        email: registrationForm.email,
        password: registrationForm.password,
        bio: registrationForm.bio,
        socialLinks: registrationForm.socialLinks,
      });
      
      setToken(data.token);
      setUser(data.user);
      setShowRegistrationForm(false);
      setShowTeamJoinForm(true);
    } catch (err) {
      setRegistrationError(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegistrationLoading(false);
    }
  };

  const handleTeamJoin = async (e) => {
    e.preventDefault();
    setTeamJoinError('');
    setTeamJoinLoading(true);

    try {
      // Use the new endpoint for logged-in users
      const response = await api.post(`/invites/${token}/join`, {
        bio: teamJoinForm.bio,
        socialLinks: teamJoinForm.socialLinks,
      });

      // Redirect to dashboard with success message
      navigate('/dashboard', { 
        state: { 
          message: `Welcome to ${invite.team.name}! You've successfully joined the team.` 
        } 
      });
    } catch (err) {
      setTeamJoinError(err.response?.data?.message || 'Failed to join team');
    } finally {
      setTeamJoinLoading(false);
    }
  };

  const CheckmarkIcon = ({ isValid, isChecking }) => {
    if (isChecking) {
      return (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
      );
    }
    
    if (isValid) {
      return (
        <div className="animate-bounce">
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Invalid Invitation</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show team join form if user is logged in
  if (showTeamJoinForm && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Join Team</h2>
            <p className="text-gray-600">Complete your profile to join <strong>{invite?.team?.name}</strong></p>
          </div>

          <form onSubmit={handleTeamJoin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea
                name="bio"
                value={teamJoinForm.bio}
                onChange={(e) => setTeamJoinForm({...teamJoinForm, bio: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Tell us a bit about yourself..."
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Social Links (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['linkedin', 'twitter', 'github', 'website'].map((platform) => (
                  <div key={platform}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                      {platform}
                    </label>
                    <input
                      type="url"
                      name={`socialLinks.${platform}`}
                      value={teamJoinForm.socialLinks[platform]}
                      onChange={(e) => setTeamJoinForm({
                        ...teamJoinForm,
                        socialLinks: {
                          ...teamJoinForm.socialLinks,
                          [platform]: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder={`https://${platform}.com/yourprofile`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {teamJoinError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{teamJoinError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={teamJoinLoading}
              className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${
                teamJoinLoading
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {teamJoinLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Joining Team...
                </div>
              ) : (
                'Join Team'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Show login/register options if user is not logged in
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        {/* Header with email change and sign out options */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1"></div>
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <div className="text-sm text-gray-600">
                  Logged in as: <span className="font-medium">{user.email}</span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setShowTeamJoinForm(false);
                    setShowLoginForm(false);
                    setShowRegistrationForm(false);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Switch Account
                </button>
                <button
                  onClick={() => {
                    logout();
                    setShowTeamJoinForm(false);
                    setShowLoginForm(false);
                    setShowRegistrationForm(false);
                  }}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Team Invitation</h2>
          <p className="text-gray-600 mb-4">You've been invited to join <strong>{invite?.team?.name}</strong></p>
          <p className="text-sm text-gray-500">Please sign in or create an account to continue</p>
        </div>

        {!showLoginForm && !showRegistrationForm && (
          <div className="space-y-4">
            <button
              onClick={() => setShowLoginForm(true)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              I already have an account
            </button>
            <button
              onClick={() => setShowRegistrationForm(true)}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Create new account
            </button>
            <div className="text-center">
              <button
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
              >
                Switch to different account
              </button>
            </div>
          </div>
        )}

        {/* Login Form */}
        {showLoginForm && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Sign In</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/login')}
                  className="text-gray-600 hover:text-gray-800 text-sm"
                >
                  Switch Account
                </button>
                <button
                  onClick={() => {
                    setShowLoginForm(false);
                    setShowRegistrationForm(true);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Need an account?
                </button>
              </div>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email or Username</label>
                <input
                  type="text"
                  value={loginForm.emailOrUsername}
                  onChange={(e) => setLoginForm({...loginForm, emailOrUsername: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email or username"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {loginError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{loginError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className={`w-full py-2 rounded-lg font-medium transition-all duration-200 ${
                  loginLoading
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
              >
                {loginLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Registration Form */}
        {showRegistrationForm && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Create Account</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/login')}
                  className="text-gray-600 hover:text-gray-800 text-sm"
                >
                  Switch Account
                </button>
                <button
                  onClick={() => {
                    setShowRegistrationForm(false);
                    setShowLoginForm(true);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Already have an account?
                </button>
              </div>
            </div>
            
            <form onSubmit={handleRegistration} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={registrationForm.name}
                    onChange={(e) => setRegistrationForm({...registrationForm, name: e.target.value})}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={registrationForm.username}
                      onChange={(e) => setRegistrationForm({...registrationForm, username: e.target.value})}
                      className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                        validation.username.isValid ? 'border-green-500' : 
                        registrationForm.username && !validation.username.isValid ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Choose a username"
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={registrationForm.email}
                      onChange={(e) => setRegistrationForm({...registrationForm, email: e.target.value})}
                      className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                        validation.email.isValid ? 'border-green-500' : 
                        registrationForm.email && !validation.email.isValid ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your email"
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={registrationForm.password}
                      onChange={(e) => setRegistrationForm({...registrationForm, password: e.target.value})}
                      className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                        validation.password.isValid ? 'border-green-500' : 
                        registrationForm.password && !validation.password.isValid ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Create a password"
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={registrationForm.confirmPassword}
                  onChange={(e) => setRegistrationForm({...registrationForm, confirmPassword: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={registrationForm.bio}
                  onChange={(e) => setRegistrationForm({...registrationForm, bio: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us a bit about yourself..."
                />
              </div>

              {registrationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{registrationError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={registrationLoading || !validation.username.isValid || !validation.password.isValid || !validation.email.isValid}
                className={`w-full py-2 rounded-lg font-medium transition-all duration-200 ${
                  registrationLoading || !validation.username.isValid || !validation.password.isValid || !validation.email.isValid
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
              >
                {registrationLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteAccept;
