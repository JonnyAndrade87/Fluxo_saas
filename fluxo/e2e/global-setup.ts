/**
 * E2E Global Setup — Fluxeer
 *
 * Responsabilidade: garantir que o usuário/tenant E2E existe no banco antes
 * de qualquer teste ser executado. O usuário usa role `operator` para escapar
 * do MFA gate do middleware (que só intercepta role `admin`).
 *
 * O setup é idempotente: usa ON CONFLICT DO NOTHING / upsert.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// ── Constantes E2E ────────────────────────────────────────────────────────────
export const E2E_USER_EMAIL    = 'e2etest@fluxeer.test';
export const E2E_USER_PASSWORD = 'E2eTest@2026';

// IDs fixos garantem idempotência entre runs
const E2E_TENANT_ID = 'e2e-tenant-00000000-0000-0000-0000-000000000001';
const E2E_USER_ID   = 'e2e-user-00000000-0000-0000-0000-000000000001';

export default async function globalSetup() {
  const prisma = new PrismaClient();

  try {
    const passwordHash = await bcrypt.hash(E2E_USER_PASSWORD, 10);

    // 1. Garantir Tenant E2E
    const tenant = await prisma.tenant.upsert({
      where: { id: E2E_TENANT_ID },
      create: {
        id: E2E_TENANT_ID,
        name: 'E2E Test Corp',
        documentNumber: 'E2E-TEST-CNPJ',
        plan: 'starter',
        subscriptionStatus: 'trialing',
        maxUsers: 5,
        maxCustomers: 300,
        maxInvoices: 1000,
        supportLevel: 'standard',
        onboardingTier: 'basic',
      },
      update: {},
      select: { id: true },
    });

    // 2. Garantir Usuário E2E
    // emailVerified=true, isActive=true, mfaEnabled=false => auth gate passa
    const user = await prisma.user.upsert({
      where: { email: E2E_USER_EMAIL },
      create: {
        id: E2E_USER_ID,
        email: E2E_USER_EMAIL,
        fullName: 'E2E Test Admin',
        password: passwordHash,
        emailVerified: true,
        isActive: true,
        mfaEnabled: false,
      },
      update: {
        password: passwordHash,
        emailVerified: true,
        isActive: true,
        mfaEnabled: false,
      },
      select: { id: true },
    });

    // 3. Garantir vínculo TenantUser com role admin (planos/page.tsx exige isAdmin)
    // Usa os IDs reais retornados pelo upsert (pode diferir dos IDs fixos se
    // o usuário já existia com outro ID criado manualmente no banco).
    await prisma.tenantUser.createMany({
      data: [{
        tenantId: tenant.id,
        userId: user.id,
        role: 'admin',
      }],
      skipDuplicates: true,
    });

    // 4. Garantir que a tabela rate_limits existe e limpar entradas E2E antigas
    // (evita que rate limit bloqueie o login do E2E após muitas execuções)
    await prisma.rateLimit.deleteMany({
      where: { key: { startsWith: 'login:' } },
    });

    console.log('[E2E] Global setup: usuário/tenant E2E prontos.');
  } finally {
    await prisma.$disconnect();
  }
}
