'use server';

import prisma from '@/lib/prisma';
import { auth } from '../../auth';
import { generateCollectionLogs } from '@/services/communication/communicationService';

// ── Type helpers ───────────────────────────────────────────────────────────────

export interface CommunicationLogRow {
  id: string;
  ruleType: string;
  channel: string;
  message: string;
  status: string;
  scheduledFor: Date;
  sentAt: Date | null;
  createdAt: Date;
  metadata: string | null;
  customer: {
    id: string;
    name: string;
    phone: string | null;
  };
  invoice: {
    id: string;
    invoiceNumber: string;
    amount: number;
    dueDate: Date;
    balanceDue: number;
  } | null;
}

export interface GetLogsFilters {
  status?: string;
  ruleType?: string;
  customerId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// ── 1. Generate / refresh collection logs for the tenant ──────────────────────

export async function triggerCollectionLogs(): Promise<{
  success: boolean;
  created?: number;
  skipped?: number;
  errors?: string[];
  error?: string;
}> {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) return { success: false, error: 'Unauthorized' };

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true },
    });
    if (!tenant) return { success: false, error: 'Tenant not found' };

    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: ['OPEN', 'PROMISE_TO_PAY'] },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
      },
    });

    const result = await generateCollectionLogs(tenant, invoices);

    return { success: true, ...result };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// ── 2. Fetch logs with filters ─────────────────────────────────────────────────

export async function getCommunicationLogs(
  filters: GetLogsFilters = {}
): Promise<CommunicationLogRow[]> {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) return [];

  const where: {
    tenantId: string;
    status?: string;
    ruleType?: string;
    customerId?: string;
    scheduledFor?: { gte?: Date; lte?: Date };
  } = { tenantId };

  if (filters.status) where.status = filters.status;
  if (filters.ruleType) where.ruleType = filters.ruleType;
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.search) {
    // we use prisma's OR to search by customer name or invoice number
    Object.assign(where, {
      OR: [
        { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
        { invoice: { invoiceNumber: { contains: filters.search, mode: 'insensitive' } } }
      ]
    });
  }
  if (filters.dateFrom || filters.dateTo) {
    where.scheduledFor = {};
    if (filters.dateFrom) where.scheduledFor.gte = filters.dateFrom;
    if (filters.dateTo) where.scheduledFor.lte = filters.dateTo;
  }

  const rows = await prisma.communicationLog.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      invoice: {
        select: { id: true, invoiceNumber: true, amount: true, dueDate: true, balanceDue: true },
      },
    },
    orderBy: { scheduledFor: 'desc' },
    take: 200,
  });

  return rows as CommunicationLogRow[];
}

// ── 3. Mark log as sent ────────────────────────────────────────────────────────

export async function markLogSent(id: string): Promise<{ success: boolean }> {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) return { success: false };

  await prisma.communicationLog.updateMany({
    where: { id, tenantId },
    data: { status: 'sent', sentAt: new Date() },
  });

  return { success: true };
}

// ── 4. Mark log as skipped ────────────────────────────────────────────────────

export async function markLogSkipped(id: string): Promise<{ success: boolean }> {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) return { success: false };

  await prisma.communicationLog.updateMany({
    where: { id, tenantId },
    data: { status: 'skipped' },
  });

  return { success: true };
}
