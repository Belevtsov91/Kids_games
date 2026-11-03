import { defineConfig, devices } from '@playwright/test';

const externalServer = process.env.PLAYWRIGHT_BASE_URL;

// E2E оболочки: меню → игра → выход. Сервер API не нужен, только Vite.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: externalServer ?? 'http://localhost:5174',
    channel: process.env.PLAYWRIGHT_CHANNEL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: externalServer ? undefined : {
    command: 'corepack pnpm exec vite --port 5174 --strictPort',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
