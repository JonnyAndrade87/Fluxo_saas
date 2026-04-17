import { defineConfig, devices } from '@playwright/test';

const PORT = 3007;
const baseURL = `http://localhost:${PORT}`;

/**
 * String de conexão do Supabase via Session Pooler (IPv4).
 * Usa a DIRECT_URL para o servidor de dev E2E pois não há pooler local.
 * IMPORTANTE: nunca commitar credenciais reais — use env var em CI.
 */
const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ||
  'postgresql://postgres.hgvdegznbcrtqouicdib:%40Joaquimlucca09@aws-1-us-east-2.pooler.supabase.com:5432/postgres';

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
      // Segredo JWT — deve ser idêntico ao que o servidor usará para assinar tokens
      AUTH_SECRET: process.env.AUTH_SECRET || 'fluxo-super-secret-key-for-jwt-session-encryption-2026',

      // Banco — Supabase Session Pooler (IPv4 compatível)
      DATABASE_URL: E2E_DATABASE_URL,
      DIRECT_URL: E2E_DATABASE_URL,

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
