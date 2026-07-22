# Trivial Asso — Architecture & fonctionnement

Jeu multijoueur type Trivial Pursuit (4 thèmes) pour atelier formation.  
3 interfaces web + 1 API temps réel.

---

## Vue d'ensemble

**Diagramme draw.io (connexions prod, dev, Socket.IO) :** [`doc/connexions.drawio`](./connexions.drawio)  
Ouvrir avec [diagrams.net](https://app.diagrams.net) ou l’extension Draw.io Integration dans VS Code / Cursor.

Le fichier contient 3 pages :

| Page | Contenu |
|------|---------|
| **Production — connexions** | Clients → Apache :443 → Docker nginx :3333 → backend :3000 |
| **Dev local — connexions** | localhost:8083, ngrok optionnel |
| **Socket.IO — événements** | `session:subscribe`, `player:subscribe`, broadcasts |

### Chaîne production (résumé)

```
Admin / Téléphones / Projecteur
        │  HTTPS :443
        ▼
Apache (game.vitalinfo.site)
  ProxyPass /socket.io/  → 127.0.0.1:3333  (AVANT ProxyPass /)
  ProxyPass /            → 127.0.0.1:3333
        ▼
Docker frontend (nginx :80, port hôte 3333)
  /admin/ /plateau/ /joueur/  → SPAs Svelte
  /api/*                        → backend:3000
  /socket.io/*                  → backend:3000
        ▼
Docker backend (Node.js + Socket.IO :3000, mémoire)
```

En dev avec **ngrok** (téléphone) :

```
Téléphone ──► https://xxxx.ngrok-free.app ──► ngrok ──► frontend:80
PC admin  ──► même URL ngrok (pas localhost pour les QR)
```

---

## Structure du projet

```
trivial-asso/
├── .env                    # secrets (jamais commité)
├── .env.example            # modèle
├── docker-compose.yml      # backend + frontend [+ ngrok]
├── doc/
│   ├── architecture.md     # ce fichier
│   ├── connexions.drawio   # schéma draw.io (prod, dev, Socket.IO)
│   ├── ngrok.md            # dev téléphone via ngrok
│   └── ngrok.drawio        # schéma ngrok
├── scripts/
│   ├── ngrok-dev.sh        # dev téléphone via ngrok
│   └── setup-phone-access.ps1  # alternative IP locale (WSL)
├── backend/
│   └── src/
│       ├── index.js        # Express + Socket.IO
│       ├── routes/         # auth, session, player, config
│       ├── socket/         # gameHandler (temps réel)
│       ├── game/           # Session.js, questions.js
│       └── middleware/     # authJwt
└── frontend/
    ├── Dockerfile          # build 3 apps Svelte → nginx
    ├── nginx.conf          # routage + proxy API
    ├── admin/              # interface formateur
    ├── plateau/            # projecteur
    └── joueur/             # téléphone joueur
```

---

## Docker

### Services (comme Spirale / TradingBase)

| Service | Image | Port hôte | Rôle |
|---------|-------|-----------|------|
| `backend` | build `./backend` | **3004** → 3000 | API REST + Socket.IO |
| `frontend` | build `./frontend` | **8083** → 80 | nginx : 3 SPAs + proxy |
| `ngrok` | ngrok/ngrok (profile) | **4040** | tunnel HTTPS dev téléphone |

### Commandes

```bash
# Démarrer (PC seul, localhost)
docker compose up -d --build

# Arrêter
docker compose down

# Logs
docker compose logs -f
```

### Build frontend (multi-stage)

Le `frontend/Dockerfile` compile les 3 apps Svelte 5 (Vite) puis les copie dans nginx :

```
/usr/share/nginx/html/
├── admin/      ← frontend/admin/dist
├── plateau/    ← frontend/plateau/dist
└── joueur/     ← frontend/joueur/dist
```

---

## Nginx (dans le conteneur frontend)

Fichier : `frontend/nginx.conf`

| Route | Comportement |
|-------|--------------|
| `/` | Redirection → `/admin/` |
| `/admin/` | SPA formateur (`try_files` → `index.html`) |
| `/plateau/` | SPA projecteur |
| `/joueur/` | SPA joueur (mobile) |
| `/api/*` | Proxy vers `http://backend:3000` |
| `/socket.io/*` | Proxy WebSocket vers backend |

Tout passe par **un seul port** (`8083`) — pas besoin d'ouvrir plusieurs ports côté client.

---

## Variables d'environnement (`.env`)

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret signature cookie admin |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Login formateur |
| `PUBLIC_URL` | URL dans les **QR codes** joueur |
| `FRONTEND_URL` | Origine CORS + cookies |
| `NGROK_AUTHTOKEN` | Token ngrok (dev téléphone) |
| `MIN_PLAYERS` / `MAX_PLAYERS` | 2 à 4 |

**Important QR codes :** `PUBLIC_URL` doit être une URL accessible depuis le téléphone.

| Contexte | PUBLIC_URL |
|----------|------------|
| PC seul | `http://localhost:8083` |
| Téléphone (WSL) | URL ngrok `https://xxxx.ngrok-free.app` |

---

## Dev avec ngrok (téléphone)

Guide complet : **[`doc/ngrok.md`](./ngrok.md)** · schéma : [`doc/ngrok.drawio`](./ngrok.drawio)

1. Ajouter `NGROK_AUTHTOKEN` dans `.env`
2. Lancer :

```bash
./scripts/ngrok-dev.sh
```

Le script :
- démarre Docker + ngrok
- récupère l'URL HTTPS publique
- met à jour `PUBLIC_URL` et `FRONTEND_URL` dans `.env`
- redémarre le backend

3. Ouvrir l'admin via l'**URL ngrok** (pas localhost)
4. Créer une **nouvelle session** → nouveaux QR codes

Dashboard ngrok : http://localhost:4040

> L'URL ngrok change à chaque redémarrage (plan gratuit). Relancer le script et recréer une session.

---

## Fonctionnement général

### Parcours formateur (admin)

1. Login → `POST /api/auth/login` (cookie JWT httpOnly)
2. Choisir 2–4 joueurs → `POST /api/admin/session`
3. QR codes générés : `{PUBLIC_URL}/joueur/?token=XXXX`
4. Suivi live des connexions (Socket.IO)
5. Lancer la partie quand tous connectés
6. Reset possible à tout moment

### Parcours joueur (téléphone)

1. Scan QR → page accueil (prénom)
2. `POST /api/player/join` → lobby
3. Écran d'attente (liste participants, compteur)
4. `game:start` → interface partie (en cours de dev)

### Parcours projecteur (plateau)

1. URL : `{PUBLIC_URL}/plateau/?session=XXXX`
2. Lecture seule — slots joueurs, puis plateau jeu
3. Synchronisé via Socket.IO

---

## API REST

| Méthode | Route | Auth | Rôle |
|---------|-------|------|------|
| GET | `/api/health` | — | Health check |
| GET | `/api/config` | — | URL publique, avertissements |
| POST | `/api/auth/login` | — | Login admin |
| POST | `/api/auth/logout` | cookie | Déconnexion |
| GET | `/api/admin/me` | JWT | Vérifier session admin |
| POST | `/api/admin/session` | JWT | Créer session + tokens |
| GET | `/api/admin/session/:id` | JWT | État session |
| POST | `/api/admin/session/:id/start` | JWT | Lancer partie |
| POST | `/api/admin/session/:id/reset` | JWT | Reset |
| POST | `/api/player/join` | — | Joueur rejoint (token + prénom) |

---

## Socket.IO

Room = `sessionId` (tous les clients rejoignent la même room).

| Événement | Direction | Description |
|-----------|-----------|-------------|
| `session:subscribe` | client → serveur | Admin / plateau rejoint la room |
| `player:subscribe` | client → serveur | Joueur rejoint la room |
| `session:state` | serveur → clients | État complet de la session |
| `player:joined` | serveur → clients | Un joueur vient de se connecter |
| `game:start` | serveur → clients | Partie lancée |
| `session:reset` | serveur → clients | Session supprimée |

---

## État d'avancement

| Fait | À faire |
|------|---------|
| Architecture Docker (2 services) | Logique de jeu (dé, questions) |
| Auth admin JWT | Plateau SVG Trivial Pursuit |
| Lobby + QR + ngrok | Camembert, victoire |
| Interfaces joueur (accueil + attente) | Contenu questions client |
| Socket.IO lobby | Déploiement prod OVH |

---

## Ports (éviter conflits locaux)

| Projet | Frontend | Backend |
|--------|----------|---------|
| yt-webService | 8080 | — |
| association-spirale | 8081 | 3002 |
| tradingbase | 8082 | 3003 |
| **trivial-asso** | **8083** | **3004** |

---

## Dépannage rapide

| Problème | Solution |
|----------|----------|
| 404 sur `/admin/` | `docker compose up -d --build` (tout le stack) |
| QR « site inaccessible » | `PUBLIC_URL` = localhost → utiliser ngrok |
| Admin OK mais tel non | Recréer session après changement `PUBLIC_URL` |
| Login admin via ngrok échoue | Vérifier `FRONTEND_URL` = même URL ngrok |
