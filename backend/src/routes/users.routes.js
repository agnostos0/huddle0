import { Router } from 'express';
import { Event } from '../models/Event.js';
import { Team } from '../models/Team.js';
import { Invite } from '../models/Invite.js';

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

export default router;


