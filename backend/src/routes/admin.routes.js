import { Router } from 'express';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { Team } from '../models/Team.js';
import { Invite } from '../models/Invite.js';
import { signJwt } from '../utils/jwt.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Helper function to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify admin status' });
  }
};

// Get all users
router.get('/users', authenticate, requireAdmin, async (req, res) => {
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
router.get('/events', authenticate, requireAdmin, async (req, res) => {
  try {
    const events = await Event.find({})
      .populate('organizer', 'name email')
      .populate('participants', 'name email')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// Get pending events
router.get('/events/pending', authenticate, requireAdmin, async (req, res) => {
  try {
    const pendingEvents = await Event.find({ status: 'pending' })
      .populate('organizer', 'name email')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(pendingEvents);
  } catch (error) {
    console.error('Pending events fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch pending events' });
  }
});

// Approve event
router.post('/events/:id/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    event.status = 'approved';
    event.approvedBy = req.user.id;
    event.approvedAt = new Date();
    event.rejectionReason = undefined;

    await event.save();

    const user = await User.findById(req.user.id);
    res.json({
      message: 'Event approved successfully',
      event: {
        _id: event._id,
        title: event.title,
        status: event.status,
        approvedBy: user.name,
        approvedAt: event.approvedAt
      }
    });
  } catch (error) {
    console.error('Event approval error:', error);
    res.status(500).json({ message: 'Failed to approve event' });
  }
});

// Approve all pending events (temporary utility)
router.post('/events/approve-all', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await Event.updateMany(
      { status: 'pending' },
      { 
        status: 'approved',
        approvedBy: req.user.id,
        approvedAt: new Date()
      }
    );
    
    res.json({
      message: `Approved ${result.modifiedCount} events`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk approval error:', error);
    res.status(500).json({ message: 'Failed to approve events' });
  }
});

// Get organizer requests
router.get('/organizer-requests', authenticate, requireAdmin, async (req, res) => {
  try {
    const requests = await User.find({
      'organizerProfile.hasRequestedOrganizer': true,
      'organizerProfile.organizerRequestStatus': 'pending'
    }).select('-password');
    
    res.json(requests);
  } catch (error) {
    console.error('Organizer requests fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch organizer requests' });
  }
});

// Approve organizer request
router.post('/organizer-requests/:userId/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = 'organizer';
    user.organizerProfile.isVerified = true;
    user.organizerProfile.organizerRequestStatus = 'approved';
    user.organizerProfile.approvedBy = req.user.id;
    user.organizerProfile.approvedAt = new Date();

    await user.save();

    res.json({
      message: 'Organizer request approved successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Organizer approval error:', error);
    res.status(500).json({ message: 'Failed to approve organizer request' });
  }
});

// Reject organizer request
router.post('/organizer-requests/:userId/reject', authenticate, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.organizerProfile.organizerRequestStatus = 'rejected';
    user.organizerProfile.organizerRequestRejectionReason = reason;

    await user.save();

    res.json({
      message: 'Organizer request rejected successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Organizer rejection error:', error);
    res.status(500).json({ message: 'Failed to reject organizer request' });
  }
});

// Reject event
router.post('/events/:id/reject', authenticate, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    event.status = 'rejected';
    event.rejectionReason = reason;
    event.approvedBy = undefined;
    event.approvedAt = undefined;

    await event.save();

    res.json({
      message: 'Event rejected successfully',
      event: {
        _id: event._id,
        title: event.title,
        status: event.status,
        rejectionReason: event.rejectionReason
      }
    });
  } catch (error) {
    console.error('Event rejection error:', error);
    res.status(500).json({ message: 'Failed to reject event' });
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

    // Check if user exists and get their email
    const existingUser = await User.findById(userId);
    
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent deactivation of admin@huddle.com account
    if (action === 'deactivate' && existingUser.email === 'admin@huddle.com') {
      return res.status(403).json({ message: 'Cannot deactivate the main admin account' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: action === 'activate' },
      { new: true }
    ).select('-password');

    res.json({ message: `User ${action}d successfully`, user });
  } catch (error) {
    res.status(500).json({ message: `Failed to ${req.params.action} user` });
  }
});

// Update user role
router.put('/users/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!['user', 'organizer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be user, organizer, or admin' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: `User role updated to ${role} successfully`, 
      user 
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Failed to update user role' });
  }
});

// Delete user
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists and get their email
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent deletion of admin@huddle.com account
    if (user.email === 'admin@huddle.com') {
      return res.status(403).json({ message: 'Cannot delete the main admin account' });
    }
    
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
    await User.findByIdAndDelete(userId);

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

// Delete all events
router.delete('/events', async (req, res) => {
  try {
    const result = await Event.deleteMany({});
    res.json({ 
      message: `All events deleted successfully. Deleted ${result.deletedCount} events.` 
    });
  } catch (error) {
    console.error('Delete all events error:', error);
    res.status(500).json({ message: 'Failed to delete all events' });
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
