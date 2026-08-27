<script>
  import { onMount } from 'svelte';
  import { PLAYER_ANIMALS, playerColorHex, DEFAULT_EVENT_TITLE } from '@trivial-asso/game';
  import { fetchLobby } from '../lib/api.js';
  import AnimalIcon from './AnimalIcon.svelte';

  let {
    name = $bindable(''),
    animal = $bindable(null),
    token = '',
    loading = false,
    onsubmit,
  } = $props();

  let takenAnimals = $state([]);
  let lobbyError = $state('');
  let eventTitle = $state(DEFAULT_EVENT_TITLE);

  const canSubmit = $derived(
    !!name.trim() && animal != null && !loading && !takenAnimals.includes(animal),
  );

  onMount(async () => {
    if (!token) return;
    try {
      const lobby = await fetchLobby(token);
      takenAnimals = lobby.takenAnimals ?? [];
      eventTitle = lobby.eventTitle ?? DEFAULT_EVENT_TITLE;
      if (lobby.myAnimal != null && animal == null) animal = lobby.myAnimal;
      if (lobby.myName && !name) name = lobby.myName;
    } catch (err) {
      lobbyError = err.message;
    }
  });
</script>

<div class="screen">
  <div class="hero">
    <span class="badge">{eventTitle}</span>
    <h1>Bienvenue !</h1>
    <p class="lead">Choisissez votre animal et entrez votre prénom.</p>
  </div>

  <form class="card" onsubmit={onsubmit}>
    <fieldset class="animals" disabled={loading}>
      <legend>Votre pion</legend>
      <div class="grid" role="radiogroup" aria-label="Animal du joueur">
        {#each PLAYER_ANIMALS as a (a.id)}
          {@const taken = takenAnimals.includes(a.id) && animal !== a.id}
          {@const ringColor = playerColorHex(a.id % 6)}
          <button
            type="button"
            class="pick"
            class:selected={animal === a.id}
            class:taken
            disabled={taken || loading}
            aria-pressed={animal === a.id}
            aria-label={taken ? `${a.name} (pris)` : a.name}
            style:--ring={ringColor}
            onclick={() => {
              if (!taken) animal = a.id;
            }}
          >
            <span class="icon-wrap">
              <AnimalIcon animalId={a.id} size={46} />
            </span>
            <span class="label">{a.name}</span>
            {#if animal === a.id}
              <span class="check" aria-hidden="true">✓</span>
            {/if}
          </button>
        {/each}
      </div>
      {#if animal == null}
        <p class="hint">Touchez un animal pour le choisir</p>
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

  .animals {
    border: none;
    margin: 0;
    padding: 0;
  }

  .animals legend {
    font-weight: 600;
    color: #3d4450;
    margin-bottom: 0.65rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.55rem;
  }

  .pick {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    padding: 0.55rem 0.35rem 0.45rem;
    border-radius: 14px;
    border: 3px solid transparent;
    background: #f4f6f9;
    cursor: pointer;
    position: relative;
    transition: transform 0.12s, border-color 0.12s, opacity 0.12s;
  }

  .icon-wrap {
    display: grid;
    place-items: center;
    width: 3.35rem;
    height: 3.35rem;
    border-radius: 50%;
    background: var(--ring, #ccc);
    padding: 0.22rem;
    box-shadow: inset 0 0 0 2px rgb(255 255 255 / 35%);
  }

  .icon-wrap :global(.animal-icon) {
    background: #fff;
    border-radius: 50%;
  }

  .pick:not(:disabled):active {
    transform: scale(0.96);
  }

  .pick.selected {
    border-color: var(--ring, #1a1a2e);
    background: #fff;
    transform: scale(1.02);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--ring, #1a1a2e) 35%, transparent);
  }

  .pick.taken {
    opacity: 0.35;
    cursor: not-allowed;
    filter: grayscale(0.5);
  }

  .label {
    font-size: 0.72rem;
    font-weight: 700;
    color: #3d4450;
    text-align: center;
    line-height: 1.15;
  }

  .check {
    position: absolute;
    top: 0.35rem;
    right: 0.35rem;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
    background: #1a1a2e;
    color: white;
    font-size: 0.75rem;
    font-weight: 900;
    display: grid;
    place-items: center;
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

  @media (max-width: 380px) {
    .grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
