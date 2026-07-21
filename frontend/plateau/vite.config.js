import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const sharedGame = [path.resolve(dir, 'shared/game'), path.resolve(dir, '../../shared/game')].find(
  (p) => existsSync(p),
);

export default defineConfig({
  plugins: [svelte()],
  base: '/plateau/',
  resolve: {
    alias: {
      '@trivial-asso/game': sharedGame,
    },
  },
  server: {
    host: true,
    port: 5174,
    proxy: {
      '/api': 'http://localhost:3000',
      '/socket.io': { target: 'http://localhost:3000', ws: true },
    },
  },
});
