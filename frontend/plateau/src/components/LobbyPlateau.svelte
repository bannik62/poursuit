<script>
  let { session } = $props();
</script>

<div class="lobby">
  <p class="title">En attente des joueurs</p>
  <p class="count">{session.connectedCount} / {session.playerCount}</p>

  <div class="slots">
    {#each session.players as player (player.slot)}
      <div class="slot" class:filled={player.connected}>
        <span class="num">{player.slot + 1}</span>
        {#if player.connected}
          <span class="name">{player.name}</span>
        {:else}
          <span class="waiting">—</span>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .lobby {
    text-align: center;
    width: min(900px, 100%);
    padding: 2rem clamp(1.25rem, 4vw, 2.5rem);
    background: color-mix(in srgb, var(--surface) 88%, transparent);
    border: 1px solid var(--border);
    border-radius: 20px;
    box-shadow:
      0 0 0 1px rgb(124 58 237 / 10%),
      0 20px 48px rgb(0 0 0 / 35%);
    backdrop-filter: blur(10px);
  }

  .title {
    font-size: clamp(1.5rem, 3vw, 2rem);
    margin: 0 0 0.5rem;
    color: var(--muted);
    font-weight: 600;
  }

  .count {
    font-size: clamp(2.5rem, 6vw, 3.5rem);
    font-weight: 800;
    margin: 0 0 2rem;
    color: var(--gold);
  }

  .slots {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1rem;
  }

  .slot {
    background: color-mix(in srgb, var(--bg) 55%, var(--surface));
    border: 2px dashed color-mix(in srgb, var(--muted) 35%, transparent);
    border-radius: 16px;
    padding: 1.5rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .slot.filled {
    border-style: solid;
    border-color: color-mix(in srgb, var(--green) 65%, transparent);
    background: color-mix(in srgb, var(--green) 14%, var(--surface));
  }

  .num {
    font-size: 2rem;
    color: var(--muted);
    opacity: 0.7;
  }

  .name {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text);
  }

  .waiting {
    font-size: 2rem;
    color: var(--muted);
    opacity: 0.35;
  }
</style>
