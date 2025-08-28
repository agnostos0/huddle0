import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './src/config/env.js';
import { connectToDatabase } from './src/db/mongoose.js';
import authRoutes from './src/routes/auth.routes.js';
import eventRoutes from './src/routes/events.routes.js';
import userRoutes from './src/routes/users.routes.js';
import teamRoutes from './src/routes/teams.routes.js';
import inviteRoutes from './src/routes/invites.routes.js';
import adminRoutes from './src/routes/admin.routes.js';
import notificationRoutes from './src/routes/notifications.routes.js';
import otpRoutes from './src/routes/otp.routes.js';
import paymentRoutes from './src/routes/payments.routes.js';

const app = express();

// Allow multiple origins for development and production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174', 
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'https://huddle-e6492.web.app',
  'https://huddle-e6492.firebaseapp.com',
  'https://huddle-frontend.vercel.app',
  'https://huddle-frontend-git-main.vercel.app',
  'https://huddle-frontend-git-develop.vercel.app',
  'https://eventify-frontend.vercel.app',
  'https://eventify-frontend-git-main.vercel.app',
  'https://frontend-80mhyiqvf-princetagadiyas-projects.vercel.app',
  env.clientOrigin
].filter(Boolean);

app.use(cors({ 
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS: Blocked origin:', origin);
      console.log('CORS: Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'huddle-backend-firebase' });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/payments', paymentRoutes);

// Initialize database connection
let dbConnected = false;

const initializeApp = async () => {
  if (!dbConnected) {
    try {
      await connectToDatabase();
      dbConnected = true;
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }
};

// Firebase Functions handler
export const api = onRequest(
  {
    region: 'us-central1',
    maxInstances: 10,
    timeoutSeconds: 540,
    memory: '1GiB'
  },
  async (req, res) => {
    try {
      await initializeApp();
      app(req, res);
    } catch (error) {
      console.error('Function error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);
