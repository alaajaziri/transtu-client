import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { store } from '../store/index.js';
import { requireAuth } from '../middleware/auth.js';
import { ah, badRequest, unauthorized } from '../utils/errors.js';
import { isPhone, normPhone } from '../utils/validate.js';
import { publicUser } from '../utils/present.js';

const router = Router();
router.use(requireAuth);

router.get('/me', (req, res) => res.json({ user: publicUser(req.user) }));

router.put('/me', ah(async (req, res) => {
  const { name, phone } = req.body || {};
  const patch = {};
  if (name !== undefined) {
    if (String(name).trim().length < 2) throw badRequest('Nom complet requis.');
    patch.name = String(name).trim();
  }
  if (phone !== undefined) {
    if (!isPhone(phone)) throw badRequest('Numéro de téléphone invalide (8 chiffres).');
    patch.phone = normPhone(phone);
  }
  const user = await store.users.update(req.user.id, patch);
  res.json({ user: publicUser(user) });
}));

router.put('/me/password', ah(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!bcrypt.compareSync(String(currentPassword || ''), req.user.passwordHash)) throw unauthorized('Mot de passe actuel incorrect.');
  if (String(newPassword || '').length < 6) throw badRequest('Nouveau mot de passe : 6 caractères minimum.');
  await store.users.update(req.user.id, { passwordHash: bcrypt.hashSync(String(newPassword), 10) });
  res.json({ message: 'Mot de passe modifié.' });
}));

export default router;
