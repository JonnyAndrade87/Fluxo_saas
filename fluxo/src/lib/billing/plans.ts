import type {
  OnboardingTier,
  SubscriptionStatus,
  SupportLevel,
  TenantPlan,
} from '@prisma/client';

type PlanConfig = {
  maxUsers: number;
  maxCustomers: number;
  maxInvoices: number;
  supportLevel: SupportLevel;
  onboardingTier: OnboardingTier;
};

export const PLAN_CONFIG = {
  starter: {
    maxUsers: 1,
    maxCustomers: 300,
    maxInvoices: 1000,
    supportLevel: 'standard',
    onboardingTier: 'basic',
  },
  pro: {
    maxUsers: 3,
    maxCustomers: 2000,
    maxInvoices: 10000,
    supportLevel: 'priority',
    onboardingTier: 'assisted',
  },
  scale: {
    maxUsers: 10,
    maxCustomers: 20000,
    maxInvoices: 100000,
    supportLevel: 'vip',
    onboardingTier: 'concierge',
  },
} satisfies Record<TenantPlan, PlanConfig>;

export const DEFAULT_TENANT_PLAN: TenantPlan = 'starter';
export const DEFAULT_SUBSCRIPTION_STATUS: SubscriptionStatus = 'trialing';

export function isTenantPlan(value: string): value is TenantPlan {
  return Object.prototype.hasOwnProperty.call(PLAN_CONFIG, value);
}

export type TenantBillingSnapshot = PlanConfig & {
  plan: TenantPlan;
  subscriptionStatus: SubscriptionStatus;
};

export function getTenantPlanSnapshot(
  plan: TenantPlan,
  subscriptionStatus: SubscriptionStatus = DEFAULT_SUBSCRIPTION_STATUS,
): TenantBillingSnapshot {
  const config = PLAN_CONFIG[plan];

  return {
    plan,
    subscriptionStatus,
    maxUsers: config.maxUsers,
    maxCustomers: config.maxCustomers,
    maxInvoices: config.maxInvoices,
    supportLevel: config.supportLevel,
    onboardingTier: config.onboardingTier,
  };
}
