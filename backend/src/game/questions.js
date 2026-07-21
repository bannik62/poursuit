import { SERIES, themeInfo as sharedThemeInfo } from '../../shared/game/index.js';
import { QUESTIONS } from '../../shared/questions/index.js';

export { SERIES };

const bySeries = new Map();
for (const q of QUESTIONS) {
  if (!bySeries.has(q.series)) bySeries.set(q.series, []);
  bySeries.get(q.series).push(q);
}

export function pickQuestionForPlayer(series, askedIds = []) {
  const pool = bySeries.get(series) ?? [];
  const asked = new Set(askedIds);
  const available = pool.filter((q) => !asked.has(q.id));
  if (!available.length) return null;
  return available[Math.floor(Math.random() * available.length)];
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
