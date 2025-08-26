import { Router } from 'express';
import { Event } from '../models/Event.js';

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

export default router;


