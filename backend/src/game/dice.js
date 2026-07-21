import {
  buildPlayerPath,
  getSpaceInfo,
  hasAllWedges,
} from '../../shared/game/index.js';

export function rollDiceValue() {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Partie rapide : favorise un jet qui atterrit sur un camembert manquant.
 * @param {object} player
 * @param {number} from
 * @param {{ fastGame?: boolean, requireExactCenter?: boolean }} [options]
 */
export function pickRollValue(player, from, options = {}) {
  const { fastGame = false, requireExactCenter = true } = options;

  if (!fastGame || hasAllWedges(player)) {
    return rollDiceValue();
  }

  const good = [];
  for (let value = 1; value <= 6; value += 1) {
    const path = buildPlayerPath(player, from, value, { requireExactCenter });
    if (!path.length) continue;
    const to = path[path.length - 1];
    const space = getSpaceInfo(to);
    if (
      (space.type === 'color' || space.type === 'hq') &&
      !player.wedges[space.theme]
    ) {
      good.push(value);
    }
  }

  if (good.length > 0) {
    return good[Math.floor(Math.random() * good.length)];
  }

  return rollDiceValue();
}
