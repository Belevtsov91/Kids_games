import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      // Rapier встраивает wasm в JS (~3 МБ); поднимаем лимит, чтобы 3D работало офлайн.
      workbox: { maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 },
      manifest: {
        name: 'Interact Games',
        short_name: 'Games',
        description: 'Игры для детей',
        theme_color: '#ffcc33',
        background_color: '#fff8e7',
        display: 'fullscreen',
        orientation: 'any',
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: { chunkSizeWarningLimit: 4000 },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3000' },
  },
});
