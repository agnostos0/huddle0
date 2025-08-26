import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function EventDetails() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [error, setError] = useState('')

  async function load() {
    const { data } = await api.get(`/events/${id}`)
    setEvent(data)
  }

  useEffect(() => { load() }, [id])

  async function join() {
    try { await api.post(`/events/${id}/join`); await load() } catch (e) { setError('Failed to join') }
  }
  async function leave() {
    try { await api.post(`/events/${id}/leave`); await load() } catch (e) { setError('Failed to leave') }
  }
  async function del() {
    try { await api.delete(`/events/${id}`); navigate('/dashboard') } catch (e) { setError('Failed to delete') }
  }

  if (!event) return <div>Loading...</div>
  const isOwner = event.organizer?._id === user?.id || event.organizer === user?.id
  const isParticipant = event.participants?.some(p => (p._id || p) === user?.id)

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
      {error && <div className="text-red-600 mb-3">{error}</div>}
      <h1 className="text-3xl font-bold">{event.title}</h1>
      <p className="text-gray-600 mb-2">{new Date(event.date).toLocaleString()} • {event.location}</p>
      <p className="mb-4">{event.description}</p>
      <p className="mb-4 text-sm">Organizer: {event.organizer?.name || 'Unknown'}</p>

      <div className="flex gap-3 mb-6">
        {isOwner ? (
          <button onClick={del} className="bg-red-600 text-white px-4 py-2 rounded">Delete</button>
        ) : isParticipant ? (
          <button onClick={leave} className="bg-gray-700 text-white px-4 py-2 rounded">Leave</button>
        ) : (
          <button onClick={join} className="bg-blue-600 text-white px-4 py-2 rounded">Join</button>
        )}
      </div>

      <h3 className="font-semibold mb-2">Participants</h3>
      <ul className="list-disc list-inside text-sm text-gray-800">
        {event.participants?.map(p => (
          <li key={p._id || p}>{p.name || p}</li>
        ))}
        {(!event.participants || event.participants.length === 0) && <li>None</li>}
      </ul>
    </div>
  )
}


