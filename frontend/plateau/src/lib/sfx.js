/** Effets sonores légers (Web Audio) — pas de fichiers externes. */

let ctx = null;

function getCtx() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function unlockAudio() {
  const c = getCtx();
  if (!c) return;
  const buf = c.createBuffer(1, 1, 22050);
  const src = c.createBufferSource();
  src.buffer = buf;
  src.connect(c.destination);
  src.start(0);
}

/** Bip de confirmation au premier déblocage audio. */
export function playUnlockConfirm() {
  tone(523.25, 0.1, { gain: 0.12 });
  tone(659.25, 0.14, { gain: 0.12, delay: 0.08 });
}

function tone(freq, duration, { type = 'sine', gain = 0.12, delay = 0, slideTo } = {}) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo != null) {
    osc.frequency.linearRampToValueAtTime(slideTo, t0 + duration);
  }
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export function playCorrect() {
  tone(523.25, 0.12, { gain: 0.14 });
  tone(659.25, 0.14, { gain: 0.14, delay: 0.1 });
  tone(783.99, 0.22, { gain: 0.16, delay: 0.2 });
}

export function playWrong() {
  tone(220, 0.28, { type: 'square', gain: 0.08, slideTo: 110 });
}

export function playQuestion() {
  tone(440, 0.1, { gain: 0.1 });
  tone(554.37, 0.14, { gain: 0.1, delay: 0.08 });
}

export function playVictory() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => tone(f, 0.22, { gain: 0.14, delay: i * 0.12 }));
  tone(1318.5, 0.45, { gain: 0.12, delay: 0.55 });
}

export function playPass() {
  tone(196, 0.2, { type: 'triangle', gain: 0.1, slideTo: 98 });
}

export function playRejouez() {
  tone(587.33, 0.1, { gain: 0.12 });
  tone(740.0, 0.12, { gain: 0.12, delay: 0.1 });
  tone(880.0, 0.16, { gain: 0.13, delay: 0.2 });
}

export function playWedge() {
  tone(784, 0.1, { gain: 0.12 });
  tone(988, 0.12, { gain: 0.12, delay: 0.08 });
  tone(1175, 0.2, { gain: 0.14, delay: 0.16 });
}

export function playDiceReveal() {
  tone(330, 0.08, { type: 'triangle', gain: 0.1 });
  tone(440, 0.12, { type: 'triangle', gain: 0.1, delay: 0.06 });
}

/** « Toc » sourd — pion qui pose sur une case */
export function playStep() {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime;
  const duration = 0.055;

  // Corps sourd (basse)
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(145, t0);
  osc.frequency.exponentialRampToValueAtTime(70, t0 + duration);
  g.gain.setValueAtTime(0.22, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.01);

  // Légère attaque mate (triangle)
  const click = c.createOscillator();
  const cg = c.createGain();
  click.type = 'triangle';
  click.frequency.setValueAtTime(180, t0);
  cg.gain.setValueAtTime(0.08, t0);
  cg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.025);
  click.connect(cg);
  cg.connect(c.destination);
  click.start(t0);
  click.stop(t0 + 0.03);
}

export function playAnswerResult(answer) {
  if (!answer) return;
  if (answer.isVictory && answer.correct) {
    playCorrect();
    return;
  }
  if (answer.correct) {
    playCorrect();
    playWedge();
    return;
  }
  playWrong();
}
