import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { Team } from '../models/Team.js';
import { Invite } from '../models/Invite.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Events created by a user
router.get('/:id/events', async (req, res) => {
  const events = await Event.find({ organizer: req.params.id })
    .populate('participants', 'name')
    .sort({ createdAt: -1 });
  res.json(events);
});

// Events joined by a user
router.get('/:id/joined', async (req, res) => {
  const events = await Event.find({ participants: req.params.id })
    .populate('organizer', 'name')
    .sort({ createdAt: -1 });
  res.json(events);
});

// Teams owned by a user
router.get('/:id/teams', async (req, res) => {
  try {
    const teams = await Team.find({ 
      $or: [
        { owner: req.params.id },
        { members: req.params.id }
      ]
    })
    .populate('owner', 'name email')
    .populate('members', 'name email')
    .sort({ createdAt: -1 });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch teams' });
  }
});

// Pending invites for a user
router.get('/:id/invites', async (req, res) => {
  try {
    const invites = await Invite.find({ 
      email: req.params.email || req.params.id,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    })
    .populate('team', 'name')
    .populate('invitedBy', 'name')
    .sort({ createdAt: -1 });
    res.json(invites);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch invites' });
  }
});

// Analytics for a user
router.get('/:id/analytics', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Get user's events
    const myEvents = await Event.find({ organizer: userId });
    const totalEvents = myEvents.length;
    
    // Calculate total participants across all user's events
    const totalParticipants = myEvents.reduce((sum, event) => sum + (event.participants?.length || 0), 0);
    
    // Calculate real total views from events
    const totalViews = myEvents.reduce((sum, event) => sum + (event.views || 0), 0);
    
    // Get user's teams
    const myTeams = await Team.find({ 
      $or: [
        { owner: userId },
        { members: userId }
      ]
    });
    const totalTeams = myTeams.length;
    
    // Recent activity (last 10 events created or joined)
    const recentActivity = await Event.find({
      $or: [
        { organizer: userId },
        { participants: userId }
      ]
    })
    .populate('organizer', 'name')
    .sort({ createdAt: -1 })
    .limit(10);
    
    res.json({
      totalEvents,
      totalParticipants,
      totalViews,
      totalTeams,
      recentActivity
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, username, bio, socialLinks, profilePicture } = req.body;
    
    // Check if username is already taken by another user
    if (username) {
      const existingUser = await User.findOne({ 
        username: username.toLowerCase(), 
        _id: { $ne: req.user.id } 
      });
      if (existingUser) {
        return res.status(409).json({ message: 'Username already taken' });
      }
    }
    
    const updateData = {};
    if (name) updateData.name = name;
    if (username) updateData.username = username.toLowerCase();
    if (bio !== undefined) updateData.bio = bio;
    if (socialLinks) updateData.socialLinks = socialLinks;
    if (profilePicture) updateData.profilePicture = profilePicture;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Change password
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    
    const user = await User.findById(req.user.id);
    const isValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(req.user.id, { password: hashedPassword });
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// Delete account
router.delete('/account', authenticate, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'Password is required to delete account' });
    }
    
    const user = await User.findById(req.user.id);
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }
    
    // Delete user's events
    await Event.deleteMany({ organizer: req.user.id });
    
    // Remove user from teams
    await Team.updateMany(
      { members: req.user.id },
      { $pull: { members: req.user.id } }
    );
    
    // Delete teams owned by user
    await Team.deleteMany({ owner: req.user.id });
    
    // Finally delete the user
    await User.findByIdAndDelete(req.user.id);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

// Upload profile picture
router.post('/profile-picture', authenticate, async (req, res) => {
  try {
    const { profilePicture } = req.body;
    
    if (!profilePicture) {
      return res.status(400).json({ message: 'Profile picture is required' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile picture' });
  }
});

// Search users by username
router.get('/search/username/:username', authenticate, async (req, res) => {
  try {
    const { username } = req.params;
    const users = await User.find({
      username: { $regex: username, $options: 'i' },
      _id: { $ne: req.user.id } // Exclude current user
    })
    .select('name username email bio socialLinks')
    .limit(10);
    
    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get users for auto-matching (excluding team members)
router.get('/auto-match/:teamId', authenticate, async (req, res) => {
  try {
    const { teamId } = req.params;
    
    // Get team members
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    // Get users not in the team
    const users = await User.find({
      _id: { 
        $nin: [...team.members, req.user.id] // Exclude team members and current user
      }
    })
    .select('name username email bio socialLinks')
    .limit(20);
    
    res.json(users);
  } catch (error) {
    console.error('Error getting auto-match users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;


