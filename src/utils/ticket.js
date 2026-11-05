import { fmtLong, fmtTime } from './format';

/**
 * Contenu du QR.
 * Cas normal : le serveur fournit un texte SIGNÉ (r.qr = "TRANSTU1.TR-XXXXXX.signature")
 * que le chauffeur peut vérifier. On l'affiche tel quel, sans le modifier.
 * Repli (backend sans QR signé) : JSON avec les données réelles de la réservation —
 * non vérifiable par le serveur, utile seulement pour l'affichage.
 */
export function buildQrPayload(r) {
  if (r.qr) return r.qr;
  return JSON.stringify({
    app: 'TRANSTU',
    reservation: String(r.number),
    id: String(r.id),
    trip: r.tripId != null ? String(r.tripId) : undefined,
    seat: r.seat != null ? String(r.seat) : undefined,
    from: r.trip.from || undefined,
    to: r.trip.to || undefined,
    departure: r.trip.departureAt ? r.trip.departureAt.toISOString() : undefined,
  });
}

export async function downloadTicketPng(r, qrUrl) {
  await document.fonts?.ready;
  const W = 1100, H = 460;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const rr = (x, y, w, h, rad) => { g.beginPath(); g.roundRect(x, y, w, h, rad); };
  const font = (w, s) => `${w} ${s}px "Bricolage Grotesque", "Instrument Sans", Arial, sans-serif`;

  g.fillStyle = '#f6f2e8'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#009751'; rr(20, 20, 720, 420, 28); g.fill();
  g.fillStyle = '#f8af26'; g.fillRect(20, 96, 720, 6);
  g.fillStyle = '#fffdf8'; rr(740, 20, 340, 420, 28); g.fill();

  g.fillStyle = '#fff'; g.textBaseline = 'alphabetic';
  g.font = font(700, 20); g.globalAlpha = 0.8; g.fillText('TRANSTU · BILLET NUMÉRIQUE', 56, 70); g.globalAlpha = 1;

  g.font = font(800, 54); g.fillText((r.trip.from || 'Départ').slice(0, 16), 56, 190);
  g.font = font(600, 28); g.globalAlpha = 0.7; g.fillText('vers', 56, 232); g.globalAlpha = 1;
  g.font = font(800, 54); g.fillText((r.trip.to || 'Destination').slice(0, 16), 56, 292);

  g.font = font(600, 22);
  g.fillText(`${fmtLong(r.trip.departureAt)} · ${fmtTime(r.trip.departureAt)}`, 56, 342);
  g.font = font(700, 26); g.fillText(`Siège ${r.seat ?? '—'}`, 56, 392);
  g.font = font(500, 20); g.globalAlpha = 0.8;
  g.fillText(`N° ${r.number}${r.passenger ? ` · ${r.passenger}` : ''}`.slice(0, 48), 190, 392); g.globalAlpha = 1;

  g.setLineDash([10, 10]); g.strokeStyle = '#d8cfba'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(740, 40); g.lineTo(740, 420); g.stroke(); g.setLineDash([]);

  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = qrUrl; });
  g.drawImage(img, 780, 70, 260, 260);
  g.fillStyle = '#0b2238'; g.textAlign = 'center'; g.font = '700 20px monospace';
  g.fillText(String(r.number).slice(0, 22), 910, 372);
  g.font = font(500, 16); g.fillStyle = '#5d6882'; g.fillText('Présentez ce code à bord', 910, 402);

  const a = document.createElement('a');
  a.download = `billet-transtu-${r.number}.png`;
  a.href = c.toDataURL('image/png');
  a.click();
}
