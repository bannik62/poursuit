/** Timeline partagée plateau / joueur : dé → pion → action de case. */

/** Affichage du score (overlay) avant que le pion bouge */
export const DICE_HOLD_MS = 1800;

/** Durée d’un pas de pion sur le plateau */
export const STEP_MS = 450;

/** Petit battement après le dernier pas, avant question / passe / rejouez */
export const POST_MOVE_BEAT_MS = 400;

/** Marge anti-désync réseau / rendu */
export const SYNC_SLACK_MS = 300;

/**
 * Durée totale jusqu’à l’action de case.
 * @param {number} pathLength
 */
export function moveAnimDurationMs(pathLength = 0) {
  const steps = Math.max(0, Number(pathLength) || 0);
  return DICE_HOLD_MS + steps * STEP_MS + POST_MOVE_BEAT_MS + SYNC_SLACK_MS;
}

/**
 * Attente restante depuis la réception du lancer (même instant que le plateau).
 * @param {number} pathLength
 * @param {number} startedAtMs  Date.now() quand le roll est reçu
 */
export function remainingMoveAnimMs(pathLength, startedAtMs) {
  const elapsed = Date.now() - (startedAtMs || Date.now());
  return Math.max(0, moveAnimDurationMs(pathLength) - elapsed);
}

/**
 * @param {number} pathLength
 * @param {number} startedAtMs
 */
export function waitForMoveAnim(pathLength, startedAtMs) {
  const ms = remainingMoveAnimMs(pathLength, startedAtMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Infère le cue si le serveur n’envoie pas encore `roll.cue`.
 * @param {object | null} session
 * @param {object | null} roll
 */
export function inferRollCue(session, roll) {
  if (roll?.cue) return roll.cue;
  if (roll?.blocked) return 'exact';
  if (!session || !roll) return 'none';
  if (session.phase === 'challenge_select') return 'challenge';
  if (session.phase === 'question') return 'question';
  if (roll.to != null && session.players?.[roll.slot]?.finished) return 'finish';
  if (session.phase === 'roll') {
    if (session.extraRolls > 0) return 'bonus';
    if (session.currentPlayer === roll.slot) return 'rejouez';
    // Tour suivant sans case spéciale → pas de popup
    return 'none';
  }
  return 'none';
}
