// Écrit un PNG de QR pour chaque réservation active (pour tester le scanner du chauffeur
// avec l'écran d'un autre appareil). Usage : npm run qr
import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';
import { config } from '../src/config.js';
import { store } from '../src/store/index.js';
import { buildQr } from '../src/services/qr.js';

const out = path.join(config.root, 'data', 'qr');
fs.mkdirSync(out, { recursive: true });

const trips = await store.trips.list();
let n = 0;
for (const t of trips) {
  for (const r of await store.reservations.listByTrip(t.id)) {
    if (r.status === 'cancelled') continue;
    const payload = buildQr(r);
    await QRCode.toFile(path.join(out, `${r.number}.png`), payload, { width: 400, margin: 2 });
    console.log(`${r.number}  trajet ${t.id} (${t.departure}→${t.destination})  siège ${r.seatNumber}  ${r.status}\n   ${payload}`);
    n++;
  }
}
console.log(`\n${n} QR écrits dans ${out}`);
