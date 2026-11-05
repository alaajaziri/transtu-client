# Routes utilisées par le client

Ces routes sont **implémentées et testées** par le serveur de démonstration (`server/`, voir `npm run server:test`).
Pour un autre backend, le contrat complet (formes de réponse, codes HTTP, règles métier, QR signé) est dans **`MERGE.md`** ;
vérifiez ensuite avec `npm run probe` et corrigez au besoin `src/config/endpoints.js` et `src/utils/normalize.js`.

Toutes les routes protégées envoient `Authorization: Bearer <JWT>`.
Si une route manque, l'écran concerné affiche une erreur ou un encart « Fonction non disponible côté serveur » : aucune donnée n'est inventée.

## Passager

| Fonction | Méthode + route | Corps / paramètres | Réponse |
|---|---|---|---|
| Inscription | `POST /auth/register` | `{ name, email, phone, password }` | `201 { token, user }` (rôle toujours `client`) |
| Connexion | `POST /auth/login` | `{ email, password }` | `{ token, user }` |
| Profil connecté | `GET /auth/me` | — | `{ user }` |
| Liste des trajets | `GET /trips` | `?departure=&destination=&date=YYYY-MM-DD` | `{ trips }` |
| Détail d'un trajet | `GET /trips/:id` | — | `{ trip }` |
| Sièges d'un trajet | `GET /trips/:id/seats` | — | `{ totalSeats, occupiedSeats }` |
| Créer une réservation | `POST /reservations` | `{ tripId, seatNumber }` | `201 { reservation }` + `qrPayload` |
| Mes réservations | `GET /reservations/me` | — | `{ reservations }` |
| Détail réservation | `GET /reservations/:id` | — | `{ reservation }` |
| Modifier (siège) | `PUT /reservations/:id` | `{ seatNumber }` | `{ reservation }` |
| Annuler | `PATCH /reservations/:id/cancel` | — | `{ reservation }` |
| Lire le profil | `GET /users/me` | — | `{ user }` |
| Modifier le profil | `PUT /users/me` | `{ name, phone }` | `{ user }` |
| Changer le mot de passe | `PUT /users/me/password` | `{ currentPassword, newPassword }` | `{ message }` |

## Chauffeur (rôle `driver`)

| Fonction | Méthode + route | Corps | Réponse |
|---|---|---|---|
| Mes trajets | `GET /driver/trips` | — | `{ trips: [{…, booked, boarded}] }` |
| Fiche d'un trajet | `GET /driver/trips/:id` | — | `{ trip, stats, passengers }` |
| Scanner / saisir un billet | `POST /driver/trips/:id/scan` | `{ qr }` ou `{ number }` | HTTP 200 : `{ ok, code, message, reservation?, stats? }` |
| Changer le statut du trajet | `POST /driver/trips/:id/status` | `{ status }` : `boarding` · `departed` · `completed` | `{ trip, stats }` |
| Embarquer à la main | `POST /driver/trips/:id/reservations/:rid/board` | — | `{ stats }` |
| Annuler un embarquement | `POST /driver/trips/:id/reservations/:rid/unboard` | — | `{ stats }` |

Codes de scan : `BOARDED` · `ALREADY_BOARDED` · `INVALID_QR` · `NOT_FOUND` · `WRONG_TRIP` · `CANCELLED` · `TRIP_CLOSED`.

## Données dont l'interface a besoin

**Trajet** : id, départ, destination, date/heure de départ (et d'arrivée), prix, ligne (facultatif), **capacité**, **sièges occupés**, statut (`scheduled`, `boarding`, `departed`, `completed`).
Noms lus automatiquement (liste complète dans `src/utils/normalize.js`) : `departure|depart|origin|from|villeDepart…`, `destination|arrivee|to…`, `departureTime|dateDepart…`, `price|prix|tarif`, `totalSeats|capacity|capacite|nbPlaces`, `occupiedSeats|reservedSeats…`, `availableSeats|placesDisponibles`.

**Sièges** : plan construit avec les numéros `1…capacité`. L'état vient de `GET /trips/:id/seats` ou directement du trajet. Sans capacité ni liste d'occupés, l'interface propose une saisie manuelle du siège (le serveur valide).

**Réservation** : id, numéro (`reservationNumber|numero|reference|code`), statut (`confirmed`, `boarded`, `cancelled`), siège, trajet (imbriqué ou id), date de création, `qrPayload`.

**QR code** : texte signé fourni par le serveur — `TRANSTU1.<numéro>.<signature>` (HMAC, lié au siège : un changement de siège invalide l'ancien QR). Le client l'affiche tel quel. Sans `qrPayload`, repli sur un JSON non vérifiable (affichage uniquement).

## Ce que votre backend doit garantir (s'il remplace `server/`)

1. `GET /reservations/me` avec trajet inclus.
2. Refus clair d'un siège déjà pris (409) — **contrainte d'unicité `(trajet, siège)` en base**, pas seulement un contrôle applicatif.
3. Capacité + sièges occupés par trajet (`GET /trips/:id/seats`).
4. Règles d'annulation / modification (le client affiche le `message` d'erreur du serveur).
5. Rôle `driver` côté serveur, jamais accordé à l'inscription ; routes `/driver/*` protégées et limitées aux trajets du chauffeur.
6. CORS pour l'origine du client (ou passer par le proxy Vite en développement).
