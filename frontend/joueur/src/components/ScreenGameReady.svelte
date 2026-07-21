<script>
  import DiceRoller from './DiceRoller.svelte';
  import ScreenQuestion from './ScreenQuestion.svelte';
  import ScreenAnswerResult from './ScreenAnswerResult.svelte';
  import ScreenCaseCue from './ScreenCaseCue.svelte';
  import ScreenChallengeSelect from './ScreenChallengeSelect.svelte';
  import { SERIES, waitForMoveAnim, inferRollCue, moveAnimDurationMs } from '@trivial-asso/game';
  import {
    unlockAudio,
    playQuestion,
    playAnswerResult,
    playVictory,
    playRejouez,
    playPass,
    playDiceRoll,
  } from '../lib/sfx.js';

  let {
    playerSlot,
    session,
    rolling = false,
    lastMyRoll = null,
    rollError = '',
    answerError = '',
    challengeError = '',
    onroll,
    onrollend,
    onanswer,
    onchallenge,
  } = $props();

  let diceRoller;
  let animating = $state(false);
  let answering = $state(false);
  let challenging = $state(false);
  /** false pendant dé + pion : la question / passe / rejouez attend la fin du mouvement */
  let caseReady = $state(true);
  /** @type {'rejouez' | 'bonus' | 'pass' | 'finish' | 'exact' | null} */
  let caseCue = $state(null);
  /** @type {object | null} */
  let answerResult = $state(null);
  let lastQuestionId = null;
  let victoryPlayed = false;
  let animClock = $state(Date.now());

  $effect(() => {
    const roll = session?.lastRoll;
    if (!roll?.at) return;
    const endAt = roll.at + moveAnimDurationMs(roll.path?.length ?? roll.value ?? 0);
    if (Date.now() >= endAt) return;
    const id = setInterval(() => {
      animClock = Date.now();
    }, 200);
    return () => clearInterval(id);
  });

  const rollAnimActive = $derived.by(() => {
    animClock;
    const roll = session?.lastRoll;
    if (!roll?.at) return false;
    return Date.now() < roll.at + moveAnimDurationMs(roll.path?.length ?? roll.value ?? 0);
  });

  const turnLocked = $derived(
    session?.phase !== 'roll' || rollAnimActive || !!caseCue,
  );

  const players = $derived(session?.players ?? []);
  const me = $derived(players.find((p) => p.slot === playerSlot));
  const myName = $derived(me?.name ?? '…');
  const iAmFinished = $derived(!!me?.finished);
  const currentName = $derived(players[session?.currentPlayer]?.name ?? '…');
  const isMyRollTurn = $derived(
    session?.phase === 'roll' && session?.currentPlayer === playerSlot && !iAmFinished,
  );
  const isMyQuestion = $derived(
    session?.phase === 'question' && session?.currentPlayer === playerSlot,
  );
  const isMyChallengeSelect = $derived(
    session?.phase === 'challenge_select' &&
      session?.currentPlayer === playerSlot &&
      caseReady,
  );
  const showQuestion = $derived(
    isMyQuestion && caseReady && !caseCue && !!session?.currentQuestion,
  );
  const busy = $derived(
    rolling || animating || answering || challenging || !caseReady || !!caseCue,
  );
  const isFinished = $derived(session?.status === 'finished');
  const isWinner = $derived(isFinished && session?.winner === playerSlot);
  const winnerName = $derived(
    isFinished ? players.find((p) => p.slot === session?.winner)?.name : null,
  );
  const canRoll = $derived(
    isMyRollTurn && !busy && !answerResult && !isFinished && !turnLocked,
  );

  $effect(() => {
    const q = session?.currentQuestion;
    if (showQuestion && q?.id && q.id !== lastQuestionId) {
      lastQuestionId = q.id;
      playQuestion();
    }
  });

  $effect(() => {
    if (isFinished && !victoryPlayed) {
      victoryPlayed = true;
      playVictory();
    }
    if (!isFinished) victoryPlayed = false;
  });

  async function handleRollClick() {
    if (!canRoll || !onroll) return;
    unlockAudio();
    playDiceRoll();
    animating = true;
    caseReady = false;
    caseCue = null;
    try {
      const roll = await onroll();
      const receivedAt = Date.now();
      if (roll?.value != null) {
        await diceRoller?.animate?.(roll.value);
      }
      const pathLen = roll?.path?.length ?? roll?.value ?? 0;
      await waitForMoveAnim(pathLen, receivedAt);

      const cue = inferRollCue(session, roll);
      caseReady = true;

      if (cue === 'rejouez' || cue === 'bonus') {
        playRejouez();
        caseCue = cue;
      } else if (cue === 'exact') {
        playRejouez();
        caseCue = 'exact';
      } else if (cue === 'pass') {
        playPass();
        caseCue = 'pass';
      } else if (cue === 'finish') {
        caseCue = 'finish';
      }
    } catch {
      caseReady = true;
    } finally {
      animating = false;
      onrollend?.();
    }
  }

  async function handleAnswer(choiceIndex) {
    if (!showQuestion || answering || !onanswer) return;
    unlockAudio();
    answering = true;
    try {
      const result = await onanswer(choiceIndex);
      if (result) {
        answerResult = result;
        playAnswerResult(result);
      }
    } finally {
      answering = false;
    }
  }

  function handleChallengeSelect(payload) {
    if (!isMyChallengeSelect || challenging || !onchallenge) return;
    unlockAudio();
    challenging = true;
    try {
      onchallenge(payload);
    } finally {
      challenging = false;
    }
  }

  function dismissAnswerResult() {
    answerResult = null;
  }

  function dismissCaseCue() {
    caseCue = null;
  }
</script>

<div class="screen">
  <div class="card hero">
    <span class="badge live">Partie en cours</span>
    <h1>Bonjour {myName} !</h1>
    <p class="lead">Regardez le projecteur pendant que les autres jouent.</p>
  </div>

  <section class="card turn">
    <p class="label">Tour actuel</p>
    <p class="name">{currentName}</p>
    {#if isFinished}
      <p class="sub yours">{isWinner ? '🏆 Vous avez gagné !' : `Victoire de ${winnerName ?? '…'}`}</p>
    {:else if iAmFinished}
      <p class="sub yours">🏁 Vous êtes au centre — place #{me?.finishRank ?? '…'}</p>
    {:else if !caseReady}
      <p class="sub yours">Le pion avance sur le plateau…</p>
    {:else if isMyChallengeSelect}
      <p class="sub yours">Case défi — choisissez thème et adversaire</p>
    {:else if showQuestion}
      <p class="sub yours">
        {session?.currentQuestion?.isChallenge ? 'Défi — répondez !' : 'Répondez à la question !'}
      </p>
    {:else if isMyRollTurn}
      <p class="sub yours">
        {#if session?.extraRolls > 0}
          Relance bonus — {session.extraRolls} lancer{session.extraRolls > 1 ? 's' : ''} restant{session.extraRolls > 1 ? 's' : ''}
        {:else if me?.wedges?.every(Boolean)}
          Direction le centre — lancez le dé !
        {:else}
          C'est votre tour — lancez le dé !
        {/if}
      </p>
    {:else}
      <p class="sub">Patientez, ce n'est pas encore votre tour.</p>
    {/if}
  </section>

  <section class="card dice-zone">
    <DiceRoller bind:this={diceRoller} />

    {#if !iAmFinished && !isFinished}
      <button
        class="dice-btn"
        type="button"
        disabled={!canRoll}
        onclick={handleRollClick}
      >
        {#if busy}
          <span class="dice-label">{!caseReady ? 'Regardons le plateau…' : 'Lancement…'}</span>
        {:else if isMyRollTurn}
          <span class="dice-label">Lancer le dé</span>
        {:else if turnLocked}
          <span class="dice-label">Tour en cours…</span>
        {:else}
          <span class="dice-label">En attente de votre tour</span>
        {/if}
      </button>

      {#if rollError && isMyRollTurn}
        <p class="roll-error">{rollError}</p>
      {/if}
    {/if}
  </section>

  {#if lastMyRoll}
    <section class="card result">
      <p class="label">Votre dernier lancer</p>
      <p class="roll-value">{lastMyRoll.value}</p>
    </section>
  {/if}

  <section class="card wedges">
    <p class="label">Votre camembert</p>
    <div class="parts">
      {#each SERIES as theme, i (i)}
        <span
          class="part"
          style:background={theme.color}
          class:earned={me?.wedges?.[i]}
          title={theme.name}
        ></span>
      {/each}
    </div>
    <ul class="legend">
      {#each SERIES as theme, i (i)}
        <li class:earned={me?.wedges?.[i]}>{theme.name}</li>
      {/each}
    </ul>
  </section>
</div>

{#if isMyChallengeSelect}
  <ScreenChallengeSelect
    {session}
    {playerSlot}
    disabled={challenging}
    onselect={handleChallengeSelect}
  />
  {#if challengeError}
    <p class="answer-error">{challengeError}</p>
  {/if}
{/if}

{#if caseCue}
  <ScreenCaseCue cue={caseCue} onclose={dismissCaseCue} />
{/if}

{#if showQuestion}
  <ScreenQuestion
    question={session.currentQuestion}
    disabled={answering}
    onanswer={handleAnswer}
  />
  {#if answerError}
    <p class="answer-error">{answerError}</p>
  {/if}
{/if}

{#if answerResult}
  <ScreenAnswerResult result={answerResult} onclose={dismissAnswerResult} />
{/if}

<style>
  .screen {
    min-height: 100vh;
    padding: 1.25rem 1rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .card {
    background: white;
    border-radius: 16px;
    padding: 1.25rem;
    box-shadow: 0 8px 32px rgb(26 26 46 / 8%);
  }

  .hero {
    text-align: center;
  }

  .badge {
    display: inline-block;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 700;
    margin-bottom: 0.75rem;
  }

  .badge.live {
    background: #edfbf3;
    color: #1e8449;
  }

  h1 {
    margin: 0 0 0.35rem;
    font-size: 1.75rem;
  }

  .lead {
    margin: 0;
    color: #5a6270;
  }

  .label {
    margin: 0 0 0.35rem;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #8b93a1;
    font-weight: 700;
  }

  .turn .name {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 800;
    color: #1a1a2e;
  }

  .sub {
    margin: 0.5rem 0 0;
    color: #6b7280;
  }

  .sub.yours {
    color: #2980b9;
    font-weight: 600;
  }

  .dice-zone {
    padding: 1rem 1.25rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .dice-btn {
    width: 100%;
    padding: 1rem 1.5rem;
    border: none;
    border-radius: 14px;
    background: linear-gradient(145deg, #2980b9, #1a5276);
    color: white;
    cursor: pointer;
    transition: transform 0.15s, opacity 0.15s;
  }

  .dice-btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .dice-btn:not(:disabled):active {
    transform: scale(0.98);
  }

  .dice-label {
    font-size: 1.2rem;
    font-weight: 800;
    letter-spacing: 0.02em;
  }

  .roll-error,
  .answer-error {
    margin: 0;
    color: #c0392b;
    font-weight: 600;
    text-align: center;
  }

  .answer-error {
    position: fixed;
    bottom: 1rem;
    left: 1rem;
    right: 1rem;
    z-index: 110;
    background: white;
    padding: 0.75rem;
    border-radius: 10px;
  }

  .result {
    text-align: center;
  }

  .roll-value {
    margin: 0;
    font-size: 4rem;
    font-weight: 900;
    color: #1a1a2e;
    line-height: 1;
  }

  .parts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    width: 8rem;
    aspect-ratio: 1;
    border-radius: 50%;
    overflow: hidden;
    margin-top: 0.5rem;
  }

  .part {
    opacity: 0.25;
    transition: opacity 0.3s;
  }

  .part.earned {
    opacity: 1;
  }

  .legend {
    list-style: none;
    margin: 0.75rem 0 0;
    padding: 0;
    font-size: 0.85rem;
    color: #8b93a1;
  }

  .legend li {
    opacity: 0.5;
  }

  .legend li.earned {
    opacity: 1;
    font-weight: 700;
    color: #1a1a2e;
  }
</style>
