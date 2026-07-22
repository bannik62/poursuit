<script>
  import {
    SERIES,
    BOARD_SPACES,
    PAWN_COLORS,
    playerColorHex,
    CX,
    CY,
    BOARD_R,
    HUB_R,
    CENTER_PASS_R,
    ringTilePath,
    ringTileCenter,
    spokeTilePath,
    spokeTileCenter,
    spokeSpaceColor,
    spokeWedgeColor,
    ringSpaceColor,
    hqTrianglePoints,
    smallWedgePoints,
    hubSlicePath,
    pawnOffset,
    wedgeSectorPath,
    isHQ,
    isRejouez,
    isPassTurn,
    isSpokeBonus,
    spaceXY,
    CORNER_LEGENDS,
    SPOKE_SPACES,
    tilePathForPosition,
    isCenterPosition,
  } from '../lib/board.js';
  import { playStep } from '../lib/sfx.js';
  import { DICE_HOLD_MS, STEP_MS, POST_MOVE_BEAT_MS } from '@trivial-asso/game';

  let { session, onMoveAnimDone, soundEnabled = false } = $props();

  const players = $derived(session?.players ?? []);
  const current = $derived(session?.currentPlayer ?? 0);

  let displayPositions = $state({});
  let lastRollAt = 0;
  let animToken = 0;
  let animating = false;
  let primed = false;

  $effect(() => {
    const list = session?.players ?? [];
    const roll = session?.lastRoll;

    if (!primed) {
      primed = true;
      lastRollAt = roll?.at ?? 0;
      const next = {};
      for (const p of list) next[p.slot] = p.position ?? 0;
      displayPositions = next;
      return;
    }

    if (!roll) {
      const next = {};
      for (const p of list) next[p.slot] = p.position ?? 0;
      displayPositions = next;
      return;
    }

    if (roll.at === lastRollAt) {
      if (animating) return;
      const next = {};
      for (const p of list) next[p.slot] = p.position ?? 0;
      displayPositions = next;
      return;
    }

    lastRollAt = roll.at;
    const token = ++animToken;
    animating = true;
    const snap = {};
    for (const p of list) {
      snap[p.slot] = p.slot === roll.slot ? roll.from : (p.position ?? 0);
    }
    displayPositions = snap;

    (async () => {
      await new Promise((resolve) => setTimeout(resolve, DICE_HOLD_MS));
      if (token !== animToken) return;

      for (const pos of roll.path ?? []) {
        if (token !== animToken) return;
        await new Promise((resolve) => setTimeout(resolve, STEP_MS));
        displayPositions = { ...displayPositions, [roll.slot]: pos };
        if (soundEnabled) playStep();
      }
      if (token !== animToken) return;
      displayPositions = { ...displayPositions, [roll.slot]: roll.to };
      await new Promise((resolve) => setTimeout(resolve, POST_MOVE_BEAT_MS));
      if (token !== animToken) return;
      animating = false;
      onMoveAnimDone?.(roll);
    })();
  });

  function pawnPosition(slot, fallback) {
    return displayPositions[slot] ?? fallback ?? 0;
  }

  function pawnFill(p) {
    return p.color != null ? playerColorHex(p.color) : PAWN_COLORS[p.slot % PAWN_COLORS.length];
  }

  /** Cases occupées → couleur dominante du pion (priorité au joueur actif) */
  const occupiedTiles = $derived.by(() => {
    const map = new Map();
    for (const p of players) {
      if (!p.connected) continue;
      const pos = pawnPosition(p.slot, p.position);
      const color = pawnFill(p);
      const entry = map.get(pos) ?? { colors: [], primary: null };
      entry.colors.push(color);
      if (p.slot === current || !entry.primary) {
        entry.primary = color;
      }
      map.set(pos, entry);
    }
    return map;
  });
</script>

<svg class="board" viewBox="0 0 1000 1000" role="img" aria-label="Plateau Trivial Pursuit">
  <defs>
    {#each SERIES as s}
      <radialGradient id="wedge-{s.id}" cx="42%" cy="38%" r="80%">
        <stop offset="0%" stop-color="#fff" stop-opacity="0.62" />
        <stop offset="45%" stop-color={s.color} stop-opacity="0.28" />
        <stop offset="100%" stop-color={s.color} stop-opacity="0.72" />
      </radialGradient>
      <pattern id="tex-{s.id}" width="48" height="48" patternUnits="userSpaceOnUse">
        <circle cx="24" cy="24" r="12" fill={s.color} opacity="0.06" />
      </pattern>
    {/each}

    <radialGradient id="board-surface" cx="50%" cy="44%" r="58%">
      <stop offset="0%" stop-color="#fffef9" />
      <stop offset="55%" stop-color="#f3efe6" />
      <stop offset="100%" stop-color="#ddd6c8" />
    </radialGradient>

    <radialGradient id="bg-depth" cx="50%" cy="48%" r="72%">
      <stop offset="0%" stop-color="#127a8a" />
      <stop offset="100%" stop-color="#064652" />
    </radialGradient>

    <linearGradient id="tile-depth" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.22" />
      <stop offset="55%" stop-color="#000" stop-opacity="0" />
      <stop offset="100%" stop-color="#000" stop-opacity="0.18" />
    </linearGradient>

    <filter id="board-shadow" x="-8%" y="-6%" width="116%" height="118%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000" flood-opacity="0.38" />
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.2" />
    </filter>

    <filter id="board-inner" x="-4%" y="-4%" width="108%" height="108%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
      <feOffset dx="0" dy="2" result="offset" />
      <feComposite in="offset" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="inner" />
      <feColorMatrix in="inner" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.25 0" />
      <feMerge>
        <feMergeNode in="SourceGraphic" />
        <feMergeNode />
      </feMerge>
    </filter>

    <filter id="pawn-glow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="pawn-shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity="0.35" />
    </filter>

    <filter id="vignette">
      <feGaussianBlur in="SourceAlpha" stdDeviation="18" result="blur" />
      <feOffset dx="0" dy="0" result="offsetBlur" />
      <feFlood flood-color="#000" flood-opacity="0.35" result="color" />
      <feComposite in="color" in2="offsetBlur" operator="in" result="shadow" />
      <feComposite in="SourceGraphic" in2="shadow" operator="over" />
    </filter>
  </defs>

  <!-- Fond -->
  <rect width="1000" height="1000" fill="url(#bg-depth)" />
  <rect x="16" y="16" width="968" height="968" rx="12" fill="#0a5560" opacity="0.55" />
  <rect x="24" y="24" width="952" height="952" rx="10" fill="#0e7a88" opacity="0.85" />

  <!-- Plateau principal -->
  <circle cx={CX} cy={CY} r={BOARD_R + 6} fill="#000" opacity="0.12" />
  <circle cx={CX} cy={CY} r={BOARD_R} fill="url(#board-surface)" filter="url(#board-shadow)" />
  <circle
    cx={CX}
    cy={CY}
    r={BOARD_R - 2}
    fill="none"
    stroke="#fff"
    stroke-width="2"
    opacity="0.35"
  />
  <circle cx={CX} cy={CY} r={BOARD_R} fill="none" stroke="#1a1a1a" stroke-width="5" />

  <!-- Fonds illustrés -->
  {#each SERIES as s}
    <path d={wedgeSectorPath(s.id)} fill="url(#wedge-{s.id})" />
    <path d={wedgeSectorPath(s.id)} fill="url(#tex-{s.id})" />
  {/each}

  <!-- Rayons -->
  {#each SERIES as s}
    {#each Array(SPOKE_SPACES) as _, step}
      {@const pos = spokeTileCenter(s.id, step)}
      {@const bonus = isSpokeBonus(step)}
      {@const bgId = spokeSpaceColor(s.id, step)}
      {@const wedgeId = spokeWedgeColor(s.id)}
      <path
        d={spokeTilePath(s.id, step)}
        fill={bonus ? '#6c5ce7' : SERIES[bgId].color}
        stroke="#1a1a1a"
        stroke-width="0.9"
        opacity="0.96"
      />
      <path d={spokeTilePath(s.id, step)} fill="url(#tile-depth)" pointer-events="none" />
      {#if bonus}
        <text x={pos.x} y={pos.y - 2} text-anchor="middle" fill="#fff" font-size="7" font-weight="800">
          BONUS
        </text>
        <text x={pos.x} y={pos.y + 7} text-anchor="middle" fill="#fff" font-size="5" font-weight="600" opacity="0.9">
          libre
        </text>
      {:else}
        <polygon
          points={smallWedgePoints(pos.x, pos.y, pos.angle, 7)}
          fill={SERIES[wedgeId].color}
          stroke="#fff"
          stroke-width="0.5"
        />
      {/if}
    {/each}
  {/each}

  <!-- Anneau -->
  {#each BOARD_SPACES as _, i}
    {#if !isHQ(i)}
      {@const rejouez = isRejouez(i)}
      {@const passTurn = isPassTurn(i)}
      {@const colorId = ringSpaceColor(i)}
      {@const center = ringTileCenter(i)}
      <path
        d={ringTilePath(i)}
        fill={passTurn ? '#1a1a1a' : rejouez ? '#FF8FAB' : SERIES[colorId].color}
        stroke="#1a1a1a"
        stroke-width="0.9"
        opacity="0.96"
      />
      <path d={ringTilePath(i)} fill="url(#tile-depth)" pointer-events="none" />
      {#if rejouez}
        <rect x={center.x - 7} y={center.y - 7} width="14" height="14" rx="2" fill="#fff" stroke="#333" stroke-width="0.6" />
        <circle cx={center.x - 3} cy={center.y - 3} r="1.5" fill="#333" />
        <circle cx={center.x + 3} cy={center.y + 3} r="1.5" fill="#333" />
      {:else if passTurn}
        <text
          x={center.x}
          y={center.y + 2}
          text-anchor="middle"
          fill="#fff"
          font-size="5"
          font-weight="800"
        >
          PASSE
        </text>
      {:else}
        <polygon
          points={smallWedgePoints(center.x, center.y, center.angle, 6)}
          fill="#fff"
          opacity="0.9"
        />
      {/if}
    {/if}
  {/each}

  {#each BOARD_SPACES as _, i}
    {#if isHQ(i)}
      {@const colorId = ringSpaceColor(i)}
      <path d={ringTilePath(i)} fill="#f8f6f0" stroke="#1a1a1a" stroke-width="1.2" />
      <path d={ringTilePath(i)} fill="url(#tile-depth)" pointer-events="none" />
      <polygon points={hqTrianglePoints(i)} fill={SERIES[colorId].color} stroke="#222" stroke-width="2" />
    {/if}
  {/each}

  <!-- Hub -->
  {#each SERIES as s}
    <path d={hubSlicePath(s.id)} fill={s.color} stroke="#fff" stroke-width="1.2" opacity="0.95" />
    <path d={hubSlicePath(s.id)} fill="url(#tile-depth)" pointer-events="none" />
  {/each}
  <circle cx={CX} cy={CY} r={HUB_R + 2} fill="none" stroke="#222" stroke-width="2.5" />

  <!-- Centre -->
  <circle cx={CX} cy={CY} r={CENTER_PASS_R + 4} fill="#000" opacity="0.15" />
  <circle cx={CX} cy={CY} r={CENTER_PASS_R} fill="#2d3436" stroke="#fff" stroke-width="3" />
  <text x={CX} y={CY + 4} text-anchor="middle" fill="#c9a227" font-size="14" font-weight="800">
    ★
  </text>

  <!-- Surbrillance cases occupées (couleur du pion) -->
  {#each [...occupiedTiles.entries()] as [pos, info] (pos)}
    {#if isCenterPosition(pos)}
      <circle
        cx={CX}
        cy={CY}
        r={CENTER_PASS_R + 14}
        fill={info.primary}
        opacity="0.42"
        filter="url(#pawn-glow)"
        class="tile-glow"
      />
    {:else if tilePathForPosition(pos)}
      <path
        d={tilePathForPosition(pos)}
        fill={info.primary}
        opacity="0.38"
        filter="url(#pawn-glow)"
        class="tile-glow"
        pointer-events="none"
      />
      <path
        d={tilePathForPosition(pos)}
        fill="none"
        stroke={info.primary}
        stroke-width="2.5"
        opacity="0.75"
        pointer-events="none"
      />
    {/if}
  {/each}

  <!-- Pions -->
  {#each players as p (p.slot)}
    {#if p.connected}
      {@const pos = spaceXY(pawnPosition(p.slot, p.position))}
      {@const off = pawnOffset(p.slot, players.length)}
      {@const fill = pawnFill(p)}
      <circle
        cx={pos.x + off.dx}
        cy={pos.y + off.dy + 2}
        r="14"
        fill="#000"
        opacity="0.22"
      />
      <circle
        cx={pos.x + off.dx}
        cy={pos.y + off.dy}
        r="15"
        fill={fill}
        stroke={p.slot === current ? '#111' : '#fff'}
        stroke-width={p.slot === current ? 3.5 : 2}
        filter="url(#pawn-shadow)"
        class:current={p.slot === current}
      />
      <text
        x={pos.x + off.dx}
        y={pos.y + off.dy + 4}
        text-anchor="middle"
        fill="#fff"
        font-size="11"
        font-weight="800"
        style="text-shadow: 0 1px 2px rgb(0 0 0 / 45%)"
      >
        {p.name?.[0]?.toUpperCase() ?? '?'}
      </text>
    {/if}
  {/each}

  <!-- Légendes -->
  {#each SERIES as s, i}
    {@const corner = CORNER_LEGENDS[i]}
    {@const lx = corner.anchor === 'end' ? corner.x - 72 : corner.x}
    <g filter="url(#pawn-shadow)">
      <polygon
        points="{lx},{corner.y - 8} {lx + 14},{corner.y + 6} {lx - 14},{corner.y + 6}"
        fill={s.color}
        stroke="#fff"
        stroke-width="1"
      />
      <text
        x={corner.anchor === 'end' ? corner.x - 94 : corner.x + 20}
        y={corner.y + 5}
        text-anchor={corner.anchor}
        fill="#fff"
        font-size="14"
        font-weight="700"
        font-family="Georgia, serif"
        style="text-shadow: 0 1px 3px rgb(0 0 0 / 50%)"
      >
        {s.name}
      </text>
    </g>
  {/each}

  <g transform="translate(820, 78)" filter="url(#pawn-shadow)">
    <ellipse cx="0" cy="0" rx="105" ry="30" fill="#1a1a2e" stroke="#c9a227" stroke-width="2" />
    <text x="0" y="-3" text-anchor="middle" fill="#c9a227" font-size="15" font-weight="800" font-family="Georgia, serif">
      TRIVIAL ASSO
    </text>
    <text x="0" y="14" text-anchor="middle" fill="#fff" font-size="9">Édition Formation</text>
  </g>
  <g transform="translate(180, 922)" filter="url(#pawn-shadow)">
    <ellipse cx="0" cy="0" rx="105" ry="30" fill="#1a1a2e" stroke="#c9a227" stroke-width="2" />
    <text x="0" y="-3" text-anchor="middle" fill="#c9a227" font-size="15" font-weight="800" font-family="Georgia, serif">
      TRIVIAL ASSO
    </text>
    <text x="0" y="14" text-anchor="middle" fill="#fff" font-size="9">Édition Formation</text>
  </g>
</svg>

<style>
  .board {
    width: 100%;
    max-width: min(96vh, 1000px);
    max-height: min(92vh, 1000px);
    height: auto;
    display: block;
    filter: drop-shadow(0 24px 48px rgb(0 0 0 / 45%));
  }

  .tile-glow {
    animation: tile-pulse 2.4s ease-in-out infinite;
  }

  @keyframes tile-pulse {
    0%,
    100% {
      opacity: 0.32;
    }
    50% {
      opacity: 0.48;
    }
  }

  circle.current {
    animation: pulse 1.2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      filter: drop-shadow(0 0 4px #fff);
    }
    50% {
      filter: drop-shadow(0 0 14px #ffeb3b);
    }
  }
</style>
