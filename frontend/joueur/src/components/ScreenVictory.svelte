<script>
  import { Confetti } from 'svelte-confetti';
  import { PLAYER_COLORS } from '@trivial-asso/game';

  let { isWinner = false, winnerName = '', playerColor = null, onquit } = $props();

  const colors = $derived(
    playerColor != null && PLAYER_COLORS[playerColor]
      ? [PLAYER_COLORS[playerColor].hex, '#f1c40f', '#ffffff', '#2ecc71', '#e74c3c']
      : ['#f1c40f', '#2ecc71', '#3498db', '#e74c3c', '#9b59b6', '#ffffff'],
  );
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="victory-title">
  <div class="confetti-rain" aria-hidden="true">
    <Confetti
      amount={180}
      size={14}
      rounded
      x={[-5, 5]}
      y={[0, 0.15]}
      delay={[0, 2000]}
      duration={4500}
      fallDistance="100vh"
      infinite
      colorArray={colors}
      disableForReducedMotion
    />
  </div>

  <div class="modal" class:win={isWinner}>
    <div class="trophy" aria-hidden="true">{isWinner ? '🏆' : '🎉'}</div>

    <h2 id="victory-title" class="title">
      {#if isWinner}
        Vous avez gagné !
      {:else}
        Partie terminée
      {/if}
    </h2>

    <p class="message">
      {#if isWinner}
        Bravo — vous êtes arrivé·e au centre en premier.
      {:else}
        Victoire de <strong>{winnerName || '…'}</strong> !
      {/if}
    </p>

    <button type="button" class="quit-btn" onclick={() => onquit?.()}>
      Quitter
    </button>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgb(0 0 0 / 60%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.25rem;
    overflow: hidden;
  }

  .confetti-rain {
    position: fixed;
    top: -40px;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    overflow: hidden;
    pointer-events: none;
    z-index: 1;
  }

  .modal {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: 400px;
    background: white;
    border-radius: 24px;
    padding: 2rem 1.5rem 1.5rem;
    text-align: center;
    box-shadow: 0 20px 60px rgb(0 0 0 / 35%);
    animation: pop-in 0.35s ease;
    border: 3px solid #c9a227;
  }

  .modal.win {
    border-color: #f1c40f;
    background: linear-gradient(180deg, #fffbeb 0%, #ffffff 40%);
  }

  .trophy {
    font-size: 3.5rem;
    line-height: 1;
    margin-bottom: 0.75rem;
    animation: bounce 1.4s ease-in-out infinite;
  }

  .title {
    margin: 0 0 0.75rem;
    font-size: 1.85rem;
    font-weight: 900;
    color: #1a1a2e;
  }

  .message {
    margin: 0 0 1.5rem;
    color: #5a6270;
    font-size: 1.1rem;
    line-height: 1.45;
  }

  .message strong {
    color: #1a1a2e;
  }

  .quit-btn {
    width: 100%;
    padding: 1rem 1.5rem;
    border: none;
    border-radius: 14px;
    background: #1a1a2e;
    color: white;
    font-size: 1.15rem;
    font-weight: 800;
    cursor: pointer;
  }

  .quit-btn:active {
    transform: scale(0.98);
  }

  @keyframes pop-in {
    from {
      transform: scale(0.88);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes bounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-8px);
    }
  }
</style>
