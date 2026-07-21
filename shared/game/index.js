/** Source de vérité partagée — thèmes, anneau, rayons, centre. */

export const SERIES = [
  { id: 0, name: 'Santé', color: '#E74C3C', label: 'A' },
  { id: 1, name: 'Préjugé', color: '#3498DB', label: 'B' },
  { id: 2, name: 'Art et lettres', color: '#2ECC71', label: 'C' },
  { id: 3, name: 'Mobilité', color: '#F1C40F', label: 'D' },
];

/** Couleurs de pion / identité joueur (choix au démarrage) */
export const PLAYER_COLORS = [
  { id: 0, hex: '#E74C3C', name: 'Rouge' },
  { id: 1, hex: '#3498DB', name: 'Bleu' },
  { id: 2, hex: '#2ECC71', name: 'Vert' },
  { id: 3, hex: '#F1C40F', name: 'Jaune' },
  { id: 4, hex: '#9B59B6', name: 'Violet' },
  { id: 5, hex: '#E67E22', name: 'Orange' },
];

export function playerColorHex(colorId) {
  const c = PLAYER_COLORS.find((x) => x.id === colorId);
  return c?.hex ?? PLAYER_COLORS[0].hex;
}

export const NUM_SERIES = 4;
export const SPACES_PER_SEGMENT = 7;
export const RING_SIZE = NUM_SERIES * SPACES_PER_SEGMENT;

export const HQ_POSITIONS = [0, 7, 14, 21];
export const RING_FIXED_ORDER = { 1: 0, 2: 1, 5: 2, 6: 3 };

/** Cases par rayon (HQ → centre), dernière = défi */
export const SPOKE_SPACES = 5;
export const SPOKE_CHALLENGE_STEP = 4;
export const CENTER_INDEX = RING_SIZE + NUM_SERIES * SPOKE_SPACES;
export const TOTAL_SPACES = CENTER_INDEX + 1;

export function homeTheme(slot) {
  return slot % NUM_SERIES;
}

export function startingPosition(slot) {
  return HQ_POSITIONS[slot % HQ_POSITIONS.length];
}

export function homeHqPosition(slot) {
  return HQ_POSITIONS[slot % HQ_POSITIONS.length];
}

export function segmentInfo(index) {
  const segment = Math.floor(index / SPACES_PER_SEGMENT);
  const pos = index % SPACES_PER_SEGMENT;
  return {
    segment,
    pos,
    isHQ: pos === 0,
    isPassTurn: pos === 3,
    isRejouez: pos === 4,
  };
}

export function ringSpaceColor(index) {
  const { segment, pos, isHQ: hq, isRejouez: rej, isPassTurn: pass } = segmentInfo(index);
  if (hq) return segment;
  if (pass) return -3;
  if (rej) return -1;
  return RING_FIXED_ORDER[pos];
}

export const BOARD_SPACES = Array.from({ length: RING_SIZE }, (_, i) => ringSpaceColor(i));

export function spokePosition(seriesId, step) {
  return RING_SIZE + seriesId * SPOKE_SPACES + step;
}

export function parseSpoke(position) {
  if (position < RING_SIZE || position >= CENTER_INDEX) return null;
  const spokeIdx = position - RING_SIZE;
  return {
    seriesId: Math.floor(spokeIdx / SPOKE_SPACES),
    step: spokeIdx % SPOKE_SPACES,
  };
}

export function isOnSpoke(position) {
  return position >= RING_SIZE && position < CENTER_INDEX;
}

export function isAtCenter(position) {
  return position === CENTER_INDEX;
}

export function spokeThemeAt(seriesId, step) {
  const order = [
    (seriesId + 2) % NUM_SERIES,
    (seriesId + 3) % NUM_SERIES,
    (seriesId + 1) % NUM_SERIES,
  ];
  return order[step % order.length];
}

export function getSpaceInfo(position) {
  if (position === CENTER_INDEX) return { type: 'center' };

  const spoke = parseSpoke(position);
  if (spoke) {
    if (spoke.step === SPOKE_CHALLENGE_STEP) {
      return { type: 'challenge', spokeTheme: spoke.seriesId };
    }
    return {
      type: 'color',
      theme: spokeThemeAt(spoke.seriesId, spoke.step),
      onSpoke: true,
      spokeTheme: spoke.seriesId,
    };
  }

  if (position < 0 || position >= RING_SIZE) return { type: 'unknown' };

  const pos = position % SPACES_PER_SEGMENT;
  const colorId = BOARD_SPACES[position];

  if (colorId === -3) return { type: 'pass' };
  if (colorId === -1) return { type: 'rejouez' };
  if (pos === 0) return { type: 'hq', theme: Math.floor(position / SPACES_PER_SEGMENT) };
  if (colorId >= 0 && colorId <= 3) return { type: 'color', theme: colorId };
  return { type: 'unknown' };
}

export function hasAllWedges(player) {
  return player?.wedges?.every(Boolean) ?? false;
}

export function themeInfo(series) {
  return SERIES[series] ?? null;
}

function distanceToCenterFrom(pos, seriesId, homeHq) {
  if (pos === CENTER_INDEX) return 0;
  if (pos === homeHq) return SPOKE_SPACES + 1;
  const spoke = parseSpoke(pos);
  if (spoke && spoke.seriesId === seriesId) {
    return SPOKE_SPACES - spoke.step;
  }
  return null;
}

function nextTowardCenter(pos, seriesId, homeHq) {
  if (pos === homeHq) return spokePosition(seriesId, 0);
  const spoke = parseSpoke(pos);
  if (!spoke) return pos;
  if (spoke.step >= SPOKE_SPACES - 1) return CENTER_INDEX;
  return spokePosition(seriesId, spoke.step + 1);
}

function canEnterSpoke(player, pos) {
  return hasAllWedges(player) && pos === homeHqPosition(player.slot);
}

/**
 * Chemin de déplacement.
 * @param {object} [options]
 * @param {boolean} [options.requireExactCenter=true] jet exact pour le centre
 */
export function buildPlayerPath(player, from, steps, options = {}) {
  const requireExactCenter = options.requireExactCenter !== false;
  const path = [];
  let pos = from;
  const seriesId = homeTheme(player.slot);
  const homeHq = homeHqPosition(player.slot);
  let remaining = Math.max(0, Number(steps) || 0);

  const headingToCenter = () =>
    isOnSpoke(pos) || canEnterSpoke(player, pos) || pos === CENTER_INDEX;

  if (headingToCenter() && pos !== CENTER_INDEX) {
    const dist = distanceToCenterFrom(pos, seriesId, homeHq);
    if (dist != null && remaining > dist && requireExactCenter) {
      return [];
    }
  }

  while (remaining > 0) {
    if (pos === CENTER_INDEX) break;

    if (isOnSpoke(pos) || canEnterSpoke(player, pos)) {
      const dist = distanceToCenterFrom(pos, seriesId, homeHq);
      if (dist != null && remaining > dist) {
        if (requireExactCenter) break;
        pos = CENTER_INDEX;
        path.push(pos);
        remaining = 0;
        break;
      }
      pos = nextTowardCenter(pos, seriesId, homeHq);
      path.push(pos);
      remaining -= 1;
      continue;
    }

    pos = (pos + 1) % RING_SIZE;
    path.push(pos);
    remaining -= 1;
  }

  return path;
}

export {
  DICE_HOLD_MS,
  STEP_MS,
  POST_MOVE_BEAT_MS,
  SYNC_SLACK_MS,
  moveAnimDurationMs,
  remainingMoveAnimMs,
  waitForMoveAnim,
  inferRollCue,
} from './timing.js';
