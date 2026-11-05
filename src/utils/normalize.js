/**
 * Couche d'adaptation : le backend peut nommer ses champs en français ou en
 * anglais. Chaque fonction lit les noms les plus probables. Si un champ n'est
 * pas trouvé, la valeur reste vide (jamais inventée).
 */
const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
export const pick = (o, paths, def) => {
  if (!o) return def;
  for (const p of paths) {
    const v = get(o, p);
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return def;
};
const num = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const label = (v) => {
  if (v == null) return null;
  if (typeof v === 'object') return pick(v, ['name', 'nom', 'label', 'city', 'ville', 'station', 'title']) ?? null;
  return String(v);
};
const toDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d) ? null : d;
};

export function unwrapList(res, keys = ['data', 'trips', 'reservations', 'items', 'results', 'rows', 'seats']) {
  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object') {
    for (const k of keys) {
      const v = res[k];
      if (Array.isArray(v)) return v;
      if (v && typeof v === 'object') {
        const r = unwrapList(v, keys);
        if (r.length) return r;
      }
    }
  }
  return [];
}

export function unwrapObject(res, keys) {
  let cur = res;
  for (let i = 0; i < 3; i++) {
    if (!cur || typeof cur !== 'object' || Array.isArray(cur)) break;
    const k = keys.find((x) => cur[x] && typeof cur[x] === 'object' && !Array.isArray(cur[x]));
    if (!k) break;
    cur = cur[k];
  }
  return cur;
}

const seatId = (s) =>
  typeof s === 'object' ? String(pick(s, ['seatNumber', 'number', 'numero', 'seat', 'siege', 'place', 'id', 'label'])) : String(s);

function departureOf(o) {
  const raw = pick(o, ['departureTime', 'departure_time', 'departureAt', 'dateDepart', 'date_depart', 'departureDate', 'dateTime', 'datetime', 'startTime', 'date']);
  const time = pick(o, ['time', 'heure', 'heureDepart', 'heure_depart']);
  if (raw && time && typeof raw === 'string' && !raw.includes('T') && /^\d{1,2}:\d{2}/.test(String(time))) {
    return toDate(`${raw.slice(0, 10)}T${String(time).slice(0, 5).padStart(5, '0')}`);
  }
  return toDate(raw);
}

export function normalizeTrip(raw, fallbackId) {
  const o = raw || {};
  const departureAt = departureOf(o);
  const arrRaw = pick(o, ['arrivalTime', 'arrival_time', 'arrivalAt', 'dateArrivee', 'heureArrivee', 'arrivalDate']);
  let arrivalAt = null;
  if (typeof arrRaw === 'string' && /^\d{1,2}:\d{2}$/.test(arrRaw) && departureAt) {
    const [h, m] = arrRaw.split(':').map(Number);
    arrivalAt = new Date(departureAt);
    arrivalAt.setHours(h, m, 0, 0);
  } else arrivalAt = toDate(arrRaw);

  const total = num(pick(o, ['totalSeats', 'capacity', 'capacite', 'nbPlaces', 'totalPlaces', 'nombrePlaces', 'seats_total']));
  let occ = pick(o, ['occupiedSeats', 'reservedSeats', 'takenSeats', 'bookedSeats', 'seatsTaken', 'placesReservees', 'placesOccupees', 'unavailableSeats']);
  occ = Array.isArray(occ) ? occ.map(seatId) : null;
  let available = num(pick(o, ['availableSeats', 'placesDisponibles', 'seatsAvailable', 'nbPlacesDisponibles', 'remainingSeats', 'placesRestantes']));
  if (available == null && total != null && occ) available = total - occ.length;

  return {
    id: pick(o, ['id', '_id', 'tripId', 'voyageId'], fallbackId),
    from: label(pick(o, ['departure', 'depart', 'origin', 'origine', 'from', 'villeDepart', 'departureCity', 'departureStation', 'stationDepart', 'route.from', 'route.departure'])),
    to: label(pick(o, ['destination', 'arrival', 'arrivee', 'to', 'villeArrivee', 'arrivalCity', 'arrivalStation', 'stationArrivee', 'route.to', 'route.destination'])),
    departureAt,
    arrivalAt,
    price: num(pick(o, ['price', 'prix', 'tarif', 'fare'])),
    line: label(pick(o, ['line', 'ligne', 'route.name', 'routeName', 'busLine', 'lineNumber'])),
    status: pick(o, ['status', 'statut']) ?? null, // statut du TRAJET (scheduled, boarding, departed…)
    total,
    occupied: occ,
    available,
    raw: o,
  };
}

export function normalizeReservation(raw, fallbackId) {
  const o = raw || {};
  const tripVal = pick(o, ['trip', 'voyage', 'trajet', 'tripId', 'trip_id', 'voyageId']);
  const tripObj = tripVal && typeof tripVal === 'object' ? tripVal : null;
  const tripId = tripObj ? pick(tripObj, ['id', '_id']) : tripVal;
  const trip = { ...normalizeTrip(tripObj || o), id: tripId };
  if (!tripObj) trip.status = null; // sans trajet imbriqué, "status" est celui de la réservation
  const id = pick(o, ['id', '_id', 'reservationId'], fallbackId);
  return {
    id,
    number: pick(o, ['reservationNumber', 'reservation_number', 'numero', 'numeroReservation', 'reference', 'ref', 'code', 'ticketNumber'], id),
    status: pick(o, ['status', 'statut', 'state']) ?? null,
    seat: pick(o, ['seatNumber', 'seat_number', 'seat', 'siege', 'place', 'numeroSiege', 'seatNo']) ?? null,
    tripId,
    trip,
    createdAt: toDate(pick(o, ['createdAt', 'created_at', 'dateReservation', 'date_reservation', 'bookedAt'])),
    price: num(pick(o, ['price', 'prix', 'amount', 'totalPrice', 'total'])) ?? trip.price,
    passenger: label(pick(o, ['passenger', 'passager', 'passengerName', 'user', 'client'])),
    qr: pick(o, ['qrPayload', 'qrCode', 'qr']) ?? null, // contenu signé du QR (fourni par le serveur)
    boardedAt: toDate(pick(o, ['boardedAt', 'embarqueLe'])),
    raw: o,
  };
}

export function normalizeUser(raw) {
  const o = raw || {};
  const first = pick(o, ['firstName', 'prenom']);
  const last = pick(o, ['lastName', 'nom']);
  const full = pick(o, ['name', 'fullName', 'username']) ?? ([first, last].filter(Boolean).join(' ') || null);
  return {
    id: pick(o, ['id', '_id']),
    name: full,
    email: pick(o, ['email', 'mail']) ?? null,
    phone: pick(o, ['phone', 'telephone', 'tel', 'phoneNumber', 'mobile']) ?? null,
    role: pick(o, ['role', 'userRole']) ?? null, // 'client' | 'driver'
  };
}

const OCC_KEYS = ['occupied', 'occupiedSeats', 'reserved', 'reservedSeats', 'taken', 'takenSeats', 'booked', 'bookedSeats', 'unavailable', 'unavailableSeats', 'placesReservees', 'placesOccupees'];
const AVAIL_KEYS = ['available', 'availableSeats', 'free', 'freeSeats', 'placesDisponibles'];
const occFlag = (s) => {
  const occ = pick(s, ['occupied', 'isOccupied', 'reserved', 'isReserved', 'booked', 'isBooked', 'taken']);
  if (occ !== undefined) return !!occ;
  const av = pick(s, ['available', 'isAvailable', 'disponible', 'free']);
  if (av !== undefined) return !av;
  const st = pick(s, ['status', 'statut', 'state']);
  if (st !== undefined) return !/avail|libre|free|dispo/i.test(String(st));
  return null;
};

/** Lit la réponse d'un endpoint de sièges, quelle que soit sa forme courante. */
export function parseSeats(payload) {
  const out = { total: null, occupied: null };
  if (!payload) return out;
  if (Array.isArray(payload)) {
    if (payload.length && typeof payload[0] === 'object') {
      const flags = payload.map(occFlag);
      if (flags.every((f) => f !== null)) {
        out.total = payload.length;
        out.occupied = payload.filter((_, i) => flags[i]).map(seatId);
      }
    }
    return out;
  }
  const o = payload.data && typeof payload.data === 'object' ? payload.data : payload;
  if (Array.isArray(o.seats)) {
    const r = parseSeats(o.seats);
    if (r.occupied) Object.assign(out, r);
  }
  const total = num(pick(o, ['totalSeats', 'capacity', 'capacite', 'nbPlaces', 'total']));
  if (total != null) out.total = total;
  const occ = pick(o, OCC_KEYS);
  if (Array.isArray(occ)) out.occupied = occ.map(seatId);
  else {
    const av = pick(o, AVAIL_KEYS);
    if (Array.isArray(av) && out.total != null) {
      const set = new Set(av.map(seatId));
      out.occupied = Array.from({ length: out.total }, (_, i) => String(i + 1)).filter((s) => !set.has(s));
    }
  }
  return out;
}
