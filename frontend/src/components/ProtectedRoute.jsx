import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { token, user } = useAuth();

  // Check if user is authenticated
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If no specific role is required, allow access
  if (!requiredRole) {
    return children;
  }

  // Check if user has the required role
  if (user && user.role) {
    // Admin has access to everything
    if (user.role === 'admin') {
      return children;
    }

    // Organizer has access to organizer routes
    if (requiredRole === 'organizer' && (user.role === 'organizer' || user.role === 'admin')) {
      return children;
    }

    // User role check
    if (requiredRole === 'user' && user.role) {
      return children;
    }
  }

  // If user doesn't have the required role, redirect to appropriate dashboard
  if (user && user.role === 'admin') {
    return <Navigate to="/admin-dashboard" replace />;
  } else if (user && user.role === 'organizer') {
    return <Navigate to="/organizer-dashboard" replace />;
  } else {
    return <Navigate to="/dashboard" replace />;
  }
};

export default ProtectedRoute;
