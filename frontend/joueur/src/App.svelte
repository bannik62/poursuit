<script>
  import { onMount } from 'svelte';
  import { playerColorHex } from '@trivial-asso/game';
  import { joinGame } from './lib/api.js';
  import { subscribePlayer, disconnectSocket } from './lib/socket.js';
  import ScreenJoin from './components/ScreenJoin.svelte';
  import ScreenWaiting from './components/ScreenWaiting.svelte';
  import ScreenGameReady from './components/ScreenGameReady.svelte';
  import ScreenError from './components/ScreenError.svelte';
  import ScreenVictory from './components/ScreenVictory.svelte';

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const storageKey = token ? `trivial-asso:${token}` : null;

  let phase = $state(token ? 'join' : 'error');
  let name = $state('');
  let color = $state(null);
  let error = $state(token ? '' : 'Lien invalide. Scannez le QR code fourni par le formateur.');
  let loading = $state(false);
  let player = $state(null);
  let session = $state(null);

  let unsubscribe = null;
  let rollDiceFn = () => {};
  let submitAnswerFn = () => {};
  let selectChallengeFn = () => {};
  let rollError = $state('');
  let answerError = $state('');
  let challengeError = $state('');
  let lastMyRoll = $state(null);
  let rolling = $state(false);
  /** @type {{ resolve: (roll: object) => void, reject: (err: Error) => void } | null} */
  let pendingRoll = null;
  /** @type {{ resolve: (answer: object) => void, reject: (err: Error) => void } | null} */
  let pendingAnswer = null;

  function applyPlayerBackground(colorId) {
    const hex = colorId != null ? playerColorHex(colorId) : null;
    if (!hex) {
      document.documentElement.style.removeProperty('--player-bg');
      document.documentElement.style.removeProperty('--player-bg-soft');
      document.body.classList.remove('has-player-color');
      return;
    }
    document.documentElement.style.setProperty('--player-bg', hex);
    document.documentElement.style.setProperty('--player-bg-soft', `${hex}33`);
    document.body.classList.add('has-player-color');
  }

  $effect(() => {
    if (color != null) applyPlayerBackground(color);
  });

  function persistPlayer(sessionId, colorId) {
    if (!storageKey || !name) return;
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({ name, sessionId, color: colorId ?? color }),
    );
  }

  function syncPlayerFromSession(state) {
    if (!player || player.slot == null) return;
    const me = state.players?.find((p) => p.slot === player.slot);
    if (me) {
      player = { slot: me.slot, name: me.name, color: me.color };
      if (me.color != null) {
        color = me.color;
        applyPlayerBackground(me.color);
      }
    }
  }

  function settleRoll(roll) {
    if (!roll || roll.slot !== player?.slot) return;
    lastMyRoll = roll;
    if (pendingRoll) {
      pendingRoll.resolve(roll);
      pendingRoll = null;
    }
  }

  function settleAnswer(answer) {
    if (!answer || answer.slot !== player?.slot) return;
    if (pendingAnswer) {
      pendingAnswer.resolve(answer);
      pendingAnswer = null;
    }
  }

  function requestServerRoll() {
    rollError = '';
    rolling = true;
    return new Promise((resolve, reject) => {
      pendingRoll = { resolve, reject };
      rollDiceFn();
    });
  }

  function requestAnswer(choiceIndex) {
    answerError = '';
    return new Promise((resolve, reject) => {
      pendingAnswer = { resolve, reject };
      submitAnswerFn(choiceIndex);
    });
  }

  function requestChallenge({ theme, targetSlot }) {
    challengeError = '';
    selectChallengeFn(theme, targetSlot);
  }

  function finishRoll() {
    rolling = false;
  }

  function connectSocket(sessionId) {
    unsubscribe?.();
    const conn = subscribePlayer(sessionId, token, {
      onState: (state) => {
        session = state;
        syncPlayerFromSession(state);
        if (state.status === 'playing' || state.status === 'finished') phase = 'game';
        if (state.status === 'lobby') phase = 'waiting';
        settleRoll(state.lastRoll);
        if (state.lastAnswer?.slot === player?.slot) {
          settleAnswer(state.lastAnswer);
        }
      },
      onStart: (state) => {
        session = state;
        syncPlayerFromSession(state);
        phase = 'game';
      },
      onReset: () => {
        if (storageKey) sessionStorage.removeItem(storageKey);
        player = null;
        session = null;
        applyPlayerBackground(null);
        phase = 'error';
        error = 'La session a été réinitialisée par le formateur.';
        pendingRoll?.reject(new Error('Session réinitialisée'));
        pendingAnswer?.reject(new Error('Session réinitialisée'));
        pendingRoll = null;
        pendingAnswer = null;
        rolling = false;
      },
      onDice: (roll) => settleRoll(roll),
      onAnswer: (answer) => settleAnswer(answer),
      onGameOver: (payload) => {
        session = payload.session ?? session;
        phase = 'game';
      },
      onError: (msg) => {
        if (pendingAnswer) {
          answerError = msg;
          pendingAnswer.reject(new Error(msg));
          pendingAnswer = null;
        } else if (session?.phase === 'challenge_select') {
          challengeError = msg;
        } else {
          rollError = msg;
          rolling = false;
          pendingRoll?.reject(new Error(msg));
          pendingRoll = null;
        }
      },
    });
    unsubscribe = conn.disconnect;
    rollDiceFn = conn.rollDice;
    submitAnswerFn = conn.submitAnswer;
    selectChallengeFn = conn.selectChallenge;
  }

  async function enterSession(playerName, playerColor) {
    error = '';
    loading = true;
    name = playerName;
    if (playerColor != null) color = playerColor;

    try {
      const data = await joinGame(token, name, color);
      player = data.player;
      session = data.session;
      color = data.player.color ?? color;
      applyPlayerBackground(color);
      persistPlayer(data.sessionId, color);
      phase =
        data.session.status === 'playing' || data.session.status === 'finished'
          ? 'game'
          : 'waiting';
      connectSocket(data.sessionId);
    } catch (err) {
      error = err.message;
      phase = 'error';
    } finally {
      loading = false;
    }
  }

  async function join(e) {
    e.preventDefault();
    if (color == null) {
      error = 'Choisissez une couleur';
      return;
    }
    await enterSession(name, color);
  }

  function quitGame() {
    if (storageKey) sessionStorage.removeItem(storageKey);
    unsubscribe?.();
    unsubscribe = null;
    disconnectSocket();
    applyPlayerBackground(null);
    player = null;
    session = null;
    name = '';
    color = null;
    pendingRoll = null;
    pendingAnswer = null;
    rolling = false;
    // Enlever le token de l’URL pour éviter une reconnexion auto
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    window.history.replaceState({}, '', url.pathname);
    phase = 'bye';
  }

  onMount(() => {
    if (token && storageKey) {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        try {
          const { name: savedName, color: savedColor } = JSON.parse(saved);
          if (savedName) {
            if (savedColor != null) {
              color = savedColor;
              applyPlayerBackground(savedColor);
            }
            phase = 'loading';
            enterSession(savedName, savedColor);
          }
        } catch {
          // ignore
        }
      }
    }

    return () => {
      unsubscribe?.();
      disconnectSocket();
      applyPlayerBackground(null);
    };
  });
</script>

{#if phase === 'join'}
  <ScreenJoin bind:name bind:color {token} {loading} onsubmit={join} />
{:else if phase === 'waiting' && player && session}
  <ScreenWaiting playerSlot={player.slot} {session} />
{:else if phase === 'game' && player && session}
  <ScreenGameReady
    playerSlot={player.slot}
    {session}
    {rolling}
    {lastMyRoll}
    {rollError}
    {answerError}
    {challengeError}
    onroll={requestServerRoll}
    onrollend={finishRoll}
    onanswer={requestAnswer}
    onchallenge={requestChallenge}
  />
  {#if session.status === 'finished'}
    <ScreenVictory
      isWinner={session.winner === player.slot}
      winnerName={session.players?.find((p) => p.slot === session.winner)?.name ?? ''}
      playerColor={player.color}
      onquit={quitGame}
    />
  {/if}
{:else if phase === 'bye'}
  <div class="bye">
    <h1>À bientôt !</h1>
    <p>Vous pouvez refermer cet onglet.</p>
  </div>
{:else if phase === 'error'}
  <ScreenError title="Accès impossible" message={error} />
{:else if loading}
  <p class="loading">Reconnexion…</p>
{/if}

<style>
  .loading {
    min-height: 100vh;
    display: grid;
    place-items: center;
    font-size: 1.25rem;
    color: #5a6270;
  }

  .bye {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1.5rem;
    text-align: center;
  }

  .bye h1 {
    margin: 0;
    font-size: 2rem;
    color: #1a1a2e;
  }

  .bye p {
    margin: 0;
    color: #5a6270;
    font-size: 1.1rem;
  }
</style>
