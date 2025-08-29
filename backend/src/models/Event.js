import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  googleLocationLink: { type: String },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  // Interested participants tracking
  interestedParticipants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    interestedAt: { type: Date, default: Date.now },
    bio: { type: String }, // User's bio when expressing interest
    skills: [{ type: String }], // User's skills/interests
    lookingFor: { type: String }, // What they're looking for in a team
    contactPreference: { type: String, enum: ['email', 'username', 'both'], default: 'username' }
  }],
  // Solo participants tracking (for backward compatibility)
  soloParticipants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // Team suggestions for solo participants
  teamSuggestions: [{
    suggestedTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    suggestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    suggestedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    suggestedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
  }],
  maxParticipants: { type: Number, default: 0 },
  teamRequirements: {
    girlsRequired: { type: Number, default: 0 },
    boysRequired: { type: Number, default: 0 }
  },
  category: { type: String, default: 'General' },
  tags: [{ type: String, trim: true }],
  photos: [{ type: String }], // Array of photo URLs
  coverPhoto: { type: String }, // Main cover photo
  image: { type: String }, // Legacy field for backward compatibility
  views: { type: Number, default: 0 },
  viewHistory: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    viewedAt: { type: Date, default: Date.now }
  }],
  isPublic: { type: Boolean, default: true },
  price: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  prizePool: {
    totalAmount: { type: Number, default: 0 },
    firstPlace: { type: Number, default: 0 },
    secondPlace: { type: Number, default: 0 },
    thirdPlace: { type: Number, default: 0 },
    consolationPrizes: [{ type: Number }], // Additional prizes
    currency: { type: String, default: 'INR' }
  },
  eventType: { type: String, enum: ['in-person', 'virtual', 'hybrid'], default: 'in-person' },
  virtualMeetingLink: { type: String },
  contactEmail: { type: String },
  contactPhone: { type: String },
  website: { type: String },
  socialLinks: {
    facebook: { type: String },
    twitter: { type: String },
    instagram: { type: String },
    linkedin: { type: String }
  },
  // Event approval system
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'edited_pending'], 
    default: 'pending' 
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
  submittedForReview: { type: Boolean, default: false },
  // Event editing system
  isEdited: { type: Boolean, default: false },
  originalVersion: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' }, // Reference to original event if this is an edit
  editHistory: [{
    editedAt: { type: Date, default: Date.now },
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changes: { type: String }, // Description of what was changed
    previousStatus: { type: String }
  }],
  pendingChanges: {
    title: { type: String },
    description: { type: String },
    date: { type: Date },
    location: { type: String },
    googleLocationLink: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    },
    category: { type: String },
    tags: [{ type: String, trim: true }],
    photos: [{ type: String }],
    coverPhoto: { type: String },
    maxParticipants: { type: Number },
    teamRequirements: {
      girlsRequired: { type: Number },
      boysRequired: { type: Number }
    },
    price: { type: Number },
    prizePool: {
      totalAmount: { type: Number },
      firstPlace: { type: Number },
      secondPlace: { type: Number },
      thirdPlace: { type: Number },
      consolationPrizes: [{ type: Number }],
      currency: { type: String }
    },
    currency: { type: String },
    eventType: { type: String },
    virtualMeetingLink: { type: String },
    contactEmail: { type: String },
    contactPhone: { type: String },
    website: { type: String },
    socialLinks: {
      facebook: { type: String },
      twitter: { type: String },
      instagram: { type: String },
      linkedin: { type: String }
    }
  }
}, { timestamps: true });

// Virtual field to calculate team size
eventSchema.virtual('teamSize').get(function() {
  return (this.teamRequirements?.girlsRequired || 0) + (this.teamRequirements?.boysRequired || 0);
});

// Pre-save middleware to validate team requirements
eventSchema.pre('save', function(next) {
  if (this.teamRequirements) {
    const girlsRequired = this.teamRequirements.girlsRequired || 0;
    const boysRequired = this.teamRequirements.boysRequired || 0;
    const calculatedTeamSize = girlsRequired + boysRequired;
    
    // Validate that girls + boys don't exceed maxParticipants if set
    if (this.maxParticipants && calculatedTeamSize > this.maxParticipants) {
      return next(new Error(`Team size (${calculatedTeamSize}) cannot exceed maximum participants (${this.maxParticipants})`));
    }
    
    // Validate that girls and boys requirements are reasonable
    if (girlsRequired < 0 || boysRequired < 0) {
      return next(new Error('Girls and boys requirements cannot be negative'));
    }
    
    if (calculatedTeamSize === 0) {
      return next(new Error('Team must have at least one member (girls or boys)'));
    }
  }
  
  // Validate prize pool if provided
  if (this.prizePool) {
    const { firstPlace, secondPlace, thirdPlace, consolationPrizes, totalAmount } = this.prizePool;
    const calculatedTotal = (firstPlace || 0) + (secondPlace || 0) + (thirdPlace || 0) + 
                           (consolationPrizes?.reduce((sum, prize) => sum + (prize || 0), 0) || 0);
    
    if (totalAmount && calculatedTotal > totalAmount) {
      return next(new Error(`Total prize distribution (${calculatedTotal}) cannot exceed total prize pool (${totalAmount})`));
    }
  }
  
  next();
});

export const Event = mongoose.model('Event', eventSchema);


