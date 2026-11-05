import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { store } from '../store/index.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { ah, badRequest, conflict, unauthorized } from '../utils/errors.js';
import { isEmail, isPhone, normEmail, normPhone } from '../utils/validate.js';
import { publicUser } from '../utils/present.js';

const router = Router();

router.post('/register', ah(async (req, res) => {
  const { name, email, phone, password } = req.body || {};
  const errors = [];
  if (String(name || '').trim().length < 2) errors.push('Nom complet requis.');
  if (!isEmail(email)) errors.push('Adresse e-mail invalide.');
  if (!isPhone(phone)) errors.push('Numéro de téléphone invalide (8 chiffres).');
  if (String(password || '').length < 6) errors.push('Mot de passe : 6 caractères minimum.');
  if (errors.length) throw badRequest(errors.join(' '), { errors });

  if (await store.users.findByEmail(normEmail(email))) throw conflict('Un compte existe déjà avec cet e-mail.');
  // Le rôle n'est JAMAIS lu depuis la requête : une inscription crée toujours un client.
  const user = await store.users.create({
    name: String(name).trim(), email: normEmail(email), phone: normPhone(phone), role: 'client',
    passwordHash: bcrypt.hashSync(String(password), 10), createdAt: new Date().toISOString(),
  });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

router.post('/login', ah(async (req, res) => {
  const { email, password } = req.body || {};
  const user = await store.users.findByEmail(normEmail(email));
  const ok = user && bcrypt.compareSync(String(password || ''), user.passwordHash);
  if (!ok) throw unauthorized('E-mail ou mot de passe incorrect.');
  res.json({ token: signToken(user), user: publicUser(user) });
}));

router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

export default router;
