import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { ah } from '../utils/errors.js';
import { presentReservation } from '../utils/present.js';
import * as svc from '../services/reservations.js';

const router = Router();
router.use(requireAuth);

const send = (res, { r, trip }, user, status = 200) =>
  res.status(status).json({ reservation: presentReservation(r, trip, user, { withQr: true }) });

// Doit être déclarée AVANT "/:id"
router.get('/me', ah(async (req, res) => {
  const list = await svc.listMine(req.user);
  res.json({ reservations: list.map(({ r, trip }) => presentReservation(r, trip, req.user, { withQr: true })) });
}));

router.post('/', ah(async (req, res) => {
  send(res, await svc.create(req.user, req.body || {}), req.user, 201);
}));

router.get('/:id', ah(async (req, res) => send(res, await svc.getMine(req.user, req.params.id), req.user)));

router.put('/:id', ah(async (req, res) => {
  send(res, await svc.changeSeat(req.user, req.params.id, (req.body || {}).seatNumber), req.user);
}));

router.patch('/:id/cancel', ah(async (req, res) => send(res, await svc.cancel(req.user, req.params.id), req.user)));

export default router;
