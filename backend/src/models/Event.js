import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  maxParticipants: { type: Number, default: 0 },
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
  currency: { type: String, default: 'USD' },
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
  }
}, { timestamps: true });

export const Event = mongoose.model('Event', eventSchema);


