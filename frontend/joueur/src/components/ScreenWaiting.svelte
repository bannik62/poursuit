<script>
  import { playerColorHex } from '@trivial-asso/game';
  let { playerSlot, session } = $props();

  const total = $derived(session?.playerCount ?? 0);
  const connected = $derived(session?.connectedCount ?? 0);
  const players = $derived(session?.players ?? []);
  const myName = $derived(
    players.find((p) => p.slot === playerSlot)?.name ?? '…',
  );

  function avatarColor(p) {
    if (p.color != null) return playerColorHex(p.color);
    return '#2ecc71';
  }
</script>

<div class="screen">
  <header class="top">
    <span class="badge">Lobby</span>
    <h1>Bonjour {myName} !</h1>
    <p class="lead">En attente des autres joueurs…</p>
  </header>

  <section class="counter card">
    <div class="count" aria-live="polite">
      <strong>{connected}</strong>
      <span>/ {total}</span>
    </div>
    <p class="count-label">joueurs connectés</p>

    <div class="dots" role="progressbar" aria-valuenow={connected} aria-valuemin="0" aria-valuemax={total}>
      {#each Array(total) as _, i (i)}
        <span class="dot" class:filled={players[i]?.connected}></span>
      {/each}
    </div>
  </section>

  <section class="card players">
    <h2>Participants</h2>
    <ul>
      {#each players as p (p.slot)}
        <li class:online={p.connected} class:me={p.slot === playerSlot}>
          <span
            class="avatar"
            style:background={p.connected ? avatarColor(p) : undefined}
            style:color={p.connected ? '#fff' : undefined}
          >
            {p.connected && p.name ? p.name[0].toUpperCase() : '?'}
          </span>
          <span class="label">
            {#if p.connected}
              {p.name}
              {#if p.slot === playerSlot}
                <em class="you">(vous)</em>
              {/if}
            {:else}
              Joueur {p.slot + 1}
              <em>en attente</em>
            {/if}
          </span>
          <span class="status">{p.connected ? '✓' : '…'}</span>
        </li>
      {/each}
    </ul>
  </section>

  <footer class="hint">
    <span class="pulse"></span>
    Le formateur lancera la partie quand tout le monde sera prêt.
  </footer>
</div>

<style>
  .screen {
    min-height: 100vh;
    padding: 1.25rem 1rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .top {
    text-align: center;
    padding-top: 0.5rem;
  }

  .badge {
    display: inline-block;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    background: #fff4e5;
    color: #d68910;
    font-size: 0.8rem;
    font-weight: 700;
    margin-bottom: 0.75rem;
  }

  h1 {
    margin: 0 0 0.35rem;
    font-size: 1.75rem;
  }

  .lead {
    margin: 0;
    color: #5a6270;
  }

  .card {
    background: white;
    border-radius: 16px;
    padding: 1.25rem;
    box-shadow: 0 8px 32px rgb(26 26 46 / 8%);
  }

  .counter {
    text-align: center;
  }

  .count {
    font-size: 2.5rem;
    line-height: 1;
    color: #1a1a2e;
  }

  .count span {
    font-size: 1.5rem;
    color: #8b93a1;
    font-weight: 500;
  }

  .count-label {
    margin: 0.25rem 0 1rem;
    color: #6b7280;
  }

  .dots {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #e4e8ee;
    transition: background 0.2s, transform 0.2s;
  }

  .dot.filled {
    background: #2ecc71;
    transform: scale(1.1);
  }

  .players h2 {
    margin: 0 0 0.75rem;
    font-size: 0.95rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #8b93a1;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 12px;
    background: #f7f8fa;
    color: #8b93a1;
  }

  li.online {
    background: #edfbf3;
    color: #1a1a2e;
  }

  li.me {
    outline: 2px solid #3498db;
    outline-offset: -2px;
  }

  .avatar {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 50%;
    background: #dde1e8;
    display: grid;
    place-items: center;
    font-weight: 700;
    flex-shrink: 0;
  }

  .label {
    flex: 1;
    font-weight: 600;
  }

  .label em {
    display: block;
    font-size: 0.8rem;
    font-style: normal;
    font-weight: 500;
    color: #a0a7b4;
  }

  .label em.you {
    display: inline;
    color: #2980b9;
    font-weight: 700;
    margin-left: 0.25rem;
  }

  .status {
    font-size: 1.1rem;
    font-weight: 700;
  }

  .hint {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    text-align: center;
    color: #7a8290;
    font-size: 0.95rem;
    line-height: 1.4;
    padding: 0 0.5rem;
  }

  .pulse {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #f39c12;
    flex-shrink: 0;
    animation: pulse 1.4s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.4;
      transform: scale(0.9);
    }
    50% {
      opacity: 1;
      transform: scale(1.15);
    }
  }
</style>
