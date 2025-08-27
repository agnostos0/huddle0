import { Router } from 'express';
import { Team } from '../models/Team.js';
import { User } from '../models/User.js';
import { Invite } from '../models/Invite.js';
import { Notification } from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Create a team
router.post('/', authenticate, async (req, res) => {
  const { name, members } = req.body;
  const team = await Team.create({ name, owner: req.user.id, members: members || [req.user.id] });
  res.status(201).json(team);
});

// My teams (owned or member)
router.get('/mine', authenticate, async (req, res) => {
  const teams = await Team.find({ $or: [{ owner: req.user.id }, { members: req.user.id }] })
    .populate('owner', 'name')
    .populate('members', 'name');
  res.json(teams);
});

// Get all teams (for event joining)
router.get('/', authenticate, async (req, res) => {
  const teams = await Team.find({ members: req.user.id })
    .populate('owner', 'name')
    .populate('members', 'name');
  res.json(teams);
});

// Debug route to check all users (for testing)
router.get('/debug/users', authenticate, async (req, res) => {
  try {
    const users = await User.find({}).select('username name email').limit(20);
    res.json({ 
      totalUsers: users.length,
      users: users 
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
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

// Search users by username for team invitation
router.get('/search-users/:username', authenticate, async (req, res) => {
  try {
    const { username } = req.params;
    const { teamId } = req.query;

    console.log('Searching for username:', username);
    console.log('Team ID:', teamId);

    if (!username || username.length < 2) {
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

    // Search users by username (excluding current user and team members)
    const users = await User.find({
      username: { $regex: username, $options: 'i' },
      _id: { 
        $nin: [req.user.id, ...excludeUsers]
      }
    })
    .select('name username email bio socialLinks')
    .limit(10);

    console.log('Found users:', users.length);
    console.log('Users:', users.map(u => ({ username: u.username, name: u.name })));

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
      return res.status(400).json({ message: 'User is already a team member' });
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


