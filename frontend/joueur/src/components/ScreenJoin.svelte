<script>
  import { onMount } from 'svelte';
  import { PLAYER_COLORS } from '@trivial-asso/game';
  import { fetchLobby } from '../lib/api.js';

  let {
    name = $bindable(''),
    color = $bindable(null),
    token = '',
    loading = false,
    onsubmit,
  } = $props();

  let takenColors = $state([]);
  let lobbyError = $state('');

  const canSubmit = $derived(
    !!name.trim() && color != null && !loading && !takenColors.includes(color),
  );

  onMount(async () => {
    if (!token) return;
    try {
      const lobby = await fetchLobby(token);
      takenColors = lobby.takenColors ?? [];
      if (lobby.myColor != null && color == null) color = lobby.myColor;
      if (lobby.myName && !name) name = lobby.myName;
    } catch (err) {
      lobbyError = err.message;
    }
  });
</script>

<div class="screen">
  <div class="hero">
    <span class="badge">Trivial Asso</span>
    <h1>Bienvenue !</h1>
    <p class="lead">Choisissez votre couleur et entrez votre prénom.</p>
  </div>

  <form class="card" onsubmit={onsubmit}>
    <fieldset class="colors" disabled={loading}>
      <legend>Votre couleur</legend>
      <div class="swatches" role="radiogroup" aria-label="Couleur du joueur">
        {#each PLAYER_COLORS as c (c.id)}
          {@const taken = takenColors.includes(c.id) && color !== c.id}
          <button
            type="button"
            class="swatch"
            class:selected={color === c.id}
            class:taken
            style:--swatch={c.hex}
            disabled={taken || loading}
            aria-pressed={color === c.id}
            aria-label={taken ? `${c.name} (prise)` : c.name}
            onclick={() => {
              if (!taken) color = c.id;
            }}
          >
            {#if color === c.id}
              <span class="check" aria-hidden="true">✓</span>
            {/if}
          </button>
        {/each}
      </div>
      {#if color == null}
        <p class="hint">Touchez une couleur pour la choisir</p>
      {/if}
    </fieldset>

    <label class="field">
      <span>Votre prénom</span>
      <input
        type="text"
        placeholder="Ex. Marie"
        bind:value={name}
        maxlength="24"
        autocomplete="given-name"
        required
        disabled={loading}
      />
    </label>

    {#if lobbyError}
      <p class="form-error">{lobbyError}</p>
    {/if}

    <button type="submit" class="primary" disabled={!canSubmit}>
      {loading ? 'Connexion…' : 'Rejoindre la partie'}
    </button>
  </form>
</div>

<style>
  .screen {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 1.5rem;
    gap: 1.5rem;
  }

  .hero {
    text-align: center;
  }

  .badge {
    display: inline-block;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    background: rgb(255 255 255 / 75%);
    color: #1a1a2e;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    margin-bottom: 1rem;
  }

  h1 {
    margin: 0 0 0.5rem;
    font-size: 2rem;
    line-height: 1.2;
  }

  .lead {
    margin: 0;
    color: #3d4450;
    font-size: 1.05rem;
    line-height: 1.5;
  }

  .card {
    background: rgb(255 255 255 / 92%);
    border-radius: 16px;
    padding: 1.25rem;
    box-shadow: 0 8px 32px rgb(26 26 46 / 12%);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .colors {
    border: none;
    margin: 0;
    padding: 0;
  }

  .colors legend {
    font-weight: 600;
    color: #3d4450;
    margin-bottom: 0.65rem;
  }

  .swatches {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.65rem;
  }

  .swatch {
    aspect-ratio: 1;
    border-radius: 16px;
    border: 3px solid transparent;
    background: var(--swatch);
    cursor: pointer;
    position: relative;
    box-shadow: inset 0 -4px 0 rgb(0 0 0 / 12%);
    transition: transform 0.12s, border-color 0.12s, opacity 0.12s;
  }

  .swatch:not(:disabled):active {
    transform: scale(0.96);
  }

  .swatch.selected {
    border-color: #1a1a2e;
    transform: scale(1.04);
  }

  .swatch.taken {
    opacity: 0.35;
    cursor: not-allowed;
    filter: grayscale(0.4);
  }

  .check {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: white;
    font-size: 1.5rem;
    font-weight: 900;
    text-shadow: 0 1px 3px rgb(0 0 0 / 35%);
  }

  .hint {
    margin: 0.5rem 0 0;
    font-size: 0.9rem;
    color: #6b7280;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-weight: 600;
    color: #3d4450;
  }

  input {
    padding: 1rem;
    font-size: 1.125rem;
    border: 2px solid #e4e8ee;
    border-radius: 12px;
    transition: border-color 0.15s;
  }

  input:focus {
    outline: none;
    border-color: #3498db;
  }

  .form-error {
    margin: 0;
    color: #c0392b;
    font-weight: 600;
    font-size: 0.95rem;
  }

  .primary {
    padding: 1rem;
    background: #1a1a2e;
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 700;
    font-size: 1.1rem;
  }

  .primary:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
</style>
