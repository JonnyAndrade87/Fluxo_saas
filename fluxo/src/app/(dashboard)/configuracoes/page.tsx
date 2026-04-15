import { auth } from '../../../../auth';
import { getTeamMembers } from '@/actions/users';
import prisma from '@/lib/prisma';
import BillingClient from './BillingClient';
import ReguaClient from './ReguaClient';
import TeamClient from './TeamClient';

export const metadata = { title: 'Configurações — Fluxo' };

type DashboardSessionUser = {
  role?: string | null;
  tenantId?: string | null;
};

export default async function ConfiguracoesPage() {
  const session = await auth();
  const sessionUser = session?.user as DashboardSessionUser | undefined;
  const isAdmin = sessionUser?.role === 'admin';
  const tenantId = sessionUser?.tenantId ?? null;

  const [members, tenant] = await Promise.all([
    isAdmin ? getTeamMembers().catch(() => []) : Promise.resolve([]),
    isAdmin && tenantId
      ? prisma.tenant.findUnique({
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
              select: {
                users: true,
                customers: true,
                invoices: true,
              },
            },
          },
        }).catch(() => null)
      : Promise.resolve(null),
  ]);

  const billing = tenant
    ? {
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
      }
    : null;

  return (
    <div className="space-y-0">
      {isAdmin && <BillingClient billing={billing} />}
      {isAdmin && <ReguaClient />}
      {isAdmin && <TeamClient members={members} />}
    </div>
  );
}
