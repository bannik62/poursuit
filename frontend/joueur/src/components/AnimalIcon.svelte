<script>
  import { pawnSpriteShapes } from '@trivial-asso/game/pawnSprites.js';

  let { animalId = 0, size = 36 } = $props();

  const shapes = $derived(pawnSpriteShapes(animalId));
</script>

<svg
  class="animal-icon"
  width={size}
  height={size}
  viewBox="0 0 36 36"
  aria-hidden="true"
>
  {#each shapes as shape, i (i)}
    <svelte:element this={shape.tag} {...shape.attrs} />
  {/each}
</svg>

<style>
  .animal-icon {
    display: block;
    flex-shrink: 0;
  }
</style>
