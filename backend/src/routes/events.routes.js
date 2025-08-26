import { Router } from 'express';
import { Event } from '../models/Event.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Create
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, date, location } = req.body;
    const event = await Event.create({ title, description, date, location, organizer: req.user.id });
    res.status(201).json(event);
  } catch (err) {
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
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Not found' });
  if (event.organizer.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  const { title, description, date, location } = req.body;
  event.title = title ?? event.title;
  event.description = description ?? event.description;
  event.date = date ?? event.date;
  event.location = location ?? event.location;
  await event.save();
  res.json(event);
});

// Delete (only organizer)
router.delete('/:id', authenticate, async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Not found' });
  if (event.organizer.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  await event.deleteOne();
  res.status(204).end();
});

// Join event
router.post('/:id/join', authenticate, async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Not found' });
  if (event.organizer.toString() === req.user.id) return res.status(400).json({ message: 'Organizer cannot join' });
  if (!event.participants.some((p) => p.toString() === req.user.id)) {
    event.participants.push(req.user.id);
    await event.save();
  }
  res.json(event);
});

// Leave event
router.post('/:id/leave', authenticate, async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Not found' });
  event.participants = event.participants.filter((p) => p.toString() !== req.user.id);
  await event.save();
  res.json(event);
});

export default router;


