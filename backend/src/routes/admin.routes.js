import { Router } from 'express';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { Team } from '../models/Team.js';
import { Invite } from '../models/Invite.js';
import { signJwt } from '../utils/jwt.js';

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

// Create admin account
router.post('/create-admin', async (req, res) => {
  try {
    const { name, email, username, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }

    // Create admin user
    const adminUser = new User({
      name,
      email,
      username,
      password,
      role: 'admin'
    });

    await adminUser.save();

    res.status(201).json({
      message: 'Admin account created successfully',
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        username: adminUser.username,
        role: adminUser.role
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Failed to create admin account' });
  }
});

// Send notice and deactivate user
router.post('/users/:userId/notice', async (req, res) => {
  try {
    const { userId } = req.params;
    const { notice, deactivateAccount } = req.body;
    
    if (!notice || !notice.trim()) {
      return res.status(400).json({ message: 'Notice message is required' });
    }

    const updateData = {
      notice: notice.trim(),
      noticeDate: new Date()
    };

    if (deactivateAccount) {
      updateData.isActive = false;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send email notification to user
    try {
      const { sendNoticeEmail } = await import('../utils/email.js');
      await sendNoticeEmail(user, notice);
    } catch (emailError) {
      console.error('Failed to send notice email:', emailError);
    }

    res.json({ 
      message: 'Notice sent successfully', 
      user,
      deactivated: deactivateAccount 
    });
  } catch (error) {
    console.error('Send notice error:', error);
    res.status(500).json({ message: 'Failed to send notice' });
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

// Admin impersonation - login as any user
router.post('/impersonate/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate token for the impersonated user
    const token = signJwt({ id: user._id.toString() });
    
    res.json({ 
      message: `Now logged in as ${user.name}`,
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        username: user.username,
        email: user.email 
      } 
    });
  } catch (error) {
    console.error('Admin impersonation error:', error);
    res.status(500).json({ message: 'Failed to impersonate user' });
  }
});

// Delete event
router.delete('/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findByIdAndDelete(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Failed to delete event' });
  }
});

// Delete invite
router.delete('/invites/:inviteId', async (req, res) => {
  try {
    const { inviteId } = req.params;
    
    const invite = await Invite.findByIdAndDelete(inviteId);
    
    if (!invite) {
      return res.status(404).json({ message: 'Invite not found' });
    }

    res.json({ message: 'Invite deleted successfully' });
  } catch (error) {
    console.error('Delete invite error:', error);
    res.status(500).json({ message: 'Failed to delete invite' });
  }
});

// Withdraw invite
router.post('/invites/:inviteId/withdraw', async (req, res) => {
  try {
    const { inviteId } = req.params;
    
    const invite = await Invite.findByIdAndUpdate(
      inviteId,
      { status: 'withdrawn' },
      { new: true }
    );
    
    if (!invite) {
      return res.status(404).json({ message: 'Invite not found' });
    }

    res.json({ message: 'Invite withdrawn successfully', invite });
  } catch (error) {
    console.error('Withdraw invite error:', error);
    res.status(500).json({ message: 'Failed to withdraw invite' });
  }
});

// Clear all database data
router.delete('/clear-database', async (req, res) => {
  try {
    // Delete all data from all collections
    await Promise.all([
      User.deleteMany({}),
      Event.deleteMany({}),
      Team.deleteMany({}),
      Invite.deleteMany({})
    ]);

    res.json({ message: 'Database cleared successfully' });
  } catch (error) {
    console.error('Clear database error:', error);
    res.status(500).json({ message: 'Failed to clear database' });
  }
});

export default router;
