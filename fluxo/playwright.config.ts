import { defineConfig, devices } from '@playwright/test';

const PORT = 3007;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npx next dev --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    env: {
      AUTH_SECRET: 'e2e-auth-secret',
      DATABASE_URL: 'postgresql://fluxeer:fluxeer@127.0.0.1:5432/fluxeer_e2e',
      NEXT_PUBLIC_APP_URL: baseURL,
      E2E_BILLING_MOCKS: '1',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
