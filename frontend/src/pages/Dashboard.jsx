import { useEffect, useState } from 'react'
import api from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { user } = useAuth()
  const [myEvents, setMyEvents] = useState([])
  const [joinedEvents, setJoinedEvents] = useState([])

  useEffect(() => {
    async function fetchData() {
      const [mine, joined] = await Promise.all([
        api.get(`/users/${user.id}/events`),
        api.get(`/users/${user.id}/joined`),
      ])
      setMyEvents(mine.data)
      setJoinedEvents(joined.data)
    }
    if (user?.id) fetchData()
  }, [user])

  return (
    <div className="grid md:grid-cols-2 gap-6">
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
    </div>
  )
}


