// Verrou simple (un seul processus) : sérialise les écritures sensibles
// (réservation d'un siège, embarquement) pour éviter les doubles réservations.
// Avec une vraie base de données : utiliser une contrainte UNIQUE (tripId, seat)
// ou une transaction, ce verrou devient inutile.
let tail = Promise.resolve();
export function withLock(fn) {
  const run = tail.then(fn, fn);
  tail = run.catch(() => {});
  return run;
}
