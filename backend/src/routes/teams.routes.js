import { Router } from 'express';
import { Team } from '../models/Team.js';
import { User } from '../models/User.js';
import { Invite } from '../models/Invite.js';
import { Notification } from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Create a team
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description, members, leader } = req.body;
    const team = await Team.create({ 
      name, 
      description,
      owner: req.user.id, 
      leader: leader || req.user.id, // Default leader is the creator
      members: members || [req.user.id] 
    });
    
    const populatedTeam = await Team.findById(team._id)
      .populate('owner', 'name')
      .populate('leader', 'name')
      .populate('members', 'name');
    
    res.status(201).json(populatedTeam);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ message: 'Failed to create team' });
  }
});

// My teams (owned or member)
router.get('/mine', authenticate, async (req, res) => {
  const teams = await Team.find({ $or: [{ owner: req.user.id }, { members: req.user.id }] })
    .populate('owner', 'name')
    .populate('members', 'name');
  res.json(teams);
});

// Get all teams (for event joining) - only show approved teams
router.get('/', authenticate, async (req, res) => {
  try {
    // Get teams where user is a member
    const userTeams = await Team.find({ members: req.user.id })
      .populate('owner', 'name')
      .populate('leader', 'name')
      .populate('members', 'name');
    
    // Get all approved teams (for joining events)
    const allTeams = await Team.find({ status: 'approved' })
      .populate('owner', 'name')
      .populate('leader', 'name')
      .populate('members', 'name')
      .limit(50); // Limit to prevent performance issues
    
    res.json({
      userTeams,
      allTeams
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ message: 'Failed to fetch teams' });
  }
});

// Get all teams (admin only) - includes pending and rejected
router.get('/admin/all', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const teams = await Team.find()
      .populate('owner', 'name email')
      .populate('leader', 'name email')
      .populate('members', 'name email')
      .populate('approvedBy', 'name')
      .populate('joinRequests.userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(teams);
  } catch (error) {
    console.error('Admin teams fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch teams' });
  }
});

// Get pending teams (admin only)
router.get('/admin/pending', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const teams = await Team.find({ status: 'pending' })
      .populate('owner', 'name email')
      .populate('leader', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });
    res.json(teams);
  } catch (error) {
    console.error('Pending teams fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch pending teams' });
  }
});

// Debug route to check all users (for testing)
router.get('/debug/users', authenticate, async (req, res) => {
  try {
    const allUsers = await User.find({}).select('username name email _id').limit(20);
    const currentUser = await User.findById(req.user.id).select('username name email _id');
    
    console.log('Current user:', currentUser);
    console.log('All users in database:', allUsers.length);
    console.log('Users:', allUsers.map(u => ({ id: u._id, username: u.username, email: u.email, name: u.name })));
    
    res.json({ 
      currentUser,
      totalUsers: allUsers.length,
      users: allUsers,
      message: 'Debug info logged to console'
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

// Get team details with full member profiles
router.get('/:id', authenticate, async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate('owner', 'name email bio socialLinks')
    .populate('members', 'name email bio socialLinks');
  if (!team) return res.status(404).json({ message: 'Team not found' });
  res.json(team);
});

// Note: Email invitations are now handled by /api/invites/teams/:teamId/invite

// Add member manually with details
router.post('/:id/members/manual', authenticate, async (req, res) => {
  const { name, email, bio, socialLinks } = req.body;
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  if (team.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  
  // Create new user or find existing
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ 
      name, 
      email, 
      password: 'temp-password-' + Date.now(), // temporary password
      bio,
      socialLinks
    });
  }
  
  if (!team.members.some(m => m.toString() === user._id.toString())) {
    team.members.push(user._id);
    await team.save();
  }
  
  res.json(team);
});

// Add member (owner only)
router.post('/:id/members', authenticate, async (req, res) => {
  const { userId } = req.body;
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  if (team.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  if (!team.members.some((m) => m.toString() === userId)) team.members.push(userId);
  await team.save();
  res.json(team);
});

// Remove member (owner only)
router.delete('/:id/members/:userId', authenticate, async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  if (team.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  team.members = team.members.filter((m) => m.toString() !== req.params.userId);
  await team.save();
  res.json(team);
});

// Delete team (owner only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    if (team.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only team owner can delete the team' });
    }

    // Delete all invites for this team
    await Invite.deleteMany({ team: req.params.id });
    
    // Delete the team
    await Team.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ message: 'Failed to delete team' });
  }
});

// Search users by username or email for team invitation
router.get('/search-users/:query', authenticate, async (req, res) => {
  try {
    const { query } = req.params;
    const { teamId } = req.query;

    console.log('Searching for query:', query);
    console.log('Team ID:', teamId);

    if (!query || query.length < 2) {
      return res.json([]);
    }

    // Get team members to exclude them from search
    let excludeUsers = [];
    if (teamId) {
      const team = await Team.findById(teamId);
      if (team) {
        excludeUsers = team.members.map(m => m.toString());
      }
    }

    console.log('Excluding users:', excludeUsers);

    // First, let's search without exclusions to see what we find
    const allMatchingUsers = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
    .select('name username email bio socialLinks _id')
    .limit(20);

    console.log('All matching users before exclusions:', allMatchingUsers.length);
    console.log('Matching users:', allMatchingUsers.map(u => ({ id: u._id, username: u.username, email: u.email, name: u.name })));

    // Now filter out current user and team members
    const users = allMatchingUsers.filter(user => {
      const userId = user._id.toString();
      const isCurrentUser = userId === req.user.id;
      const isTeamMember = excludeUsers.includes(userId);
      
      if (isCurrentUser) {
        console.log('Excluding current user:', user.username || user.email);
      }
      if (isTeamMember) {
        console.log('Excluding team member:', user.username || user.email);
      }
      
      return !isCurrentUser && !isTeamMember;
    });

    console.log('Final filtered users:', users.length);

    console.log('Found users:', users.length);
    console.log('Users:', users.map(u => ({ username: u.username, email: u.email, name: u.name })));

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Failed to search users' });
  }
});

// Invite user by username
router.post('/:id/invite-by-username', authenticate, async (req, res) => {
  try {
    const { username, reason } = req.body;
    const teamId = req.params.id;

    if (!username || !username.trim()) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // Check if team exists and user is owner
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only team owner can send invitations' });
    }

    // Find user by username (case insensitive)
    const user = await User.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    });
    
    if (!user) {
      return res.status(404).json({ message: `User with username "${username}" not found` });
    }

    // Check if user is already a member
    if (team.members.some(m => m.toString() === user._id.toString())) {
      return res.status(400).json({ message: 'You are already a member of this team' });
    }

    // Check if invite already exists
    const existingInvite = await Invite.findOne({
      team: teamId,
      email: user.email,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (existingInvite) {
      return res.status(400).json({ message: 'Invitation already sent to this user' });
    }

    // Create new invite
    const invite = await Invite.create({
      team: teamId,
      email: user.email,
      invitedName: user.name,
      token: require('crypto').randomBytes(32).toString('hex'),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      invitedBy: req.user.id,
    });

    // Create notification for the invited user
    await Notification.create({
      recipient: user._id,
      sender: req.user.id,
      type: 'team_invitation',
      title: `Team Invitation: ${team.name}`,
      message: reason || `${req.user.name} has invited you to join their team "${team.name}"`,
      data: {
        teamId: teamId,
        inviteId: invite._id
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // Send email with reason
    try {
      const { sendInviteEmail } = await import('../utils/email.js');
      await sendInviteEmail(invite, team.name, req.user.name, reason);
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({ 
      message: 'Invitation sent successfully',
      invite: {
        id: invite._id,
        email: invite.email,
        invitedName: invite.invitedName,
        expiresAt: invite.expiresAt,
        status: invite.status,
      }
    });
  } catch (error) {
    console.error('Error inviting user by username:', error);
    res.status(500).json({ message: 'Failed to send invitation. Please try again.' });
  }
});

export default router;


