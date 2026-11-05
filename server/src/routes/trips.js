import { Router } from 'express';
import { store } from '../store/index.js';
import { ah, notFound } from '../utils/errors.js';
import { fold } from '../utils/validate.js';
import { presentTrip } from '../utils/present.js';
import { occupiedSeats } from '../services/reservations.js';
import { config } from '../config.js';

const router = Router();

const dayInTz = (iso) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: config.tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));

// Trajets à venir et encore ouverts à la réservation. Filtres : ?departure= &destination= &date=YYYY-MM-DD
router.get('/', ah(async (req, res) => {
  const { departure, destination, date } = req.query;
  const now = Date.now();
  const list = (await store.trips.list())
    .filter((t) => t.status === 'scheduled' && new Date(t.departureTime).getTime() > now)
    .filter((t) => !departure || fold(t.departure).includes(fold(departure)))
    .filter((t) => !destination || fold(t.destination).includes(fold(destination)))
    .filter((t) => !date || dayInTz(t.departureTime) === String(date))
    .sort((a, b) => a.departureTime.localeCompare(b.departureTime));
  const out = await Promise.all(list.map(async (t) => presentTrip(t, await occupiedSeats(t.id))));
  res.json({ trips: out });
}));

router.get('/:id', ah(async (req, res) => {
  const t = await store.trips.get(req.params.id);
  if (!t) throw notFound('Trajet introuvable.');
  res.json({ trip: presentTrip(t, await occupiedSeats(t.id)) });
}));

router.get('/:id/seats', ah(async (req, res) => {
  const t = await store.trips.get(req.params.id);
  if (!t) throw notFound('Trajet introuvable.');
  res.json({ totalSeats: t.totalSeats, occupiedSeats: await occupiedSeats(t.id) });
}));

export default router;
