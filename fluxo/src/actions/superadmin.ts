'use server';

import prisma from '@/lib/prisma';
import { auth } from '../../auth';

function assertSuperAdmin(session: any) {
  if (!session?.user?.isSuperAdmin) {
    throw new Error('Unauthorized Access. Super Admin only.');
  }
}

export interface GlobalMetrics {
  totalTenants: number;
  activeTenants: number;
  totalCustomers: number;
  totalInvoices: number;
  globalReceivables: number;
  globalOverdue: number;
  communicationsToday: number;
}

export interface TenantRow {
  id: string;
  name: string;
  documentNumber: string;
  createdAt: Date;
  customerCount: number;
  invoiceCount: number;
  totalReceivables: number;
}

export async function getGlobalMetrics(): Promise<GlobalMetrics> {
  const session = await auth();
  assertSuperAdmin(session);

  const [
    tenantCount,
    customerCount,
    invoiceCount,
    invoiceStats,
    communicationsToday
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.customer.count(),
    prisma.invoice.count(),
    prisma.invoice.aggregate({
      _sum: { amount: true },
      where: { status: { in: ['OPEN', 'PROMISE_TO_PAY'] } }
    }),
    // Prisma treats OVERDUE visually or dynamically, let's query raw overdue:
    prisma.communicationLog.count({
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }
    })
  ]);

  const rawOverdue = await prisma.invoice.aggregate({
    _sum: { amount: true },
    where: { 
      status: { in: ['OPEN', 'PROMISE_TO_PAY'] },
      dueDate: { lt: new Date() }
    }
  });

  return {
    totalTenants: tenantCount,
    activeTenants: tenantCount, // Simplification for now, assuming all created are active
    totalCustomers: customerCount,
    totalInvoices: invoiceCount,
    globalReceivables: invoiceStats._sum.amount || 0,
    globalOverdue: rawOverdue._sum.amount || 0,
    communicationsToday
  };
}

export async function getTenantsList(): Promise<TenantRow[]> {
  const session = await auth();
  assertSuperAdmin(session);

  // We query all tenants with their explicit aggregates
  const tenants = await prisma.tenant.findMany({
    include: {
      _count: {
        select: { customers: true, invoices: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // To get total receivables efficiently across tenants, we could group by tenantId
  const receivablesByTenant = await prisma.invoice.groupBy({
    by: ['tenantId'],
    _sum: { amount: true },
    where: { status: { in: ['OPEN', 'PROMISE_TO_PAY'] } }
  });

  const receivablesMap = new Map(
    receivablesByTenant.map(row => [row.tenantId, row._sum.amount || 0])
  );

  return tenants.map(t => ({
    id: t.id,
    name: t.name,
    documentNumber: t.documentNumber,
    createdAt: t.createdAt,
    customerCount: t._count.customers,
    invoiceCount: t._count.invoices,
    totalReceivables: receivablesMap.get(t.id) || 0,
  }));
}
