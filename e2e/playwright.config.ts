import { defineConfig, devices } from '@playwright/test';

// E2E_BASE_URL: target environment. Default is local dev; NEVER point the
// mutating buyer-journey spec at production without RUN_BUYER_JOURNEY=1.
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:4200';
const apiBaseURL = process.env.E2E_API_URL || `${baseURL}/api`;

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});

export { baseURL, apiBaseURL };
