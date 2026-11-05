# Fusionner avec le vrai backend TRANSTU

Le dossier `server/` est un **serveur de démonstration** (Express + fichier JSON). Il définit le contrat d'API
que le client attend et contient toutes les règles métier (réservation, QR signé, embarquement).
Pour passer en production, vous avez deux options :

| Option | Quand | Travail |
|---|---|---|
| **A. Remplacer le stockage** | Vous gardez ce serveur Express et branchez MongoDB/SQL | Écrire un seul fichier (`store/xxxStore.js`) |
| **B. Porter les routes dans votre backend** | Vous avez déjà un backend Express/Nest/… | Reprendre les routes + `services/` + le contrat ci-dessous |

Le client (`src/`) n'a **rien à changer** dans les deux cas tant que le contrat de la section 2 est respecté.
Sinon, ajustez uniquement `src/config/endpoints.js` et `src/utils/normalize.js`.

---

## 1. Modèles de données

Tous les ids sont comparés en **texte** (`String(a) === String(b)`) : entiers ou ObjectId fonctionnent.

### `users`
| Champ | Type | Remarques |
|---|---|---|
| `id` | id | |
| `name` | string | nom complet |
| `email` | string | **unique**, stocké en minuscules |
| `phone` | string | 8 chiffres (Tunisie), sans indicatif |
| `role` | `'client'` \| `'driver'` | jamais lu depuis le corps d'une inscription |
| `passwordHash` | string | bcrypt, **jamais renvoyé au client** |
| `createdAt` | ISO date | |

### `trips`
| Champ | Type | Remarques |
|---|---|---|
| `id` | id | |
| `line` | string | ex. `Ligne 21` |
| `departure` / `destination` | string | villes |
| `departureTime` / `arrivalTime` | ISO date (UTC) | |
| `price` | number | en DT |
| `totalSeats` | integer | capacité (sièges numérotés `1…totalSeats`) |
| `driverId` | id | chauffeur affecté |
| `status` | `scheduled` → `boarding` → `departed` → `completed` (ou `cancelled`) | |

### `reservations`
| Champ | Type | Remarques |
|---|---|---|
| `id` | id | |
| `number` | string | `TR-XXXXXX`, **unique** (alphabet sans 0/O/1/I) |
| `userId`, `tripId` | id | |
| `seatNumber` | integer | `1…totalSeats` |
| `status` | `confirmed` \| `boarded` \| `cancelled` | |
| `price` | number | copie du prix du trajet à la réservation |
| `createdAt`, `cancelledAt`, `boardedAt` | ISO date \| null | |
| `boardedBy` | id \| null | chauffeur qui a validé |

### Contraintes à garantir (vraie base de données)
- `UNIQUE (tripId, seatNumber)` **parmi les réservations non annulées** (index partiel / index unique filtré).
  C'est ce qui remplace `utils/mutex.js` (verrou mono-processus) — sans lui, deux clients peuvent prendre le même siège.
- Une seule réservation active par `(userId, tripId)`.
- `UNIQUE (number)`, `UNIQUE (email)`.

---

## 2. Contrat d'API (ce que le client appelle)

Préfixe `/api`. Les routes protégées exigent `Authorization: Bearer <JWT>`. Erreurs : `{ "message": "…" }` (le client l'affiche tel quel).

### Public / passager
| Route | Corps / paramètres | Réponse | Erreurs métier |
|---|---|---|---|
| `POST /auth/register` | `{ name, email, phone, password }` | `201 { token, user }` | 400 validation · 409 e-mail pris |
| `POST /auth/login` | `{ email, password }` | `{ token, user }` | 401 |
| `GET /auth/me` | — | `{ user }` | 401 |
| `GET /trips` | `?departure=&destination=&date=YYYY-MM-DD` | `{ trips: [...] }` (seulement `scheduled` et à venir ; avec `occupiedSeats`, `availableSeats`) | |
| `GET /trips/:id` | — | `{ trip }` | 404 |
| `GET /trips/:id/seats` | — | `{ totalSeats, occupiedSeats: ["5","12"] }` | 404 |
| `POST /reservations` | `{ tripId, seatNumber }` | `201 { reservation }` (avec `qrPayload`) | 400 siège hors plage · 404 · 409 siège pris / déjà réservé / trajet fermé |
| `GET /reservations/me` | — | `{ reservations: [...] }` (trajet imbriqué + `qrPayload`) | |
| `GET /reservations/:id` | — | `{ reservation }` | **404** si ce n'est pas le vôtre (pas 403) |
| `PUT /reservations/:id` | `{ seatNumber }` | `{ reservation }` | 409 siège pris / non modifiable |
| `PATCH /reservations/:id/cancel` | — | `{ reservation }` | 409 déjà annulée / déjà embarqué / trajet parti |
| `GET /users/me` · `PUT /users/me` | `{ name?, phone? }` | `{ user }` | |
| `PUT /users/me/password` | `{ currentPassword, newPassword }` | `{ message }` | 401 mot de passe actuel faux |

Champs renvoyés pour une réservation : `id, reservationNumber, status, seatNumber, tripId, trip, price, createdAt, boardedAt, passenger, qrPayload`.
Le `qrPayload` n'est fourni qu'au **propriétaire** et jamais pour une réservation annulée.

### Chauffeur (`role = driver`, sinon 403)
| Route | Corps | Réponse |
|---|---|---|
| `GET /driver/trips` | — | `{ trips: [{ …trip, booked, boarded }] }` — ses trajets, à partir de 6 h avant maintenant, hors terminés/annulés |
| `GET /driver/trips/:id` | — | `{ trip, stats: {booked, boarded}, passengers: [...] }` — **403** si le trajet n'est pas le sien |
| `POST /driver/trips/:id/scan` | `{ qr }` **ou** `{ number }` | **toujours HTTP 200** : `{ ok, code, message, reservation?, stats? }` |
| `POST /driver/trips/:id/status` | `{ status }` | `{ trip, stats }` — transitions : `scheduled→boarding\|departed`, `boarding→departed`, `departed→completed` (sinon 409) |
| `POST /driver/trips/:id/reservations/:rid/board` | — | `{ stats }` |
| `POST /driver/trips/:id/reservations/:rid/unboard` | — | `{ stats }` |

Codes de `scan` : `BOARDED`, `ALREADY_BOARDED`, `INVALID_QR`, `NOT_FOUND`, `WRONG_TRIP`, `CANCELLED`, `TRIP_CLOSED`.
Un résultat négatif n'est **pas** une erreur HTTP : l'écran du chauffeur affiche simplement vert/rouge.

---

## 3. Le QR code (à reprendre à l'identique)

Contenu : `TRANSTU1.<numéro>.<signature>` — ex. `TRANSTU1.TR-8F3K2Q.b3Jp3x9dQvE1mWk0aT7sLg`

- `signature = base64url( HMAC-SHA256(QR_SECRET, "numéro|id|tripId|seatNumber") )` tronquée à **22 caractères**.
- Vérification : comparaison en temps constant (`timingSafeEqual`).
- La signature dépend du siège : après un changement de siège, **l'ancien QR devient invalide** (comportement voulu, testé).
- Le QR ne contient aucune donnée personnelle ; tout est retrouvé via le numéro.
- Code de référence : `server/src/services/qr.js` (≈ 40 lignes, indépendant de la base).
- `QR_SECRET` doit être **identique** partout où l'on vérifie des billets, et être changé en production.

---

## 4. Option A — brancher MongoDB / SQL

1. Lisez l'interface en tête de `server/src/store/jsonStore.js` :
   ```
   users:        findById findByEmail create update
   trips:        list get listByDriver update
   reservations: get findByNumber listByUser listByTrip create update
   ```
   Toutes les méthodes sont `async` et renvoient des **copies** (objets simples), `null` si introuvable.
2. Créez `server/src/store/mongoStore.js` (ou `sqlStore.js`) qui exporte `createXxxStore()` avec la même forme
   (plus `isEmpty()` et `replaceAll()` si vous gardez le seed de démo).
3. Dans `server/src/store/index.js`, remplacez `createJsonStore()` par votre fabrique. **Rien d'autre ne change** :
   les routes et services (`services/reservations.js`, `services/boarding.js`) n'utilisent que `store`.
4. Ajoutez les contraintes de la section 1 (index uniques). Le verrou `withLock` peut alors rester (inoffensif)
   ou être supprimé au profit d'une transaction.
5. Remplacez le seed par vos vraies données ; supprimez les comptes de démo.

## 5. Option B — porter dans un backend existant

1. Copiez `server/src/services/` (`reservations.js`, `boarding.js`, `qr.js`, `numbers.js`) : la logique métier
   ne dépend que de l'objet `store` — adaptez ses appels à vos modèles.
2. Recréez les routes du tableau de la section 2 (le code de `server/src/routes/` sert de modèle).
3. Gardez les **formes de réponse** (`{ trips }`, `{ reservation }`, `{ user }`…) et les **codes HTTP** : le client lit
   le message d'erreur du champ `message`.
4. Si vos noms de champs diffèrent, adaptez `src/utils/normalize.js` (déjà tolérant FR/EN) plutôt que le serveur.
5. Lancez `npm run probe` (avec `TOKEN=<JWT>` pour les routes protégées) pour vérifier que toutes les routes répondent.

## 6. Check-list avant mise en production

- [ ] `JWT_SECRET` et `QR_SECRET` forts, hors dépôt (`.env`)
- [ ] `CORS_ORIGIN` limité au domaine du client (plus de `*`)
- [ ] HTTPS partout (la caméra du scanner exige HTTPS ou `localhost`)
- [ ] Inscription : rôle toujours `client` ; les comptes chauffeurs sont créés par l'administration
- [ ] Contraintes d'unicité en base (siège par trajet, numéro, e-mail)
- [ ] Limitation de débit sur `/auth/login` et `/driver/*/scan`
- [ ] Comptes et données de démonstration supprimés
- [ ] `npm run server:test` (smoke test) adapté puis relancé contre votre implémentation
