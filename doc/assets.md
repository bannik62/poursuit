# Assets visuels — Trivial Asso

## Approche actuelle : SVG généré en code

Le plateau projecteur **n'utilise pas d'images externes**. Tout est dessiné en **SVG dans Svelte** :

```
frontend/plateau/src/
├── lib/board.js           # géométrie, couleurs, positions
└── components/Board.svelte # rendu SVG (quartiers, cases, pions)
```

### Avantages

- Aucun fichier PNG/SVG à maintenir
- Pions et cases se mettent à jour en temps réel via Socket.IO
- Responsive (projecteur 16:9, `viewBox` SVG)
- Facile à changer les 4 couleurs / thèmes dans `board.js`

### Personnaliser les thèmes

Éditer `SERIES` dans `frontend/plateau/src/lib/board.js` :

```js
export const SERIES = [
  { id: 0, name: 'Recrutement', color: '#E74C3C' },
  { id: 1, name: 'Candidature', color: '#3498DB' },
  // ...
];
```

Même structure dans `backend/src/game/questions.js` (à synchroniser).

---

## Structure du plateau

```
         [Thème A - rouge]
              ╱    ╲
    [Thème D]  ●CENTRE●  [Thème B]
              ╲    ╱
         [Thème C - vert]

    ○ ○ ○ ○  ← 28 cases sur la piste extérieure
```

- **4 quartiers** colorés (fond semi-transparent)
- **28 cases** numérotées (7 par thème)
- **Centre** : victoire
- **Pions** : couleur par joueur, initiale du prénom

---

## Plus tard : assets graphiques (optionnel)

Si le client fournit une maquette Figma / Illustrator :

| Étape | Outil | Export |
|-------|-------|--------|
| 1 | Figma | Plateau en SVG (1 fichier) |
| 2 | Placer dans | `frontend/plateau/public/board.svg` |
| 3 | Remplacer | `<Board />` par `<img>` + calque SVG pions par-dessus |

Ou exporter **4 icônes thème** en PNG/WebP → `public/themes/`.

Pour le MVP, le SVG code suffit pour valider l'atelier.

---

## Écrans

| Phase | Composant | Quand |
|-------|-----------|-------|
| Lobby | `LobbyPlateau.svelte` | Avant lancement |
| Jeu | `Board.svelte` + `GameHud.svelte` | Après `game:start` |

Le projecteur bascule automatiquement au lancement par l'admin.
