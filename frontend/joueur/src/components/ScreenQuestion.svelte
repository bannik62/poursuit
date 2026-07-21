<script>
  let { question, onanswer, disabled = false } = $props();

  const labels = ['A', 'B', 'C', 'D'];
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="q-title">
  <div class="modal">
    <p class="theme" style:--theme-color={question?.themeColor ?? '#888'}>
      {question?.themeName ?? 'Thème'}
    </p>
    <h2 id="q-title" class="text">{question?.text ?? ''}</h2>
    <div class="choices">
      {#each question?.choices ?? [] as choice, i (i)}
        <button
          type="button"
          class="choice"
          disabled={disabled}
          onclick={() => onanswer?.(i)}
        >
          <span class="letter">{labels[i]}</span>
          <span class="label">{choice}</span>
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgb(0 0 0 / 55%);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 1rem 1rem 1.5rem;
  }

  .modal {
    width: 100%;
    max-width: 480px;
    background: white;
    border-radius: 20px 20px 16px 16px;
    padding: 1.25rem 1.25rem 1.5rem;
    box-shadow: 0 -8px 40px rgb(0 0 0 / 25%);
    animation: slide-up 0.25s ease;
  }

  .theme {
    margin: 0 0 0.5rem;
    font-size: 0.8rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--theme-color);
  }

  .text {
    margin: 0 0 1.25rem;
    font-size: 1.2rem;
    line-height: 1.4;
    color: #1a1a2e;
  }

  .choices {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .choice {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.85rem 1rem;
    border: 2px solid #e8ecf0;
    border-radius: 12px;
    background: #fafbfc;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
  }

  .choice:not(:disabled):active {
    border-color: #2980b9;
    background: #eef6fc;
  }

  .choice:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .letter {
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: #2980b9;
    color: white;
    font-weight: 800;
    font-size: 0.95rem;
  }

  .label {
    font-size: 1rem;
    font-weight: 600;
    color: #2c3e50;
    line-height: 1.3;
  }

  @keyframes slide-up {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
</style>
