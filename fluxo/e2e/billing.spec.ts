/**
 * E2E · Billing Area (Planos)
 *
 * Estratégia de autenticação:
 * 1. Login real via POST para o endpoint de credentials do NextAuth.
 * 2. Após login, o middleware verifica `mfa_verified` cookie para admins.
 *    Como `mfaEnabled=false`, o middleware redireciona para `/mfa-setup`.
 *    Portanto, injetamos manualmente `mfa_verified=1` no contexto do browser
 *    APÓS o login — isso é seguro porque simula o que o usuário real faria
 *    (configurar MFA uma vez). Não afeta produção pois não há bypass aberto:
 *    o cookie só existe no contexto do browser de teste em memória.
 * 3. E2E_BILLING_MOCKS=1 faz a página /planos usar fixtures de billing
 *    via cookie `fluxeer_e2e_billing_scenario`, isolando o DB Stripe.
 *
 * Causa raiz dos erros anteriores:
 * - DATABASE_URL apontava para Railway (inválida)
 * - Usuário `e2etest@fluxeer.test` não existia no banco
 * - MFA gate bloqueava admin sem cookie `mfa_verified`
 * - Rate limit podia travar login entre runs
 * - Todos os 3 testes faziam login sem definir o cenário de billing
 */

import type { Page } from '@playwright/test';
import { test, expect } from '@playwright/test';
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from './global-setup';

const E2E_BILLING_COOKIE = 'fluxeer_e2e_billing_scenario';

/**
 * Executa o login real via credentials e injeta o cookie mfa_verified,
 * necessário para que o middleware não redirecione admins para /mfa-setup.
 */
async function loginAndBypassMfa(page: Page, baseURL: string) {
  // 1. Ir para a página de login
  await page.goto(`${baseURL}/login`);
  await page.waitForLoadState('networkidle');

  // 2. Preencher credenciais e submeter
  await page.fill('input[name="email"]', E2E_USER_EMAIL);
  await page.fill('input[name="password"]', E2E_USER_PASSWORD);
  await page.click('button[type="submit"]');

  // 3. Aguardar a resposta do servidor (redirect ou mfa-setup)
  await page.waitForURL(
    (url) => !url.pathname.includes('/login'),
    { timeout: 15_000 }
  );

  // 4. Injetar cookie mfa_verified — simula admin que já configurou MFA
  //    Necessário porque mfaEnabled=false também aciona o gate de /mfa-setup
  //    (regra de negócio: todo admin DEVE configurar MFA primeiro)
  await page.context().addCookies([{
    name: 'mfa_verified',
    value: '1',
    domain: 'localhost',
    path: '/',
    secure: false,
    httpOnly: false,
    sameSite: 'Lax',
  }]);

  const finalUrl = page.url();
  console.log('[E2E] URL após login + mfa cookie:', finalUrl);
}

/**
 * Define o cenário de billing E2E via cookie e navega para /planos.
 */
async function goToBillingScenario(
  page: Page,
  baseURL: string,
  scenario: 'trialing' | 'active' | 'past_due'
) {
  // Definir o cenário de billing antes de navegar
  await page.context().addCookies([{
    name: E2E_BILLING_COOKIE,
    value: scenario,
    domain: 'localhost',
    path: '/',
    secure: false,
    httpOnly: false,
    sameSite: 'Lax',
  }]);

  await page.goto(`${baseURL}/planos`);
  await page.waitForLoadState('networkidle');

  const currentUrl = page.url();
  console.log(`[E2E] Billing (${scenario}) URL:`, currentUrl);

  // Verificar que não fomos redirecionados para fora do /planos
  expect(currentUrl).toContain('/planos');
}

// ── Testes ────────────────────────────────────────────────────────────────────

test.describe('Billing area — /planos', () => {
  // Estado isolado por describe: cada test retoma a mesma sessão autenticada
  test.use({ storageState: undefined });

  test.beforeEach(async ({ page, baseURL }) => {
    // Login + cookie MFA uma vez por teste (stateless)
    await loginAndBypassMfa(page, baseURL!);
  });

  test('trialing: mostra plano atual e CTA de assinar', async ({ page, baseURL }) => {
    await goToBillingScenario(page, baseURL!, 'trialing');

    // Badge no header: "Plano atual: Starter · Trial"
    await expect(page.getByText(/Plano atual: Starter/)).toBeVisible({ timeout: 10_000 });
    // No cenário trialing (starter), os cards de Pro e Scale mostram "Assinar Pro" / "Assinar Scale"
    await expect(page.locator('#pro-card').getByRole('button', { name: /Assinar/ })).toBeVisible({ timeout: 10_000 });
  });

  test('active: prioriza o portal do cliente com botão Gerenciar', async ({ page, baseURL }) => {
    await goToBillingScenario(page, baseURL!, 'active');

    // Badge no header: "Plano atual: Pro · Ativo"
    await expect(page.getByText(/Plano atual: Pro/)).toBeVisible({ timeout: 10_000 });
    // active com stripeCustomerId = true → hasPortalAccess = true
    // O header mostra o botão de portal "Gerenciar cobrança"
    await expect(page.getByRole('button', { name: 'Gerenciar cobrança' }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('past_due: destaca status de pagamento pendente', async ({ page, baseURL }) => {
    await goToBillingScenario(page, baseURL!, 'past_due');

    // Badge no header: "Plano atual: Scale · Pagamento pendente"
    await expect(page.getByText(/Plano atual: Scale/)).toBeVisible({ timeout: 10_000 });
    // Status "Pagamento pendente" visível no badge
    await expect(page.getByText(/Pagamento pendente/)).toBeVisible({ timeout: 10_000 });
    // past_due com stripeCustomerId → hasPortalAccess = true → botão de portal disponível
    await expect(page.getByRole('button', { name: 'Gerenciar cobrança' }).first()).toBeVisible({ timeout: 10_000 });
  });
});
