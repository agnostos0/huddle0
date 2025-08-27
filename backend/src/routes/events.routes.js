import { Router } from 'express';
import { Event } from '../models/Event.js';
import { Team } from '../models/Team.js';
import { User } from '../models/User.js';
import { OTP } from '../models/OTP.js';
import { authenticate } from '../middleware/auth.js';
import { sendEventJoinNotification } from '../utils/email.js';

const router = Router();

// Create
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      location,
      googleLocationLink,
      coordinates,
      category,
      tags,
      photos,
      coverPhoto,
      maxParticipants,
      teamRequirements,
      price,
      pricing,
      currency,
      eventType,
      virtualMeetingLink,
      contactEmail,
      contactPhone,
      website,
      socialLinks
    } = req.body;

    const eventData = {
      title,
      description,
      date,
      location,
      googleLocationLink,
      organizer: req.user.id,
      coordinates,
      category: category || 'General',
      tags: tags || [],
      photos: photos || [],
      coverPhoto,
      maxParticipants: maxParticipants || 0,
      teamRequirements: teamRequirements || { teamSize: 0, girlsRequired: 0, boysRequired: 0 },
      price: price || 0,
      pricing: pricing || { individual: 0, teamLeader: 0, teamMember: 0, malePrice: 0, femalePrice: 0 },
      currency: currency || 'USD',
      eventType: eventType || 'in-person',
      virtualMeetingLink,
      contactEmail,
      contactPhone,
      website,
      socialLinks
    };

    const event = await Event.create(eventData);
    res.status(201).json(event);
  } catch (err) {
    console.error('Event creation error:', err);
    res.status(400).json({ message: 'Failed to create event' });
  }
});

// Read all (public/basic)
router.get('/', async (_req, res) => {
  const events = await Event.find().populate('organizer', 'name').sort({ date: 1 });
  res.json(events);
});

// Read one
router.get('/:id', async (req, res) => {
  const event = await Event.findById(req.params.id).populate('organizer', 'name').populate('participants', 'name');
  if (!event) return res.status(404).json({ message: 'Not found' });
  res.json(event);
});

// Update (only organizer)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Not found' });
    if (event.organizer.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    
    const {
      title,
      description,
      date,
      location,
      coordinates,
      category,
      tags,
      photos,
      coverPhoto,
      maxParticipants,
      price,
      currency,
      eventType,
      virtualMeetingLink,
      contactEmail,
      contactPhone,
      website,
      socialLinks
    } = req.body;

    // Update fields if provided
    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (date !== undefined) event.date = date;
    if (location !== undefined) event.location = location;
    if (coordinates !== undefined) event.coordinates = coordinates;
    if (category !== undefined) event.category = category;
    if (tags !== undefined) event.tags = tags;
    if (photos !== undefined) event.photos = photos;
    if (coverPhoto !== undefined) event.coverPhoto = coverPhoto;
    if (maxParticipants !== undefined) event.maxParticipants = maxParticipants;
    if (price !== undefined) event.price = price;
    if (currency !== undefined) event.currency = currency;
    if (eventType !== undefined) event.eventType = eventType;
    if (virtualMeetingLink !== undefined) event.virtualMeetingLink = virtualMeetingLink;
    if (contactEmail !== undefined) event.contactEmail = contactEmail;
    if (contactPhone !== undefined) event.contactPhone = contactPhone;
    if (website !== undefined) event.website = website;
    if (socialLinks !== undefined) event.socialLinks = socialLinks;

    await event.save();
    res.json(event);
  } catch (err) {
    console.error('Event update error:', err);
    res.status(400).json({ message: 'Failed to update event' });
  }
});

// Delete (only organizer)
router.delete('/:id', authenticate, async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Not found' });
  if (event.organizer.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  await event.deleteOne();
  res.status(204).end();
});

// Join event with OTP verification
router.post('/:id/join', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name email');
    if (!event) return res.status(404).json({ message: 'Not found' });
    if (event.organizer._id.toString() === req.user.id) return res.status(400).json({ message: 'Organizer cannot join' });
    
    const { teamId, mobileNumber, otp } = req.body || {};
    
    // Verify OTP if provided
    if (mobileNumber && otp) {
      const otpDoc = await OTP.findOne({
        mobileNumber,
        otp,
        purpose: teamId ? 'team_join' : 'event_join',
        eventId: event._id,
        teamId: teamId || null,
        isUsed: false,
        expiresAt: { $gt: new Date() }
      });

      if (!otpDoc) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }

      // Mark OTP as used
      otpDoc.isUsed = true;
      await otpDoc.save();
    } else {
      return res.status(400).json({ message: 'Mobile number and OTP are required' });
    }
    
    let joinType = 'Individual';
    let teamName = null;
    
    if (teamId) {
      // Join with specific team
      const team = await Team.findById(teamId);
      if (!team) return res.status(404).json({ message: 'Team not found' });
      
      // Check if user is a member of the team
      if (!team.members.some(m => m.toString() === req.user.id)) {
        return res.status(403).json({ message: 'You can only join with teams you are a member of' });
      }
      
      joinType = 'Team';
      teamName = team.name;
      
      // Add all team members who are not already participants
      const current = new Set(event.participants.map((p) => p.toString()));
      for (const memberId of team.members.map((m) => m.toString())) {
        if (!current.has(memberId)) event.participants.push(memberId);
      }
    } else {
      // Join as individual
      if (!event.participants.some((p) => p.toString() === req.user.id)) {
        event.participants.push(req.user.id);
      }
    }
    
    await event.save();
    
    // Send email notification to organizer
    try {
      const user = await User.findById(req.user.id);
      await sendEventJoinNotification(event, user, joinType, teamName);
    } catch (emailError) {
      console.error('Failed to send join notification email:', emailError);
      // Don't fail the request if email fails
    }
    
    res.json(event);
  } catch (error) {
    console.error('Join event error:', error);
    res.status(500).json({ message: 'Failed to join event' });
  }
});

// Leave event
router.post('/:id/leave', authenticate, async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Not found' });
  event.participants = event.participants.filter((p) => p.toString() !== req.user.id);
  await event.save();
  res.json(event);
});

// Track event view
router.post('/:id/view', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Increment view count
    event.views += 1;
    
    // Add to view history if user is logged in
    if (req.user) {
      const existingView = event.viewHistory.find(v => v.userId.toString() === req.user.id);
      if (!existingView) {
        event.viewHistory.push({
          userId: req.user.id,
          viewedAt: new Date()
        });
      }
    }
    
    await event.save();
    res.json({ message: 'View tracked', views: event.views });
  } catch (error) {
    console.error('View tracking error:', error);
    res.status(500).json({ message: 'Failed to track view' });
  }
});

export default router;


