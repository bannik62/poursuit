<script>
  let { title = 'Oups', message, actionLabel = '', onaction } = $props();
</script>

<div class="screen">
  <div class="card">
    <div class="icon">!</div>
    <h1>{title}</h1>
    <p>{message}</p>
    {#if actionLabel && onaction}
      <button class="primary" onclick={onaction}>{actionLabel}</button>
    {/if}
  </div>
</div>

<style>
  .screen {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 1.5rem;
  }

  .card {
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 8px 32px rgb(26 26 46 / 8%);
    text-align: center;
    max-width: 22rem;
  }

  .icon {
    width: 3rem;
    height: 3rem;
    margin: 0 auto 1rem;
    border-radius: 50%;
    background: #fdecea;
    color: #e74c3c;
    display: grid;
    place-items: center;
    font-size: 1.5rem;
    font-weight: 800;
  }

  h1 {
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
  }

  p {
    margin: 0 0 1rem;
    color: #5a6270;
    line-height: 1.5;
  }

  .primary {
    width: 100%;
    padding: 0.875rem;
    background: #3498db;
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 700;
  }
</style>
