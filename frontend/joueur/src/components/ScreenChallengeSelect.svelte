<script>
  import { SERIES } from '@trivial-asso/game';

  let { session, playerSlot, onselect, disabled = false } = $props();

  let theme = $state(0);
  let targetSlot = $state(null);

  const opponents = $derived(
    (session?.players ?? []).filter(
      (p) => p.connected && !p.finished && p.slot !== playerSlot,
    ),
  );

  const canSubmit = $derived(
    !disabled && targetSlot != null && theme >= 0 && theme <= 3 && opponents.length > 0,
  );

  function submit() {
    if (!canSubmit) return;
    onselect?.({ theme, targetSlot });
  }
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="challenge-title">
  <div class="modal">
    <p class="badge">Case défi</p>
    <h2 id="challenge-title">Choisissez un thème et un joueur</h2>
    <p class="lead">Ce joueur devra répondre à la question. S’il se trompe, vous rejouez.</p>

    <p class="label">Thème</p>
    <div class="themes">
      {#each SERIES as s (s.id)}
        <button
          type="button"
          class="theme-btn"
          class:active={theme === s.id}
          style:--c={s.color}
          disabled={disabled}
          onclick={() => (theme = s.id)}
        >
          {s.name}
        </button>
      {/each}
    </div>

    <p class="label">Joueur</p>
    {#if opponents.length === 0}
      <p class="empty">Aucun adversaire disponible</p>
    {:else}
      <div class="targets">
        {#each opponents as p (p.slot)}
          <button
            type="button"
            class="target-btn"
            class:active={targetSlot === p.slot}
            disabled={disabled}
            onclick={() => (targetSlot = p.slot)}
          >
            {p.name}
          </button>
        {/each}
      </div>
    {/if}

    <button type="button" class="submit" disabled={!canSubmit} onclick={submit}>
      Poser la question
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
    align-items: flex-end;
    justify-content: center;
    padding: 1rem;
  }

  .modal {
    width: 100%;
    max-width: 440px;
    background: white;
    border-radius: 20px;
    padding: 1.5rem;
    box-shadow: 0 -8px 40px rgb(0 0 0 / 25%);
  }

  .badge {
    margin: 0 0 0.5rem;
    font-size: 0.8rem;
    font-weight: 800;
    text-transform: uppercase;
    color: #8e44ad;
  }

  h2 {
    margin: 0 0 0.5rem;
    font-size: 1.35rem;
    color: #1a1a2e;
  }

  .lead {
    margin: 0 0 1.25rem;
    color: #5a6270;
    font-size: 0.95rem;
    line-height: 1.4;
  }

  .label {
    margin: 0 0 0.5rem;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #8b93a1;
  }

  .themes,
  .targets {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .theme-btn,
  .target-btn {
    padding: 0.65rem 0.9rem;
    border-radius: 10px;
    border: 2px solid #e8ecf0;
    background: #fafbfc;
    font-weight: 700;
    cursor: pointer;
  }

  .theme-btn.active {
    border-color: var(--c);
    background: color-mix(in srgb, var(--c) 18%, white);
  }

  .target-btn.active {
    border-color: #8e44ad;
    background: #f5eef8;
  }

  .empty {
    color: #c0392b;
    font-weight: 600;
  }

  .submit {
    width: 100%;
    padding: 0.95rem;
    border: none;
    border-radius: 14px;
    background: linear-gradient(145deg, #8e44ad, #6c3483);
    color: white;
    font-size: 1.1rem;
    font-weight: 800;
    cursor: pointer;
  }

  .submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
