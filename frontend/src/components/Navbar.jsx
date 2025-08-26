import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { token, setToken, setUser } = useAuth()
  const navigate = useNavigate()

  function logout() {
    setToken(null)
    setUser(null)
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold">Eventify</Link>
        <div className="flex items-center gap-4">
          <Link to="/">Home</Link>
          {token && <Link to="/dashboard">Dashboard</Link>}
          {token && <Link to="/create" className="text-white bg-blue-600 px-3 py-1.5 rounded">Create Event</Link>}
          {!token ? (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          ) : (
            <button onClick={logout} className="text-gray-700">Logout</button>
          )}
        </div>
      </div>
    </nav>
  )
}


