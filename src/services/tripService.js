import { call, isMissing } from './http';
import { ENDPOINTS, SEARCH_PARAMS } from '../config/endpoints';
import { normalizeTrip, unwrapList, unwrapObject, parseSeats } from '../utils/normalize';
import { norm, sameDay } from '../utils/format';

const cache = new Map();

function matches(t, f) {
  if (f.from && !norm(t.from).includes(norm(f.from))) return false;
  if (f.to && !norm(t.to).includes(norm(f.to))) return false;
  if (f.date && t.departureAt) {
    const d = new Date(`${f.date}T00:00:00`);
    if (!sameDay(d, t.departureAt)) return false;
  }
  return true;
}

export const tripService = {
  async list(filters = {}) {
    const params = {};
    ['from', 'to', 'date'].forEach((k) => { if (filters[k]) params[SEARCH_PARAMS[k]] = filters[k]; });
    const res = await call(ENDPOINTS.trips.list, { params });
    return unwrapList(res)
      .map((r) => normalizeTrip(r))
      .filter((t) => matches(t, filters))
      .sort((a, b) => (a.departureAt?.getTime() ?? Infinity) - (b.departureAt?.getTime() ?? Infinity));
  },

  get(id, { fresh = false } = {}) {
    if (fresh) cache.delete(String(id));
    if (!cache.has(String(id))) {
      const p = call(ENDPOINTS.trips.one(id)).then((r) => normalizeTrip(unwrapObject(r, ['trip', 'voyage', 'data', 'result']), id));
      p.catch(() => cache.delete(String(id)));
      cache.set(String(id), p);
    }
    return cache.get(String(id));
  },

  invalidate(id) { cache.delete(String(id)); },

  /** Trajet + état des sièges (toujours frais). */
  async seatState(id) {
    const trip = await this.get(id, { fresh: true });
    let parsed = { total: null, occupied: null };
    try {
      parsed = parseSeats(await call(ENDPOINTS.trips.seats(id)));
    } catch (e) {
      if (!isMissing(e)) throw e;
    }
    const total = parsed.total ?? trip.total;
    const occupied = parsed.occupied ?? trip.occupied;
    return { trip, total, occupied: occupied || [], occupancyKnown: occupied != null };
  },
};
