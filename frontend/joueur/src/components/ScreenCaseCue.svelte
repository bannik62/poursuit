<script>
  let { cue = 'none', onclose } = $props();

  const copy = $derived(
    {
      rejouez: {
        title: 'Rejouez !',
        message: 'Vous retombez sur une case Relance — lancez le dé à nouveau.',
        icon: '↻',
        tone: 'go',
      },
      bonus: {
        title: 'Relance bonus !',
        message: 'Vous avez déjà ce camembert — lancez encore le dé.',
        icon: '★',
        tone: 'go',
      },
      pass: {
        title: 'Passe ton tour',
        message: 'Case noire — c’est au joueur suivant.',
        icon: '→',
        tone: 'pass',
      },
      finish: {
        title: 'Arrivée au centre !',
        message: 'Vous avez terminé. Les autres continuent pour le podium.',
        icon: '🏁',
        tone: 'go',
      },
      exact: {
        title: 'Nombre exact requis',
        message: 'Votre jet est trop grand pour le centre — au joueur suivant.',
        icon: '🎯',
        tone: 'pass',
      },
    }[cue] ?? null,
  );
</script>

{#if copy}
  <div class="overlay" role="dialog" aria-modal="true" aria-labelledby="case-title">
    <div class="modal" class:go={copy.tone === 'go'} class:pass={copy.tone === 'pass'}>
      <div class="icon" aria-hidden="true">{copy.icon}</div>
      <h2 id="case-title" class="title">{copy.title}</h2>
      <p class="message">{copy.message}</p>
      <button type="button" class="close-btn" onclick={() => onclose?.()}>
        Continuer
      </button>
    </div>
  </div>
{/if}

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
  }

  .modal {
    width: 100%;
    max-width: 400px;
    background: white;
    border-radius: 20px;
    padding: 1.75rem 1.5rem 1.5rem;
    text-align: center;
    box-shadow: 0 16px 48px rgb(0 0 0 / 25%);
    animation: pop-in 0.25s ease;
  }

  .modal.go {
    border: 3px solid #f1c40f;
  }

  .modal.pass {
    border: 3px solid #1a1a2e;
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

  .go .icon {
    background: #fff8e1;
    color: #b7950b;
  }

  .pass .icon {
    background: #1a1a2e;
    color: #fff;
  }

  .title {
    margin: 0 0 0.75rem;
    font-size: 1.75rem;
    font-weight: 800;
    color: #1a1a2e;
  }

  .message {
    margin: 0 0 1.25rem;
    color: #5a6270;
    font-size: 1.05rem;
    line-height: 1.45;
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
