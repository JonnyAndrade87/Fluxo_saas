import { beforeEach, describe, expect, it, vi } from 'vitest';

import { upsertCustomer } from '@/actions/customers';
import { createInvoice } from '@/actions/invoices';
import prisma from '@/lib/prisma';
import { requireAuthFresh, requireRole } from '@/lib/permissions';

vi.mock('../../../auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    tenant: { findUnique: vi.fn() },
    tenantUser: { count: vi.fn() },
    customer: {
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    invoice: {
      count: vi.fn(),
      create: vi.fn(),
    },
    financialContact: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/permissions', () => ({
  requireAuthFresh: vi.fn(),
  requireRole: vi.fn(),
  AUDIT_ACTIONS: {
    CUSTOMER_CREATED: 'CUSTOMER_CREATED',
    CUSTOMER_UPDATED: 'CUSTOMER_UPDATED',
    INVOICE_CREATED: 'INVOICE_CREATED',
  },
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Billing plan limits on write actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(requireAuthFresh).mockResolvedValue({
      tenantId: 'tenant-A',
      userId: 'user-1',
      role: 'admin',
      mfaEnabled: false,
    } as any);
    vi.mocked(requireRole).mockImplementation(() => undefined);

    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
      id: 'tenant-A',
      plan: 'starter',
      maxUsers: 1,
      maxCustomers: 300,
      maxInvoices: 1000,
    } as any);
    vi.mocked(prisma.tenantUser.count).mockResolvedValue(1);
    vi.mocked(prisma.customer.count).mockResolvedValue(1);
    vi.mocked(prisma.invoice.count).mockResolvedValue(1);
  });

  it('blocks creating a customer when maxCustomers is already reached', async () => {
    vi.mocked(prisma.customer.count).mockResolvedValue(300);

    await expect(
      upsertCustomer({
        name: 'Empresa Nova',
        documentNumber: '12345678000199',
        email: 'financeiro@nova.com',
      }),
    ).rejects.toThrow(
      'Limite do plano atingido: seu plano starter permite até 300 clientes. Ajuste o plano ou reduza o volume atual para continuar.',
    );

    expect(prisma.customer.create).not.toHaveBeenCalled();
  });

  it('allows updating an existing customer even when maxCustomers is already reached', async () => {
    vi.mocked(prisma.customer.count).mockResolvedValue(300);
    vi.mocked(prisma.customer.update).mockResolvedValue({ id: 'cust-1', name: 'Empresa Atualizada' } as any);

    await expect(
      upsertCustomer({
        id: 'cust-1',
        name: 'Empresa Atualizada',
        documentNumber: '12345678000199',
      }),
    ).resolves.toEqual({ id: 'cust-1', name: 'Empresa Atualizada' });

    expect(prisma.customer.update).toHaveBeenCalled();
  });

  it('blocks creating an invoice when maxInvoices is already reached', async () => {
    vi.mocked(prisma.customer.findFirst).mockResolvedValue({ id: 'cust-1', tenantId: 'tenant-A' } as any);
    vi.mocked(prisma.invoice.count).mockResolvedValue(1000);

    await expect(
      createInvoice({
        customerId: 'cust-1',
        amount: 1500,
        dueDate: '2026-04-30',
      }),
    ).rejects.toThrow(
      'Limite do plano atingido: seu plano starter permite até 1000 faturas. Ajuste o plano ou reduza o volume atual para continuar.',
    );

    expect(prisma.invoice.create).not.toHaveBeenCalled();
  });
});
