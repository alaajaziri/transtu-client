/**
 * ⚠️  FICHIER CLÉ : c'est le SEUL endroit où les routes et les noms de champs
 * envoyés au backend sont définis.
 *
 * Ces valeurs sont des HYPOTHÈSES (le dépôt backend n'était pas accessible
 * au moment de la génération). Lancez `npm run probe` pour vérifier lesquelles
 * existent, puis corrigez ce fichier si besoin. Rien d'autre à modifier.
 */
export const ENDPOINTS = {
  auth: {
    register: { method: 'POST', path: '/auth/register' },
    login: { method: 'POST', path: '/auth/login' },
    me: { method: 'GET', path: '/auth/me' },
  },
  trips: {
    list: { method: 'GET', path: '/trips' },
    one: (id) => ({ method: 'GET', path: `/trips/${id}` }),
    seats: (id) => ({ method: 'GET', path: `/trips/${id}/seats` }),
  },
  reservations: {
    create: { method: 'POST', path: '/reservations' },
    mine: { method: 'GET', path: '/reservations/me' },
    one: (id) => ({ method: 'GET', path: `/reservations/${id}` }),
    update: (id) => ({ method: 'PUT', path: `/reservations/${id}` }),
    cancel: (id) => ({ method: 'PATCH', path: `/reservations/${id}/cancel` }),
  },
  // Interface chauffeur (rôle "driver") — routes définies par NOTRE serveur (server/)
  driver: {
    trips: { method: 'GET', path: '/driver/trips' },
    trip: (id) => ({ method: 'GET', path: `/driver/trips/${id}` }),
    scan: (id) => ({ method: 'POST', path: `/driver/trips/${id}/scan` }),
    status: (id) => ({ method: 'POST', path: `/driver/trips/${id}/status` }),
    board: (id, rid) => ({ method: 'POST', path: `/driver/trips/${id}/reservations/${rid}/board` }),
    unboard: (id, rid) => ({ method: 'POST', path: `/driver/trips/${id}/reservations/${rid}/unboard` }),
  },
  users: {
    profile: { method: 'GET', path: '/users/me' },
    updateProfile: { method: 'PUT', path: '/users/me' },
    changePassword: { method: 'PUT', path: '/users/me/password' },
  },
};

/** Noms des paramètres de recherche envoyés à GET /trips */
export const SEARCH_PARAMS = { from: 'departure', to: 'destination', date: 'date' };

/** Corps des requêtes (adapter les noms de champs au backend) */
export const PAYLOAD = {
  register: ({ name, email, phone, password }) => ({ name, email, phone, password }),
  login: ({ email, password }) => ({ email, password }),
  createReservation: ({ tripId, seat }) => ({ tripId, seatNumber: seat }),
  updateReservation: ({ seat }) => ({ seatNumber: seat }),
  updateProfile: ({ name, phone }) => ({ name, phone }),
  changePassword: ({ currentPassword, newPassword }) => ({ currentPassword, newPassword }),
  // { qr } = contenu lu dans le QR ; { number } = saisie manuelle du numéro de réservation
  scan: ({ qr, number }) => (qr ? { qr } : { number }),
  tripStatus: (status) => ({ status }),
};
