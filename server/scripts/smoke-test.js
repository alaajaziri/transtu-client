// Test de bout en bout (base JSON temporaire). Usage : npm test
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'transtu-'));
process.env.DB_FILE = path.join(tmp, 'db.json');

const { createApp } = await import('../src/app.js');
const { store } = await import('../src/store/index.js');
const { seedStore } = await import('../src/store/seed.js');
const { buildQr } = await import('../src/services/qr.js');

await seedStore(store);
const server = createApp().listen(0);
const base = `http://127.0.0.1:${server.address().port}/api`;

let pass = 0, failed = 0;
const check = (name, cond, extra) => {
  if (cond) { pass++; console.log('  ✓', name); } else { failed++; console.log('  ✗', name, extra ?? ''); }
};
const api = async (method, url, { token, body } = {}) => {
  const res = await fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
};
const login = async (email, password) => (await api('POST', '/auth/login', { body: { email, password } })).body;

try {
  console.log('Auth');
  const reg = await api('POST', '/auth/register', { body: { name: 'Nouveau Client', email: 'new@test.tn', phone: '22 333 444', password: 'secret1', role: 'driver' } });
  check('inscription 201 + token', reg.status === 201 && !!reg.body.token);
  check("le rôle demandé à l'inscription est ignoré (client)", reg.body.user.role === 'client');
  check('e-mail déjà pris → 409', (await api('POST', '/auth/register', { body: { name: 'X Y', email: 'new@test.tn', phone: '22333444', password: 'secret1' } })).status === 409);
  check('mauvais mot de passe → 401', (await api('POST', '/auth/login', { body: { email: 'client@transtu.tn', password: 'nope' } })).status === 401);
  const client = await login('client@transtu.tn', 'client123');
  const d1 = await login('chauffeur1@transtu.tn', 'driver123');
  const d2 = await login('chauffeur2@transtu.tn', 'driver123');
  check('connexion client/chauffeur + rôle', client.user.role === 'client' && d1.user.role === 'driver');
  check('GET /auth/me', (await api('GET', '/auth/me', { token: d1.token })).body.user.email === 'chauffeur1@transtu.tn');
  check('sans token → 401', (await api('GET', '/reservations/me')).status === 401);

  console.log('Trajets');
  const trips = (await api('GET', '/trips')).body.trips;
  check('liste de trajets non vide', trips.length > 10);
  const filtered = (await api('GET', '/trips?departure=mateur&destination=tunis')).body.trips;
  check('filtre ville (sans accent/majuscule)', filtered.length > 0 && filtered.every((t) => t.departure === 'Mateur'));
  const seats = (await api('GET', '/trips/1/seats')).body;
  check('sièges : total + occupés', seats.totalSeats === 36 && seats.occupiedSeats.includes('5'));

  console.log('Réservations');
  const mine = (await api('GET', '/reservations/me', { token: client.token })).body.reservations;
  check('mes réservations avec trajet + QR', mine.length === 2 && mine[0].trip.departure && mine[0].qrPayload.startsWith('TRANSTU1.'));
  const r1 = await api('POST', '/reservations', { token: reg.body.token, body: { tripId: 1, seatNumber: 30 } });
  check('réservation créée 201 + QR', r1.status === 201 && r1.body.reservation.qrPayload && r1.body.reservation.status === 'confirmed');
  const qr1 = r1.body.reservation.qrPayload;
  check('siège déjà pris → 409', (await api('POST', '/reservations', { token: client.token, body: { tripId: 1, seatNumber: 30 } })).status === 409);
  check('siège hors plage → 400', (await api('POST', '/reservations', { token: d2.token, body: { tripId: 1, seatNumber: 99 } })).status === 400);
  const amel = await login('amel@example.tn', 'client123');
  const yass = await login('yassine@example.tn', 'client123');
  // course : 2 clients, même siège, en parallèle sur le trajet 3
  const race = await Promise.all([
    api('POST', '/reservations', { token: amel.token, body: { tripId: 3, seatNumber: 7 } }),
    api('POST', '/reservations', { token: yass.token, body: { tripId: 3, seatNumber: 7 } }),
  ]);
  check('2 réservations simultanées du même siège → 1 seule gagne', race.map((r) => r.status).sort().join() === '201,409', race.map((r) => r.status));
  check("le billet d'un autre est introuvable (404)", (await api('GET', `/reservations/${r1.body.reservation.id}`, { token: client.token })).status === 404);

  console.log('QR + embarquement (chauffeur 1, trajet 1)');
  const status = (await api('GET', '/driver/trips/1', { token: d1.token })).body;
  check('fiche trajet chauffeur : passagers + stats', status.passengers.length === 5 && status.stats.booked === 5 && status.stats.boarded === 0);
  check("un client n'accède pas aux routes chauffeur → 403", (await api('GET', '/driver/trips', { token: client.token })).status === 403);
  check("un autre chauffeur n'accède pas à ce trajet → 403", (await api('GET', '/driver/trips/1', { token: d2.token })).status === 403);

  const scan = (qr, token = d1.token, id = 1) => api('POST', `/driver/trips/${id}/scan`, { token, body: { qr } });
  let s = await scan(qr1);
  check('scan valide → BOARDED', s.body.ok && s.body.code === 'BOARDED' && s.body.reservation.passengerName === 'Nouveau Client' && s.body.stats.boarded === 1, s.body);
  s = await scan(qr1);
  check('2e scan → ALREADY_BOARDED', !s.body.ok && s.body.code === 'ALREADY_BOARDED');
  check('QR bien formé mais numéro inconnu → NOT_FOUND', (await scan('TRANSTU1.TR-AAAAAA.' + 'x'.repeat(22))).body.code === 'NOT_FOUND');
  const real = (await store.reservations.get(1)); // siège 5, client test
  const forged = `TRANSTU1.${real.number}.${'A'.repeat(22)}`;
  check('signature fausse sur un vrai numéro → INVALID_QR', (await scan(forged)).body.code === 'INVALID_QR');
  check('texte quelconque → INVALID_QR', (await scan('https://example.com')).body.code === 'INVALID_QR');

  // QR périmé : le client change de siège → l'ancien QR ne marche plus, le nouveau oui
  const oldQr = buildQr(real);
  const ch = await api('PUT', '/reservations/1', { token: client.token, body: { seatNumber: 8 } });
  check('changement de siège 200', ch.status === 200 && ch.body.reservation.seatNumber === 8);
  check('ancien QR (ancien siège) → INVALID_QR', (await scan(oldQr)).body.code === 'INVALID_QR');
  check('nouveau QR → BOARDED', (await scan(ch.body.reservation.qrPayload)).body.code === 'BOARDED');

  check('billet pour un autre trajet → WRONG_TRIP', (await scan(buildQr(await store.reservations.get(5)))).body.code === 'WRONG_TRIP');

  // saisie manuelle + annulation + embarquement manuel
  const r3 = await store.reservations.get(2); // Amel, siège 6
  const man = await api('POST', '/driver/trips/1/scan', { token: d1.token, body: { number: r3.number.toLowerCase().replace('-', ' ') } });
  check('saisie manuelle du numéro → BOARDED (manual)', man.body.code === 'BOARDED' && man.body.reservation.manual === true, man.body);
  check('numéro mal formé → 400', (await api('POST', '/driver/trips/1/scan', { token: d1.token, body: { number: 'abc' } })).status === 400);
  check('numéro inconnu → NOT_FOUND', (await api('POST', '/driver/trips/1/scan', { token: d1.token, body: { number: 'TR-ZZZZZZ' } })).body.code === 'NOT_FOUND');
  check('annulation d\'un billet déjà embarqué → 409', (await api('PATCH', `/reservations/${r3.id}/cancel`, { token: amel.token })).status === 409);
  const r4 = await store.reservations.get(3); // Yassine, siège 12
  await api('PATCH', `/reservations/${r4.id}/cancel`, { token: yass.token });
  check('billet annulé → CANCELLED', (await api('POST', '/driver/trips/1/scan', { token: d1.token, body: { number: r4.number } })).body.code === 'CANCELLED');
  const un = await api('POST', `/driver/trips/1/reservations/${r3.id}/unboard`, { token: d1.token });
  check('annuler un embarquement (unboard)', un.status === 200 && un.body.stats.boarded === 2, un.body);
  const bo = await api('POST', `/driver/trips/1/reservations/${r3.id}/board`, { token: d1.token });
  check('embarquer à la main (board)', bo.status === 200 && bo.body.stats.boarded === 3);

  console.log('Statut du trajet');
  check('trajet passé en « boarding » automatiquement', (await store.trips.get(1)).status === 'boarding');
  check('transition interdite → 409', (await api('POST', '/driver/trips/1/status', { token: d1.token, body: { status: 'completed' } })).status === 409);
  check('départ OK', (await api('POST', '/driver/trips/1/status', { token: d1.token, body: { status: 'departed' } })).status === 200);
  check('scan après départ → TRIP_CLOSED', (await scan(qr1)).body.code === 'TRIP_CLOSED');
  check("réservation d'un trajet parti → 409", (await api('POST', '/reservations', { token: d2.token, body: { tripId: 1, seatNumber: 40 } })).status === 409);
  check('la liste publique ne montre plus ce trajet', !(await api('GET', '/trips')).body.trips.some((t) => t.id === 1));

  console.log('Profil');
  check('PUT /users/me', (await api('PUT', '/users/me', { token: client.token, body: { name: 'Client Modifié', phone: '22 123 456' } })).body.user.name === 'Client Modifié');
  check('mauvais mot de passe actuel → 401', (await api('PUT', '/users/me/password', { token: client.token, body: { currentPassword: 'x', newPassword: 'abcdef' } })).status === 401);
  check('changement de mot de passe', (await api('PUT', '/users/me/password', { token: client.token, body: { currentPassword: 'client123', newPassword: 'abcdef' } })).status === 200);
  check('nouveau mot de passe accepté', !!(await login('client@transtu.tn', 'abcdef')).token);
} catch (e) {
  failed++;
  console.error('ERREUR INATTENDUE', e);
} finally {
  server.close();
  fs.rmSync(tmp, { recursive: true, force: true });
}
console.log(`\n${pass} réussis, ${failed} échoués`);
process.exit(failed ? 1 : 0);
