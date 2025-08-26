import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function EventDetails() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [error, setError] = useState('')
  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState('')
  const [showTeamPopup, setShowTeamPopup] = useState(false)
  const [selectedTeamDetails, setSelectedTeamDetails] = useState(null)
  const [showMemberPopup, setShowMemberPopup] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)

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

  async function joinAsTeam() {
    if (!selectedTeam) return
    try { await api.post(`/events/${id}/join`, { teamId: selectedTeam }); await load() } catch (e) { setError('Failed to join as team') }
  }

  async function showTeamDetails(teamId) {
    try {
      const { data } = await api.get(`/teams/${teamId}`)
      setSelectedTeamDetails(data)
      setShowTeamPopup(true)
    } catch (e) {
      setError('Failed to load team details')
    }
  }

  function showMemberDetails(member) {
    setSelectedMember(member)
    setShowMemberPopup(true)
  }

  useEffect(() => { 
    (async () => { 
      try { 
        const { data } = await api.get('/teams/mine'); 
        setTeams(data) 
      } catch {} 
    })() 
  }, [])

  if (!event) return <div>Loading...</div>
  const isOwner = event.organizer?._id === user?.id || event.organizer === user?.id
  const isParticipant = event.participants?.some(p => (p._id || p) === user?.id)

  // Group participants by team
  const participantsByTeam = {}
  const individualParticipants = []
  
  event.participants?.forEach(participant => {
    const team = teams.find(t => t.members?.some(m => m._id === participant._id || m === participant._id))
    if (team) {
      if (!participantsByTeam[team._id]) participantsByTeam[team._id] = { team, members: [] }
      participantsByTeam[team._id].members.push(participant)
    } else {
      individualParticipants.push(participant)
    }
  })

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
          <>
            <button onClick={join} className="bg-blue-600 text-white px-4 py-2 rounded">Join</button>
            {teams.length > 0 && (
              <div className="flex items-center gap-2">
                <select className="border px-2 py-2 rounded" value={selectedTeam} onChange={e=>setSelectedTeam(e.target.value)}>
                  <option value="">Select team</option>
                  {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
                <button onClick={joinAsTeam} className="bg-indigo-600 text-white px-4 py-2 rounded">Join as Team</button>
              </div>
            )}
          </>
        )}
      </div>

      <h3 className="font-semibold mb-2">Participants</h3>
      
      {/* Teams */}
      {Object.values(participantsByTeam).map(({ team, members }) => (
        <div key={team._id} className="mb-4 p-3 bg-blue-50 rounded">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-blue-800 cursor-pointer hover:underline" onClick={() => showTeamDetails(team._id)}>
              {team.name} ({members.length} members)
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {members.map(member => (
              <div key={member._id} className="p-2 bg-white rounded cursor-pointer hover:bg-gray-50" onClick={() => showMemberDetails(member)}>
                <p className="text-sm font-medium">{member.name}</p>
                <p className="text-xs text-gray-600">{member.email}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Individual participants */}
      {individualParticipants.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium mb-2">Individual Participants</h4>
          <div className="grid grid-cols-2 gap-2">
            {individualParticipants.map(participant => (
              <div key={participant._id} className="p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100" onClick={() => showMemberDetails(participant)}>
                <p className="text-sm font-medium">{participant.name}</p>
                <p className="text-xs text-gray-600">{participant.email}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!event.participants || event.participants.length === 0) && <p className="text-gray-600">No participants yet.</p>}

      {/* Team Details Popup */}
      {showTeamPopup && selectedTeamDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{selectedTeamDetails.name}</h2>
              <button onClick={() => setShowTeamPopup(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Owner: {selectedTeamDetails.owner?.name}</p>
            <h3 className="font-semibold mb-3">Team Members</h3>
            <div className="grid grid-cols-2 gap-3">
              {selectedTeamDetails.members?.map(member => (
                <div key={member._id} className="p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100" onClick={() => showMemberDetails(member)}>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-gray-600">{member.email}</p>
                  {member.bio && <p className="text-xs text-gray-500 mt-1">{member.bio.substring(0, 50)}...</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Member Details Popup */}
      {showMemberPopup && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{selectedMember.name}</h2>
              <button onClick={() => setShowMemberPopup(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="space-y-3">
              <p><strong>Email:</strong> {selectedMember.email}</p>
              {selectedMember.bio && <p><strong>Bio:</strong> {selectedMember.bio}</p>}
              {selectedMember.socialLinks && (
                <div>
                  <strong>Social Links:</strong>
                  <div className="mt-2 space-y-1">
                    {selectedMember.socialLinks.linkedin && (
                      <a href={selectedMember.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">LinkedIn</a>
                    )}
                    {selectedMember.socialLinks.twitter && (
                      <a href={selectedMember.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">Twitter</a>
                    )}
                    {selectedMember.socialLinks.github && (
                      <a href={selectedMember.socialLinks.github} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">GitHub</a>
                    )}
                    {selectedMember.socialLinks.website && (
                      <a href={selectedMember.socialLinks.website} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">Website</a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


