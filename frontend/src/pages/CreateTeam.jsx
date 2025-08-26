import React, { useState } from 'react'
import api from '../lib/api.js'
import { useNavigate } from 'react-router-dom'

export default function CreateTeam() {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/teams', { name })
      navigate('/teams')
    } catch (e) {
      setError('Failed to create team')
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Create Team</h1>
      {error && <div className="text-red-600 mb-3">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border px-3 py-2 rounded" placeholder="Team name" value={name} onChange={(e)=>setName(e.target.value)} />
        <button className="w-full bg-blue-600 text-white py-2 rounded" type="submit">Create</button>
      </form>
    </div>
  )
}


