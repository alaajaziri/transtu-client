import { call } from './http';
import { ENDPOINTS, PAYLOAD } from '../config/endpoints';
import { normalizeReservation, unwrapList, unwrapObject } from '../utils/normalize';
import { tripService } from './tripService';

const KEYS = ['reservation', 'booking', 'data', 'result'];

/** Si la réservation ne contient que l'id du trajet, on va chercher le trajet. */
async function hydrate(list) {
  const need = [...new Set(list.filter((r) => r.tripId && !r.trip.from && !r.trip.to).map((r) => r.tripId))];
  const trips = new Map();
  await Promise.all(need.map(async (id) => {
    try { trips.set(String(id), await tripService.get(id)); } catch { /* le trajet restera vide */ }
  }));
  return list.map((r) => (trips.has(String(r.tripId)) ? { ...r, trip: trips.get(String(r.tripId)) } : r));
}

export const reservationService = {
  async mine() {
    const res = await call(ENDPOINTS.reservations.mine);
    return hydrate(unwrapList(res).map((r) => normalizeReservation(r)));
  },
  async get(id) {
    const res = await call(ENDPOINTS.reservations.one(id));
    const r = normalizeReservation(unwrapObject(res, KEYS), id);
    return (await hydrate([r]))[0];
  },
  async create({ tripId, seat }) {
    const res = await call(ENDPOINTS.reservations.create, { body: PAYLOAD.createReservation({ tripId, seat }) });
    tripService.invalidate(tripId);
    const r = normalizeReservation(unwrapObject(res, KEYS));
    if (r.tripId == null) r.tripId = tripId;
    if (r.seat == null) r.seat = seat; // siège accepté par le backend
    return r;
  },
  async update(id, { seat }) {
    await call(ENDPOINTS.reservations.update(id), { body: PAYLOAD.updateReservation({ seat }) });
  },
  async cancel(id) {
    await call(ENDPOINTS.reservations.cancel(id));
  },
};
