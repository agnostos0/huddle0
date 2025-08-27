import { Router } from 'express';
import { Payment } from '../models/Payment.js';
import { Event } from '../models/Event.js';
import { User } from '../models/User.js';
import { Team } from '../models/Team.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Create payment intent
router.post('/create-payment', authenticate, async (req, res) => {
  try {
    const { eventId, teamId, teamRole, paymentMethod } = req.body;
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate amount based on pricing structure
    let amount = 0;
    if (event.pricing) {
      if (teamId) {
        // Team payment
        amount = teamRole === 'leader' ? event.pricing.teamLeader : event.pricing.teamMember;
      } else {
        // Individual payment
        amount = event.pricing.individual;
      }
      
      // Apply gender-based pricing if available
      if (user.gender === 'male' && event.pricing.malePrice > 0) {
        amount = event.pricing.malePrice;
      } else if (user.gender === 'female' && event.pricing.femalePrice > 0) {
        amount = event.pricing.femalePrice;
      }
    } else {
      // Fallback to general price
      amount = event.price;
    }

    // Create payment record
    const payment = new Payment({
      event: eventId,
      user: req.user.id,
      amount,
      currency: event.currency || 'USD',
      paymentMethod: paymentMethod || 'dummy',
      metadata: {
        teamId,
        teamRole,
        gender: user.gender
      }
    });

    await payment.save();

    // For dummy payment, simulate success
    if (paymentMethod === 'dummy') {
      payment.status = 'completed';
      payment.transactionId = `dummy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await payment.save();
    }

    res.json({
      paymentId: payment._id,
      amount,
      currency: payment.currency,
      status: payment.status,
      transactionId: payment.transactionId
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ message: 'Failed to create payment' });
  }
});

// Get payment status
router.get('/:paymentId', authenticate, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate('event', 'title')
      .populate('user', 'name email');
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user owns the payment or is event organizer
    if (payment.user._id.toString() !== req.user.id) {
      const event = await Event.findById(payment.event);
      if (event.organizer.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(payment);
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ message: 'Failed to get payment' });
  }
});

// Get event payments (for organizer)
router.get('/event/:eventId', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is event organizer
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const payments = await Payment.find({ event: req.params.eventId })
      .populate('user', 'name email gender')
      .populate('metadata.teamId', 'name')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Get event payments error:', error);
    res.status(500).json({ message: 'Failed to get event payments' });
  }
});

// Get user payments
router.get('/user/payments', authenticate, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate('event', 'title date location')
      .populate('metadata.teamId', 'name')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({ message: 'Failed to get user payments' });
  }
});

// Refund payment (for organizer)
router.post('/:paymentId/refund', authenticate, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate('event');
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user is event organizer
    if (payment.event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ message: 'Payment cannot be refunded' });
    }

    payment.status = 'refunded';
    payment.refundDate = new Date();
    await payment.save();

    res.json({ message: 'Payment refunded successfully', payment });
  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json({ message: 'Failed to refund payment' });
  }
});

export default router;
