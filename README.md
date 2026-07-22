# Trivial Asso (Poursuit)

Jeu multijoueur type **Trivial Pursuit** pour atelier de formation.  
Un formateur pilote la partie depuis un PC ; les participants jouent sur leur téléphone (QR code) ; le plateau s’affiche sur un projecteur.

**Production :** [https://game.vitalinfo.site](https://game.vitalinfo.site)

---

## Interfaces

| Interface | URL | Rôle |
|-----------|-----|------|
| **Admin** | `/admin/` | Login formateur, création session, QR codes, lancement partie |
| **Joueur** | `/joueur/?token=…` | Scan QR → prénom → jeu sur mobile |
| **Plateau** | `/plateau/?session=…` | Affichage projecteur (lecture seule, sync Socket.IO) |

---

## Stack

- **Backend** — Node.js, Express, Socket.IO (sessions en mémoire)
- **Frontend** — 3 apps Svelte 5 (Vite) servies par nginx
- **Dev** — Docker Compose, ngrok optionnel pour téléphone
- **Prod** — Docker sur VPS OVH, Apache en reverse proxy (HTTPS)

Schéma des connexions : [`doc/connexions.drawio`](doc/connexions.drawio) · doc détaillée : [`doc/architecture.md`](doc/architecture.md)

---

## Démarrage rapide (dev local)

### Prérequis

- Docker & Docker Compose
- Ports libres : **8083** (frontend), **3004** (backend debug)

### Installation

```bash
git clone https://github.com/bannik62/poursuit.git
cd poursuit   # ou trivial-asso

cp .env.example .env
# Éditer .env : JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD

docker compose up -d --build
```

Ouvrir **http://localhost:8083/admin/** — login admin → créer une session → scanner les QR.

### Dev avec téléphone (ngrok)

1. Ajouter `NGROK_AUTHTOKEN` dans `.env`
2. Lancer :

```bash
./scripts/ngrok-dev.sh
```

3. Ouvrir l’admin via l’**URL ngrok** (pas localhost)
4. **Recréer une session** pour régénérer les QR avec la bonne `PUBLIC_URL`

Doc détaillée : [`doc/ngrok.md`](doc/ngrok.md) · schéma : [`doc/ngrok.drawio`](doc/ngrok.drawio)

Dashboard ngrok : http://localhost:4040

---

## Variables d’environnement

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret signature cookie admin |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Identifiants formateur |
| `PUBLIC_URL` | URL dans les **QR codes** (doit être joignable par le téléphone) |
| `FRONTEND_URL` | Origine CORS + Socket.IO (même domaine qu’admin en prod) |
| `NGROK_AUTHTOKEN` | Token ngrok (dev téléphone uniquement) |
| `MIN_PLAYERS` / `MAX_PLAYERS` | 2 à 4 joueurs |

| Contexte | `PUBLIC_URL` / `FRONTEND_URL` |
|----------|-------------------------------|
| PC seul | `http://localhost:8083` |
| Téléphone (ngrok) | `https://xxxx.ngrok-free.app` |
| Production | `https://game.vitalinfo.site` |

---

## Production (VPS)

Chaîne : **Clients → Apache :443 → Docker nginx :3333 → backend :3000**

### Déploiement automatique

Push sur `main` → GitHub Actions (`.github/workflows/deploy.yml`) :

- rsync vers le VPS
- écriture de `.env.prod`
- `docker compose -f docker-compose.prod.yml up -d --build`

Secrets GitHub requis : `PURSUIT_DEPLOY_KEY`, `DEPLOY_HOST`, `DEPLOY_PORT`, `DEPLOY_USER`, `DEPLOY_PATH`, `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `PUBLIC_URL`, `FRONTEND_URL`, `GAME_HTTP_PORT`.

### Déploiement manuel sur le VPS

```bash
cd /var/www/html/poursuit
sudo docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Modèle d’env : [`.env.prod.example`](.env.prod.example)  
Vhost Apache commenté : [`deploy/apache-game-vitalinfo.conf.example`](deploy/apache-game-vitalinfo.conf.example)

> Toujours passer `--env-file .env.prod` avec les commandes `docker compose` sur le VPS.

---

## Commandes utiles

```bash
# Dev — logs
docker compose logs -f

# Dev — arrêt
docker compose down

# Prod — rebuild
sudo docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Health check
curl -s https://game.vitalinfo.site/api/health
```

---

## Fonctionnement (résumé)

1. **Admin** se connecte → crée une session (2–4 joueurs) → QR générés
2. **Joueurs** scannent → `POST /api/player/join` → lobby (Socket.IO)
3. Quand tous connectés → **Lancer la partie** → ouverture plateau + sync temps réel
4. **Reset** possible à tout moment depuis l’admin

Événements Socket.IO : `session:subscribe`, `player:subscribe`, `session:state`, `game:start`, `game:dice`, `game:answer`, `game:over` — voir [`doc/architecture.md`](doc/architecture.md).

---

## Structure du projet

```
trivial-asso/
├── backend/           # API REST + Socket.IO
├── frontend/
│   ├── admin/         # Dashboard formateur
│   ├── joueur/        # Interface mobile
│   └── plateau/       # Projecteur
├── shared/            # Logique jeu partagée
├── doc/               # Architecture, ngrok, draw.io
├── deploy/            # Exemple vhost Apache
├── scripts/           # ngrok-dev.sh
├── docker-compose.yml
└── docker-compose.prod.yml
```

---

## Dépannage

| Problème | Piste |
|----------|--------|
| Admin bloqué « en attente », téléphones OK | Socket admin : recréer session ; vérifier Apache `/socket.io/` avant `ProxyPass /` |
| **403 sur `/socket.io?…&sid=…`** (console nav) | **Apache** bloque avant Docker (`Server: Apache`). Souvent ModSecurity / mod_evasive après plusieurs connexions (admin + téléphones + plateau). Voir `deploy/apache-game-vitalinfo.conf.example` |
| 403 sur tout le site (`/admin/`, `/api/health`) | Vhost HTTPS sans proxy (certbot a écrasé la config) → remettre les `ProxyPass`, `sudo systemctl reload apache2` |
| 403 CORS backend (rare, `Server: nginx`) | `FRONTEND_URL` = origine exacte (`https://game.vitalinfo.site`, sans slash final) |
| 401 sur `/api/admin/me` | Normal tant que tu n’es pas connecté admin |
| QR « site inaccessible » | `PUBLIC_URL` = localhost → utiliser ngrok ou URL prod |
| QR anciens après changement d’URL | Recréer une **nouvelle** session admin |
| `docker compose exec` affiche des WARN | Ajouter `--env-file .env.prod` |

---

## Licence

Projet privé — usage interne formation.
