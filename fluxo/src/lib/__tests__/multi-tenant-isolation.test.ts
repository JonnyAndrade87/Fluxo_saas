/**
 * invoices-customers-tasks-isolation.test.ts
 *
 * Testes provando o isolamento multi-tenant (prevenindo IDOR) em associações
 * (criação de faturas, notas, contatos e tarefas) usando IDs cruzados.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createInvoice } from '@/actions/invoices';
import { addCustomerNote, upsertFinancialContact } from '@/actions/customers';
import { createTask } from '@/actions/tasks';
import prisma from '@/lib/prisma';
import { auth } from '../../../auth';
import { requireAuth, requireAuthFresh } from '@/lib/permissions';

vi.mock('@/lib/prisma', () => ({
  default: {
    tenant: { findUnique: vi.fn() },
    tenantUser: { count: vi.fn() },
    customer: { findFirst: vi.fn(), count: vi.fn() },
    invoice: { findFirst: vi.fn(), count: vi.fn(), create: vi.fn() },
    financialContact: { findFirst: vi.fn(), updateMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    customerNote: { create: vi.fn() },
    task: { create: vi.fn() },
  },
}));

vi.mock('../../../auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/permissions', () => ({
  requireAuth: vi.fn(), requireAuthFresh: vi.fn(),
  requireRole: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

describe('Multi-Tenant Data Isolation em Associação de Entidades', () => {
  const mockTenantId = 'tenant-A';
  const mockUserId = 'user-1';
  const authMock = auth as unknown as ReturnType<typeof vi.fn>;
  const tenantMock = {
    id: mockTenantId,
    plan: 'pro',
    maxUsers: 3,
    maxCustomers: 2000,
    maxInvoices: 10000,
  } as Awaited<ReturnType<typeof prisma.tenant.findUnique>>;
  const tenantOwnedCustomer = {
    id: 'valid-customer',
    tenantId: mockTenantId,
  } as Awaited<ReturnType<typeof prisma.customer.findFirst>>;

  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { tenantId: mockTenantId, id: mockUserId, role: 'operator' } });
    vi.mocked(requireAuth).mockResolvedValue({ tenantId: mockTenantId, userId: mockUserId, role: 'admin' });
    vi.mocked(requireAuthFresh).mockResolvedValue({ tenantId: mockTenantId, userId: mockUserId, role: 'admin', mfaEnabled: false });
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue(tenantMock);
    vi.mocked(prisma.tenantUser.count).mockResolvedValue(1);
    vi.mocked(prisma.customer.count).mockResolvedValue(1);
    vi.mocked(prisma.invoice.count).mockResolvedValue(1);
  });

  describe('createInvoice', () => {
    it('bloqueia a criação de fatura informando um customerId de outro tenant', async () => {
      // prisma.customer.findFirst (checagem) retorna null indicando que não achou o customer no tenant corrente
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);

      await expect(createInvoice({ customerId: 'customer-tenant-B', amount: 100, dueDate: '2024-01-01' }))
        .rejects.toThrow('Customer not found or invalid tenant');

      expect(prisma.invoice.create).not.toHaveBeenCalled();
    });
  });

  describe('addCustomerNote', () => {
    it('bloqueia a adição de nota informando um customerId de outro tenant', async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);

      await expect(addCustomerNote('customer-tenant-B', 'nota vazada'))
        .rejects.toThrow('Customer not found or invalid tenant');

      expect(prisma.customerNote.create).not.toHaveBeenCalled();
    });
  });

  describe('upsertFinancialContact', () => {
    it('bloqueia anexar um novo contato a um customerId de outro tenant', async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null); // falha na checagem do customer

      await expect(upsertFinancialContact({ customerId: 'customer-tenant-B', name: 'John', email: 'j@ex.com', isPrimary: true }))
        .rejects.toThrow('Customer not found or invalid tenant');

      expect(prisma.financialContact.create).not.toHaveBeenCalled();
    });

    it('bloqueia o update de um financialContact cuja origem é de outro tenant', async () => {
      // Simula que o Customer pertence ao usuário, MAS o Contato pertence a outro tenant (IDOR modificado)
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(tenantOwnedCustomer);
      // Checagem do próprio contato falha validando tenantId:
      vi.mocked(prisma.financialContact.findFirst).mockResolvedValue(null);

      await expect(upsertFinancialContact({ id: 'contact-tenant-B', customerId: 'valid-customer', name: 'John', email: 'j@ex.com' }))
        .rejects.toThrow('Contact not found or invalid tenant');

      expect(prisma.financialContact.update).not.toHaveBeenCalled();
    });
  });

  describe('createTask', () => {
    it('bloqueia criação de tarefa se for informado um invoiceId de um tenant externo', async () => {
      // O Customer é dele:
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(tenantOwnedCustomer);
      // A Fatura informada é roubada de outro tenant:
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue(null);

      await expect(createTask({ customerId: 'valid-customer', invoiceId: 'fatura-tenant-Z', title: 'Test', dueDate: '2024-01-01' }))
        .rejects.toThrow('Invoice not found or invalid tenant');

      expect(prisma.task.create).not.toHaveBeenCalled();
    });
  });
});
