import { Router } from 'express';
import { User } from '../models/User.js';
import { signJwt } from '../utils/jwt.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, username, password, contactNumber, role = 'user' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }

    // Validate role (only allow user and organizer roles during registration)
    if (!['user', 'organizer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Create user
    const user = new User({
      name,
      email,
      username,
      password,
      contactNumber: contactNumber || undefined, // Let the model handle the default
      role
    });

    await user.save();

    // Generate token
    const token = signJwt({ id: user._id.toString(), role: user.role });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername },
        { username: emailOrUsername }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token with role
    const token = signJwt({ id: user._id.toString(), role: user.role });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        isOrganizer: user.isOrganizer(),
        isAdmin: user.isAdmin()
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        isOrganizer: user.isOrganizer(),
        isAdmin: user.isAdmin(),
        profilePicture: user.profilePicture,
        bio: user.bio,
        socialLinks: user.socialLinks,
        organizerProfile: user.organizerProfile
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user' });
  }
});

// Update user role (admin only)
router.patch('/users/:userId/role', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Check if current user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Validate role
    if (!['user', 'organizer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User role updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Failed to update user role' });
  }
});

// Verify organizer (admin only)
router.patch('/organizers/:userId/verify', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isVerified } = req.body;

    // Check if current user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { 'organizerProfile.isVerified': isVerified },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: `Organizer ${isVerified ? 'verified' : 'unverified'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        organizerProfile: user.organizerProfile
      }
    });
  } catch (error) {
    console.error('Verify organizer error:', error);
    res.status(500).json({ message: 'Failed to verify organizer' });
  }
});

// Check username availability
router.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // Check if username exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    
    res.json({
      available: !existingUser,
      username: username.toLowerCase()
    });
  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({ message: 'Error checking username availability' });
  }
});

// Create admin user (for development only)
router.post('/create-admin', async (req, res) => {
  try {
    const { name, email, username, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }

    // Create admin user
    const user = new User({
      name,
      email,
      username,
      password,
      role: 'admin'
    });

    await user.save();

    // Generate token
    const token = signJwt({ id: user._id.toString(), role: user.role });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin creation error:', error);
    res.status(500).json({ message: 'Admin creation failed' });
  }
});

export default router;


