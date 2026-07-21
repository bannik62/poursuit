<script>
  import { SERIES, PAWN_COLORS, playerColorHex } from '../lib/board.js';

  let { session } = $props();

  const players = $derived(session?.players ?? []);
  const current = $derived(session?.currentPlayer ?? 0);
  const currentName = $derived(players[current]?.name ?? '…');

  function pawnColor(p) {
    if (p.color != null) return playerColorHex(p.color);
    return PAWN_COLORS[p.slot % PAWN_COLORS.length];
  }</script>

<aside class="hud">
  <div class="turn">
    <span class="label">Tour de</span>
    <strong class="name">{currentName}</strong>
  </div>

  <ul class="scores">
    {#each players as p (p.slot)}
      {#if p.connected}
        <li class:active={p.slot === current}>
          <span
            class="pawn-dot"
            style:background={pawnColor(p)}
          ></span>
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
    background: rgb(0 0 0 / 35%);
    border-radius: 16px;
    padding: 1.25rem 1.5rem;
    min-width: 280px;
    backdrop-filter: blur(8px);
  }

  .turn {
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgb(255 255 255 / 15%);
  }

  .label {
    display: block;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    opacity: 0.65;
    margin-bottom: 0.25rem;
  }

  .name {
    font-size: 2rem;
    font-weight: 800;
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
    gap: 0.65rem;
    padding: 0.5rem 0.65rem;
    border-radius: 10px;
    background: rgb(255 255 255 / 6%);
  }

  li.active {
    background: rgb(255 255 255 / 14%);
    outline: 2px solid rgb(255 255 255 / 35%);
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
    width: 28px;
    height: 28px;
    border-radius: 50%;
    overflow: hidden;
  }

  .wedge {
    opacity: 0.2;
  }

  .wedge.earned {
    opacity: 1;
  }
</style>
