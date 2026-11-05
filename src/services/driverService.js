import { call } from './http';
import { ENDPOINTS, PAYLOAD } from '../config/endpoints';
import { normalizeTrip, unwrapList } from '../utils/normalize';

const toDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d) ? null : d;
};

/** Trajet + compteurs (booked = places réservées, boarded = déjà embarquées) */
const toTrip = (raw) => ({ ...normalizeTrip(raw), booked: Number(raw?.booked ?? 0), boarded: Number(raw?.boarded ?? 0) });

export const driverService = {
  /** Mes trajets (à partir de 6 h avant maintenant, hors terminés) */
  async trips() {
    return unwrapList(await call(ENDPOINTS.driver.trips)).map(toTrip);
  },

  /** { trip, stats: {booked, boarded}, passengers: [...] } */
  async trip(id) {
    const res = await call(ENDPOINTS.driver.trip(id));
    return {
      trip: normalizeTrip(res.trip, id),
      stats: { booked: Number(res.stats?.booked ?? 0), boarded: Number(res.stats?.boarded ?? 0) },
      passengers: (res.passengers || []).map((p) => ({ ...p, boardedAt: toDate(p.boardedAt) })),
    };
  },

  /**
   * Scan d'un QR ({ qr }) ou saisie du numéro ({ number }).
   * Résultat métier TOUJOURS en HTTP 200 : { ok, code, message, reservation?, stats? }
   */
  scan(id, input) {
    return call(ENDPOINTS.driver.scan(id), { body: PAYLOAD.scan(input) });
  },

  /** 'boarding' | 'departed' | 'completed' */
  setStatus(id, status) {
    return call(ENDPOINTS.driver.status(id), { body: PAYLOAD.tripStatus(status) });
  },
  board(id, reservationId) { return call(ENDPOINTS.driver.board(id, reservationId)); },
  unboard(id, reservationId) { return call(ENDPOINTS.driver.unboard(id, reservationId)); },
};
