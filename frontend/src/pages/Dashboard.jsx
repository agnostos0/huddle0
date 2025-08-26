import React, { useEffect, useState } from 'react'
import api from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { user } = useAuth()
  const [myEvents, setMyEvents] = useState([])
  const [joinedEvents, setJoinedEvents] = useState([])
  const [allEvents, setAllEvents] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        const [mine, joined, all] = await Promise.all([
          api.get(`/users/${user.id}/events`),
          api.get(`/users/${user.id}/joined`),
          api.get(`/events`),
        ])
        setMyEvents(mine.data)
        setJoinedEvents(joined.data)
        setAllEvents(all.data)
      } catch (e) {
        setError('Failed to load events')
      }
    }
    if (user?.id) fetchData()
  }, [user])

  async function joinEvent(eventId) {
    try {
      await api.post(`/events/${eventId}/join`)
      const [joined, all] = await Promise.all([
        api.get(`/users/${user.id}/joined`),
        api.get(`/events`),
      ])
      setJoinedEvents(joined.data)
      setAllEvents(all.data)
    } catch (e) {
      setError('Failed to join event')
    }
  }

  async function leaveEvent(eventId) {
    try {
      await api.post(`/events/${eventId}/leave`)
      const [joined, all] = await Promise.all([
        api.get(`/users/${user.id}/joined`),
        api.get(`/events`),
      ])
      setJoinedEvents(joined.data)
      setAllEvents(all.data)
    } catch (e) {
      setError('Failed to leave event')
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {error && <div className="md:col-span-2 text-red-600">{error}</div>}
      <section>
        <h2 className="text-xl font-bold mb-3">My Events</h2>
        <div className="space-y-3">
          {myEvents.map(ev => (
            <div key={ev._id} className="bg-white p-4 rounded shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold"><Link to={`/event/${ev._id}`} className="text-blue-700">{ev.title}</Link></h3>
                  <p className="text-sm text-gray-600">{new Date(ev.date).toLocaleString()} • {ev.location}</p>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-700">Participants: {ev.participants?.map(p => p.name).join(', ') || 'None'}</p>
            </div>
          ))}
          {myEvents.length === 0 && <div className="text-gray-600">No events yet. <Link to="/create" className="text-blue-700">Create one</Link>.</div>}
        </div>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">Joined Events</h2>
        <div className="space-y-3">
          {joinedEvents.map(ev => (
            <div key={ev._id} className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold"><Link to={`/event/${ev._id}`} className="text-blue-700">{ev.title}</Link></h3>
              <p className="text-sm text-gray-600">Organizer: {ev.organizer?.name || 'Unknown'}</p>
              <p className="text-sm text-gray-600">{new Date(ev.date).toLocaleString()} • {ev.location}</p>
            </div>
          ))}
          {joinedEvents.length === 0 && <div className="text-gray-600">You haven't joined any events yet.</div>}
        </div>
      </section>

      <section className="md:col-span-2">
        <h2 className="text-xl font-bold mb-3">All Events</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {allEvents
            .filter(ev => ev.organizer?._id !== user.id && ev.organizer !== user.id)
            .map(ev => {
              const isJoined = joinedEvents.some(j => j._id === ev._id)
              return (
                <div key={ev._id} className="bg-white p-4 rounded shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold"><Link to={`/event/${ev._id}`} className="text-blue-700">{ev.title}</Link></h3>
                      <p className="text-sm text-gray-600">Organizer: {ev.organizer?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">{new Date(ev.date).toLocaleString()} • {ev.location}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isJoined ? (
                        <button onClick={() => joinEvent(ev._id)} className="bg-blue-600 text-white px-3 py-1.5 rounded">Join</button>
                      ) : (
                        <button onClick={() => leaveEvent(ev._id)} className="bg-gray-700 text-white px-3 py-1.5 rounded">Leave</button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
        {allEvents.length === 0 && <div className="text-gray-600">No events available yet.</div>}
      </section>
    </div>
  )
}


