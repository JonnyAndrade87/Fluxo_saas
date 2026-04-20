import { defineConfig, devices } from '@playwright/test';

const PORT = 3007;
const baseURL = `http://localhost:${PORT}`;

const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL || process.env.DIRECT_URL || process.env.DATABASE_URL;

// AUTH_SECRET is the canonical env; NEXTAUTH_SECRET stays as temporary fallback.
const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

export default defineConfig({
  testDir: './e2e',

  // Global setup: garante usuário/tenant E2E no banco antes dos testes
  globalSetup: './e2e/global-setup.ts',

  timeout: 45_000,
  expect: {
    timeout: 12_000,
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
    timeout: 120_000,
    env: {
      // Reaproveita os segredos já definidos no ambiente local/CI
      AUTH_SECRET: AUTH_SECRET ?? '',

      // Banco — Supabase Session Pooler (IPv4 compatível)
      DATABASE_URL: E2E_DATABASE_URL ?? '',
      DIRECT_URL: E2E_DATABASE_URL ?? '',

      // URL base para Auth.js construir callbacks corretamente
      NEXTAUTH_URL: baseURL,
      NEXT_PUBLIC_APP_URL: baseURL,

      // Ativa os fixtures de billing E2E na página /planos
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
