import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const config = {
  root,
  port: Number(process.env.PORT) || 5000,
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-me',
  jwtExpires: process.env.JWT_EXPIRES || '7d',
  qrSecret: process.env.QR_SECRET || 'dev-qr-secret-change-me',
  tz: process.env.APP_TZ || 'Africa/Tunis',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  dbFile: path.resolve(root, process.env.DB_FILE || './data/db.json'),
};
