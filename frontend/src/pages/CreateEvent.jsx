import { useState } from 'react'
import api from '../lib/api.js'
import { useNavigate } from 'react-router-dom'

export default function CreateEvent() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '', date: '', location: '' })
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const payload = { ...form, date: new Date(form.date).toISOString() }
      const { data } = await api.post('/events', payload)
      navigate(`/event/${data._id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event')
    }
  }

  return (
    <div className="max-w-lg mx-auto bg-white p-6 mt-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Create Event</h2>
      {error && <div className="text-red-600 mb-3">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-4">
        <input className="w-full border px-3 py-2 rounded" placeholder="Title" value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})} />
        <textarea className="w-full border px-3 py-2 rounded" placeholder="Description" value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} />
        <input className="w-full border px-3 py-2 rounded" type="datetime-local" value={form.date} onChange={(e)=>setForm({...form, date:e.target.value})} />
        <input className="w-full border px-3 py-2 rounded" placeholder="Location" value={form.location} onChange={(e)=>setForm({...form, location:e.target.value})} />
        <button className="w-full bg-blue-600 text-white py-2 rounded" type="submit">Create</button>
      </form>
    </div>
  )
}


