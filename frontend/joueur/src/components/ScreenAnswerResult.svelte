<script>
  import { Confetti } from 'svelte-confetti';

  let { result, onclose } = $props();

  const labels = ['A', 'B', 'C', 'D'];
  const correctLabel = $derived(labels[result?.answerIndex] ?? '');
  const themeColors = $derived(
    result?.themeColor
      ? [result.themeColor, '#2ecc71', '#f1c40f', '#ffffff']
      : ['#2ecc71', '#f1c40f', '#3498db', '#e74c3c', '#ffffff'],
  );
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="result-title">
  {#if result?.correct}
    <div class="confetti-burst" aria-hidden="true">
      <Confetti
        amount={120}
        size={12}
        cone
        rounded
        x={[-0.9, 0.9]}
        y={[0.4, 1.2]}
        delay={[0, 200]}
        duration={2800}
        fallDistance="180px"
        colorArray={themeColors}
        disableForReducedMotion
      />
    </div>
  {/if}

  <div class="modal" class:ok={result?.correct} class:ko={!result?.correct}>
    <div class="icon" aria-hidden="true">{result?.correct ? '✓' : '✗'}</div>

    <p class="theme" style:--theme-color={result?.themeColor ?? '#888'}>
      {result?.themeName ?? 'Thème'}
    </p>

    <h2 id="result-title" class="title">
      {#if result?.isVictory && result?.correct}
        Victoire !
      {:else if result?.correct}
        Bonne réponse !
      {:else}
        Mauvaise réponse
      {/if}
    </h2>

    {#if result?.correct}
      <p class="message win">
        {#if result?.isVictory}
          Vous remportez la partie !
        {:else}
          Camembert <strong>{result.themeName}</strong> gagné !
        {/if}
      </p>
    {:else}
      <p class="message">La bonne réponse était :</p>
      <p class="correct-answer">
        <span class="letter">{correctLabel}</span>
        {result?.correctAnswer ?? '…'}
      </p>
      {#if result?.explanation}
        <p class="explanation">{result.explanation}</p>
      {/if}
    {/if}

    <button type="button" class="close-btn" onclick={() => onclose?.()}>
      Continuer
    </button>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 110;
    background: rgb(0 0 0 / 55%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.25rem;
    overflow: hidden;
  }

  .confetti-burst {
    position: absolute;
    top: 28%;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
    z-index: 1;
  }

  .modal {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: 400px;
    background: white;
    border-radius: 20px;
    padding: 1.75rem 1.5rem 1.5rem;
    text-align: center;
    box-shadow: 0 16px 48px rgb(0 0 0 / 25%);
    animation: pop-in 0.25s ease;
  }

  .modal.ok {
    border: 3px solid #2ecc71;
  }

  .modal.ko {
    border: 3px solid #e74c3c;
  }

  .icon {
    width: 4rem;
    height: 4rem;
    margin: 0 auto 1rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: 900;
  }

  .ok .icon {
    background: #edfbf3;
    color: #1e8449;
  }

  .ko .icon {
    background: #fdf2f2;
    color: #c0392b;
  }

  .theme {
    margin: 0 0 0.35rem;
    font-size: 0.8rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--theme-color);
  }

  .title {
    margin: 0 0 0.75rem;
    font-size: 1.5rem;
    font-weight: 800;
    color: #1a1a2e;
  }

  .message {
    margin: 0 0 0.75rem;
    color: #5a6270;
    font-size: 1rem;
    line-height: 1.4;
  }

  .message.win {
    color: #1e8449;
    font-weight: 600;
  }

  .correct-answer {
    margin: 0 0 1rem;
    padding: 0.85rem 1rem;
    background: #edfbf3;
    border-radius: 12px;
    font-weight: 700;
    color: #1a1a2e;
    display: flex;
    align-items: center;
    gap: 0.65rem;
    text-align: left;
  }

  .letter {
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: #2ecc71;
    color: white;
    font-weight: 800;
  }

  .explanation {
    margin: 0 0 1.25rem;
    font-size: 0.95rem;
    color: #6b7280;
    line-height: 1.45;
    text-align: left;
  }

  .close-btn {
    width: 100%;
    padding: 0.95rem 1.5rem;
    border: none;
    border-radius: 14px;
    background: linear-gradient(145deg, #2980b9, #1a5276);
    color: white;
    font-size: 1.1rem;
    font-weight: 800;
    cursor: pointer;
  }

  .close-btn:active {
    transform: scale(0.98);
  }

  @keyframes pop-in {
    from {
      transform: scale(0.9);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
