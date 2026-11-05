// Met en forme les objets envoyés au client (noms de champs lus par src/utils/normalize.js).
import { buildQr } from '../services/qr.js';

export const publicUser = (u) => (u ? { id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role } : null);

/** occupied = tableau de numéros de sièges pris, ou null si inconnu */
export function presentTrip(t, occupied = null) {
  if (!t) return null;
  const out = {
    id: t.id,
    line: t.line,
    departure: t.departure,
    destination: t.destination,
    departureTime: t.departureTime,
    arrivalTime: t.arrivalTime,
    price: t.price,
    totalSeats: t.totalSeats,
    status: t.status,
  };
  if (occupied) {
    out.occupiedSeats = occupied;
    out.availableSeats = t.totalSeats - occupied.length;
  }
  return out;
}

/** withQr : uniquement pour le propriétaire du billet. */
export function presentReservation(r, trip, user, { withQr = false } = {}) {
  const out = {
    id: r.id,
    reservationNumber: r.number,
    status: r.status,
    seatNumber: r.seatNumber,
    tripId: r.tripId,
    trip: presentTrip(trip),
    price: r.price,
    createdAt: r.createdAt,
    boardedAt: r.boardedAt,
    passenger: user?.name ?? null,
  };
  if (withQr && r.status !== 'cancelled') out.qrPayload = buildQr(r);
  return out;
}
