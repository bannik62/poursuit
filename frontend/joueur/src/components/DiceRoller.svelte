<script>
  import { onMount, onDestroy, tick } from 'svelte';

  let { onready, onerror } = $props();

  let mountEl = $state(null);
  let diceBox = null;
  let ready = $state(false);
  let rolling = $state(false);
  let loadError = $state('');
  let resizeObserver = null;
  let mountId = `dice-mount-${Math.random().toString(36).slice(2, 9)}`;

  function syncSize() {
    if (!diceBox?.initialized || !mountEl) return;
    diceBox.setDimensions?.();
  }

  onMount(async () => {
    await tick();

    try {
      const DiceBox = (await import('@3d-dice/dice-box-threejs')).default;
      diceBox = new DiceBox(`#${mountId}`, {
        assetPath: import.meta.env.BASE_URL,
        sounds: true,
        volume: 70,
        sound_dieMaterial: 'plastic',
        shadows: false,
        theme_material: 'plastic',
        theme_colorset: 'white',
        theme_surface: 'green-felt',
        strength: 0.55,
        baseScale: 55,
        gravity_multiplier: 380,
      });

      const initTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), 15000);
      });

      await Promise.race([diceBox.initialize(), initTimeout]);
      await tick();
      syncSize();

      if (mountEl) {
        resizeObserver = new ResizeObserver(() => syncSize());
        resizeObserver.observe(mountEl);
      }

      ready = true;
      loadError = '';
      onready?.();
    } catch (err) {
      console.error('DiceBox init failed', err);
      loadError = 'Dé 3D indisponible — le résultat s’affichera quand même.';
      onerror?.(err);
    }
  });

  onDestroy(() => {
    resizeObserver?.disconnect();
    diceBox = null;
  });

  /** Animation synchronisée avec le résultat serveur (notation @). */
  export async function animate(serverValue) {
    const value = Math.min(6, Math.max(1, Number(serverValue) || 1));
    if (!diceBox?.initialized || !ready) return value;

    syncSize();
    rolling = true;
    try {
      await diceBox.roll(`1d6@${value}`);
    } catch (err) {
      console.warn('Dice animation failed', err);
    } finally {
      rolling = false;
    }
    return value;
  }

  export function isReady() {
    return ready;
  }
</script>

<div class="dice-stage" class:rolling>
  <div bind:this={mountEl} class="dice-mount" id={mountId}></div>
  {#if !ready && !loadError}
    <p class="dice-overlay">Chargement du dé 3D…</p>
  {:else if loadError}
    <p class="dice-overlay dice-fallback">{loadError}</p>
  {/if}
</div>

<style>
  .dice-stage {
    position: relative;
    width: 100%;
    height: clamp(200px, 32vh, 280px);
    border-radius: 16px;
    overflow: hidden;
    contain: strict;
    isolation: isolate;
    background: linear-gradient(180deg, #1a2a3a 0%, #0d1520 100%);
  }

  .dice-mount {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .dice-mount :global(canvas) {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    display: block !important;
    touch-action: none;
  }

  .dice-overlay {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 0 1rem;
    text-align: center;
    color: rgb(255 255 255 / 75%);
    font-size: 0.9rem;
    font-weight: 600;
    pointer-events: none;
    background: rgb(13 21 32 / 55%);
  }

  .dice-fallback {
    color: rgb(255 255 255 / 55%);
    font-size: 0.85rem;
  }

  .dice-stage.rolling {
    outline: 2px solid #f1c40f;
  }
</style>
