<script>
  let { session } = $props();

  const podium = $derived(session?.podium ?? []);
  const players = $derived(session?.players ?? []);
  const medals = ['🥇', '🥈', '🥉'];

  function nameOf(slot) {
    return players.find((p) => p.slot === slot)?.name ?? `Joueur ${slot + 1}`;
  }
</script>

{#if podium.length > 0}
  <div class="podium" role="status">
    <h2>Podium</h2>
    <ol>
      {#each podium as slot, i (slot)}
        <li class:first={i === 0}>
          <span class="medal">{medals[i] ?? `${i + 1}.`}</span>
          <span class="name">{nameOf(slot)}</span>
        </li>
      {/each}
    </ol>
  </div>
{/if}

<style>
  .podium {
    position: fixed;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 32;
    min-width: min(90vw, 380px);
    padding: 1.25rem 1.75rem;
    border-radius: 18px;
    background: linear-gradient(145deg, #1a1a2e, #2c3e50);
    color: #fff;
    box-shadow: 0 12px 40px rgb(0 0 0 / 45%);
    text-align: center;
  }

  h2 {
    margin: 0 0 0.75rem;
    font-size: 1.25rem;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #f1c40f;
  }

  ol {
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
    justify-content: center;
    gap: 0.65rem;
    font-size: 1.15rem;
    font-weight: 700;
  }

  li.first {
    font-size: 1.45rem;
    color: #f1c40f;
  }

  .medal {
    font-size: 1.35em;
  }
</style>
