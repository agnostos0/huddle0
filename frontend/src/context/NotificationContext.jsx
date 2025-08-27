import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';
import api from '../lib/api.js';
import NotificationPopup from '../components/NotificationPopup.jsx';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPopup, setCurrentPopup] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load notifications
  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [notificationsRes, unreadRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count')
      ]);
      
      setNotifications(notificationsRes.data);
      setUnreadCount(unreadRes.data.count);
      
      // Show popup for first unread team invitation
      const unreadInvitation = notificationsRes.data.find(
        n => !n.isRead && n.type === 'team_invitation' && n.isAccepted === null
      );
      
      if (unreadInvitation && !currentPopup) {
        setCurrentPopup(unreadInvitation);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Accept invitation
  const acceptInvitation = async (notification) => {
    try {
      await api.post(`/notifications/${notification._id}/accept`);
      
      // Update notification in state
      setNotifications(prev => 
        prev.map(n => n._id === notification._id 
          ? { ...n, isAccepted: true, isRead: true } 
          : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      setCurrentPopup(null);
      
      // Reload notifications to get updated data
      await loadNotifications();
      
      return true;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return false;
    }
  };

  // Decline invitation
  const declineInvitation = async (notification) => {
    try {
      await api.post(`/notifications/${notification._id}/decline`);
      
      // Update notification in state
      setNotifications(prev => 
        prev.map(n => n._id === notification._id 
          ? { ...n, isAccepted: false, isRead: true } 
          : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      setCurrentPopup(null);
      
      return true;
    } catch (error) {
      console.error('Error declining invitation:', error);
      return false;
    }
  };



  // Load notifications when user changes
  useEffect(() => {
    if (user) {
      loadNotifications();
      
      // Set up polling for new notifications
      const interval = setInterval(loadNotifications, 30000); // Check every 30 seconds
      
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setCurrentPopup(null);
    }
  }, [user]);

  const value = {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    acceptInvitation,
    declineInvitation
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Notification Popup */}
      {currentPopup && (
        <NotificationPopup
          notification={currentPopup}
          onAccept={acceptInvitation}
          onDecline={declineInvitation}
        />
      )}
    </NotificationContext.Provider>
  );
};
