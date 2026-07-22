<script>
  import { onMount } from 'svelte';
  import QRCode from 'qrcode';
  import { api } from './lib/api.js';
  import { subscribeSession } from './lib/socket.js';
  import AuroraBackground from './components/effects/AuroraBackground.svelte';

  let phase = $state('loading');
  let error = $state('');
  let admin = $state(null);

  let username = $state('');
  let password = $state('');

  let playerCount = $state(4);
  let session = $state(null);
  let qrCodes = $state([]);
  let plateauUrl = $state('');
  let gameStarted = $state(false);
  let gameOver = $state(false);
  let phoneWarning = $state('');
  let publicUrl = $state('');

  async function loadConfig() {
    try {
      const cfg = await api('/config');
      publicUrl = cfg.publicUrl || '';
      phoneWarning = cfg.phoneWarning || cfg.ngrokHint || '';
    } catch {
      // ignore
    }
  }

  async function checkAuth() {
    try {
      const data = await api('/admin/me');
      admin = data.admin;
      phase = 'dashboard';
    } catch {
      phase = 'login';
    }
  }

  async function login(e) {
    e.preventDefault();
    error = '';
    try {
      await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      await checkAuth();
    } catch (err) {
      error = err.message;
    }
  }

  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    session = null;
    qrCodes = [];
    gameStarted = false;
    phase = 'login';
  }

  async function generateQrCodes(tokens) {
    const codes = await Promise.all(
      tokens.map(async (item) => ({
        slot: item.slot,
        joinUrl: item.joinUrl,
        dataUrl: await QRCode.toDataURL(item.joinUrl, { width: 200, margin: 1 }),
      })),
    );
    qrCodes = codes;
  }

  async function createSession() {
    error = '';
    try {
      const data = await api('/admin/session', {
        method: 'POST',
        body: JSON.stringify({ playerCount }),
      });
      session = data;
      plateauUrl = `${data.publicUrl || window.location.origin}/plateau/?session=${data.id}`;
      await generateQrCodes(data.playerTokens);
      gameStarted = false;
      phase = 'session';
    } catch (err) {
      error = err.message;
    }
  }

  async function startGame() {
    error = '';
    try {
      await api(`/admin/session/${session.id}/start`, { method: 'POST' });
      gameStarted = true;
      window.open(plateauUrl, '_blank', 'noopener');
    } catch (err) {
      error = err.message;
    }
  }

  function isSlotUsed(slot) {
    return session?.players?.some((p) => p.slot === slot && p.connected) ?? false;
  }

  function slotPlayerName(slot) {
    return session?.players?.find((p) => p.slot === slot)?.name ?? null;
  }

  async function resetSession() {
    error = '';
    if (!session) return;
    try {
      await api(`/admin/session/${session.id}/reset`, { method: 'POST' });
      session = null;
      qrCodes = [];
      gameStarted = false;
      phase = 'dashboard';
    } catch (err) {
      error = err.message;
    }
  }

  async function setShowQuestionOnPlateau(enabled) {
    if (!session) return;
    error = '';
    try {
      const data = await api(`/admin/session/${session.id}/settings`, {
        method: 'PATCH',
        body: JSON.stringify({ showQuestionOnPlateau: enabled }),
      });
      session = {
        ...session,
        ...data.session,
        playerTokens: session.playerTokens ?? data.session.playerTokens,
      };
    } catch (err) {
      error = err.message;
    }
  }

  async function patchSettings(patch) {
    if (!session) return;
    error = '';
    try {
      const data = await api(`/admin/session/${session.id}/settings`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      session = {
        ...session,
        ...data.session,
        playerTokens: session.playerTokens ?? data.session.playerTokens,
      };
    } catch (err) {
      error = err.message;
    }
  }

  onMount(() => {
    loadConfig();
    checkAuth();
    return () => {};
  });

  $effect(() => {
    if (!session?.id || phase !== 'session') return;

    return subscribeSession(session.id, {
      onState: (state) => {
        session = { ...session, ...state, playerTokens: session.playerTokens };
      },
      onStart: () => {
        gameStarted = true;
        gameOver = false;
      },
      onGameOver: (payload) => {
        gameOver = true;
        session = payload.session
          ? { ...session, ...payload.session, playerTokens: session.playerTokens }
          : session;
      },
      onReset: () => {
        session = null;
        qrCodes = [];
        gameStarted = false;
        phase = 'dashboard';
      },
    });
  });
</script>

<AuroraBackground />

<div class="shell">
<main class="page">
  {#if phase === 'loading'}
    <p class="loading">Chargement…</p>

  {:else if phase === 'login'}
    <h1 class="title">Admin — Trivial Asso</h1>
    <form class="form" onsubmit={login}>
      <input type="text" placeholder="Identifiant" bind:value={username} required autocomplete="username" />
      <input type="password" placeholder="Mot de passe" bind:value={password} required autocomplete="current-password" />
      <button type="submit" class="btn-primary">Connexion</button>
    </form>

  {:else if phase === 'dashboard'}
    <header class="header">
      <h1>Dashboard</h1>
      <button class="link" onclick={logout}>Déconnexion</button>
    </header>
    {#if phoneWarning}
      <div class="warn">{phoneWarning}</div>
    {/if}
    {#if publicUrl}
      <p class="url-hint">URL publique QR : <code>{publicUrl}</code></p>
    {/if}
    <p class="greeting">Bonjour {admin?.username}</p>
    <div class="form">
      <label>
        Nombre de joueurs
        <select bind:value={playerCount}>
          {#each [2, 3, 4] as n}
            <option value={n}>{n}</option>
          {/each}
        </select>
      </label>
      <button class="btn-primary" onclick={createSession}>Créer une session</button>
    </div>

  {:else if phase === 'session' && session}
    <header class="header">
      <h1>Session {session.id}</h1>
      <button class="link" onclick={resetSession}>Reset</button>
    </header>

    {#if phoneWarning}
      <div class="warn">{phoneWarning}</div>
    {/if}
    {#if publicUrl}
      <p class="url-hint">URL publique QR : <code>{publicUrl}</code></p>
    {/if}

    <p class="counter">
      {session.connectedCount}/{session.playerCount} joueurs connectés
    </p>

    <label class="switch-row">
      <span class="switch-text">
        <strong>Afficher les questions sur le projecteur</strong>
        <small>Popup lecture seule sur le plateau (réponse toujours sur le téléphone)</small>
      </span>
      <input
        type="checkbox"
        class="switch"
        checked={!!session.showQuestionOnPlateau}
        onchange={(e) => setShowQuestionOnPlateau(e.currentTarget.checked)}
      />
    </label>

    <label class="switch-row">
      <span class="switch-text">
        <strong>Finir sur le nombre exact</strong>
        <small>Si désactivé, un jet trop grand atteint quand même le centre</small>
      </span>
      <input
        type="checkbox"
        class="switch"
        checked={session.requireExactCenterRoll !== false}
        onchange={(e) => patchSettings({ requireExactCenterRoll: e.currentTarget.checked })}
      />
    </label>

    <label class="switch-row">
      <span class="switch-text">
        <strong>Partie rapide</strong>
        <small>Pas de relance sur camembert déjà gagné — le dé favorise les couleurs manquantes</small>
      </span>
      <input
        type="checkbox"
        class="switch"
        checked={!!session.fastGame}
        onchange={(e) => patchSettings({ fastGame: e.currentTarget.checked })}
      />
    </label>

    <div class="qr-grid">
      {#each qrCodes as qr (qr.slot)}
        {@const used = isSlotUsed(qr.slot)}
        {@const playerName = slotPlayerName(qr.slot)}
        <div class="qr-card" class:used>
          <p>
            Joueur {qr.slot + 1}
            {#if used}
              <span class="taken">— {playerName}</span>
            {/if}
          </p>
          <img src={qr.dataUrl} alt="QR joueur {qr.slot + 1}" class:greyed={used} />
          {#if used}
            <p class="taken-label">QR utilisé</p>
          {:else}
            <small>{qr.joinUrl}</small>
          {/if}
        </div>
      {/each}
    </div>

    <ul class="slots">
      {#each session.players as player}
        <li class:filled={player.connected} class:offline={player.name && !player.connected}>
          Slot {player.slot + 1} :
          {#if player.name}
            {player.name}
            {#if !player.connected}
              <em class="offline-tag">déconnecté</em>
            {/if}
          {:else}
            <em>en attente…</em>
          {/if}
        </li>
      {/each}
    </ul>

    {#if gameOver}
      {@const winner = session.players?.find((p) => p.slot === session.winner)}
      <p class="winner">🏆 Victoire de {winner?.name ?? '…'} !</p>
    {:else if gameStarted}
      <p class="started">Partie lancée — le plateau s’ouvre sur le projecteur.</p>
      <button class="link plateau-reopen" type="button" onclick={() => window.open(plateauUrl, '_blank', 'noopener')}>
        Rouvrir le plateau
      </button>
    {:else}
      <button
        class="start btn-primary"
        disabled={!session.allConnected}
        onclick={startGame}
      >
        Lancer la partie et ouvrir le plateau
      </button>
    {/if}
  {/if}

  {#if error}
    <p class="error">{error}</p>
  {/if}
</main>
</div>

<style>
  .shell {
    position: relative;
    z-index: 1;
    min-height: 100vh;
    min-height: 100dvh;
    padding: 1.5rem clamp(1rem, 4vw, 2.5rem) 2.5rem;
  }

  .page {
    max-width: 56rem;
    margin: 0 auto;
    padding: 1.75rem clamp(1.25rem, 3vw, 2rem);
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    border: 1px solid var(--border);
    border-radius: 16px;
    box-shadow:
      0 0 0 1px rgb(124 58 237 / 8%),
      0 24px 48px rgb(0 0 0 / 35%);
    backdrop-filter: blur(8px);
  }

  .title {
    margin: 0 0 1.25rem;
    font-size: 1.75rem;
    font-weight: 700;
    background: var(--grad-title);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .loading {
    color: var(--muted);
    letter-spacing: 0.04em;
  }

  .greeting {
    color: var(--muted);
    margin: 0 0 1.25rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  h1 {
    margin: 0 0 1rem;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 22rem;
  }

  .form label {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    color: var(--muted);
    font-size: 0.9rem;
  }

  input,
  select {
    padding: 0.75rem 1rem;
    font-size: 1rem;
    border-radius: 10px;
    border: 1px solid var(--border-btn);
    background: var(--input-bg);
    color: var(--text);
  }

  input::placeholder {
    color: color-mix(in srgb, var(--muted) 70%, transparent);
  }

  input:focus,
  select:focus {
    outline: 2px solid color-mix(in srgb, var(--accent) 55%, transparent);
    outline-offset: 2px;
    border-color: var(--accent);
  }

  select option {
    background: var(--surface);
    color: var(--text);
  }

  .btn-primary,
  button.start {
    padding: 0.75rem 1.25rem;
    font-size: 1rem;
    border-radius: 10px;
    border: none;
    background: var(--grad-cta);
    color: #fff;
    font-weight: 600;
    transition: filter 0.15s ease, transform 0.15s ease;
  }

  .btn-primary:hover:not(:disabled),
  button.start:hover:not(:disabled) {
    filter: brightness(1.08);
    transform: translateY(-1px);
  }

  button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    filter: grayscale(0.3);
  }

  .link {
    background: none;
    color: var(--muted);
    border: none;
    text-decoration: underline;
    padding: 0;
    font-size: 0.95rem;
  }

  .link:hover {
    color: var(--cyan);
  }

  .counter {
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--gold);
    margin: 0.5rem 0 1rem;
  }

  .switch-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin: 1rem 0 0.5rem;
    padding: 1rem 1.15rem;
    background: color-mix(in srgb, var(--bg) 65%, var(--surface));
    border-radius: 12px;
    border: 1px solid var(--border);
    cursor: pointer;
  }

  .switch-text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .switch-text strong {
    color: var(--text);
    font-size: 0.95rem;
  }

  .switch-text small {
    color: var(--muted);
    font-size: 0.85rem;
    line-height: 1.35;
  }

  .switch {
    width: 2.75rem;
    height: 1.5rem;
    accent-color: var(--accent);
    cursor: pointer;
    flex-shrink: 0;
  }

  .plateau-reopen {
    margin-top: 0.5rem;
    font-size: 0.95rem;
  }

  .qr-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
    margin: 1.5rem 0;
  }

  .qr-card {
    text-align: center;
    padding: 1rem;
    background: color-mix(in srgb, var(--bg) 50%, var(--surface));
    border: 1px solid var(--border);
    border-radius: 12px;
  }

  .qr-card.used {
    background: color-mix(in srgb, var(--bg) 75%, var(--surface));
    border-color: var(--border-btn);
  }

  .qr-card img.greyed {
    opacity: 0.35;
    filter: grayscale(1);
  }

  .taken {
    color: var(--green);
    font-weight: 600;
  }

  .taken-label {
    margin: 0.5rem 0 0;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .qr-card img {
    width: 100%;
    max-width: 200px;
    height: auto;
    border-radius: 8px;
  }

  .qr-card small {
    display: block;
    margin-top: 0.5rem;
    font-size: 0.7rem;
    color: var(--muted);
    word-break: break-all;
  }

  .slots {
    list-style: none;
    padding: 0;
    margin: 1rem 0;
  }

  .slots li {
    padding: 0.65rem 0;
    border-bottom: 1px solid var(--border);
    color: var(--muted);
  }

  .slots li.filled {
    color: var(--green);
    font-weight: 600;
  }

  .slots li.offline {
    color: var(--red-light);
  }

  .offline-tag {
    margin-left: 0.35rem;
    font-style: normal;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--red-light);
  }

  .winner {
    margin: 1rem 0;
    padding: 1rem 1.25rem;
    background: color-mix(in srgb, var(--gold) 15%, var(--surface));
    border: 2px solid color-mix(in srgb, var(--gold) 45%, transparent);
    border-radius: 12px;
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--gold);
  }

  .start {
    margin-top: 1rem;
    padding: 1rem 2rem;
    font-size: 1.1rem;
  }

  .started {
    color: var(--green);
    font-weight: 600;
    font-size: 1.1rem;
  }

  .error {
    color: var(--red-light);
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    background: color-mix(in srgb, var(--red) 12%, var(--surface));
    border: 1px solid color-mix(in srgb, var(--red) 35%, transparent);
    border-radius: 10px;
  }

  .warn {
    background: color-mix(in srgb, var(--gold) 14%, var(--surface));
    border: 1px solid color-mix(in srgb, var(--gold) 40%, transparent);
    color: #fde68a;
    padding: 0.875rem 1rem;
    border-radius: 10px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .url-hint {
    font-size: 0.85rem;
    color: var(--muted);
    margin: 0 0 1rem;
    word-break: break-all;
  }

  .url-hint code {
    background: color-mix(in srgb, var(--accent) 18%, var(--bg));
    color: #ddd6fe;
    padding: 0.15rem 0.45rem;
    border-radius: 6px;
    border: 1px solid var(--border);
  }
</style>
