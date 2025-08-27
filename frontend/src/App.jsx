import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CreateEvent from './pages/CreateEvent.jsx'
import EventDetails from './pages/EventDetails.jsx'
import Teams from './pages/Teams.jsx'
import CreateTeam from './pages/CreateTeam.jsx'
import InviteAccept from './pages/InviteAccept.jsx'
import Events from './pages/Events.jsx'
import EventsMap from './pages/EventsMap.jsx'
import ExploreEvents from './pages/ExploreEvents.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminAccessGuide from './components/AdminAccessGuide.jsx'
import Navbar from './components/Navbar.jsx'

function ProtectedRoute({ children }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/map" element={<EventsMap />} />
          <Route path="/explore" element={<ExploreEvents />} />
          <Route path="/invite/:token" element={<InviteAccept />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/create" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
          <Route path="/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
          <Route path="/teams/create" element={<ProtectedRoute><CreateTeam /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/event" element={<Navigate to="/dashboard" replace />} />
          <Route path="/event/:id" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Admin Access Guide - Always visible */}
        <AdminAccessGuide />
      </div>
    </AuthProvider>
  )
}


