import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  username: {
    type: String,
    unique: true,
    trim: true,
    sparse: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'organizer', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  socialLinks: {
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String,
    website: String
  },
  organizerProfile: {
    isVerified: {
      type: Boolean,
      default: false
    },
    organization: String,
    description: String,
    contactEmail: String,
    contactPhone: String
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    privacy: {
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false }
    }
  },
  notice: {
    type: String,
    default: ''
  },
  noticeDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if user has permission
userSchema.methods.hasPermission = function(permission) {
  const permissions = {
    user: ['view_events', 'join_events', 'create_teams', 'join_teams'],
    organizer: ['view_events', 'join_events', 'create_teams', 'join_teams', 'create_events', 'manage_own_events', 'view_own_analytics'],
    admin: ['view_events', 'join_events', 'create_teams', 'join_teams', 'create_events', 'manage_own_events', 'view_own_analytics', 'manage_all_events', 'manage_users', 'manage_teams', 'view_all_analytics', 'moderate_content']
  };
  
  return permissions[this.role]?.includes(permission) || false;
};

// Check if user is organizer or admin
userSchema.methods.isOrganizer = function() {
  return this.role === 'organizer' || this.role === 'admin';
};

// Check if user is admin
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

export const User = mongoose.model('User', userSchema);


