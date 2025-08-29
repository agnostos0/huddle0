import { Router } from 'express';
import { User } from '../models/User.js';
import { signJwt } from '../utils/jwt.js';
import { authenticate } from '../middleware/auth.js';
import axios from 'axios';

const router = Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, username, password, contactNumber, gender } = req.body;

    console.log('Registration attempt:', { name, email, username, gender });

    // Validate required fields
    if (!name || !email || !username || !password || !gender) {
      return res.status(400).json({
        message: 'All required fields must be provided'
      });
    }

    // Validate gender
    if (!['male', 'female', 'other'].includes(gender)) {
      return res.status(400).json({
        message: 'Invalid gender selection'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
    });

    if (existingUser) {
      const message = existingUser.email === email.toLowerCase() 
        ? 'Email already registered' 
        : 'Username already taken';
      return res.status(400).json({ message });
    }

    // All new users are attendees by default - only admins can promote to organizer
    const role = 'user';

    // Create user
    const user = new User({
      name,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password,
      gender,
      contactNumber: contactNumber || undefined,
      role
    });

    await user.save();
    console.log('User created successfully:', user._id);

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

    console.log('Login attempt:', { emailOrUsername });

    if (!emailOrUsername || !password) {
      return res.status(400).json({ 
        message: 'Email/username and password are required' 
      });
    }

    // Find user by email or username (case insensitive)
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername.toLowerCase() }
      ]
    });

    console.log('User lookup result:', user ? 'User found' : 'User not found');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    console.log('Password validation result:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token with role
    const token = signJwt({ id: user._id.toString(), role: user.role });

    console.log('Login successful for user:', user.username);

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

// Debug endpoint to check all usernames
router.get('/debug/usernames', async (req, res) => {
  try {
    const users = await User.find({}, 'username email');
    console.log('All users in database:', users);
    res.json({ users });
  } catch (error) {
    console.error('Debug usernames error:', error);
    res.status(500).json({ message: 'Error fetching usernames' });
  }
});

// Check username availability
router.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    console.log('Checking username availability for:', username);
    
    // Check if username exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    
    console.log('Existing user found:', existingUser ? 'Yes' : 'No');
    
    const result = {
      available: !existingUser,
      username: username.toLowerCase()
    };
    
    console.log('Username availability result:', result);
    
    res.json(result);
  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({ message: 'Error checking username availability' });
  }
});

// Create admin user (for development only)
router.post('/create-admin', async (req, res) => {
  try {
    const { name, email, username, password, gender = 'male' } = req.body;

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
      gender,
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

// Google OAuth authentication
router.post('/google', async (req, res) => {
  try {
    const { accessToken, user: googleUser } = req.body;

    if (!accessToken || !googleUser) {
      return res.status(400).json({ message: 'Invalid Google authentication data' });
    }

    // Verify the Google access token
    try {
      const googleResponse = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
      const verifiedUser = googleResponse.data;

      // Check if the email matches
      if (verifiedUser.email !== googleUser.email) {
        return res.status(401).json({ message: 'Invalid Google authentication' });
      }
    } catch (error) {
      console.error('Google token verification failed:', error);
      return res.status(401).json({ message: 'Invalid Google authentication token' });
    }

    // Check if user already exists
    let user = await User.findOne({ email: googleUser.email.toLowerCase() });

    if (user) {
      // Check if user is deactivated
      if (!user.isActive) {
        return res.status(403).json({ 
          message: 'Account deactivated', 
          deactivationReason: user.deactivationReason || 'Account has been deactivated by administrator'
        });
      }

      // User exists and is active, update last login and return token
      user.lastLogin = new Date();
      await user.save();

      const token = signJwt({ id: user._id.toString(), role: user.role });

      return res.json({
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
    } else {
      // Create new user from Google data
      const username = googleUser.email.split('@')[0].toLowerCase();
      
      // Ensure username is unique
      let uniqueUsername = username;
      let counter = 1;
      while (await User.findOne({ username: uniqueUsername })) {
        uniqueUsername = `${username}${counter}`;
        counter++;
      }

      const newUser = new User({
        name: googleUser.displayName || 'Google User',
        email: googleUser.email.toLowerCase(),
        username: uniqueUsername,
        password: 'google-oauth-' + Math.random().toString(36).substring(2), // Random password for Google users
        gender: 'other', // Default gender
        role: 'user',
        isActive: true,
        lastLogin: new Date()
      });

      await newUser.save();

      const token = signJwt({ id: newUser._id.toString(), role: newUser.role });

      return res.status(201).json({
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          username: newUser.username,
          role: newUser.role,
          isOrganizer: newUser.isOrganizer(),
          isAdmin: newUser.isAdmin()
        }
      });
    }
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ message: 'Google authentication failed' });
  }
});

export default router;


