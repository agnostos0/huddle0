import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { setToken, setUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const { data } = await api.post('/auth/login', form)
      setToken(data.token)
      setUser(data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 mt-10 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      {error && <div className="text-red-600 mb-3">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-4">
        <input className="w-full border px-3 py-2 rounded" placeholder="Email" type="email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} />
        <input className="w-full border px-3 py-2 rounded" placeholder="Password" type="password" value={form.password} onChange={(e)=>setForm({...form, password:e.target.value})} />
        <button className="w-full bg-blue-600 text-white py-2 rounded" type="submit">Sign In</button>
      </form>
      <p className="mt-4 text-sm">No account? <Link to="/register" className="text-blue-700">Register</Link></p>
    </div>
  )
}


