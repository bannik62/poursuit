import sante from './sante.js';
import prejuge from './prejuge.js';
import art from './art.js';
import mobilite from './mobilite.js';

const POOLS = { sante, prejuge, art, mobilite };

function validateQuestion(q, seenIds) {
  if (!q?.id || seenIds.has(q.id)) {
    throw new Error(`Question invalide ou id dupliqué : ${q?.id ?? '?'}`);
  }
  if (!Number.isInteger(q.series) || q.series < 0 || q.series > 3) {
    throw new Error(`series invalide pour ${q.id}`);
  }
  if (!Array.isArray(q.choices) || q.choices.length !== 4) {
    throw new Error(`${q.id} : choices doit contenir exactement 4 réponses`);
  }
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) {
    throw new Error(`${q.id} : answer doit être un index entre 0 et 3`);
  }
  if (!q.text?.trim()) throw new Error(`${q.id} : text requis`);
  seenIds.add(q.id);
}

function buildBank() {
  const seenIds = new Set();
  const all = [];

  for (const [name, pool] of Object.entries(POOLS)) {
    if (!Array.isArray(pool)) {
      throw new Error(`shared/questions/${name}.js doit exporter un tableau`);
    }
    for (const q of pool) {
      validateQuestion(q, seenIds);
      all.push(q);
    }
  }

  return all;
}

export const QUESTIONS = buildBank();
