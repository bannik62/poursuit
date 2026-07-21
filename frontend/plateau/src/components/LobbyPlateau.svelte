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
  }

  .title {
    font-size: 2rem;
    margin: 0 0 0.5rem;
    opacity: 0.9;
  }

  .count {
    font-size: 3rem;
    font-weight: 800;
    margin: 0 0 2rem;
    color: #2ecc71;
  }

  .slots {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1rem;
  }

  .slot {
    background: rgb(255 255 255 / 8%);
    border: 2px dashed rgb(255 255 255 / 25%);
    border-radius: 16px;
    padding: 1.5rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .slot.filled {
    border-style: solid;
    border-color: #2ecc71;
    background: rgb(46 204 113 / 15%);
  }

  .num {
    font-size: 2rem;
    opacity: 0.5;
  }

  .name {
    font-size: 1.75rem;
    font-weight: 700;
  }

  .waiting {
    font-size: 2rem;
    opacity: 0.3;
  }
</style>
