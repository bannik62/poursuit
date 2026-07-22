import { SERIES, themeInfo as sharedThemeInfo } from '../../shared/game/index.js';
import { QUESTIONS } from '../../shared/questions/index.js';

export { SERIES };

const bySeries = new Map();
for (const q of QUESTIONS) {
  if (!bySeries.has(q.series)) bySeries.set(q.series, []);
  bySeries.get(q.series).push(q);
}

/** IDs des questions d’un thème (recyclage du pool par thème). */
export function questionIdsForSeries(series) {
  return (bySeries.get(series) ?? []).map((q) => q.id);
}

/**
 * Tire une question pour la partie entière (pas de doublon tant que le pool tient).
 * Si toutes les questions du thème ont déjà été posées → recycled=true, pool réouvert.
 */
export function pickQuestionForParty(series, askedIds = []) {
  const pool = bySeries.get(series) ?? [];
  if (!pool.length) return { question: null, recycled: false };

  const asked = new Set(askedIds);
  let available = pool.filter((q) => !asked.has(q.id));
  let recycled = false;

  if (!available.length) {
    recycled = true;
    available = pool;
  }

  const question = available[Math.floor(Math.random() * available.length)];
  return { question, recycled };
}

/** @deprecated Utiliser pickQuestionForParty — conservé pour compat interne */
export function pickQuestionForPlayer(series, askedIds = []) {
  return pickQuestionForParty(series, askedIds).question;
}

export function questionForClient(q, theme = q.series) {
  if (!q) return null;
  const info = sharedThemeInfo(theme);
  return {
    id: q.id,
    series: theme,
    themeName: info?.name ?? 'Thème',
    themeColor: info?.color ?? '#888',
    text: q.text,
    choices: q.choices,
  };
}

export function themeInfo(series) {
  return sharedThemeInfo(series);
}

export { QUESTIONS };
