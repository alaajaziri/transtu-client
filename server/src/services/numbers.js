import crypto from 'node:crypto';

// Alphabet sans caractères ambigus (pas de 0/O, 1/I) : facile à dicter au chauffeur.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Ex. TR-8F3K2Q */
export function newReservationNumber() {
  let s = '';
  for (let i = 0; i < 6; i++) s += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return `TR-${s}`;
}

/** Accepte "tr 8f3k2q", "TR8F3K2Q"… et renvoie "TR-8F3K2Q" (ou null). */
export function normalizeNumber(input) {
  const s = String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const m = /^TR([A-Z0-9]{6})$/.exec(s);
  return m ? `TR-${m[1]}` : null;
}
