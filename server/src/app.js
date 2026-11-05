import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { errorHandler } from './utils/errors.js';
import authRoutes from './routes/auth.js';
import tripRoutes from './routes/trips.js';
import reservationRoutes from './routes/reservations.js';
import userRoutes from './routes/users.js';
import driverRoutes from './routes/driver.js';

export function createApp() {
  const app = express();
  const origins = config.corsOrigin === '*' ? '*' : config.corsOrigin.split(',').map((s) => s.trim());
  app.use(cors({ origin: origins })); // JWT en en-tête (pas de cookies) : pas de credentials
  app.use(express.json({ limit: '100kb' }));

  const api = express.Router();
  api.get('/health', (_req, res) => res.json({ ok: true }));
  api.use('/auth', authRoutes);
  api.use('/trips', tripRoutes);
  api.use('/reservations', reservationRoutes);
  api.use('/users', userRoutes);
  api.use('/driver', driverRoutes);
  api.use((_req, res) => res.status(404).json({ message: 'Route inconnue.' }));
  app.use('/api', api);

  app.use(errorHandler);
  return app;
}
