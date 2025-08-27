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
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      console.log('AuthContext: Fetching user data...');
      const response = await api.get('/auth/me');
      console.log('AuthContext: User data received:', response.data);
      setUser(response.data.user);
    } catch (error) {
      console.error('AuthContext: Error fetching user:', error);
      // Only logout if it's a 401 error (unauthorized)
      if (error.response?.status === 401) {
        console.log('AuthContext: Unauthorized, logging out');
        logout();
      } else {
        console.log('AuthContext: Other error, not logging out');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailOrUsername, password) => {
    try {
      console.log('AuthContext: Attempting login API call')
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
        return '/attendee-dashboard';
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


