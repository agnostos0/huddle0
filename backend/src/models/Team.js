import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Team leader (can be different from owner)
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    maxMembers: { type: Number, default: 10 },
    // Team approval system
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending' 
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    submittedForReview: { type: Boolean, default: false },
    // Team join requests
    joinRequests: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      requestedAt: { type: Date, default: Date.now },
      approvedByLeader: { type: Boolean, default: false },
      approvedByAdmin: { type: Boolean, default: false },
      leaderApprovedAt: { type: Date },
      adminApprovedAt: { type: Date },
      rejectionReason: { type: String }
    }]
  },
  { timestamps: true }
);

export const Team = mongoose.models.Team || mongoose.model('Team', teamSchema);


