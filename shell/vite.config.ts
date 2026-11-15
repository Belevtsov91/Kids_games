import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { shellPrecache } from './precache.ts';

/** Адрес сайта для превью ссылок (Open Graph любит абсолютные ссылки): VITE_SITE_URL, иначе относительные. */
function siteUrl(mode: string): Plugin {
  const url = (loadEnv(mode, process.cwd(), 'VITE_').VITE_SITE_URL ?? '').replace(/\/$/, '');
  return { name: 'site-url', transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', url) };
}

export default defineConfig(({ mode }) => {
  const precache = shellPrecache();
  return {
  plugins: [
    siteUrl(mode),
    react(),
    precache.plugin,
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      workbox: {
        // Заранее кэшируем только оболочку (см. precache.ts): с 30 играми полный precache весил ~22 МБ.
        // Код и картинки игр кэшируются при первом запуске игры (runtimeCaching ниже).
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,png,webp,ico,wasm}'],
        manifestTransforms: [precache.transform],
        // /api — всегда сервер: без этого навигация на /api/parent/export получила бы index.html из кэша.
        navigateFallbackDenylist: [/^\/api\//],
        // Push-уведомления взрослому (просьбы о времени): обработчики push и нажатий — в public/push-sw.js.
        importScripts: ['push-sw.js'],
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
  };
});
