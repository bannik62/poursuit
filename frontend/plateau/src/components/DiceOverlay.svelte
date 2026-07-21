<script>
  let { roll } = $props();

  const playerName = $derived(roll?.name ?? '');
</script>

{#if roll}
  <div class="overlay" role="status" aria-live="polite">
    <div class="dice-card">
      <p class="who">{playerName}</p>
      <p class="value">{roll.value}</p>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 20;
    animation: fade-in 0.2s ease;
  }

  .dice-card {
    background: rgb(0 0 0 / 75%);
    border: 3px solid #f1c40f;
    border-radius: 24px;
    padding: 1.5rem 2.5rem;
    text-align: center;
    backdrop-filter: blur(6px);
    animation: pop 0.35s ease;
  }

  .who {
    margin: 0 0 0.5rem;
    font-size: 1.25rem;
    font-weight: 700;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .value {
    margin: 0;
    font-size: 6rem;
    font-weight: 900;
    color: #f1c40f;
    line-height: 1;
  }

  @keyframes pop {
    from {
      transform: scale(0.6);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
