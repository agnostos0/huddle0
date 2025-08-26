import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { signJwt } from '../utils/jwt.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password) return res.status(400).json({ message: 'Missing fields' });
    
    // Check if email or username already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(409).json({ message: 'Email already registered' });
    
    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(409).json({ message: 'Username already taken' });
    
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, username, email, password: hashed });
    const token = signJwt({ id: user._id.toString() });
    res.status(201).json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        username: user.username,
        email: user.email 
      } 
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) return res.status(400).json({ message: 'Missing fields' });
    
    // Try to find user by email or username
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername.toLowerCase() }
      ]
    });
    
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
    const token = signJwt({ id: user._id.toString() });
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        username: user.username,
        email: user.email 
      } 
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
});

export default router;


