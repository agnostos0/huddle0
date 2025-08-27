import mongoose from 'mongoose';
import { env } from './src/config/env.js';

async function clearDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(env.mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log('🗑️  Clearing all collections...');
    
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`   Clearing collection: ${collectionName}`);
      await mongoose.connection.db.collection(collectionName).deleteMany({});
    }
    
    console.log('✅ Database cleared successfully!');
    console.log('📊 Collections cleared:');
    collections.forEach(col => console.log(`   - ${col.name}`));
    
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

clearDatabase();
