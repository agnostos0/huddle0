import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { connectToDatabase } from './db/mongoose.js';
import authRoutes from './routes/auth.routes.js';
import eventRoutes from './routes/events.routes.js';
import userRoutes from './routes/users.routes.js';
import teamRoutes from './routes/teams.routes.js';
import inviteRoutes from './routes/invites.routes.js';

const app = express();

app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(helmet());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'eventify-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/invites', inviteRoutes);

async function start() {
  try {
    await connectToDatabase();
    app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Eventify backend listening on port ${env.port}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();


