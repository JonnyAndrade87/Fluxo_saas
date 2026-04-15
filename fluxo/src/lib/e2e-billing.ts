import type {
  OnboardingTier,
  SubscriptionStatus,
  SupportLevel,
  TenantPlan,
} from '@prisma/client';

export const E2E_BILLING_SCENARIO_COOKIE = 'fluxeer_e2e_billing_scenario';

export type BillingE2EScenario = 'trialing' | 'active' | 'past_due';

type CookieStoreLike = {
  get(name: string): { value: string } | undefined;
};

type BillingFixture = {
  tenantName: string;
  sessionUser: {
    id: string;
    name: string;
    email: string;
    tenantId: string;
    role: 'admin';
    isSuperAdmin: false;
    mfaEnabled: false;
  };
  billing: {
    plan: TenantPlan;
    subscriptionStatus: SubscriptionStatus;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    maxUsers: number;
    maxCustomers: number;
    maxInvoices: number;
    supportLevel: SupportLevel;
    onboardingTier: OnboardingTier;
    usage: {
      users: number;
      customers: number;
      invoices: number;
    };
  };
};

const BILLING_FIXTURES: Record<BillingE2EScenario, BillingFixture> = {
  trialing: {
    tenantName: 'Fluxeer Trial Lab',
    sessionUser: {
      id: 'e2e-user-trialing',
      name: 'Billing Trial Admin',
      email: 'trialing@fluxeer.test',
      tenantId: 'e2e-tenant-trialing',
      role: 'admin',
      isSuperAdmin: false,
      mfaEnabled: false,
    },
    billing: {
      plan: 'starter',
      subscriptionStatus: 'trialing',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      maxUsers: 1,
      maxCustomers: 300,
      maxInvoices: 1000,
      supportLevel: 'standard',
      onboardingTier: 'basic',
      usage: {
        users: 1,
        customers: 42,
        invoices: 120,
      },
    },
  },
  active: {
    tenantName: 'Fluxeer Pro Ops',
    sessionUser: {
      id: 'e2e-user-active',
      name: 'Billing Active Admin',
      email: 'active@fluxeer.test',
      tenantId: 'e2e-tenant-active',
      role: 'admin',
      isSuperAdmin: false,
      mfaEnabled: false,
    },
    billing: {
      plan: 'pro',
      subscriptionStatus: 'active',
      stripeCustomerId: 'cus_e2e_active',
      stripeSubscriptionId: 'sub_e2e_active',
      maxUsers: 3,
      maxCustomers: 2000,
      maxInvoices: 10000,
      supportLevel: 'priority',
      onboardingTier: 'assisted',
      usage: {
        users: 2,
        customers: 180,
        invoices: 960,
      },
    },
  },
  past_due: {
    tenantName: 'Fluxeer Scale Finance',
    sessionUser: {
      id: 'e2e-user-past-due',
      name: 'Billing Past Due Admin',
      email: 'pastdue@fluxeer.test',
      tenantId: 'e2e-tenant-past-due',
      role: 'admin',
      isSuperAdmin: false,
      mfaEnabled: false,
    },
    billing: {
      plan: 'scale',
      subscriptionStatus: 'past_due',
      stripeCustomerId: 'cus_e2e_past_due',
      stripeSubscriptionId: 'sub_e2e_past_due',
      maxUsers: 10,
      maxCustomers: 20000,
      maxInvoices: 100000,
      supportLevel: 'vip',
      onboardingTier: 'concierge',
      usage: {
        users: 7,
        customers: 4120,
        invoices: 18540,
      },
    },
  },
};

export function isBillingE2EModeEnabled(): boolean {
  return process.env.E2E_BILLING_MOCKS === '1';
}

export function parseBillingE2EScenario(value: string | null | undefined): BillingE2EScenario | null {
  if (!value) {
    return null;
  }

  return value in BILLING_FIXTURES ? (value as BillingE2EScenario) : null;
}

export function getBillingE2EScenario(cookieStore: CookieStoreLike): BillingE2EScenario | null {
  return parseBillingE2EScenario(cookieStore.get(E2E_BILLING_SCENARIO_COOKIE)?.value);
}

export function getBillingE2EFixture(cookieStore: CookieStoreLike): BillingFixture | null {
  if (!isBillingE2EModeEnabled()) {
    return null;
  }

  const scenario = getBillingE2EScenario(cookieStore);
  if (!scenario) {
    return null;
  }

  return BILLING_FIXTURES[scenario];
}
