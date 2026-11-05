// Vérifie quelles routes existent sur votre backend. Usage :
//   npm run probe                      (utilise VITE_API_URL de .env)
//   TOKEN=eyJ... npm run probe         (teste aussi les routes protégées avec un vrai JWT)
import { readFileSync } from 'node:fs';

let base = process.env.VITE_API_URL;
if (!base) {
  try { base = /VITE_API_URL=(.+)/.exec(readFileSync(new URL('../.env', import.meta.url), 'utf8'))?.[1]?.trim(); } catch { /* pas de .env */ }
}
base = (base || 'http://localhost:5000/api').replace(/\/+$/, '');
const token = process.env.TOKEN;
const ID = process.env.SAMPLE_ID || '1';

const routes = [
  ['POST', '/auth/register', {}], ['POST', '/auth/login', {}], ['GET', '/auth/me'],
  ['GET', '/trips'], ['GET', `/trips/${ID}`], ['GET', `/trips/${ID}/seats`],
  ['POST', '/reservations', {}], ['GET', '/reservations/me'], ['GET', `/reservations/${ID}`],
  ['PUT', `/reservations/${ID}`, {}], ['PATCH', `/reservations/${ID}/cancel`, {}],
  ['GET', '/users/me'], ['PUT', '/users/me', {}], ['PUT', '/users/me/password', {}],
  // interface chauffeur
  ['GET', '/driver/trips'], ['GET', `/driver/trips/${ID}`], ['POST', `/driver/trips/${ID}/scan`, {}],
  ['POST', `/driver/trips/${ID}/status`, {}],
  ['POST', `/driver/trips/${ID}/reservations/${ID}/board`, {}], ['POST', `/driver/trips/${ID}/reservations/${ID}/unboard`, {}],
];

const verdict = (s) => (s === 404 || s === 405 || s === 501) ? '✗ absente' : s === 401 || s === 403 ? '✓ existe (auth requise)' : s >= 400 && s < 500 ? '✓ existe (corps/validation refusé)' : s >= 200 && s < 300 ? '✓ OK' : '? ' + s;
console.log(`Sonde de ${base}${token ? ' (avec JWT)' : ' (sans JWT)'}\n`);
for (const [m, p, body] of routes) {
  try {
    const res = await fetch(base + p, {
      method: m,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let shape = '';
    if (res.ok && m === 'GET') { try { const j = JSON.parse(text); shape = '  → clés : ' + (Array.isArray(j) ? `[tableau de ${j.length}] ` + Object.keys(j[0] || {}).join(',') : Object.keys(j).join(',')); } catch { /* non JSON */ } }
    console.log(`${m.padEnd(6)} ${p.padEnd(34)} ${String(res.status).padEnd(4)} ${verdict(res.status)}${shape}`);
  } catch (e) { console.log(`${m.padEnd(6)} ${p.padEnd(34)} ✗ serveur injoignable (${e.cause?.code || e.message})`); break; }
}
console.log('\nSi une route est absente ou nommée autrement, corrigez src/config/endpoints.js.');
