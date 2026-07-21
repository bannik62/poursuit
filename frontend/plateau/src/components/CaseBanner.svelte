<script>
  let { cue = null } = $props();

  const copy = $derived(
    {
      rejouez: { title: 'Rejouez !', sub: 'Même joueur relance', tone: 'go' },
      bonus: { title: 'Relance bonus !', sub: 'Camembert déjà gagné', tone: 'go' },
      pass: { title: 'Passe ton tour', sub: 'Joueur suivant', tone: 'pass' },
      question: { title: 'Question !', sub: 'Répondez sur le téléphone', tone: 'ask' },
      challenge: { title: 'Défi !', sub: 'Choisir thème + adversaire', tone: 'ask' },
      finish: { title: 'Arrivée !', sub: 'Un joueur rejoint le centre', tone: 'go' },
      exact: { title: 'Nombre exact', sub: 'Jet trop grand — joueur suivant', tone: 'pass' },
    }[cue] ?? null,
  );
</script>

{#if copy}
  <div class="banner" class:go={copy.tone === 'go'} class:pass={copy.tone === 'pass'} class:ask={copy.tone === 'ask'} role="status">
    <p class="title">{copy.title}</p>
    <p class="sub">{copy.sub}</p>
  </div>
{/if}

<style>
  .banner {
    position: fixed;
    top: 5.5rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 25;
    min-width: min(90vw, 420px);
    padding: 1rem 1.75rem;
    border-radius: 16px;
    text-align: center;
    box-shadow: 0 12px 40px rgb(0 0 0 / 45%);
    animation: drop-in 0.35s ease;
  }

  .banner.go {
    background: linear-gradient(135deg, #f1c40f, #f39c12);
    color: #1a1a2e;
  }

  .banner.pass {
    background: linear-gradient(135deg, #2c3e50, #1a1a2e);
    color: #fff;
  }

  .banner.ask {
    background: linear-gradient(135deg, #3498db, #2980b9);
    color: #fff;
  }

  .title {
    margin: 0;
    font-size: clamp(1.5rem, 3vw, 2.25rem);
    font-weight: 900;
    letter-spacing: 0.02em;
  }

  .sub {
    margin: 0.35rem 0 0;
    font-size: 1rem;
    font-weight: 600;
    opacity: 0.9;
  }

  @keyframes drop-in {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-12px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
</style>
