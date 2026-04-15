import type { TenantPlan } from '@prisma/client';

import prisma from '@/lib/prisma';

export type TenantLimitedResource = 'users' | 'customers' | 'invoices';

type ResourceUsage = Record<TenantLimitedResource, number>;
const ALL_LIMITED_RESOURCES: TenantLimitedResource[] = ['users', 'customers', 'invoices'];

export type TenantLimitGuard = Awaited<ReturnType<typeof createTenantLimitGuard>>;

const RESOURCE_LABELS = {
  users: { singular: 'usuário na equipe', plural: 'usuários na equipe' },
  customers: { singular: 'cliente', plural: 'clientes' },
  invoices: { singular: 'fatura', plural: 'faturas' },
} as const;

function getResourceLabel(resource: TenantLimitedResource, value: number): string {
  const labels = RESOURCE_LABELS[resource];
  return value === 1 ? labels.singular : labels.plural;
}

function buildLimitExceededMessage(
  resource: TenantLimitedResource,
  plan: TenantPlan,
  limit: number,
): string {
  return `Limite do plano atingido: seu plano ${plan} permite até ${limit} ${getResourceLabel(resource, limit)}. Ajuste o plano ou reduza o volume atual para continuar.`;
}

export class BillingLimitExceededError extends Error {
  readonly name = 'BillingLimitExceededError';
  readonly code = 'BILLING_LIMIT_EXCEEDED';

  constructor(
    readonly resource: TenantLimitedResource,
    readonly plan: TenantPlan,
    readonly limit: number,
    readonly current: number,
  ) {
    super(buildLimitExceededMessage(resource, plan, limit));
    Object.setPrototypeOf(this, BillingLimitExceededError.prototype);
  }
}

export function isBillingLimitExceededError(error: unknown): error is BillingLimitExceededError {
  return error instanceof BillingLimitExceededError;
}

function assertWithinLimit(
  resource: TenantLimitedResource,
  plan: TenantPlan,
  usage: ResourceUsage,
  limits: ResourceUsage,
): void {
  if (usage[resource] >= limits[resource]) {
    throw new BillingLimitExceededError(resource, plan, limits[resource], usage[resource]);
  }
}

export async function createTenantLimitGuard(
  tenantId: string,
  resources: TenantLimitedResource[] = ALL_LIMITED_RESOURCES,
) {
  const resourceSet = new Set(resources);

  const [tenant, users, customers, invoices] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        plan: true,
        maxUsers: true,
        maxCustomers: true,
        maxInvoices: true,
      },
    }),
    resourceSet.has('users') ? prisma.tenantUser.count({ where: { tenantId } }) : Promise.resolve(0),
    resourceSet.has('customers') ? prisma.customer.count({ where: { tenantId } }) : Promise.resolve(0),
    resourceSet.has('invoices') ? prisma.invoice.count({ where: { tenantId } }) : Promise.resolve(0),
  ]);

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const usage: ResourceUsage = {
    users,
    customers,
    invoices,
  };

  const limits: ResourceUsage = {
    users: tenant.maxUsers,
    customers: tenant.maxCustomers,
    invoices: tenant.maxInvoices,
  };

  function ensureResourceLoaded(resource: TenantLimitedResource): void {
    if (!resourceSet.has(resource)) {
      throw new Error(`Limit resource '${resource}' was not loaded for this guard.`);
    }
  }

  return {
    tenant,
    usage,
    limits,
    assertCanCreateUser() {
      ensureResourceLoaded('users');
      assertWithinLimit('users', tenant.plan, usage, limits);
    },
    assertCanCreateCustomer() {
      ensureResourceLoaded('customers');
      assertWithinLimit('customers', tenant.plan, usage, limits);
    },
    assertCanCreateInvoice() {
      ensureResourceLoaded('invoices');
      assertWithinLimit('invoices', tenant.plan, usage, limits);
    },
    registerCreatedUser() {
      ensureResourceLoaded('users');
      usage.users += 1;
    },
    registerCreatedCustomer() {
      ensureResourceLoaded('customers');
      usage.customers += 1;
    },
    registerCreatedInvoice() {
      ensureResourceLoaded('invoices');
      usage.invoices += 1;
    },
  };
}
