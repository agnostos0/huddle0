import mongoose from 'mongoose';
import { config } from './src/config/env.js';
import { User } from './src/models/User.js';
import { Event } from './src/models/Event.js';
import { Team } from './src/models/Team.js';
import { Invite } from './src/models/Invite.js';

async function clearDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB successfully');

    console.log('🗑️  Clearing all collections...');
    
    // Clear all collections
    const collections = [User, Event, Team, Invite];
    
    for (const collection of collections) {
      const count = await collection.countDocuments();
      await collection.deleteMany({});
      console.log(`✅ Cleared ${count} documents from ${collection.modelName}`);
    }

    console.log('🎉 Database cleared successfully!');
    console.log('📝 You can now start fresh with new registrations and data.');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

clearDatabase();
