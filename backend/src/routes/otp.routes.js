import { Router } from 'express';
import { OTP } from '../models/OTP.js';
import { authenticate } from '../middleware/auth.js';
import { sendSMSOTP, sendSMSOTPDev } from '../utils/sms.js';

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

    // Send OTP via SMS
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    try {
      let smsResult;
      if (isDevelopment) {
        // In development, use the dev function that logs the OTP
        smsResult = await sendSMSOTPDev(mobileNumber, otp, purpose);
      } else {
        // In production, send actual SMS
        smsResult = await sendSMSOTP(mobileNumber, otp, purpose);
      }
      
      if (smsResult.success) {
        console.log(`SMS OTP sent successfully to ${mobileNumber} via ${smsResult.provider}`);
        
        res.json({
          message: isDevelopment 
            ? `OTP sent successfully (Dev Mode: ${smsResult.otp})`
            : 'OTP sent successfully to your mobile number',
          expiresIn: '10 minutes',
          ...(isDevelopment && { otp: smsResult.otp }) // Show OTP in development
        });
      } else {
        console.error('SMS sending failed:', smsResult);
        res.status(500).json({ 
          message: 'Failed to send SMS OTP. Please try again.',
          error: 'SMS service unavailable'
        });
      }
    } catch (smsError) {
      console.error('Error sending SMS OTP:', smsError);
      res.status(500).json({ 
        message: 'Failed to send SMS OTP. Please try again.',
        error: smsError.message 
      });
    }

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

    // Send OTP via SMS
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    try {
      let smsResult;
      if (isDevelopment) {
        // In development, use the dev function that logs the OTP
        smsResult = await sendSMSOTPDev(mobileNumber, otp, purpose);
      } else {
        // In production, send actual SMS
        smsResult = await sendSMSOTP(mobileNumber, otp, purpose);
      }
      
      if (smsResult.success) {
        console.log(`SMS OTP resent successfully to ${mobileNumber} via ${smsResult.provider}`);
        
        res.json({
          message: isDevelopment 
            ? `OTP resent successfully (Dev Mode: ${smsResult.otp})`
            : 'OTP resent successfully to your mobile number',
          expiresIn: '10 minutes',
          ...(isDevelopment && { otp: smsResult.otp }) // Show OTP in development
        });
      } else {
        console.error('SMS resending failed:', smsResult);
        res.status(500).json({ 
          message: 'Failed to resend SMS OTP. Please try again.',
          error: 'SMS service unavailable'
        });
      }
    } catch (smsError) {
      console.error('Error resending SMS OTP:', smsError);
      res.status(500).json({ 
        message: 'Failed to resend SMS OTP. Please try again.',
        error: smsError.message 
      });
    }

  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ message: 'Failed to resend OTP' });
  }
});

// Test SMS OTP sending
router.post('/test-sms', async (req, res) => {
  try {
    const { mobileNumber = '9876543210' } = req.body;
    const testOTP = generateOTP();
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    let smsResult;
    
    if (isDevelopment) {
      smsResult = await sendSMSOTPDev(mobileNumber, testOTP, 'Testing');
    } else {
      smsResult = await sendSMSOTP(mobileNumber, testOTP, 'Testing');
    }
    
    if (smsResult.success) {
      res.json({
        message: `Test SMS OTP sent successfully via ${smsResult.provider}`,
        otp: testOTP,
        provider: smsResult.provider,
        note: isDevelopment 
          ? 'Development mode: OTP logged to console'
          : `SMS sent to +91${mobileNumber}`
      });
    } else {
      res.status(500).json({
        message: 'Test SMS OTP failed',
        error: smsResult.error || 'SMS service unavailable'
      });
    }
  } catch (error) {
    console.error('Error sending test SMS OTP:', error);
    res.status(500).json({ 
      message: 'Failed to send test SMS OTP',
      error: error.message 
    });
  }
});

export default router;
