import { Router } from 'express';
import { Invite } from '../models/Invite.js';
import { Team } from '../models/Team.js';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { sendInviteEmail, sendTestEmail } from '../utils/email.js';
import { signJwt } from '../utils/jwt.js';
import crypto from 'crypto';

const router = Router();

// Generate secure token for invite
const generateInviteToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Get invite by token (public route)
router.get('/:token', async (req, res) => {
  try {
    const invite = await Invite.findOne({ 
      token: req.params.token,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).populate('team', 'name description');

    if (!invite) {
      return res.status(404).json({ 
        message: 'Invitation not found or has expired' 
      });
    }

    res.json({
      invite: {
        id: invite._id,
        email: invite.email,
        team: invite.team,
        expiresAt: invite.expiresAt,
      }
    });
  } catch (error) {
    console.error('Error fetching invite:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept invite (public route)
router.post('/:token/accept', async (req, res) => {
  try {
    const { name, password, bio, socialLinks } = req.body;

    const invite = await Invite.findOne({ 
      token: req.params.token,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).populate('team');

    if (!invite) {
      return res.status(404).json({ 
        message: 'Invitation not found or has expired' 
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email: invite.email });
    
    if (user) {
      // User exists, just add to team if not already a member
      const team = await Team.findById(invite.team._id);
      if (!team.members.some(m => m.toString() === user._id.toString())) {
        team.members.push(user._id);
        await team.save();
      }
    } else {
      // Create new user
      user = await User.create({
        name,
        email: invite.email,
        password,
        bio,
        socialLinks,
      });

      // Add to team
      const team = await Team.findById(invite.team._id);
      team.members.push(user._id);
      await team.save();
    }

    // Mark invite as accepted
    invite.status = 'accepted';
    await invite.save();

    // Generate JWT token for the user
    const token = signJwt({ userId: user._id });

    res.json({ 
      message: 'Invitation accepted successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      team: {
        id: invite.team._id,
        name: invite.team.name,
      }
    });
  } catch (error) {
    console.error('Error accepting invite:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create invite (protected route)
router.post('/teams/:teamId/invite', authenticate, async (req, res) => {
  try {
    const { email } = req.body;
    const teamId = req.params.teamId;

    // Check if team exists and user is owner
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only team owner can send invitations' });
    }

    // Check if user is already a member
    const existingUser = await User.findOne({ email });
    if (existingUser && team.members.some(m => m.toString() === existingUser._id.toString())) {
      return res.status(400).json({ message: 'User is already a team member' });
    }

    // Check if invite already exists
    const existingInvite = await Invite.findOne({
      team: teamId,
      email,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (existingInvite) {
      return res.status(400).json({ message: 'Invitation already sent to this email' });
    }

    // Create new invite
    const invite = await Invite.create({
      team: teamId,
      email,
      token: generateInviteToken(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      invitedBy: req.user.id,
    });

    // Send email
    try {
      await sendInviteEmail(invite, team.name, req.user.name);
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Don't fail the request, just log the error
    }

    res.json({ 
      message: 'Invitation sent successfully',
      invite: {
        id: invite._id,
        email: invite.email,
        expiresAt: invite.expiresAt,
      }
    });
  } catch (error) {
    console.error('Error creating invite:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// List pending invites for a team (protected route)
router.get('/teams/:teamId/invites', authenticate, async (req, res) => {
  try {
    const teamId = req.params.teamId;

    // Check if team exists and user is owner
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only team owner can view invitations' });
    }

    const invites = await Invite.find({
      team: teamId,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    res.json(invites);
  } catch (error) {
    console.error('Error fetching invites:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test email endpoint
router.post('/test-email', async (req, res) => {
  try {
    const info = await sendTestEmail();
    res.json({ 
      message: 'Test email sent successfully',
      messageId: info.messageId 
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      message: 'Failed to send test email',
      error: error.message 
    });
  }
});

export default router;
