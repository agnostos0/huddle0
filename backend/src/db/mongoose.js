import mongoose from 'mongoose';
import { env } from '../config/env.js';

export async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri, {
    autoIndex: true,
  });
  return mongoose.connection;
}


