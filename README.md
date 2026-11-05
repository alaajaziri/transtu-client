# TRANSTU — Application (client React + serveur de démonstration)

Deux interfaces dans une seule application :

- **Passager** : inscription / connexion (JWT), recherche de trajets, choix du siège, réservation, billet avec QR code signé, historique, modification, annulation, profil.
- **Chauffeur** : liste de ses trajets, **scan du QR** des billets (caméra ou photo), saisie manuelle du numéro, liste des passagers, embarquement / départ du bus.

Inclut l'aperçu **« Voir sur mobile »** (cadre iPhone).

## Démarrage rapide (client + serveur de démo)

```bash
npm install
npm run server:install      # dépendances du serveur
cp .env.example .env        # (optionnel) VITE_API_URL=/api par défaut

# terminal 1 — API de démonstration  → http://localhost:5000/api
npm run server

# terminal 2 — interface             → http://localhost:5173
npm run dev
```

Au premier lancement, le serveur crée une base de démonstration (`server/data/db.json`) avec des trajets sur 7 jours,
dont un départ dans ~45 min pour tester l'embarquement tout de suite.

| Compte | E-mail | Mot de passe |
|---|---|---|
| Passager | `client@transtu.tn` | `client123` |
| Chauffeur 1 | `chauffeur1@transtu.tn` | `driver123` |
| Chauffeur 2 | `chauffeur2@transtu.tn` | `driver123` |

Le rôle (`client` / `driver`) vient du serveur : après connexion, un chauffeur arrive sur `/driver`, un passager sur `/dashboard`.

### Tester le scanner
- `npm --prefix server run qr` écrit un PNG de QR par réservation dans `server/data/qr/` : affichez-le sur un autre écran et scannez-le depuis `/driver/trips/:id`.
- La caméra en direct exige **HTTPS ou `localhost`**. Sinon : bouton « Photo du billet » ou saisie du numéro (`TR-8F3K2Q`).
- `npm --prefix server run seed` remet la base de démonstration à zéro.

### Tests
`npm run server:test` — test de bout en bout du serveur (auth, réservations, course sur un même siège, QR valide / périmé / falsifié, embarquement, statuts du trajet, profil).

## Brancher votre vrai backend

Le serveur de `server/` est un **contrat de référence** : voir **`MERGE.md`** (modèles de données, contrat d'API, format du QR signé, brancher MongoDB/SQL, check-list de production).

Côté client, tout ce qui dépend du backend est regroupé dans :
- `src/config/endpoints.js` — routes et champs envoyés ;
- `src/utils/normalize.js` — lecture des réponses (déjà tolérant : français/anglais).

`npm run probe` (avec `TOKEN=eyJ... npm run probe` pour les routes protégées) liste les routes présentes ou absentes sur l'API ciblée.
Détail des routes : `API.md`.

## Logo

Le logo officiel doit se trouver dans `public/logo.png` (fond transparent, format horizontal) : il est affiché automatiquement dans la barre du haut et le pied de page ; sans lui, une marque provisoire s'affiche.
Palette (extraite du logo) : vert `#009751` (couleur principale), orange `#F8AF26` (accent : boutons, siège choisi), bleu `#0F66AD` (secondaire : lignes, aperçu mobile). Le rouge est réservé aux erreurs et annulations.
Tout est dans les variables `:root` de `src/styles/index.css`.

## Animations (React Bits)

Les animations viennent de [React Bits](https://github.com/DavidHDev/react-bits) (licence MIT + Commons Clause : utilisation dans un site OK, revente des composants interdite). Les fichiers sont téléchargés tels quels, à un commit figé, dans `src/reactbits/` par `scripts/fetch-reactbits.mjs` — lancé automatiquement avant `npm run dev` / `npm run build` (ou à la main : `npm run reactbits`, besoin d'Internet la première fois).

| Composant | Où |
|---|---|
| `ClickSpark` | étincelles au clic (`Layout.jsx`), désactivées dans l'espace chauffeur |
| `BlurText` | phrase d'accroche de l'accueil |
| `CountUp` | compteurs du tableau de bord |
| `AnimatedContent` (via `components/fx/Reveal.jsx`) | cartes de trajets et étapes qui apparaissent au défilement |

Tout est désactivé pour les personnes qui ont réglé leur système sur « réduire les animations ». Dépendances ajoutées : `motion`, `gsap`.

## Aperçu « Voir sur mobile »

Bouton dans la barre du haut (ordinateur). Il ouvre l'application **réelle** dans une iframe aux dimensions d'un iPhone (15 Pro, 15 Pro Max, SE). Même session, même JWT, navigation interactive. « Quitter l'aperçu » (ou Échap) ramène à la page où vous étiez.
Sur un vrai téléphone, le site est responsive (barre d'onglets en bas) et le bouton est masqué.
Pour l'ouvrir depuis un téléphone du même réseau : `http://IP-du-PC:5173` (le proxy Vite redirige `/api` vers le serveur, pas de CORS à régler).

## Structure

```
src/                          CLIENT (React + Vite)
  config/endpoints.js         routes + champs envoyés
  services/                   http (fetch + JWT), auth, trips, reservations, users, driver
  utils/                      normalize, format, roles, ticket (QR + PNG), validate…
  context/AuthContext         session JWT (localStorage)
  components/                 Navbar, PhoneFrame, SeatMap, TicketCard, QrScanner…
  pages/                      Home, Trips, Login, Register, Dashboard, Booking, Confirmation,
                              Reservations, ReservationDetail, Profile,
                              DriverHome, DriverTrip
  styles/                     index.css (identité visuelle), driver.css (espace chauffeur)

server/                       SERVEUR DE DÉMO (Express + JSON)
  src/routes/                 auth, trips, reservations, users, driver
  src/services/               reservations, boarding, qr (HMAC), numbers
  src/store/                  jsonStore (SEULE couche données), seed
  scripts/                    smoke-test.js, export-qr.js
```

## Scripts

Client : `npm run dev` · `npm run build` · `npm run preview` · `npm run probe`
Serveur : `npm run server:install` · `npm run server` · `npm run server:test`
