<script>
  import { SERIES, playerColorHex } from '../lib/board.js';
  import AnimalIcon from './AnimalIcon.svelte';

  let { session } = $props();

  const players = $derived(session?.players ?? []);
  const current = $derived(session?.currentPlayer ?? 0);
  const currentName = $derived(players[current]?.name ?? '…');

  function pawnRingColor(p) {
    if (p.color != null) return playerColorHex(p.color);
    if (p.animal != null) return playerColorHex(p.animal % 6);
    return '#888';
  }
</script>

<aside class="hud">
  <div class="turn">
    <span class="label">Tour de</span>
    <strong class="name">{currentName}</strong>
  </div>

  <ul class="scores">
    {#each players as p (p.slot)}
      {#if p.connected}
        <li class:active={p.slot === current}>
          {#if p.animal != null}
            <span class="icon-wrap" style:--ring={pawnRingColor(p)}>
              <AnimalIcon animalId={p.animal} size={22} />
            </span>
          {:else}
            <span class="pawn-dot fallback"></span>
          {/if}
          <span class="pname">{p.name}</span>
          <span class="wedges">
            {#each SERIES as s, i}
              <span
                class="wedge"
                style:background={s.color}
                class:earned={p.wedges?.[i]}
              ></span>
            {/each}
          </span>
        </li>
      {/if}
    {/each}
  </ul>
</aside>

<style>
  .hud {
    background: color-mix(in srgb, var(--surface) 85%, transparent);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 1rem 1.25rem;
    width: min(400px, 34vw);
    min-width: 320px;
    flex-shrink: 0;
    backdrop-filter: blur(10px);
    box-shadow: 0 12px 32px rgb(0 0 0 / 30%);
  }

  .turn {
    margin-bottom: 0.75rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
  }

  .label {
    display: block;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
    margin-bottom: 0.25rem;
  }

  .name {
    font-size: 2rem;
    font-weight: 800;
    color: var(--gold);
  }

  .scores {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.55rem 0.85rem;
    border-radius: 10px;
    background: color-mix(in srgb, var(--bg) 45%, transparent);
    border: 1px solid transparent;
  }

  li.active {
    background: color-mix(in srgb, var(--accent) 18%, var(--surface));
    border-color: color-mix(in srgb, var(--accent) 45%, transparent);
    outline: none;
  }

  .pawn-dot.fallback {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--muted);
  }

  .icon-wrap {
    display: grid;
    place-items: center;
    width: 1.65rem;
    height: 1.65rem;
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--ring, #888);
    padding: 0.12rem;
  }

  .icon-wrap :global(.animal-icon) {
    background: #fff;
    border-radius: 50%;
  }

  .pawn-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .pname {
    flex: 1;
    font-weight: 700;
    font-size: 1.1rem;
  }

  .wedges {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    margin-left: auto;
  }

  .wedge {
    opacity: 0.2;
  }

  .wedge.earned {
    opacity: 1;
  }
</style>
