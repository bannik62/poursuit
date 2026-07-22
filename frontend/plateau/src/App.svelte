<script>
  import { onMount } from 'svelte';
  import { subscribeSession } from './lib/socket.js';
  import Board from './components/Board.svelte';
  import GameHud from './components/GameHud.svelte';
  import TurnHistory from './components/TurnHistory.svelte';
  import LobbyPlateau from './components/LobbyPlateau.svelte';
  import DiceOverlay from './components/DiceOverlay.svelte';
  import CaseBanner from './components/CaseBanner.svelte';
  import QuestionOverlay from './components/QuestionOverlay.svelte';
  import AnswerOverlay from './components/AnswerOverlay.svelte';
  import PodiumBanner from './components/PodiumBanner.svelte';
  import AuroraBackground from './components/effects/AuroraBackground.svelte';
  import { DICE_HOLD_MS, inferRollCue } from '@trivial-asso/game';
  import {
    unlockAudio,
    playUnlockConfirm,
    playDiceReveal,
    playAnswerResult,
    playVictory,
    playQuestion,
    playPass,
    playRejouez,
  } from './lib/sfx.js';

  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session');

  let session = $state(null);
  /** Session « présentée » : HUD / actions de case après la fin du pion */
  let presentedSession = $state(null);
  let gameStarted = $state(false);
  let gameOver = $state(false);
  let winnerName = $state('');
  let error = $state('');
  let diceDisplay = $state(null);
  let caseBanner = $state(null);
  /** Résultat affiché sur le projecteur (si option admin) */
  let answerDisplay = $state(null);
  /** Web Audio débloqué (politique navigateur — une fois). */
  let audioUnlocked = $state(false);
  /** Mute / unmute des effets sonores. */
  let soundEnabled = $state(true);

  const canPlaySound = () => audioUnlocked && soundEnabled;
  /** Empêche les SFX / HUD de case tant que le pion n’a pas fini */
  let moveAnimPending = $state(false);

  let diceTimer = null;
  let bannerTimer = null;
  let answerTimer = null;
  let lastDiceAt = 0;
  let lastAnswerKey = '';
  let lastQuestionId = '';
  let victoryPlayed = false;
  let lastHandledRollAt = 0;
  let hydrated = false;
  /** @type {{ at: number | string, name: string, dice: number | string, action: string }[]} */
  let turnHistory = $state([]);

  const TURN_ACTION_LABELS = {
    rejouez: 'À rejouer',
    bonus: 'À rejouer',
    pass: 'À passer',
    challenge: 'Défi',
    finish: 'Arrivée au centre',
    exact: 'Nombre exact',
    none: 'Avance',
  };

  const ANSWER_ACTION_LABELS = {
    correct: 'Bonne réponse',
    wrong: 'Mauvaise réponse',
  };

  const ANSWER_DISPLAY_MS = 5500;

  function appendHistory(entry) {
    turnHistory = [...turnHistory, entry].slice(-40);
  }

  function recordTurn(state, roll, cue) {
    if (!roll?.at || cue === 'question' || cue === 'challenge') return;
    if (turnHistory.some((e) => e.at === roll.at)) return;
    const name = state.players?.find((p) => p.slot === roll.slot)?.name ?? `J${roll.slot + 1}`;
    appendHistory({
      at: roll.at,
      name,
      dice: roll.value,
      action: TURN_ACTION_LABELS[cue] ?? cue,
    });
  }

  function recordAnswer(state, answer) {
    if (!answer) return;
    const rollAt = state.lastRoll?.at ?? '';
    const key = `a-${answer.slot}-${answer.chosenIndex}-${answer.correct}-${rollAt}`;
    if (turnHistory.some((e) => e.at === key)) return;
    const name = state.players?.find((p) => p.slot === answer.slot)?.name ?? `J${answer.slot + 1}`;
    const dice = state.lastRoll?.slot === answer.slot ? state.lastRoll.value : '—';
    appendHistory({
      at: key,
      name,
      dice,
      action: answer.correct ? ANSWER_ACTION_LABELS.correct : ANSWER_ACTION_LABELS.wrong,
    });
  }
  function toggleSound(e) {
    e.stopPropagation();
    if (!audioUnlocked) {
      unlockAudio();
      audioUnlocked = true;
      soundEnabled = true;
      playUnlockConfirm();
      return;
    }
    soundEnabled = !soundEnabled;
  }

  function showDice(state) {
    const roll = state?.lastRoll;
    if (!roll || roll.at === lastDiceAt) return;
    lastDiceAt = roll.at;
    moveAnimPending = true;
    caseBanner = null;
    answerDisplay = null;
    if (bannerTimer) clearTimeout(bannerTimer);
    if (answerTimer) clearTimeout(answerTimer);
    const name = state.players?.find((p) => p.slot === roll.slot)?.name ?? '';
    diceDisplay = { ...roll, name };
    if (canPlaySound()) playDiceReveal();
    if (diceTimer) clearTimeout(diceTimer);
    // Overlay disparaît juste avant / quand le pion démarre
    diceTimer = setTimeout(() => {
      diceDisplay = null;
    }, DICE_HOLD_MS);
  }

  function showAnswerOverlay(state, answer) {
    if (!state?.showQuestionOnPlateau || !answer) return;
    const name = state.players?.find((p) => p.slot === answer.slot)?.name ?? '';
    answerDisplay = { ...answer, playerName: name };
    if (answerTimer) clearTimeout(answerTimer);
    answerTimer = setTimeout(() => {
      answerDisplay = null;
    }, ANSWER_DISPLAY_MS);
  }

  function applyPresentedState(state) {
    if (!state) return;
    presentedSession = state;

    const q = state.currentQuestion;
    if (q?.id && q.id !== lastQuestionId) {
      lastQuestionId = q.id;
      if (canPlaySound()) playQuestion();
    }

    const a = state.lastAnswer;
    if (a) {
      const key = `${a.slot}-${a.chosenIndex}-${a.correct}-${a.series}-${state.lastRoll?.at ?? ''}`;
      if (key !== lastAnswerKey) {
        lastAnswerKey = key;
        if (canPlaySound()) playAnswerResult(a);
        showAnswerOverlay(state, a);
        recordAnswer(state, a);
      }
    }

    if (state.status === 'finished' && !victoryPlayed) {
      victoryPlayed = true;
      if (canPlaySound()) playVictory();
    }
    if (state.status !== 'finished') victoryPlayed = false;
  }

  function showCaseBanner(cue) {
    if (!cue || cue === 'none') return;
    caseBanner = cue;
    if (bannerTimer) clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => {
      caseBanner = null;
    }, 3200);
  }

  /** Fin du pion → action de case (question / passe / rejouez) + HUD à jour */
  function onMoveAnimDone(roll) {
    if (!roll || roll.at === lastHandledRollAt) return;
    lastHandledRollAt = roll.at;
    moveAnimPending = false;

    const state = session;
    if (!state) return;

    const cue = inferRollCue(state, {
      ...roll,
      cue: roll.cue ?? state.lastRoll?.cue,
    });

    if (canPlaySound()) {
      if (cue === 'rejouez' || cue === 'bonus') playRejouez();
      else if (cue === 'pass') playPass();
    }

    // Bannière courte inutile si popup question projecteur
    if (!(cue === 'question' && state.showQuestionOnPlateau)) {
      showCaseBanner(cue);
    }
    recordTurn(state, roll, cue);
    applyPresentedState(state);
  }

  function ingestState(state) {
    session = state;
    if (state.status === 'playing') gameStarted = true;
    if (state.status === 'finished') {
      gameOver = true;
      const w = state.players?.find((p) => p.slot === state.winner);
      winnerName = w?.name ?? '…';
    }

    // Premier state : pas de rejoue d’anim sur un ancien lancer
    if (!hydrated) {
      hydrated = true;
      lastDiceAt = state.lastRoll?.at ?? 0;
      lastHandledRollAt = state.lastRoll?.at ?? 0;
      moveAnimPending = false;
      if (state.lastAnswer) {
        const a = state.lastAnswer;
        lastAnswerKey = `${a.slot}-${a.chosenIndex}-${a.correct}-${a.series}-${state.lastRoll?.at ?? ''}`;
      }
      if (state.currentQuestion?.id) {
        lastQuestionId = state.currentQuestion.id;
      }
      applyPresentedState(state);
      return;
    }

    const roll = state.lastRoll;
    const isNewRoll = roll && roll.at !== lastDiceAt;

    if (isNewRoll) {
      showDice(state);
      // Pendant l’anim : HUD garde l’ancien tour (qui a lancé)
      if (!presentedSession) presentedSession = state;
    } else if (!moveAnimPending) {
      applyPresentedState(state);
    }
  }

  onMount(() => {
    if (!sessionId) {
      error = "Ajoutez ?session=XXX dans l'URL (lien fourni par le formateur).";
      return;
    }

    return subscribeSession(sessionId, {
      onState: (state) => ingestState(state),
      onJoined: (state) => {
        session = state;
        if (!presentedSession) presentedSession = state;
      },
      onStart: (state) => {
        gameStarted = true;
        gameOver = false;
        turnHistory = [];
        ingestState(state);
      },
      onGameOver: (payload) => {
        const state = payload.session ?? session;
        session = state;
        gameOver = true;
        const w = state?.players?.find((p) => p.slot === payload.winner);
        winnerName = w?.name ?? '…';
        if (!moveAnimPending) applyPresentedState(state);
        if (canPlaySound() && !victoryPlayed) {
          victoryPlayed = true;
          playVictory();
        }
      },
      onReset: () => {
        session = null;
        presentedSession = null;
        gameStarted = false;
        moveAnimPending = false;
        caseBanner = null;
        answerDisplay = null;
        turnHistory = [];
        error = 'Session réinitialisée par le formateur.';
      },
      onDice: (roll) => {
        if (session) ingestState({ ...session, lastRoll: roll });
      },
    });
  });
</script>

<AuroraBackground />

<main class="screen" class:playing={gameStarted}>
  <header class="brand">
    <h1>Trivial Asso</h1>
    {#if gameStarted && session}
      <p class="tag">Partie en cours</p>
    {/if}
  </header>

  {#if session && !error}
    <button
      type="button"
      class="audio-btn"
      class:muted={audioUnlocked && !soundEnabled}
      onclick={toggleSound}
      aria-pressed={audioUnlocked && soundEnabled}
      aria-label={!audioUnlocked ? 'Activer le son' : soundEnabled ? 'Couper le son' : 'Activer le son'}
      title={!audioUnlocked ? 'Activer le son' : soundEnabled ? 'Couper le son' : 'Activer le son'}
    >
      {#if !audioUnlocked}
        Activer le son
      {:else if soundEnabled}
        🔊
      {:else}
        🔇
      {/if}
    </button>
  {/if}

  {#if error}
    <p class="error">{error}</p>

  {:else if !session}
    <p class="loading">Connexion à la session…</p>

  {:else if gameStarted}
    {#if gameOver || (session?.podium?.length ?? 0) > 0}
      {#if gameOver}
        <div class="winner-banner" role="status">
          🏆 Victoire de <strong>{winnerName}</strong> !
        </div>
      {/if}
      {#if (session?.playerCount ?? 0) >= 3 || (session?.podium?.length ?? 0) > 0}
        <PodiumBanner session={presentedSession ?? session} />
      {/if}
    {/if}
    <DiceOverlay roll={diceDisplay} />
    <CaseBanner cue={caseBanner} />
    {#if answerDisplay}
      <AnswerOverlay result={answerDisplay} playerName={answerDisplay.playerName} />
    {:else if !moveAnimPending &&
      (presentedSession ?? session)?.showQuestionOnPlateau &&
      (presentedSession ?? session)?.phase === 'question' &&
      (presentedSession ?? session)?.currentQuestion}
      <QuestionOverlay question={(presentedSession ?? session).currentQuestion} />
    {/if}
    <div class="game">
      <Board {session} {onMoveAnimDone} soundEnabled={canPlaySound()} />
      <div class="sidebar">
        <GameHud session={presentedSession ?? session} />
        <TurnHistory entries={turnHistory} />
      </div>
    </div>

  {:else}
    <LobbyPlateau {session} />
  {/if}
</main>

<style>
  .screen {
    position: relative;
    z-index: 1;
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1.5rem 2rem 2rem;
    color: var(--text);
  }

  .screen.playing {
    justify-content: flex-start;
    padding-top: 1rem;
  }

  .brand {
    text-align: center;
    margin-bottom: 1rem;
  }

  .brand h1 {
    margin: 0;
    font-size: clamp(1.75rem, 3vw, 2.5rem);
    font-weight: 800;
    letter-spacing: 0.02em;
    background: var(--grad-title);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .tag {
    margin: 0.35rem 0 0;
    color: var(--green);
    font-weight: 700;
    font-size: 1.1rem;
  }

  .game {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    gap: 2rem;
    width: 100%;
    max-width: 1400px;
    flex-wrap: wrap;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 280px;
    max-width: 320px;
    max-height: calc(100dvh - 8rem);
  }

  .loading {
    font-size: 1.5rem;
    color: var(--muted);
    letter-spacing: 0.03em;
  }

  .error {
    font-size: 1.25rem;
    color: var(--red-light);
    padding: 1rem 1.5rem;
    background: color-mix(in srgb, var(--red-light) 12%, var(--surface));
    border: 1px solid color-mix(in srgb, var(--red-light) 35%, transparent);
    border-radius: 12px;
    max-width: 36rem;
    text-align: center;
  }

  .winner-banner {
    margin-bottom: 1rem;
    padding: 1rem 2rem;
    background: var(--grad-gold);
    color: #1a1025;
    border-radius: 16px;
    font-size: clamp(1.25rem, 3vw, 2rem);
    font-weight: 800;
    text-align: center;
    box-shadow:
      0 0 0 1px rgb(245 158 11 / 25%),
      0 8px 32px rgb(0 0 0 / 40%);
  }

  .audio-btn {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 30;
    min-width: 2.75rem;
    padding: 0.6rem 1.1rem;
    border: none;
    border-radius: 999px;
    background: var(--grad-cta);
    color: #fff;
    font-weight: 800;
    font-size: 1.1rem;
    line-height: 1;
    cursor: pointer;
    box-shadow: 0 4px 20px rgb(124 58 237 / 35%);
  }

  .audio-btn.muted {
    background: color-mix(in srgb, var(--surface) 90%, var(--bg));
    color: var(--muted);
    box-shadow: 0 4px 16px rgb(0 0 0 / 25%);
    border: 1px solid var(--border);
  }

  .audio-btn:hover {
    filter: brightness(1.08);
  }

  .audio-btn.muted:hover {
    filter: none;
    color: var(--text);
  }
</style>
