import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ah, badRequest } from '../utils/errors.js';
import { presentTrip } from '../utils/present.js';
import * as boarding from '../services/boarding.js';

const router = Router();
router.use(requireAuth, requireRole('driver'));

router.get('/trips', ah(async (req, res) => {
  const list = await boarding.myTrips(req.user);
  res.json({ trips: list.map(({ trip, booked, boarded }) => ({ ...presentTrip(trip), booked, boarded })) });
}));

router.get('/trips/:id', ah(async (req, res) => {
  const trip = await boarding.ownedTrip(req.user, req.params.id);
  res.json({
    trip: presentTrip(trip),
    stats: await boarding.stats(trip.id),
    passengers: await boarding.passengers(trip.id),
  });
}));

// Scan d'un QR (body { qr }) ou saisie manuelle (body { number })
router.post('/trips/:id/scan', ah(async (req, res) => {
  const { qr, number } = req.body || {};
  if (!qr && !number) throw badRequest('Envoyez le contenu du QR (qr) ou le numéro de réservation (number).');
  res.json(await boarding.scan(req.user, req.params.id, { qr, number }));
}));

// Ouvrir l'embarquement / départ / terminé
router.post('/trips/:id/status', ah(async (req, res) => {
  const t = await boarding.setTripStatus(req.user, req.params.id, (req.body || {}).status);
  res.json({ trip: presentTrip(t), stats: await boarding.stats(t.id) });
}));

router.post('/trips/:id/reservations/:rid/board', ah(async (req, res) => {
  res.json({ stats: await boarding.setBoarded(req.user, req.params.id, req.params.rid, true) });
}));
router.post('/trips/:id/reservations/:rid/unboard', ah(async (req, res) => {
  res.json({ stats: await boarding.setBoarded(req.user, req.params.id, req.params.rid, false) });
}));

export default router;
