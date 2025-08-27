import { Router } from 'express';
import { OTP } from '../models/OTP.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP for event joining
router.post('/send', authenticate, async (req, res) => {
  try {
    const { mobileNumber, purpose, eventId, teamId } = req.body;

    if (!mobileNumber || !purpose) {
      return res.status(400).json({ message: 'Mobile number and purpose are required' });
    }

    // Validate mobile number format (basic validation)
    const mobileRegex = /^[0-9]{10,15}$/;
    if (!mobileRegex.test(mobileNumber)) {
      return res.status(400).json({ message: 'Please enter a valid mobile number' });
    }

    // Generate OTP
    const otp = generateOTP();

    // Delete any existing unused OTPs for this mobile number and purpose
    await OTP.deleteMany({
      mobileNumber,
      purpose,
      isUsed: false
    });

    // Create new OTP
    const otpDoc = await OTP.create({
      mobileNumber,
      otp,
      purpose,
      eventId,
      teamId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // In a real app, you would send SMS here
    // For now, we'll just return the OTP in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.json({
      message: 'OTP sent successfully',
      otp: isDevelopment ? otp : undefined, // Only show OTP in development
      expiresIn: '10 minutes'
    });

    console.log(`OTP for ${mobileNumber}: ${otp}`); // Log for development

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// Verify OTP
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { mobileNumber, otp, purpose, eventId, teamId } = req.body;

    if (!mobileNumber || !otp || !purpose) {
      return res.status(400).json({ message: 'Mobile number, OTP, and purpose are required' });
    }

    // Find the OTP
    const otpDoc = await OTP.findOne({
      mobileNumber,
      otp,
      purpose,
      eventId,
      teamId,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpDoc) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Mark OTP as used
    otpDoc.isUsed = true;
    await otpDoc.save();

    res.json({
      message: 'OTP verified successfully',
      verified: true
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

// Resend OTP
router.post('/resend', authenticate, async (req, res) => {
  try {
    const { mobileNumber, purpose, eventId, teamId } = req.body;

    if (!mobileNumber || !purpose) {
      return res.status(400).json({ message: 'Mobile number and purpose are required' });
    }

    // Delete any existing unused OTPs for this mobile number and purpose
    await OTP.deleteMany({
      mobileNumber,
      purpose,
      isUsed: false
    });

    // Generate new OTP
    const otp = generateOTP();

    // Create new OTP
    await OTP.create({
      mobileNumber,
      otp,
      purpose,
      eventId,
      teamId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.json({
      message: 'OTP resent successfully',
      otp: isDevelopment ? otp : undefined,
      expiresIn: '10 minutes'
    });

    console.log(`Resent OTP for ${mobileNumber}: ${otp}`); // Log for development

  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ message: 'Failed to resend OTP' });
  }
});

export default router;
