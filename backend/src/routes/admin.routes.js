import { Router } from 'express';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { Team } from '../models/Team.js';
import { Invite } from '../models/Invite.js';

const router = Router();

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get all events
router.get('/events', async (req, res) => {
  try {
    const events = await Event.find({})
      .populate('organizer', 'name email')
      .populate('participants', 'name email')
      .sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// Get all teams
router.get('/teams', async (req, res) => {
  try {
    const teams = await Team.find({})
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch teams' });
  }
});

// Get all invites
router.get('/invites', async (req, res) => {
  try {
    const invites = await Invite.find({})
      .populate('team', 'name')
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(invites);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch invites' });
  }
});

// Get admin analytics
router.get('/analytics', async (req, res) => {
  try {
    const [
      totalUsers,
      totalEvents,
      totalTeams,
      totalInvites,
      activeUsers,
      recentRegistrations
    ] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Team.countDocuments(),
      Invite.countDocuments({ status: 'pending' }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
    ]);

    res.json({
      totalUsers,
      totalEvents,
      totalTeams,
      totalInvites,
      activeUsers,
      recentRegistrations
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// Activate/Deactivate user
router.post('/users/:userId/:action', async (req, res) => {
  try {
    const { userId, action } = req.params;
    
    if (!['activate', 'deactivate'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: action === 'activate' },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: `User ${action}d successfully`, user });
  } catch (error) {
    res.status(500).json({ message: `Failed to ${req.params.action} user` });
  }
});

// Delete user
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Delete user's events
    await Event.deleteMany({ organizer: userId });
    
    // Remove user from teams
    await Team.updateMany(
      { members: userId },
      { $pull: { members: userId } }
    );
    
    // Delete teams owned by user
    await Team.deleteMany({ owner: userId });
    
    // Delete user's invites
    await Invite.deleteMany({ invitedBy: userId });
    
    // Finally delete the user
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Get user details with all related data
router.get('/users/:userId/details', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [user, events, joinedEvents, teams, invites] = await Promise.all([
      User.findById(userId).select('-password'),
      Event.find({ organizer: userId }).populate('participants', 'name email'),
      Event.find({ participants: userId }).populate('organizer', 'name email'),
      Team.find({ 
        $or: [
          { owner: userId },
          { members: userId }
        ]
      }).populate('owner', 'name email').populate('members', 'name email'),
      Invite.find({ invitedBy: userId }).populate('team', 'name')
    ]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user,
      events,
      joinedEvents,
      teams,
      invites
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user details' });
  }
});

export default router;
