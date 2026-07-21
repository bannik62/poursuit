<script>
  let { result, playerName = '' } = $props();

  const labels = ['A', 'B', 'C', 'D'];
  const chosenLabel = $derived(labels[result?.chosenIndex] ?? '');
  const correctLabel = $derived(labels[result?.answerIndex] ?? '');
</script>

{#if result}
  <div
    class="overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="plateau-result-title"
  >
    <div class="modal" class:ok={result.correct} class:ko={!result.correct}>
      <div class="icon" aria-hidden="true">{result.correct ? '✓' : '✗'}</div>

      <p class="theme" style:--theme-color={result.themeColor ?? '#888'}>
        {result.themeName ?? 'Thème'}
        {#if playerName}
          <span class="who"> — {playerName}</span>
        {/if}
      </p>

      <h2 id="plateau-result-title" class="title">
        {#if result.isVictory && result.correct}
          Victoire !
        {:else if result.correct}
          Bonne réponse !
        {:else}
          Mauvaise réponse
        {/if}
      </h2>

      <div class="chosen">
        <p class="chosen-label">Réponse du joueur</p>
        <p class="chosen-answer" class:ok={result.correct} class:ko={!result.correct}>
          <span class="letter">{chosenLabel}</span>
          {result.chosenAnswer ?? '…'}
        </p>
      </div>

      {#if result.correct}
        <p class="message win">
          {#if result.isVictory}
            La partie est gagnée !
          {:else}
            Camembert <strong>{result.themeName}</strong> gagné !
          {/if}
        </p>
      {:else}
        <p class="message">La bonne réponse était :</p>
        <p class="correct-answer">
          <span class="letter ok">{correctLabel}</span>
          {result.correctAnswer ?? '…'}
        </p>
        {#if result.explanation}
          <p class="explanation">{result.explanation}</p>
        {/if}
      {/if}
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 29;
    background: rgb(0 0 0 / 55%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    pointer-events: none;
  }

  .modal {
    width: min(720px, 92vw);
    background: #fff;
    border-radius: 24px;
    padding: 2rem 2.25rem 1.75rem;
    text-align: center;
    box-shadow: 0 20px 60px rgb(0 0 0 / 45%);
    animation: pop-in 0.3s ease;
  }

  .modal.ok {
    border: 4px solid #2ecc71;
  }

  .modal.ko {
    border: 4px solid #e74c3c;
  }

  .icon {
    width: 4.5rem;
    height: 4.5rem;
    margin: 0 auto 1rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.25rem;
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
    font-size: 1rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--theme-color);
  }

  .who {
    color: #5a6270;
    text-transform: none;
    letter-spacing: 0;
    font-weight: 700;
  }

  .title {
    margin: 0 0 1.25rem;
    font-size: clamp(1.75rem, 3vw, 2.5rem);
    font-weight: 900;
    color: #1a1a2e;
  }

  .chosen {
    margin-bottom: 1rem;
    text-align: left;
  }

  .chosen-label {
    margin: 0 0 0.4rem;
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #8b93a1;
  }

  .chosen-answer,
  .correct-answer {
    margin: 0;
    padding: 1rem 1.15rem;
    border-radius: 14px;
    font-weight: 700;
    color: #1a1a2e;
    display: flex;
    align-items: center;
    gap: 0.85rem;
    font-size: clamp(1.05rem, 1.8vw, 1.35rem);
    line-height: 1.3;
  }

  .chosen-answer.ok {
    background: #edfbf3;
    border: 2px solid #2ecc71;
  }

  .chosen-answer.ko {
    background: #fdf2f2;
    border: 2px solid #e74c3c;
  }

  .correct-answer {
    background: #edfbf3;
    border: 2px solid #2ecc71;
    margin-bottom: 1rem;
    text-align: left;
  }

  .letter {
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: #2980b9;
    color: white;
    font-weight: 800;
    font-size: 1.15rem;
  }

  .chosen-answer.ok .letter,
  .letter.ok {
    background: #2ecc71;
  }

  .chosen-answer.ko .letter {
    background: #e74c3c;
  }

  .message {
    margin: 0 0 0.75rem;
    color: #5a6270;
    font-size: 1.1rem;
    line-height: 1.4;
  }

  .message.win {
    color: #1e8449;
    font-weight: 700;
    font-size: 1.25rem;
  }

  .explanation {
    margin: 0;
    font-size: 1.05rem;
    color: #6b7280;
    line-height: 1.45;
    text-align: left;
  }

  @keyframes pop-in {
    from {
      transform: scale(0.94);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
