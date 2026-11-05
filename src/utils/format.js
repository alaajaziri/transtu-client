const D = (d) => (d instanceof Date && !isNaN(d) ? d : null);
export const fmtTime = (d) => (D(d) ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--');
export const fmtDay = (d) => (D(d) ? d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Date à confirmer');
export const fmtLong = (d) => (D(d) ? d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—');
export const fmtDateTime = (d) => (D(d) ? `${fmtDay(d)} · ${fmtTime(d)}` : '—');
export const fmtPrice = (n) => (n == null ? '—' : `${Number(n).toFixed(3).replace('.', ',')} DT`);
export const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export const sameDay = (a, b) => a.toDateString() === b.toDateString();
export const isCancelled = (s) => /cancel|annul/i.test(String(s || ''));
export const isBoarded = (s) => /board|embarqu/i.test(String(s || ''));

// Libellés français des statuts connus ; un statut inconnu est affiché tel que reçu.
const LABELS = {
  confirmed: 'Confirmée', cancelled: 'Annulée', boarded: 'Embarqué',
  scheduled: 'Programmé', boarding: 'Embarquement', departed: 'Parti', completed: 'Terminé',
};
export const statusLabel = (s) => LABELS[String(s || '').toLowerCase()] || String(s || '');

export function statusTone(s) {
  const t = String(s || '');
  if (/cancel|annul/i.test(t)) return 'red';
  if (/confirm|valid|paid|pay|board|embarqu|complet/i.test(t)) return 'green';
  if (/schedul|depart/i.test(t)) return 'grey';
  if (/pend|attente|wait/i.test(t)) return 'amber';
  return 'grey';
}
export const isUpcoming = (r) => !isCancelled(r.status) && !!r.trip.departureAt && r.trip.departureAt > new Date();
export const uniqueStations = (trips) =>
  [...new Set(trips.flatMap((t) => [t.from, t.to]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
export const initials = (name) =>
  String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
