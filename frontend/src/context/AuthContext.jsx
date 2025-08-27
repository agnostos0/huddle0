import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        console.log('AuthContext: Initializing...');
        
        // Get stored user data
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            console.log('AuthContext: User loaded from storage:', parsedUser.name);
          } catch (e) {
            console.log('AuthContext: Invalid stored user data, clearing');
            localStorage.removeItem('user');
          }
        }
        
        setLoading(false);
        console.log('AuthContext: Initialization complete');
      } catch (error) {
        console.error('AuthContext: Error during initialization:', error);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []); // Only run once on mount



  const login = async (emailOrUsername, password) => {
    try {
      console.log('AuthContext: Attempting login API call')
      console.log('AuthContext: API base URL:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api')
      console.log('AuthContext: Login payload:', { emailOrUsername, password })
      
      const response = await api.post('/auth/login', { emailOrUsername, password });
      console.log('AuthContext: Login API response:', response.data);
      
      const { token: newToken, user: userData } = response.data;
      
      console.log('AuthContext: Setting token and user')
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log('AuthContext: Login successful, returning success')
      return { success: true, user: userData };
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token: newToken, user: userInfo } = response.data;
      
      setToken(newToken);
      setUser(userInfo);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userInfo));
      
      return { success: true, user: userInfo };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    console.log('AuthContext: Logging out user');
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };



  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    
    const permissions = {
      user: ['view_events', 'join_events', 'create_teams', 'join_teams'],
      organizer: ['view_events', 'join_events', 'create_teams', 'join_teams', 'create_events', 'manage_own_events', 'view_own_analytics'],
      admin: ['view_events', 'join_events', 'create_teams', 'join_teams', 'create_events', 'manage_own_events', 'view_own_analytics', 'manage_all_events', 'manage_users', 'manage_teams', 'view_all_analytics', 'moderate_content']
    };
    
    return permissions[user.role]?.includes(permission) || false;
  };

  const isOrganizer = () => {
    return user && (user.role === 'organizer' || user.role === 'admin');
  };

  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  const getDashboardRoute = () => {
    if (!user) return '/login';
    
    switch (user.role) {
      case 'admin':
        return '/admin-dashboard';
      case 'organizer':
        return '/organizer-dashboard';
      default:
        return '/dashboard';
    }
  };

  const value = {
    token,
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    hasPermission,
    isOrganizer,
    isAdmin,
    getDashboardRoute
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


