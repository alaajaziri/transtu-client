/**
 * LOGIQUE QR — indépendante de la base de données.
 *
 * Contenu du QR :   TRANSTU1.<numéro de réservation>.<signature>
 *                   ex. TRANSTU1.TR-8F3K2Q.b3Jp3x9dQvE1mWk0aT7sLg
 *
 * La signature = HMAC-SHA256(QR_SECRET, "numéro|id|trajet|siège") tronquée à 22 car.
 * - Impossible à fabriquer sans le secret (un QR inventé est refusé).
 * - Elle dépend du siège : si le passager change de siège, l'ancien QR devient invalide.
 * - Le QR ne contient aucune donnée personnelle ; le serveur retrouve tout via le numéro.
 */
import crypto from 'node:crypto';
import { config } from '../config.js';
import { normalizeNumber } from './numbers.js';

export const QR_PREFIX = 'TRANSTU1';

function sign(r) {
  return crypto
    .createHmac('sha256', config.qrSecret)
    .update(`${r.number}|${r.id}|${r.tripId}|${r.seatNumber}`)
    .digest('base64url')
    .slice(0, 22);
}

/** Texte à encoder dans le QR pour une réservation. */
export const buildQr = (r) => `${QR_PREFIX}.${r.number}.${sign(r)}`;

/** "TRANSTU1.TR-XXXXXX.sig" -> { number, sig } ou null si le format est mauvais. */
export function parseQr(text) {
  const parts = String(text || '').trim().split('.');
  if (parts.length !== 3 || parts[0] !== QR_PREFIX) return null;
  const number = normalizeNumber(parts[1]);
  if (!number || !/^[A-Za-z0-9_-]{22}$/.test(parts[2])) return null;
  return { number, sig: parts[2] };
}

/** La signature lue correspond-elle à l'état ACTUEL de la réservation ? */
export function verifyQr(parsed, reservation) {
  const a = Buffer.from(parsed.sig);
  const b = Buffer.from(sign(reservation));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
