import { auth } from '../../../../auth';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import PlanosClient from './PlanosClient';
import { getBillingE2EFixture } from '@/lib/e2e-billing';

export const metadata = { title: 'Planos e Assinatura — Fluxo' };

type DashboardSessionUser = {
  role?: string | null;
  tenantId?: string | null;
};

export default async function PlanosPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const { billing: billingParam } = await searchParams;
  const cookieStore = await cookies();
  const e2eFixture = getBillingE2EFixture(cookieStore);

  const session = e2eFixture ? { user: e2eFixture.sessionUser } : await auth();
  const sessionUser = session?.user as DashboardSessionUser | undefined;
  const isAdmin = sessionUser?.role === 'admin';
  const tenantId = sessionUser?.tenantId ?? null;

  if (!isAdmin && !e2eFixture) {
    return <div className="p-8 text-slate-500">Acesso restrito a administradores.</div>;
  }

  const tenant = e2eFixture
    ? {
        plan: e2eFixture.billing.plan,
        subscriptionStatus: e2eFixture.billing.subscriptionStatus,
        stripeCustomerId: e2eFixture.billing.stripeCustomerId,
        stripeSubscriptionId: e2eFixture.billing.stripeSubscriptionId,
        maxUsers: e2eFixture.billing.maxUsers,
        maxCustomers: e2eFixture.billing.maxCustomers,
        maxInvoices: e2eFixture.billing.maxInvoices,
        supportLevel: e2eFixture.billing.supportLevel,
        onboardingTier: e2eFixture.billing.onboardingTier,
        _count: {
          users: e2eFixture.billing.usage.users,
          customers: e2eFixture.billing.usage.customers,
          invoices: e2eFixture.billing.usage.invoices,
        }
      }
    : (tenantId
        ? await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
              plan: true,
              subscriptionStatus: true,
              stripeCustomerId: true,
              stripeSubscriptionId: true,
              maxUsers: true,
              maxCustomers: true,
              maxInvoices: true,
              supportLevel: true,
              onboardingTier: true,
              _count: {
                select: { users: true, customers: true, invoices: true },
              },
            },
          }).catch(() => null)
        : null);

  if (!tenant) return null;

  const billing = {
    plan: tenant.plan,
    subscriptionStatus: tenant.subscriptionStatus,
    stripeCustomerId: tenant.stripeCustomerId,
    stripeSubscriptionId: tenant.stripeSubscriptionId,
    maxUsers: tenant.maxUsers,
    maxCustomers: tenant.maxCustomers,
    maxInvoices: tenant.maxInvoices,
    supportLevel: tenant.supportLevel,
    onboardingTier: tenant.onboardingTier,
    usage: {
      users: tenant._count.users,
      customers: tenant._count.customers,
      invoices: tenant._count.invoices,
    },
  };

  return <PlanosClient billing={billing} billingFeedbackParam={billingParam} />;
}

