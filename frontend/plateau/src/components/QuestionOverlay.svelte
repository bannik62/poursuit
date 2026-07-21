<script>
  let { question } = $props();

  const labels = ['A', 'B', 'C', 'D'];
</script>

{#if question}
  <div class="overlay" role="dialog" aria-modal="true" aria-labelledby="plateau-q-title">
    <div class="modal">
      <p class="theme" style:--theme-color={question.themeColor ?? '#888'}>
        {question.themeName ?? 'Thème'}
        {#if question.isVictory}
          <span class="victory"> — Question victoire</span>
        {/if}
      </p>
      <h2 id="plateau-q-title" class="text">{question.text}</h2>
      <ul class="choices">
        {#each question.choices ?? [] as choice, i (i)}
          <li class="choice">
            <span class="letter">{labels[i]}</span>
            <span class="label">{choice}</span>
          </li>
        {/each}
      </ul>
      <p class="hint">Répondez sur le téléphone du joueur</p>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 28;
    background: rgb(0 0 0 / 55%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    pointer-events: none;
  }

  .modal {
    width: min(920px, 92vw);
    background: #fff;
    border-radius: 24px;
    padding: 2rem 2.25rem 1.75rem;
    box-shadow: 0 20px 60px rgb(0 0 0 / 45%);
    animation: pop-in 0.3s ease;
  }

  .theme {
    margin: 0 0 0.75rem;
    font-size: 1rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--theme-color);
  }

  .victory {
    color: #c9a227;
    text-transform: none;
    letter-spacing: 0;
  }

  .text {
    margin: 0 0 1.5rem;
    font-size: clamp(1.35rem, 2.5vw, 2rem);
    line-height: 1.35;
    color: #1a1a2e;
    font-weight: 800;
  }

  .choices {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.85rem;
  }

  .choice {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 1rem 1.15rem;
    border: 2px solid #e8ecf0;
    border-radius: 14px;
    background: #fafbfc;
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

  .label {
    font-size: clamp(1rem, 1.6vw, 1.25rem);
    font-weight: 700;
    color: #2c3e50;
    line-height: 1.3;
  }

  .hint {
    margin: 1.25rem 0 0;
    text-align: center;
    font-size: 1rem;
    font-weight: 600;
    color: #8b93a1;
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

  @media (max-width: 700px) {
    .choices {
      grid-template-columns: 1fr;
    }
  }
</style>
