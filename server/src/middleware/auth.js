import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { store } from '../store/index.js';
import { ah, forbidden, unauthorized } from '../utils/errors.js';

export const signToken = (user) =>
  jwt.sign({ sub: String(user.id), role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpires });

/** Exige un JWT valide ; charge l'utilisateur depuis la base (req.user). */
export const requireAuth = ah(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw unauthorized();
  let payload;
  try { payload = jwt.verify(token, config.jwtSecret); } catch { throw unauthorized('Session expirée, reconnectez-vous.'); }
  const user = await store.users.findById(payload.sub);
  if (!user) throw unauthorized('Compte introuvable.');
  req.user = user;
  next();
});

export const requireRole = (...roles) => (req, _res, next) =>
  roles.includes(req.user?.role) ? next() : next(forbidden('Cette action est réservée au personnel autorisé.'));
