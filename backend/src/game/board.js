import { rollDiceValue } from './dice.js';
import { buildPlayerPath, startingPosition } from '../../shared/game/index.js';

export { RING_SIZE, startingPosition } from '../../shared/game/index.js';
export { rollDiceValue };

// rétrocompat si quelque chose importe encore buildRingPath
export function buildRingPath(from, steps) {
  const path = [];
  let pos = from;
  for (let i = 0; i < steps; i++) {
    pos = (pos + 1) % 28;
    path.push(pos);
  }
  return path;
}

export { buildPlayerPath };
