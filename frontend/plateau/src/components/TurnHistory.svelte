<script>
  import { tick } from 'svelte';

  /** @type {{ at: number | string, name: string, dice: number | string, action: string }[]} */
  let { entries = [] } = $props();

  let listEl = $state(null);

  $effect(() => {
    entries.length;
    tick().then(() => {
      if (listEl) {
        listEl.scrollTo({ top: listEl.scrollHeight, behavior: 'smooth' });
      }
    });
  });

  function actionClass(action) {
    if (action === 'Bonne réponse') return 'ok';
    if (action === 'Mauvaise réponse') return 'ko';
    if (action === 'À rejouer') return 'again';
    if (action === 'À passer') return 'pass';
    return '';
  }
</script>

<section class="history-panel" aria-label="Historique des tours">
  <h2 class="title">Historique</h2>

  {#if entries.length === 0}
    <p class="empty">Les lancers apparaîtront ici.</p>
  {:else}
    <ol class="list" bind:this={listEl}>
      {#each entries as entry (entry.at)}
        <li class="row">
          <span class="line">
            <span class="name">{entry.name}</span>
            <span class="sep" aria-hidden="true">›</span>
            <span class="dice">{entry.dice}</span>
            <span class="sep" aria-hidden="true">›</span>
            <span class="action {actionClass(entry.action)}">{entry.action}</span>
          </span>
        </li>
      {/each}
    </ol>
  {/if}
</section>

<style>
  .history-panel {
    background: color-mix(in srgb, var(--surface) 85%, transparent);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 1rem 1.15rem;
    min-width: 280px;
    max-width: 320px;
    flex: 1;
    min-height: 180px;
    max-height: min(36vh, 320px);
    display: flex;
    flex-direction: column;
    backdrop-filter: blur(10px);
    box-shadow: 0 12px 32px rgb(0 0 0 / 30%);
  }

  .title {
    margin: 0 0 0.65rem;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
    flex-shrink: 0;
  }

  .empty {
    margin: 0;
    font-size: 0.85rem;
    color: var(--muted);
    font-style: italic;
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 0.15rem 0.1rem 0.15rem 0;
    overflow-y: auto;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    scroll-behavior: smooth;
  }

  .row {
    padding: 0.5rem 0.65rem;
    border-radius: 10px;
    background: color-mix(in srgb, var(--bg) 45%, transparent);
  }

  .line {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.92rem;
    line-height: 1.3;
    flex-wrap: nowrap;
  }

  .name {
    font-weight: 700;
    flex-shrink: 0;
    max-width: 5.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sep {
    color: var(--muted);
    opacity: 0.55;
    flex-shrink: 0;
    font-weight: 600;
  }

  .dice {
    font-weight: 800;
    font-size: 1.05rem;
    color: var(--gold);
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
    min-width: 1.1rem;
    text-align: center;
  }

  .action {
    color: var(--muted);
    font-size: 0.88rem;
    flex: 1;
    min-width: 0;
  }

  .action.ok {
    color: var(--green);
    font-weight: 700;
  }

  .action.ko {
    color: var(--red-light);
    font-weight: 700;
  }

  .action.again {
    color: #fde68a;
    font-weight: 600;
  }

  .action.pass {
    color: var(--muted);
    font-style: italic;
  }
</style>
