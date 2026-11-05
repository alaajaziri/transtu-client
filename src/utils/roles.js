// Rôles renvoyés par le serveur dans user.role : 'client' (passager) ou 'driver' (chauffeur).
export const isDriver = (u) => u?.role === 'driver';

/** Page d'accueil après connexion, selon le rôle. */
export const homeFor = (u) => (isDriver(u) ? '/driver' : '/dashboard');
