import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  timeout: 90000,
  use: { baseURL: 'http://localhost:5187' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'node shell/node_modules/vite/bin/vite.js shell --host 127.0.0.1 --port 5187 --strictPort',
    cwd: '../..',
    url: 'http://localhost:5187',
    reuseExistingServer: true,
  },
});
