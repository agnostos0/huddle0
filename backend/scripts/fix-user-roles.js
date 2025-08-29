import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixUserRoles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users that are organizers but shouldn't be (except admins)
    const organizerUsers = await User.find({ 
      role: 'organizer',
      email: { $ne: 'admin@huddle.com' } // Exclude admin
    });

    console.log(`Found ${organizerUsers.length} users with organizer role that need to be demoted`);

    if (organizerUsers.length > 0) {
      // Demote them to user (attendee) role
      const result = await User.updateMany(
        { 
          role: 'organizer',
          email: { $ne: 'admin@huddle.com' }
        },
        { 
          role: 'user',
          'organizerProfile.isVerified': false,
          'organizerProfile.hasRequestedOrganizer': false,
          'organizerProfile.organizerRequestStatus': 'pending'
        }
      );

      console.log(`Demoted ${result.modifiedCount} users from organizer to attendee role`);
    }

    // Ensure all users have a role (default to 'user' if missing)
    const usersWithoutRole = await User.find({ role: { $exists: false } });
    
    if (usersWithoutRole.length > 0) {
      const result = await User.updateMany(
        { role: { $exists: false } },
        { role: 'user' }
      );
      
      console.log(`Set default role for ${result.modifiedCount} users`);
    }

    // Show final statistics
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\nFinal user role distribution:');
    stats.forEach(stat => {
      console.log(`${stat._id || 'no role'}: ${stat.count} users`);
    });

    console.log('\nUser roles fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing user roles:', error);
    process.exit(1);
  }
}

fixUserRoles();
