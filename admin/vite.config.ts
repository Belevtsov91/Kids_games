import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Админка владельца: отдельный сайт. В разработке /api уходит на локальный бэкенд (порт 3000)
// или на заглушку с выдуманными данными (npm run dev:mock, порт 3999, MOCK=1 npm run dev).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: { '/api': { target: process.env.MOCK ? 'http://localhost:3999' : 'http://localhost:3000', changeOrigin: false } },
  },
  build: { sourcemap: false },
});
