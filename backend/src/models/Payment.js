import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  event: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  currency: { 
    type: String, 
    default: 'USD' 
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'], 
    default: 'pending' 
  },
  paymentMethod: { 
    type: String, 
    enum: ['google_pay', 'stripe', 'paypal', 'dummy'], 
    default: 'dummy' 
  },
  transactionId: { 
    type: String 
  },
  paymentDate: { 
    type: Date, 
    default: Date.now 
  },
  refundDate: { 
    type: Date 
  },
  metadata: {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    teamRole: { type: String }, // 'leader', 'member'
    gender: { type: String }
  }
}, { 
  timestamps: true 
});

export const Payment = mongoose.model('Payment', paymentSchema);
