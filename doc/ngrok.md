# Dev local avec ngrok

Permet de tester le jeu sur **téléphone** alors que l’app tourne en local (Docker).  
Schéma draw.io : [`ngrok.drawio`](./ngrok.drawio)

---

## Problème sans ngrok

En dev, Docker expose le frontend sur **http://localhost:8083**.  
Un téléphone **ne peut pas** ouvrir `localhost` de ton PC → les QR codes seraient inutilisables.

Le backend encode l’URL des QR avec **`PUBLIC_URL`**.  
Si `PUBLIC_URL=http://localhost:8083`, le téléphone affiche « site inaccessible ».

---

## Principe

**ngrok** crée un tunnel HTTPS public vers ton frontend local :

```
Téléphone ──► https://xxxx.ngrok-free.app ──► ngrok (Docker) ──► frontend:80 ──► backend:3000
PC admin  ──► même URL ngrok (recommandé)
```

Tout transite par **un seul port public** (ngrok) ; nginx dans Docker route ensuite `/admin/`, `/joueur/`, `/api/`, `/socket.io/`.

---

## Schéma simplifié

```
┌─────────────┐     HTTPS      ┌──────────────────┐
│  Téléphone  │ ─────────────► │  ngrok cloud     │
└─────────────┘                │  xxxx.ngrok-free │
                               └────────┬─────────┘
┌─────────────┐     HTTPS               │ tunnel
│  PC admin   │ ─────────────►          ▼
└─────────────┘                ┌──────────────────┐
                               │ ngrok (conteneur) │
                               └────────┬─────────┘
                                        ▼
                               ┌──────────────────┐
                               │ frontend :8083    │
                               │ nginx → backend   │
                               └──────────────────┘
```

---

## Mise en route

### 1. Token ngrok

1. Compte sur [ngrok.com](https://ngrok.com)
2. Copier l’authtoken : [dashboard.ngrok.com](https://dashboard.ngrok.com/get-started/your-authtoken)
3. Dans `.env` :

```env
NGROK_AUTHTOKEN=ton_token_ici
```

### 2. Lancer le script

```bash
./scripts/ngrok-dev.sh
```

Le script :

1. Démarre Docker avec le profil **ngrok** (`docker compose --profile ngrok up -d --build`)
2. Récupère l’URL HTTPS publique via l’API ngrok (`http://localhost:4040/api/tunnels`)
3. Met à jour **`PUBLIC_URL`** et **`FRONTEND_URL`** dans `.env`
4. Redémarre le **backend** pour prendre en compte les nouvelles URLs

### 3. Utiliser l’app

| Étape | Action |
|-------|--------|
| 1 | Ouvrir l’admin via l’**URL ngrok** affichée (ex. `https://xxxx.ngrok-free.app/admin/`) |
| 2 | Se connecter → **créer une nouvelle session** |
| 3 | Scanner les QR avec le téléphone |

> Ne pas réutiliser une session créée avec `localhost` — les QR contiendraient la mauvaise URL.

Dashboard ngrok (inspecter les requêtes) : **http://localhost:4040**

---

## Rôle des variables

| Variable | Rôle avec ngrok |
|----------|-----------------|
| `PUBLIC_URL` | URL dans les **QR codes** (`/joueur/?token=…`) |
| `FRONTEND_URL` | Origine autorisée pour **CORS** et **Socket.IO** |
| `NGROK_AUTHTOKEN` | Authentification du conteneur ngrok |

Les deux URLs doivent être **identiques** à l’URL ngrok HTTPS :

```env
PUBLIC_URL=https://abcd-1234.ngrok-free.app
FRONTEND_URL=https://abcd-1234.ngrok-free.app
```

Le script `ngrok-dev.sh` les synchronise automatiquement.

---

## PC admin : ngrok ou localhost ?

| Accès | QR téléphone | Socket / CORS |
|-------|--------------|---------------|
| Admin sur **URL ngrok** | OK | OK |
| Admin sur **localhost:8083** | QR invalides si session créée en localhost | Risque de blocage Socket.IO |

**Recommandation :** tout le monde (admin + téléphones) passe par l’**URL ngrok** pendant les tests mobile.

---

## Plan ngrok gratuit — limites

- L’URL **change à chaque redémarrage** du tunnel ngrok
- À faire après chaque relance :
  1. `./scripts/ngrok-dev.sh`
  2. Rouvrir l’admin sur la **nouvelle** URL
  3. **Recréer une session** (nouveaux QR)

En **production**, ngrok n’est pas utilisé : le domaine fixe `https://game.vitalinfo.site` remplace le tunnel (voir [`architecture.md`](./architecture.md)).

---

## Dépannage

| Symptôme | Cause probable | Action |
|----------|----------------|--------|
| QR « site inaccessible » | `PUBLIC_URL` = localhost | Relancer `ngrok-dev.sh`, recréer session |
| Socket.IO 403 | Admin sur localhost, tel sur ngrok | Ouvrir admin via URL ngrok |
| Tunnel introuvable | ngrok pas démarré | Vérifier `docker compose ps`, port 4040 |
| Login admin échoue | `FRONTEND_URL` ≠ URL du navigateur | Relancer script, vider cookies, réessayer |

---

## Fichiers liés

| Fichier | Rôle |
|---------|------|
| `scripts/ngrok-dev.sh` | Automatisation tunnel + `.env` |
| `docker-compose.yml` | Service `ngrok` (profile `ngrok`) |
| `doc/ngrok.drawio` | Schéma visuel |
| `doc/connexions.drawio` | Page « Dev local » (vue globale) |
