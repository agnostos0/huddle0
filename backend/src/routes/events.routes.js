import { Router } from 'express';
import { Event } from '../models/Event.js';
import { Team } from '../models/Team.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
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
      prizePool,
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
      teamRequirements: teamRequirements || { girlsRequired: 0, boysRequired: 0 },
      price: price || 0,
      prizePool: prizePool || { 
        totalAmount: 0, 
        firstPlace: 0, 
        secondPlace: 0, 
        thirdPlace: 0, 
        consolationPrizes: [],
        currency: currency || 'USD'
      },
      currency: currency || 'USD',
      eventType: eventType || 'in-person',
      virtualMeetingLink,
      contactEmail,
      contactPhone,
      website,
      socialLinks
    };

    // Ensure organizer is set
    if (!eventData.organizer) {
      return res.status(400).json({ message: 'Organizer is required' });
    }

    const event = await Event.create(eventData);
    res.status(201).json(event);
  } catch (err) {
    console.error('Event creation error:', err);
    res.status(400).json({ message: 'Failed to create event' });
  }
});

// Read all (public/basic) - only show approved events
router.get('/', async (_req, res) => {
  const events = await Event.find({ status: 'approved' }).populate('organizer', 'name').sort({ date: 1 });
  res.json(events);
});

// Read all events (admin only) - includes pending and rejected
router.get('/admin/all', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const events = await Event.find()
      .populate('organizer', 'name email')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    console.error('Admin events fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// Get pending events (admin only)
router.get('/admin/pending', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const events = await Event.find({ status: 'pending' })
      .populate('organizer', 'name email')
      .sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    console.error('Pending events fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch pending events' });
  }
});

// Read one
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name')
      .populate('participants', 'name')
      .populate('soloParticipants', 'name username')
      .populate('teams', 'name members')
      .populate('teams.members', 'name username')
      .populate('teamSuggestions.suggestedTeamId', 'name members')
      .populate('teamSuggestions.suggestedBy', 'name')
      .populate('teamSuggestions.suggestedFor', 'name username');
    
    if (!event) return res.status(404).json({ message: 'Not found' });
    res.json(event);
  } catch (error) {
    console.error('Event fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch event' });
  }
});

// Get solo participants for team suggestions
router.get('/:id/solo-participants', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('soloParticipants', 'name username email bio');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Filter out the current user from suggestions
    const soloParticipants = event.soloParticipants.filter(
      participant => participant._id.toString() !== req.user.id
    );

    res.json({
      soloParticipants,
      totalSoloParticipants: soloParticipants.length
    });
  } catch (error) {
    console.error('Solo participants fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch solo participants' });
  }
});

// Get event team requirements and calculated team size
router.get('/:id/team-requirements', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const girlsRequired = event.teamRequirements?.girlsRequired || 0;
    const boysRequired = event.teamRequirements?.boysRequired || 0;
    const calculatedTeamSize = girlsRequired + boysRequired;

    res.json({
      teamRequirements: event.teamRequirements,
      calculatedTeamSize,
      girlsRequired,
      boysRequired,
      maxParticipants: event.maxParticipants,
      isValid: calculatedTeamSize > 0 && (!event.maxParticipants || calculatedTeamSize <= event.maxParticipants)
    });
  } catch (error) {
    console.error('Team requirements fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch team requirements' });
  }
});

// Validate prize pool structure
router.post('/validate-prize-pool', async (req, res) => {
  try {
    const { firstPlace, secondPlace, thirdPlace, consolationPrizes, totalAmount } = req.body;
    
    const calculatedTotal = (firstPlace || 0) + (secondPlace || 0) + (thirdPlace || 0) + 
                           (consolationPrizes?.reduce((sum, prize) => sum + (prize || 0), 0) || 0);
    
    const validation = {
      firstPlace: firstPlace || 0,
      secondPlace: secondPlace || 0,
      thirdPlace: thirdPlace || 0,
      consolationPrizes: consolationPrizes || [],
      totalAmount: totalAmount || 0,
      calculatedTotal,
      isValid: true,
      errors: []
    };

    // Validation checks
    if (firstPlace < 0 || secondPlace < 0 || thirdPlace < 0) {
      validation.isValid = false;
      validation.errors.push('Prize amounts cannot be negative');
    }

    if (consolationPrizes && consolationPrizes.some(prize => prize < 0)) {
      validation.isValid = false;
      validation.errors.push('Consolation prize amounts cannot be negative');
    }

    if (totalAmount && calculatedTotal > totalAmount) {
      validation.isValid = false;
      validation.errors.push(`Total prize distribution (${calculatedTotal}) cannot exceed total prize pool (${totalAmount})`);
    }

    if (calculatedTotal === 0) {
      validation.isValid = false;
      validation.errors.push('At least one prize amount must be greater than 0');
    }

    res.json(validation);
  } catch (error) {
    console.error('Prize pool validation error:', error);
    res.status(500).json({ message: 'Failed to validate prize pool' });
  }
});

// Validate team requirements
router.post('/validate-team-requirements', async (req, res) => {
  try {
    const { girlsRequired, boysRequired, maxParticipants } = req.body;
    
    const calculatedTeamSize = (girlsRequired || 0) + (boysRequired || 0);
    
    const validation = {
      girlsRequired: girlsRequired || 0,
      boysRequired: boysRequired || 0,
      calculatedTeamSize,
      maxParticipants: maxParticipants || 0,
      isValid: true,
      errors: []
    };

    // Validation checks
    if (girlsRequired < 0 || boysRequired < 0) {
      validation.isValid = false;
      validation.errors.push('Girls and boys requirements cannot be negative');
    }

    if (calculatedTeamSize === 0) {
      validation.isValid = false;
      validation.errors.push('Team must have at least one member (girls or boys)');
    }

    if (maxParticipants && calculatedTeamSize > maxParticipants) {
      validation.isValid = false;
      validation.errors.push(`Team size (${calculatedTeamSize}) cannot exceed maximum participants (${maxParticipants})`);
    }

    res.json(validation);
  } catch (error) {
    console.error('Team requirements validation error:', error);
    res.status(500).json({ message: 'Failed to validate team requirements' });
  }
});

// Get team suggestions for solo participants
router.get('/:id/team-suggestions', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('teamSuggestions.suggestedTeamId', 'name members')
      .populate('teamSuggestions.suggestedBy', 'name')
      .populate('teamSuggestions.suggestedFor', 'name username');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Filter suggestions for current user
    const userSuggestions = event.teamSuggestions.filter(suggestion =>
      suggestion.suggestedFor.some(user => user._id.toString() === req.user.id)
    );

    res.json({
      teamSuggestions: userSuggestions,
      totalSuggestions: userSuggestions.length
    });
  } catch (error) {
    console.error('Team suggestions fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch team suggestions' });
  }
});

// Update (only organizer) - with approval workflow
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
      teamRequirements,
      price,
      pricing,
      currency,
      eventType,
      virtualMeetingLink,
      contactEmail,
      contactPhone,
      website,
      socialLinks,
      googleLocationLink
    } = req.body;

    // Check if event is currently approved
    if (event.status === 'approved') {
      // Store current values for comparison
      const previousValues = {
        title: event.title,
        description: event.description,
        date: event.date,
        location: event.location,
        coordinates: event.coordinates,
        category: event.category,
        tags: event.tags,
        photos: event.photos,
        coverPhoto: event.coverPhoto,
        maxParticipants: event.maxParticipants,
        teamRequirements: event.teamRequirements,
        price: event.price,
        pricing: event.pricing,
        currency: event.currency,
        eventType: event.eventType,
        virtualMeetingLink: event.virtualMeetingLink,
        contactEmail: event.contactEmail,
        contactPhone: event.contactPhone,
        website: event.website,
        socialLinks: event.socialLinks,
        googleLocationLink: event.googleLocationLink
      };

      // Store pending changes
      event.pendingChanges = {
        title: title !== undefined ? title : event.title,
        description: description !== undefined ? description : event.description,
        date: date !== undefined ? date : event.date,
        location: location !== undefined ? location : event.location,
        coordinates: coordinates !== undefined ? coordinates : event.coordinates,
        category: category !== undefined ? category : event.category,
        tags: tags !== undefined ? tags : event.tags,
        photos: photos !== undefined ? photos : event.photos,
        coverPhoto: coverPhoto !== undefined ? coverPhoto : event.coverPhoto,
        maxParticipants: maxParticipants !== undefined ? maxParticipants : event.maxParticipants,
        teamRequirements: teamRequirements !== undefined ? teamRequirements : event.teamRequirements,
        price: price !== undefined ? price : event.price,
        prizePool: prizePool !== undefined ? prizePool : event.prizePool,
        currency: currency !== undefined ? currency : event.currency,
        eventType: eventType !== undefined ? eventType : event.eventType,
        virtualMeetingLink: virtualMeetingLink !== undefined ? virtualMeetingLink : event.virtualMeetingLink,
        contactEmail: contactEmail !== undefined ? contactEmail : event.contactEmail,
        contactPhone: contactPhone !== undefined ? contactPhone : event.contactPhone,
        website: website !== undefined ? website : event.website,
        socialLinks: socialLinks !== undefined ? socialLinks : event.socialLinks,
        googleLocationLink: googleLocationLink !== undefined ? googleLocationLink : event.googleLocationLink
      };

      // Track changes for edit history
      const changes = [];
      if (title !== undefined && title !== previousValues.title) changes.push('Title');
      if (description !== undefined && description !== previousValues.description) changes.push('Description');
      if (date !== undefined && date !== previousValues.date) changes.push('Date');
      if (location !== undefined && location !== previousValues.location) changes.push('Location');
      if (category !== undefined && category !== previousValues.category) changes.push('Category');
      if (maxParticipants !== undefined && maxParticipants !== previousValues.maxParticipants) changes.push('Max Participants');
      if (price !== undefined && price !== previousValues.price) changes.push('Price');
      if (teamRequirements !== undefined && JSON.stringify(teamRequirements) !== JSON.stringify(previousValues.teamRequirements)) changes.push('Team Requirements');
      if (prizePool !== undefined && JSON.stringify(prizePool) !== JSON.stringify(previousValues.prizePool)) changes.push('Prize Pool');

      // Add to edit history
      event.editHistory.push({
        editedAt: new Date(),
        editedBy: req.user.id,
        changes: changes.join(', '),
        previousStatus: event.status
      });

      // Change status to edited_pending for admin approval
      event.status = 'edited_pending';
      event.isEdited = true;
      event.approvedBy = undefined;
      event.approvedAt = undefined;

      await event.save();

      res.json({
        message: 'Event updated successfully. Changes are pending admin approval.',
        event: {
          id: event._id,
          title: event.title,
          status: event.status,
          pendingChanges: event.pendingChanges,
          editHistory: event.editHistory
        }
      });
    } else {
      // For non-approved events, update directly
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
      if (teamRequirements !== undefined) event.teamRequirements = teamRequirements;
      if (price !== undefined) event.price = price;
      if (prizePool !== undefined) event.prizePool = prizePool;
      if (currency !== undefined) event.currency = currency;
      if (eventType !== undefined) event.eventType = eventType;
      if (virtualMeetingLink !== undefined) event.virtualMeetingLink = virtualMeetingLink;
      if (contactEmail !== undefined) event.contactEmail = contactEmail;
      if (contactPhone !== undefined) event.contactPhone = contactPhone;
      if (website !== undefined) event.website = website;
      if (socialLinks !== undefined) event.socialLinks = socialLinks;
      if (googleLocationLink !== undefined) event.googleLocationLink = googleLocationLink;

      await event.save();
      res.json(event);
    }
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
    if (event.organizer && event.organizer._id.toString() === req.user.id) return res.status(400).json({ message: 'Organizer cannot join' });
    
    const { teamId } = req.body || {};
    
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
      if (event.organizer && event.organizer.email) {
        const user = await User.findById(req.user.id);
        await sendEventJoinNotification(event, user, joinType, teamName);
        console.log(`Email notification sent to organizer ${event.organizer.email} for ${joinType} join`);
      }
    } catch (emailError) {
      console.error('Failed to send join notification email:', emailError);
      // Don't fail the request if email fails
    }
    
    res.json({
      message: `${joinType === 'Team' ? `Team "${teamName}"` : req.user.name} has joined the event successfully`,
      event: {
        id: event._id,
        title: event.title,
        participants: event.participants.length
      }
    });
  } catch (error) {
    console.error('Join event error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      eventId: req.params.id,
      userId: req.user.id
    });
    res.status(500).json({ message: 'Failed to join event', error: error.message });
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

// Approve event (admin only)
router.post('/:id/approve', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    event.status = 'approved';
    event.approvedBy = req.user.id;
    event.approvedAt = new Date();
    event.rejectionReason = undefined;

    await event.save();

    res.json({ 
      message: 'Event approved successfully',
      event: {
        id: event._id,
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

// Reject event (admin only)
router.post('/:id/reject', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { reason } = req.body;
    if (!reason) {
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
        id: event._id,
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

// Submit event for review (organizer)
router.post('/:id/submit-for-review', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the organizer can submit for review' });
    }

    if (event.status !== 'pending') {
      return res.status(400).json({ message: 'Event is already submitted for review' });
    }

    event.submittedForReview = true;
    await event.save();

    res.json({ 
      message: 'Event submitted for review successfully',
      event: {
        id: event._id,
        title: event.title,
        status: event.status,
        submittedForReview: event.submittedForReview
      }
    });
  } catch (error) {
    console.error('Event submission error:', error);
    res.status(500).json({ message: 'Failed to submit event for review' });
  }
});

// Suggest team for solo participants
router.post('/:id/suggest-team', authenticate, async (req, res) => {
  try {
    const { teamId, suggestedForUserIds } = req.body;
    
    if (!teamId || !suggestedForUserIds || !Array.isArray(suggestedForUserIds)) {
      return res.status(400).json({ message: 'Team ID and suggested user IDs are required' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if team exists and is approved
    const team = await Team.findById(teamId);
    if (!team || team.status !== 'approved') {
      return res.status(404).json({ message: 'Team not found or not approved' });
    }

    // Check if suggested users are solo participants
    const soloParticipantIds = event.soloParticipants.map(p => p.toString());
    const validSuggestedUsers = suggestedForUserIds.filter(userId => 
      soloParticipantIds.includes(userId)
    );

    if (validSuggestedUsers.length === 0) {
      return res.status(400).json({ message: 'No valid solo participants found' });
    }

    // Create team suggestion
    const teamSuggestion = {
      suggestedTeamId: teamId,
      suggestedBy: req.user.id,
      suggestedFor: validSuggestedUsers,
      suggestedAt: new Date(),
      status: 'pending'
    };

    event.teamSuggestions.push(teamSuggestion);
    await event.save();

    // Create notifications for suggested users
    for (const userId of validSuggestedUsers) {
      await Notification.create({
        recipient: userId,
        sender: req.user.id,
        type: 'team_suggestion',
        title: `Team Suggestion for ${event.title}`,
        message: `${req.user.name} suggested you join team "${team.name}" for the event "${event.title}"`,
        data: {
          eventId: event._id,
          teamId: teamId,
          suggestionId: teamSuggestion._id
        }
      });
    }

    res.json({
      message: 'Team suggestion created successfully',
      suggestion: teamSuggestion
    });
  } catch (error) {
    console.error('Team suggestion error:', error);
    res.status(500).json({ message: 'Failed to create team suggestion' });
  }
});

// Accept team suggestion
router.post('/:id/accept-suggestion/:suggestionId', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const suggestion = event.teamSuggestions.id(req.params.suggestionId);
    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }

    // Check if user is in the suggestedFor array
    if (!suggestion.suggestedFor.some(userId => userId.toString() === req.user.id)) {
      return res.status(403).json({ message: 'You are not authorized to accept this suggestion' });
    }

    // Update suggestion status
    suggestion.status = 'accepted';
    await event.save();

    // Add user to the suggested team
    const team = await Team.findById(suggestion.suggestedTeamId);
    if (team && !team.members.includes(req.user.id)) {
      team.members.push(req.user.id);
      await team.save();
    }

    // Remove user from solo participants
    event.soloParticipants = event.soloParticipants.filter(
      participantId => participantId.toString() !== req.user.id
    );
    await event.save();

    res.json({
      message: 'Team suggestion accepted successfully',
      suggestion: suggestion
    });
  } catch (error) {
    console.error('Accept suggestion error:', error);
    res.status(500).json({ message: 'Failed to accept team suggestion' });
  }
});

// Reject team suggestion
router.post('/:id/reject-suggestion/:suggestionId', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const suggestion = event.teamSuggestions.id(req.params.suggestionId);
    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }

    // Check if user is in the suggestedFor array
    if (!suggestion.suggestedFor.some(userId => userId.toString() === req.user.id)) {
      return res.status(403).json({ message: 'You are not authorized to reject this suggestion' });
    }

    // Update suggestion status
    suggestion.status = 'rejected';
    await event.save();

    res.json({
      message: 'Team suggestion rejected successfully',
      suggestion: suggestion
    });
  } catch (error) {
    console.error('Reject suggestion error:', error);
    res.status(500).json({ message: 'Failed to reject team suggestion' });
  }
});

export default router;


