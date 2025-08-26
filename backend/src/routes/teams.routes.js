import { Router } from 'express';
import { Team } from '../models/Team.js';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Create a team
router.post('/', authenticate, async (req, res) => {
  const { name, members } = req.body;
  const team = await Team.create({ name, owner: req.user.id, members: members || [req.user.id] });
  res.status(201).json(team);
});

// My teams (owned or member)
router.get('/mine', authenticate, async (req, res) => {
  const teams = await Team.find({ $or: [{ owner: req.user.id }, { members: req.user.id }] })
    .populate('owner', 'name')
    .populate('members', 'name');
  res.json(teams);
});

// Get team details with full member profiles
router.get('/:id', authenticate, async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate('owner', 'name email bio socialLinks')
    .populate('members', 'name email bio socialLinks');
  if (!team) return res.status(404).json({ message: 'Team not found' });
  res.json(team);
});

// Note: Email invitations are now handled by /api/invites/teams/:teamId/invite

// Add member manually with details
router.post('/:id/members/manual', authenticate, async (req, res) => {
  const { name, email, bio, socialLinks } = req.body;
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  if (team.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  
  // Create new user or find existing
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ 
      name, 
      email, 
      password: 'temp-password-' + Date.now(), // temporary password
      bio,
      socialLinks
    });
  }
  
  if (!team.members.some(m => m.toString() === user._id.toString())) {
    team.members.push(user._id);
    await team.save();
  }
  
  res.json(team);
});

// Add member (owner only)
router.post('/:id/members', authenticate, async (req, res) => {
  const { userId } = req.body;
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  if (team.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  if (!team.members.some((m) => m.toString() === userId)) team.members.push(userId);
  await team.save();
  res.json(team);
});

// Remove member (owner only)
router.delete('/:id/members/:userId', authenticate, async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  if (team.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  team.members = team.members.filter((m) => m.toString() !== req.params.userId);
  await team.save();
  res.json(team);
});

export default router;


