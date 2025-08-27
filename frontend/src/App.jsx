import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AttendeeDashboard from './pages/AttendeeDashboard.jsx';
import OrganizerDashboard from './pages/OrganizerDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import CreateEvent from './pages/CreateEvent.jsx';
import CreateTeam from './pages/CreateTeam.jsx';
import EventDetails from './pages/EventDetails.jsx';
import Teams from './pages/Teams.jsx';
import InviteAccept from './pages/InviteAccept.jsx';
import EventsMap from './pages/EventsMap.jsx';
import ExploreEvents from './pages/ExploreEvents.jsx';
import AdminAccessGuide from './components/AdminAccessGuide.jsx';
import UserProfile from './pages/UserProfile.jsx';

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Initializing..." />;
  }

  return (
    <div className="App">
      <AdminAccessGuide />
      <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/invite/:token" element={<InviteAccept />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/attendee-dashboard" element={
            <ProtectedRoute>
              <AttendeeDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/organizer-dashboard" element={
            <ProtectedRoute requiredRole="organizer">
              <OrganizerDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/admin-dashboard" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/create-event" element={
            <ProtectedRoute>
              <CreateEvent />
            </ProtectedRoute>
          } />
          
          <Route path="/event/:id" element={<EventDetails />} />
          <Route path="/event/:id/edit" element={
            <ProtectedRoute requiredRole="organizer">
              <CreateEvent />
            </ProtectedRoute>
          } />
          
          <Route path="/teams" element={
            <ProtectedRoute>
              <Teams />
            </ProtectedRoute>
          } />
          
          <Route path="/teams/create" element={
            <ProtectedRoute>
              <CreateTeam />
            </ProtectedRoute>
          } />
          
          <Route path="/events/map" element={<EventsMap />} />
          <Route path="/explore" element={<ExploreEvents />} />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          } />
          
          {/* Redirect to dashboard if authenticated, otherwise to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;


