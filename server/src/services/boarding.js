/** Règles métier côté chauffeur : trajets, scan du QR, embarquement. N'utilise que `store`. */
import { store } from '../store/index.js';
import { withLock } from '../utils/mutex.js';
import { badRequest, conflict, forbidden, notFound } from '../utils/errors.js';
import { normalizeNumber } from './numbers.js';
import { parseQr, verifyQr } from './qr.js';

const OPEN = ['scheduled', 'boarding']; // statuts où l'on peut embarquer
const NEXT = { scheduled: ['boarding', 'departed'], boarding: ['departed'], departed: ['completed'] };

export async function ownedTrip(driver, tripId) {
  const trip = await store.trips.get(tripId);
  if (!trip) throw notFound('Trajet introuvable.');
  if (String(trip.driverId) !== String(driver.id)) throw forbidden("Ce trajet n'est pas le vôtre.");
  return trip;
}

export async function stats(tripId) {
  const list = (await store.reservations.listByTrip(tripId)).filter((r) => r.status !== 'cancelled');
  return { booked: list.length, boarded: list.filter((r) => r.status === 'boarded').length };
}

/** Trajets du chauffeur : à partir de 6 h avant maintenant, hors terminés/annulés. */
export async function myTrips(driver) {
  const since = Date.now() - 6 * 3600 * 1000;
  const list = (await store.trips.listByDriver(driver.id))
    .filter((t) => !['completed', 'cancelled'].includes(t.status) && new Date(t.departureTime).getTime() >= since)
    .sort((a, b) => a.departureTime.localeCompare(b.departureTime));
  return Promise.all(list.map(async (t) => ({ trip: t, ...(await stats(t.id)) })));
}

export async function passengers(tripId) {
  const list = (await store.reservations.listByTrip(tripId)).filter((r) => r.status !== 'cancelled');
  const users = new Map();
  for (const r of list) if (!users.has(r.userId)) users.set(r.userId, await store.users.findById(r.userId));
  return list
    .sort((a, b) => a.seatNumber - b.seatNumber)
    .map((r) => ({
      reservationId: r.id,
      reservationNumber: r.number,
      seatNumber: r.seatNumber,
      status: r.status,
      passengerName: users.get(r.userId)?.name ?? '—',
      passengerPhone: users.get(r.userId)?.phone ?? null,
      boardedAt: r.boardedAt,
    }));
}

export function setTripStatus(driver, tripId, status) {
  return withLock(async () => {
    const trip = await ownedTrip(driver, tripId);
    if (!(NEXT[trip.status] || []).includes(status)) {
      throw conflict(`Impossible de passer de « ${trip.status} » à « ${status} ».`);
    }
    return store.trips.update(trip.id, { status });
  });
}

const fail = (code, message, extra = {}) => ({ ok: false, code, message, ...extra });

/**
 * Scanner un billet. Renvoie TOUJOURS un résultat { ok, code, message, ... } (HTTP 200)
 * pour que l'écran du chauffeur affiche vert/rouge sans traiter ça comme une panne réseau.
 *   input = { qr } (scan)  ou  { number } (saisie manuelle)
 * Codes : BOARDED, ALREADY_BOARDED, INVALID_QR, NOT_FOUND, WRONG_TRIP, CANCELLED, TRIP_CLOSED
 */
export function scan(driver, tripId, input) {
  return withLock(async () => {
    const trip = await ownedTrip(driver, tripId);
    if (!OPEN.includes(trip.status)) return fail('TRIP_CLOSED', "L'embarquement est terminé pour ce trajet.");

    let reservation;
    const manual = !input?.qr;
    if (input?.qr) {
      const parsed = parseQr(input.qr);
      if (!parsed) return fail('INVALID_QR', "Ce code n'est pas un billet TRANSTU.");
      reservation = await store.reservations.findByNumber(parsed.number);
      if (!reservation) return fail('NOT_FOUND', 'Billet inconnu.');
      if (!verifyQr(parsed, reservation)) {
        return fail('INVALID_QR', 'QR invalide ou périmé (siège modifié ?). Demandez le billet à jour ou saisissez le numéro.');
      }
    } else {
      const number = normalizeNumber(input?.number);
      if (!number) throw badRequest('Numéro de réservation invalide (ex. TR-8F3K2Q).');
      reservation = await store.reservations.findByNumber(number);
      if (!reservation) return fail('NOT_FOUND', 'Aucune réservation avec ce numéro.');
    }

    const passenger = await store.users.findById(reservation.userId);
    const info = {
      reservation: {
        id: reservation.id, reservationNumber: reservation.number, seatNumber: reservation.seatNumber,
        passengerName: passenger?.name ?? '—', boardedAt: reservation.boardedAt, manual,
      },
    };

    if (String(reservation.tripId) !== String(trip.id)) {
      const other = await store.trips.get(reservation.tripId);
      return fail('WRONG_TRIP', other
        ? `Ce billet est pour un autre trajet : ${other.departure} → ${other.destination}.`
        : 'Ce billet est pour un autre trajet.', info);
    }
    if (reservation.status === 'cancelled') return fail('CANCELLED', 'Réservation annulée.', info);
    if (reservation.status === 'boarded') return fail('ALREADY_BOARDED', 'Ce billet a déjà été utilisé.', info);

    const boardedAt = new Date().toISOString();
    await store.reservations.update(reservation.id, { status: 'boarded', boardedAt, boardedBy: driver.id });
    if (trip.status === 'scheduled') await store.trips.update(trip.id, { status: 'boarding' });
    info.reservation.boardedAt = boardedAt;
    return { ok: true, code: 'BOARDED', message: 'Embarquement validé.', ...info, stats: await stats(trip.id) };
  });
}

/** Embarquement / annulation d'embarquement à la main depuis la liste des passagers. */
export function setBoarded(driver, tripId, reservationId, boarded) {
  return withLock(async () => {
    const trip = await ownedTrip(driver, tripId);
    if (!OPEN.includes(trip.status)) throw conflict("L'embarquement est terminé pour ce trajet.");
    const r = await store.reservations.get(reservationId);
    if (!r || String(r.tripId) !== String(trip.id)) throw notFound('Réservation introuvable sur ce trajet.');
    if (r.status === 'cancelled') throw conflict('Réservation annulée.');
    if (boarded && r.status === 'boarded') throw conflict('Déjà embarqué.');
    if (!boarded && r.status !== 'boarded') throw conflict("Ce passager n'est pas embarqué.");
    await store.reservations.update(r.id, boarded
      ? { status: 'boarded', boardedAt: new Date().toISOString(), boardedBy: driver.id }
      : { status: 'confirmed', boardedAt: null, boardedBy: null });
    if (boarded && trip.status === 'scheduled') await store.trips.update(trip.id, { status: 'boarding' });
    return stats(trip.id);
  });
}
