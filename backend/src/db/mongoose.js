import mongoose from 'mongoose';
import { env } from '../config/env.js';

export async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  mongoose.set('strictQuery', true);
  
  try {
    // Try Atlas connection first
    const connectionOptions = {
      autoIndex: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    };

    await mongoose.connect(env.mongoUri, connectionOptions);
    console.log('✅ Connected to MongoDB Atlas successfully');
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed:', error.message);
    
    // Try local MongoDB as fallback
    try {
      const localUri = 'mongodb://localhost:27017/eventify';
      console.log('🔄 Trying local MongoDB connection...');
      await mongoose.connect(localUri, {
        autoIndex: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log('✅ Connected to local MongoDB successfully');
      return mongoose.connection;
    } catch (localError) {
      console.error('❌ Local MongoDB also failed:', localError.message);
      console.log('💡 Please ensure MongoDB is running locally or check Atlas IP whitelist');
      throw error;
    }
  }
}


