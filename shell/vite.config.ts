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
      workbox: {
        // Заранее кэшируем только лёгкое (оболочка, 2D-игры, обложки). Тяжёлые 3D-куски (Rapier ~2,4 МБ)
        // кэшируются при первом запуске игры (runtimeCaching ниже), а не качаются всем при первом визите.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,png,webp,ico,wasm}'],
        globIgnores: ['**/react-three-rapier*.js', '**/three.module*.js', '**/*-cover-*.png'],
        // /api — всегда сервер: без этого навигация на /api/parent/export получила бы index.html из кэша.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/assets/'),
            handler: 'CacheFirst',
            options: { cacheName: 'ig-assets', expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 60 } },
          },
        ],
      },
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
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Папка с играми. Оболочка обращается к ней только через import.meta.glob в src/catalog.
      '@games': fileURLToPath(new URL('../games', import.meta.url)),
    },
  },
  build: { chunkSizeWarningLimit: 4000 },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3000' },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
