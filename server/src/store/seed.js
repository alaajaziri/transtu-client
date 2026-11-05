/**
 * Données de démonstration. Les dates sont générées par rapport à MAINTENANT,
 * donc il y a toujours des trajets à venir.  `npm run seed` remet tout à zéro.
 */
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';
import { createJsonStore } from './jsonStore.js';
import { newReservationNumber } from '../services/numbers.js';

const OFFSET = '+01:00'; // Tunisie : UTC+1 toute l'année

const ymdInTz = (date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: config.tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
const at = (ymd, hm) => new Date(`${ymd}T${hm}:00${OFFSET}`);
const plus = (d, min) => new Date(d.getTime() + min * 60000);

export const DEMO_ACCOUNTS = {
  client: { email: 'client@transtu.tn', password: 'client123' },
  driver1: { email: 'chauffeur1@transtu.tn', password: 'driver123' },
  driver2: { email: 'chauffeur2@transtu.tn', password: 'driver123' },
};

// départ, destination, ligne, durée (min), prix (DT), places, heures de départ
const ROUTES = [
  ['Tunis', 'Sousse', '21', 150, 9.5, 44, ['06:30', '10:00', '15:30']],
  ['Tunis', 'Sfax', '22', 270, 16.0, 44, ['07:00', '13:00']],
  ['Tunis', 'Bizerte', '12', 90, 5.5, 40, ['08:00', '12:30', '17:00']],
  ['Mateur', 'Tunis', '14', 60, 3.2, 36, ['06:45', '16:15']],
  ['Tunis', 'Nabeul', '31', 90, 6.0, 40, ['09:00', '14:00']],
  ['Sousse', 'Monastir', '41', 40, 2.5, 36, ['08:30', '18:00']],
];

export async function buildSeed() {
  const hash = (p) => bcrypt.hashSync(p, 8);
  const now = new Date();
  const created = now.toISOString();
  let uid = 0;
  const user = (name, email, phone, role, password) => ({ id: ++uid, name, email, phone, role, passwordHash: hash(password), createdAt: created });

  const users = [
    user('Client Test', DEMO_ACCOUNTS.client.email, '22123456', 'client', DEMO_ACCOUNTS.client.password),
    user('Karim Ben Salah', DEMO_ACCOUNTS.driver1.email, '98111222', 'driver', DEMO_ACCOUNTS.driver1.password),
    user('Sami Trabelsi', DEMO_ACCOUNTS.driver2.email, '97333444', 'driver', DEMO_ACCOUNTS.driver2.password),
    user('Amel Gharbi', 'amel@example.tn', '55123123', 'client', 'client123'),
    user('Yassine Jlassi', 'yassine@example.tn', '54321321', 'client', 'client123'),
    user('Meriem Bouzid', 'meriem@example.tn', '52777888', 'client', 'client123'),
  ];
  const drivers = [2, 3];

  const trips = [];
  let tid = 0;
  const addTrip = (r, depart, driverId) => {
    const [from, to, line, dur, price, seats] = r;
    trips.push({
      id: ++tid, line: `Ligne ${line}`, departure: from, destination: to,
      departureTime: depart.toISOString(), arrivalTime: plus(depart, dur).toISOString(),
      price, totalSeats: seats, driverId, status: 'scheduled',
    });
  };

  // Un trajet très proche (pour tester l'embarquement tout de suite) : départ dans ~45 min
  addTrip(ROUTES[3], plus(now, 45), drivers[0]);
  addTrip(ROUTES[0], plus(now, 120), drivers[1]);

  // 7 jours de trajets
  const today = ymdInTz(now);
  for (let day = 0; day < 7; day++) {
    const ymd = ymdInTz(plus(at(today, '12:00'), day * 1440));
    ROUTES.forEach((r, i) => {
      r[6].forEach((hm, j) => {
        const depart = at(ymd, hm);
        if (depart > plus(now, 30)) addTrip(r, depart, drivers[(i + j + day) % 2]);
      });
    });
  }

  // Quelques réservations sur le trajet imminent (id 1) pour que la liste des passagers ne soit pas vide
  const reservations = [];
  let rid = 0;
  const used = new Set();
  const book = (tripId, userId, seat, status = 'confirmed') => {
    let number;
    do { number = newReservationNumber(); } while (used.has(number));
    used.add(number);
    const trip = trips.find((t) => t.id === tripId);
    reservations.push({ id: ++rid, number, userId, tripId, seatNumber: seat, status, price: trip.price, createdAt: created, boardedAt: null, boardedBy: null });
  };
  book(1, 1, 5); // Client Test
  book(1, 4, 6);
  book(1, 5, 12);
  book(1, 6, 13);
  book(2, 1, 20);

  return {
    counters: { users: uid, trips: tid, reservations: rid },
    users, trips, reservations,
  };
}

export async function seedStore(store) {
  await store.replaceAll(await buildSeed());
}

// `npm run seed` (ou --reset)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const store = createJsonStore();
  await seedStore(store);
  console.log('✓ Base de démonstration créée :', config.dbFile);
  console.log('  Client   :', DEMO_ACCOUNTS.client.email, '/', DEMO_ACCOUNTS.client.password);
  console.log('  Chauffeur:', DEMO_ACCOUNTS.driver1.email, '/', DEMO_ACCOUNTS.driver1.password);
  console.log('  Chauffeur:', DEMO_ACCOUNTS.driver2.email, '/', DEMO_ACCOUNTS.driver2.password);
}
