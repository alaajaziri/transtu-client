/**
 * FAUSSE BASE DE DONNÉES (fichier JSON) — c'est la SEULE couche qui touche aux données.
 *
 * Interface que la vraie base (MongoDB / SQL…) devra reproduire. Toutes les méthodes
 * sont async pour que le remplacement ne change rien au reste du serveur.
 *
 *   users:        findById(id) findByEmail(email) create(data) update(id, patch)
 *   trips:        list() get(id) listByDriver(driverId) update(id, patch)
 *   reservations: get(id) findByNumber(number) listByUser(userId) listByTrip(tripId)
 *                 create(data) update(id, patch)
 *
 * Formes des objets : voir MERGE.md (section "Modèles de données").
 */
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

const EMPTY = () => ({ counters: { users: 0, trips: 0, reservations: 0 }, users: [], trips: [], reservations: [] });

export function createJsonStore(file = config.dbFile) {
  let db = EMPTY();

  const load = () => {
    if (!fs.existsSync(file)) return false;
    db = { ...EMPTY(), ...JSON.parse(fs.readFileSync(file, 'utf8')) };
    return true;
  };
  const save = () => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
    try { fs.renameSync(tmp, file); } catch { fs.writeFileSync(file, JSON.stringify(db, null, 2)); }
  };
  const clone = (o) => (o ? structuredClone(o) : null);
  const same = (a, b) => String(a) === String(b);
  const nextId = (name) => ++db.counters[name];

  const makeUpdate = (name) => async (id, patch) => {
    const row = db[name].find((r) => same(r.id, id));
    if (!row) return null;
    Object.assign(row, patch);
    save();
    return clone(row);
  };
  const makeCreate = (name) => async (data) => {
    const row = { id: nextId(name), ...data };
    db[name].push(row);
    save();
    return clone(row);
  };

  load();

  return {
    kind: 'json',
    /** vrai si le fichier existait déjà */
    isEmpty: () => db.users.length === 0 && db.trips.length === 0,
    /** Remplace tout le contenu (utilisé par le seed). */
    async replaceAll(data) { db = { ...EMPTY(), ...data }; save(); },

    users: {
      async findById(id) { return clone(db.users.find((u) => same(u.id, id))); },
      async findByEmail(email) { return clone(db.users.find((u) => u.email === email)); },
      create: makeCreate('users'),
      update: makeUpdate('users'),
    },
    trips: {
      async list() { return clone(db.trips); },
      async get(id) { return clone(db.trips.find((t) => same(t.id, id))); },
      async listByDriver(driverId) { return clone(db.trips.filter((t) => same(t.driverId, driverId))); },
      update: makeUpdate('trips'),
    },
    reservations: {
      async get(id) { return clone(db.reservations.find((r) => same(r.id, id))); },
      async findByNumber(n) { return clone(db.reservations.find((r) => r.number === n)); },
      async listByUser(userId) { return clone(db.reservations.filter((r) => same(r.userId, userId))); },
      async listByTrip(tripId) { return clone(db.reservations.filter((r) => same(r.tripId, tripId))); },
      create: makeCreate('reservations'),
      update: makeUpdate('reservations'),
    },
  };
}
