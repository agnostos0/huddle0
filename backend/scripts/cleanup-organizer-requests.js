import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import User model
const { User } = await import('../src/models/User.js');

async function cleanupOrganizerRequests() {
  try {
    console.log('Starting organizer request cleanup...');

    // Find all users who are 'user' role but have organizer requests
    const usersToCleanup = await User.find({
      role: 'user',
      'organizerProfile.hasRequestedOrganizer': true
    });

    console.log(`Found ${usersToCleanup.length} users with organizer requests to cleanup`);

    for (const user of usersToCleanup) {
      console.log(`Cleaning up organizer request for user: ${user.email} (${user.username})`);
      
      // Reset organizer profile
      user.organizerProfile.hasRequestedOrganizer = false;
      user.organizerProfile.organizerRequestStatus = 'pending';
      user.organizerProfile.organizerRequestReason = '';
      user.organizerProfile.organizerRequestDate = null;
      user.organizerProfile.organizerRequestRejectionReason = '';
      user.organizerProfile.approvedBy = null;
      user.organizerProfile.approvedAt = null;
      user.organizerProfile.isVerified = false;

      await user.save();
      console.log(`✅ Cleaned up organizer request for: ${user.email}`);
    }

    console.log('Organizer request cleanup completed successfully!');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupOrganizerRequests();
