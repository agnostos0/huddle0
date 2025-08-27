import { Router } from 'express';
import { Notification } from '../models/Notification.js';
import { Team } from '../models/Team.js';
import { Invite } from '../models/Invite.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Get user's notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      recipient: req.user.id 
    })
    .populate('sender', 'name username')
    .populate('data.teamId', 'name')
    .populate('data.eventId', 'title')
    .sort({ createdAt: -1 })
    .limit(50);

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Get unread notifications count
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      recipient: req.user.id,
      isRead: false
    });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { 
        _id: req.params.id,
        recipient: req.user.id 
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Accept team invitation
router.post('/:id/accept', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id,
      type: 'team_invitation',
      isAccepted: null
    });

    if (!notification) {
      return res.status(404).json({ message: 'Invitation not found or already processed' });
    }

    // Add user to team
    const team = await Team.findById(notification.data.teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (!team.members.some(m => m.toString() === req.user.id)) {
      team.members.push(req.user.id);
      await team.save();
    }

    // Update notification
    notification.isAccepted = true;
    notification.isRead = true;
    await notification.save();

    // Update or delete the corresponding invite
    if (notification.data.inviteId) {
      await Invite.findByIdAndUpdate(notification.data.inviteId, {
        status: 'accepted',
        acceptedAt: new Date()
      });
    }

    res.json({ 
      message: 'Invitation accepted successfully',
      notification,
      team
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ message: 'Failed to accept invitation' });
  }
});

// Decline team invitation
router.post('/:id/decline', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id,
      type: 'team_invitation',
      isAccepted: null
    });

    if (!notification) {
      return res.status(404).json({ message: 'Invitation not found or already processed' });
    }

    // Update notification
    notification.isAccepted = false;
    notification.isRead = true;
    await notification.save();

    // Update the corresponding invite
    if (notification.data.inviteId) {
      await Invite.findByIdAndUpdate(notification.data.inviteId, {
        status: 'declined',
        declinedAt: new Date()
      });
    }

    res.json({ 
      message: 'Invitation declined',
      notification
    });
  } catch (error) {
    console.error('Error declining invitation:', error);
    res.status(500).json({ message: 'Failed to decline invitation' });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', authenticate, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
});

export default router;
