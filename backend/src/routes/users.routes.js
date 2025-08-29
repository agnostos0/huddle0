import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { Team } from '../models/Team.js';
import { Invite } from '../models/Invite.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Request to become an organizer
router.post('/request-organizer', authenticate, async (req, res) => {
  try {
    const { organization, description, contactEmail, contactPhone, reason } = req.body;
    
    if (!organization || !description || !reason) {
      return res.status(400).json({ 
        message: 'Organization, description, and reason are required' 
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user already has a pending request
    if (user.organizerProfile.hasRequestedOrganizer && 
        user.organizerProfile.organizerRequestStatus === 'pending') {
      return res.status(400).json({ 
        message: 'You already have a pending organizer request' 
      });
    }

    // Check if user is already an organizer
    if (user.role === 'organizer') {
      return res.status(400).json({ 
        message: 'You are already an organizer' 
      });
    }

    // Update user with organizer request
    user.organizerProfile.hasRequestedOrganizer = true;
    user.organizerProfile.organizerRequestDate = new Date();
    user.organizerProfile.organizerRequestReason = reason;
    user.organizerProfile.organizerRequestStatus = 'pending';
    user.organizerProfile.organization = organization;
    user.organizerProfile.description = description;
    user.organizerProfile.contactEmail = contactEmail || user.email;
    user.organizerProfile.contactPhone = contactPhone || user.contactNumber;

    await user.save();

    res.json({
      message: 'Organizer request submitted successfully. Admin will review your request.',
      request: {
        organization: user.organizerProfile.organization,
        description: user.organizerProfile.description,
        reason: user.organizerProfile.organizerRequestReason,
        status: user.organizerProfile.organizerRequestStatus,
        submittedAt: user.organizerProfile.organizerRequestDate
      }
    });
  } catch (error) {
    console.error('Organizer request error:', error);
    res.status(500).json({ message: 'Failed to submit organizer request' });
  }
});

// Get user's organizer request status
router.get('/organizer-request-status', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If user is demoted to attendee but still has approved status, reset it
    if (user.role === 'user' && user.organizerProfile.organizerRequestStatus === 'approved') {
      user.organizerProfile.organizerRequestStatus = 'pending';
      user.organizerProfile.isVerified = false;
      await user.save();
    }

    res.json({
      hasRequested: user.organizerProfile.hasRequestedOrganizer,
      status: user.organizerProfile.organizerRequestStatus,
      organization: user.organizerProfile.organization,
      description: user.organizerProfile.description,
      reason: user.organizerProfile.organizerRequestReason,
      rejectionReason: user.organizerProfile.organizerRequestRejectionReason,
      submittedAt: user.organizerProfile.organizerRequestDate,
      approvedAt: user.organizerProfile.approvedAt,
      isOrganizer: user.role === 'organizer',
      isVerified: user.organizerProfile.isVerified
    });
  } catch (error) {
    console.error('Organizer status fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch organizer status' });
  }
});



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


