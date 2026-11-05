/** Règles métier des réservations (passager). N'utilise que `store`. */
import { store } from '../store/index.js';
import { withLock } from '../utils/mutex.js';
import { badRequest, conflict, notFound } from '../utils/errors.js';
import { newReservationNumber } from './numbers.js';

const isActive = (r) => r.status !== 'cancelled';

export async function occupiedSeats(tripId) {
  const list = await store.reservations.listByTrip(tripId);
  return list.filter(isActive).map((r) => String(r.seatNumber));
}

function parseSeat(value, trip) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > trip.totalSeats) {
    throw badRequest(`Siège invalide : choisissez un numéro entre 1 et ${trip.totalSeats}.`);
  }
  return n;
}

const departureOf = (trip) => new Date(trip.departureTime);
const isFuture = (trip) => departureOf(trip) > new Date();
// Modifier / annuler reste possible tant que le bus n'est pas parti (même embarquement ouvert)
const canModify = (trip) => ['scheduled', 'boarding'].includes(trip.status) && isFuture(trip);

async function loadOwned(user, id) {
  const r = await store.reservations.get(id);
  // 404 (et pas 403) : on ne révèle pas l'existence du billet d'un autre passager
  if (!r || String(r.userId) !== String(user.id)) throw notFound('Réservation introuvable.');
  const trip = await store.trips.get(r.tripId);
  return { r, trip };
}

export async function listMine(user) {
  const list = await store.reservations.listByUser(user.id);
  const trips = new Map();
  for (const r of list) if (!trips.has(r.tripId)) trips.set(r.tripId, await store.trips.get(r.tripId));
  return list
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((r) => ({ r, trip: trips.get(r.tripId) }));
}

export const getMine = (user, id) => loadOwned(user, id);

export function create(user, { tripId, seatNumber }) {
  return withLock(async () => {
    const trip = tripId != null ? await store.trips.get(tripId) : null;
    if (!trip) throw notFound('Trajet introuvable.');
    if (trip.status !== 'scheduled' || !isFuture(trip)) throw conflict("Ce trajet n'est plus ouvert à la réservation.");
    const seat = parseSeat(seatNumber, trip);

    const existing = await store.reservations.listByTrip(trip.id);
    const active = existing.filter(isActive);
    if (active.some((r) => String(r.userId) === String(user.id))) {
      throw conflict('Vous avez déjà une réservation sur ce trajet.');
    }
    if (active.some((r) => r.seatNumber === seat)) throw conflict(`Le siège ${seat} est déjà réservé. Choisissez-en un autre.`);

    let number;
    do { number = newReservationNumber(); } while (await store.reservations.findByNumber(number));

    const r = await store.reservations.create({
      number, userId: user.id, tripId: trip.id, seatNumber: seat, status: 'confirmed',
      price: trip.price, createdAt: new Date().toISOString(), boardedAt: null, boardedBy: null,
    });
    return { r, trip };
  });
}

export function changeSeat(user, id, seatNumber) {
  return withLock(async () => {
    const { r, trip } = await loadOwned(user, id);
    if (r.status !== 'confirmed') throw conflict('Seule une réservation confirmée peut être modifiée.');
    if (!canModify(trip)) throw conflict("Ce voyage n'est plus modifiable.");
    const seat = parseSeat(seatNumber, trip);
    if (seat === r.seatNumber) return { r, trip };
    const others = (await store.reservations.listByTrip(trip.id)).filter((x) => isActive(x) && x.id !== r.id);
    if (others.some((x) => x.seatNumber === seat)) throw conflict(`Le siège ${seat} est déjà réservé.`);
    // Le QR est signé avec le siège : l'ancien QR devient automatiquement invalide.
    return { r: await store.reservations.update(r.id, { seatNumber: seat }), trip };
  });
}

export function cancel(user, id) {
  return withLock(async () => {
    const { r, trip } = await loadOwned(user, id);
    if (r.status === 'cancelled') throw conflict('Cette réservation est déjà annulée.');
    if (r.status === 'boarded') throw conflict('Vous êtes déjà embarqué : annulation impossible.');
    if (!canModify(trip)) throw conflict("Ce voyage n'est plus annulable.");
    return { r: await store.reservations.update(r.id, { status: 'cancelled', cancelledAt: new Date().toISOString() }), trip };
  });
}
