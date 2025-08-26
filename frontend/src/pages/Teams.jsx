import React, { useEffect, useState } from 'react'
import api from '../lib/api.js'

export default function Teams() {
  const [teams, setTeams] = useState([])
  const [error, setError] = useState('')
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [showManualForm, setShowManualForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [pendingInvites, setPendingInvites] = useState([])
  const [manualForm, setManualForm] = useState({ name: '', email: '', bio: '', socialLinks: { linkedin: '', twitter: '', github: '', website: '' } })

  async function load() {
    try {
      const { data } = await api.get('/teams/mine')
      setTeams(data)
    } catch (e) {
      setError('Failed to load teams')
    }
  }

  async function loadTeamDetails(teamId) {
    try {
      const { data } = await api.get(`/teams/${teamId}`)
      setSelectedTeam(data)
      
      // Load pending invites for this team
      try {
        const invitesResponse = await api.get(`/invites/teams/${teamId}/invites`)
        setPendingInvites(invitesResponse.data)
      } catch (e) {
        console.log('No pending invites or error loading invites')
        setPendingInvites([])
      }
    } catch (e) {
      setError('Failed to load team details')
    }
  }

  async function inviteMember(teamId) {
    try {
      await api.post(`/invites/teams/${teamId}/invite`, { 
        email: inviteEmail, 
        invitedName: inviteName || inviteEmail.split('@')[0] 
      })
      setInviteEmail('')
      setInviteName('')
      setShowInviteForm(false)
      setError('') // Clear any previous errors
      await loadTeamDetails(teamId) // Reload to show new invite
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to send invitation')
    }
  }

  async function addManualMember(teamId) {
    try {
      await api.post(`/teams/${teamId}/members/manual`, manualForm)
      setManualForm({ name: '', email: '', bio: '', socialLinks: { linkedin: '', twitter: '', github: '', website: '' } })
      setShowManualForm(false)
      await loadTeamDetails(teamId)
      await load()
    } catch (e) {
      setError('Failed to add member')
    }
  }

  async function removeMember(teamId, userId) {
    try {
      await api.delete(`/teams/${teamId}/members/${userId}`)
      await loadTeamDetails(teamId)
      await load()
    } catch (e) {
      setError('Failed to remove member')
    }
  }

  async function resendInvite(inviteId) {
    try {
      await api.post(`/invites/${inviteId}/resend`)
      setError('') // Clear any previous errors
      alert('Invitation resent successfully!')
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to resend invitation')
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">My Teams</h1>
        <a href="/teams/create" className="bg-blue-600 text-white px-3 py-2 rounded">Create Team</a>
      </div>
      {error && <div className="text-red-600 mb-3">{error}</div>}
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-3">Teams List</h2>
          <div className="space-y-3">
            {teams.map(team => (
              <div key={team._id} className="bg-white p-4 rounded shadow cursor-pointer hover:shadow-md" onClick={() => loadTeamDetails(team._id)}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{team.name}</h3>
                    <p className="text-sm text-gray-600">Owner: {team.owner?.name || 'You'}</p>
                    <p className="text-sm text-gray-600">{team.members?.length || 0} members</p>
                  </div>
                </div>
              </div>
            ))}
            {teams.length === 0 && <div className="text-gray-600">You have no teams yet.</div>}
          </div>
        </div>

        {selectedTeam && (
          <div className="bg-white p-6 rounded shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{selectedTeam.name}</h2>
              <div className="flex gap-2">
                <button onClick={() => setShowInviteForm(!showInviteForm)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Invite</button>
                <button onClick={() => setShowManualForm(!showManualForm)} className="bg-purple-600 text-white px-3 py-1 rounded text-sm">Add Manual</button>
              </div>
            </div>

            {showInviteForm && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <input 
                  className="w-full border px-3 py-2 rounded mb-2" 
                  placeholder="Enter email to invite" 
                  value={inviteEmail} 
                  onChange={(e) => setInviteEmail(e.target.value)} 
                />
                <input 
                  className="w-full border px-3 py-2 rounded mb-2" 
                  placeholder="Name (optional)" 
                  value={inviteName} 
                  onChange={(e) => setInviteName(e.target.value)} 
                />
                <div className="flex gap-2">
                  <button onClick={() => inviteMember(selectedTeam._id)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Send Invite</button>
                  <button onClick={() => setShowInviteForm(false)} className="bg-gray-600 text-white px-3 py-1 rounded text-sm">Cancel</button>
                </div>
              </div>
            )}

            {showManualForm && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <input className="w-full border px-3 py-2 rounded mb-2" placeholder="Name" value={manualForm.name} onChange={(e) => setManualForm({...manualForm, name: e.target.value})} />
                <input className="w-full border px-3 py-2 rounded mb-2" placeholder="Email" value={manualForm.email} onChange={(e) => setManualForm({...manualForm, email: e.target.value})} />
                <textarea className="w-full border px-3 py-2 rounded mb-2" placeholder="Bio" value={manualForm.bio} onChange={(e) => setManualForm({...manualForm, bio: e.target.value})} />
                <input className="w-full border px-3 py-2 rounded mb-2" placeholder="LinkedIn" value={manualForm.socialLinks.linkedin} onChange={(e) => setManualForm({...manualForm, socialLinks: {...manualForm.socialLinks, linkedin: e.target.value}})} />
                <input className="w-full border px-3 py-2 rounded mb-2" placeholder="Twitter" value={manualForm.socialLinks.twitter} onChange={(e) => setManualForm({...manualForm, socialLinks: {...manualForm.socialLinks, twitter: e.target.value}})} />
                <input className="w-full border px-3 py-2 rounded mb-2" placeholder="GitHub" value={manualForm.socialLinks.github} onChange={(e) => setManualForm({...manualForm, socialLinks: {...manualForm.socialLinks, github: e.target.value}})} />
                <input className="w-full border px-3 py-2 rounded mb-2" placeholder="Website" value={manualForm.socialLinks.website} onChange={(e) => setManualForm({...manualForm, socialLinks: {...manualForm.socialLinks, website: e.target.value}})} />
                <div className="flex gap-2">
                  <button onClick={() => addManualMember(selectedTeam._id)} className="bg-purple-600 text-white px-3 py-1 rounded text-sm">Add Member</button>
                  <button onClick={() => setShowManualForm(false)} className="bg-gray-600 text-white px-3 py-1 rounded text-sm">Cancel</button>
                </div>
              </div>
            )}

            {/* Pending Invitations */}
            {pendingInvites.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2 text-orange-600">Pending Invitations</h3>
                <div className="space-y-2">
                  {pendingInvites.map(invite => (
                    <div key={invite._id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded">
                      <div>
                        <p className="font-medium">{invite.invitedName || invite.email.split('@')[0]}</p>
                        <p className="text-sm text-gray-600">{invite.email}</p>
                        <p className="text-xs text-orange-600">Sent: {new Date(invite.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Pending</span>
                        <button 
                          onClick={() => resendInvite(invite._id)} 
                          className="text-blue-600 text-sm hover:text-blue-800"
                        >
                          Resend
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h3 className="font-semibold mb-2">Members</h3>
            <div className="space-y-2">
              {selectedTeam.members?.map(member => (
                <div key={member._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-gray-600">{member.email}</p>
                  </div>
                  {selectedTeam.owner?._id === member._id ? (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Owner</span>
                  ) : (
                    <button onClick={() => removeMember(selectedTeam._id, member._id)} className="text-red-600 text-sm">Remove</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
