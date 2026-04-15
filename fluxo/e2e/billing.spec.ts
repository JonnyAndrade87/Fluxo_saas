import type { Page } from '@playwright/test';
import { test, expect } from '@playwright/test';

import { E2E_BILLING_SCENARIO_COOKIE, type BillingE2EScenario } from '../src/lib/e2e-billing';

async function openBillingScenario(page: Page, scenario: BillingE2EScenario) {
  await page.context().addCookies([
    {
      name: E2E_BILLING_SCENARIO_COOKIE,
      value: scenario,
      url: 'http://localhost:3007',
    },
  ]);

  await page.goto('/configuracoes');
  await expect(page.getByRole('heading', { name: 'Plano e Billing' })).toBeVisible();
  await expect(page.locator('#billing')).toBeVisible();
}

test.describe('Billing area', () => {
  test('trialing shows current plan, usage, and checkout CTA', async ({ page }) => {
    await openBillingScenario(page, 'trialing');

    await expect(page.locator('#billing').getByRole('heading', { name: 'Starter' })).toBeVisible();
    await expect(page.getByText('Em trial')).toBeVisible();
    await expect(page.getByText('1/1')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Assinar Starter' })).toBeVisible();

    await page.getByRole('button', { name: 'Assinar Starter' }).click();
    await expect(page).toHaveURL(/billing=mock-checkout-starter/);
  });

  test('active prioritizes the customer portal', async ({ page }) => {
    await openBillingScenario(page, 'active');

    await expect(page.locator('#billing').getByRole('heading', { name: 'Pro' })).toBeVisible();
    await expect(page.locator('#billing').getByText('Ativa', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Gerenciar assinatura' })).toBeVisible();

    await page.getByRole('button', { name: 'Gerenciar assinatura' }).click();
    await expect(page).toHaveURL(/billing=mock-portal/);
  });

  test('past_due highlights the pending payment state and regularization CTA', async ({ page }) => {
    await openBillingScenario(page, 'past_due');

    await expect(page.locator('#billing').getByRole('heading', { name: 'Scale' })).toBeVisible();
    await expect(page.getByText('Em atraso')).toBeVisible();
    await expect(
      page.getByText('Há cobrança pendente. Abra o portal Stripe para atualizar o pagamento e evitar impacto operacional.'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Regularizar pagamento' })).toBeVisible();

    await page.getByRole('button', { name: 'Regularizar pagamento' }).click();
    await expect(page).toHaveURL(/billing=mock-portal/);
  });
});
