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
import { requireAuth, requireRole } from '@/lib/permissions';

vi.mock('@/lib/prisma', () => ({
  default: {
    customer: { findFirst: vi.fn() },
    invoice: { findFirst: vi.fn(), create: vi.fn() },
    financialContact: { findFirst: vi.fn(), updateMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    customerNote: { create: vi.fn() },
    task: { create: vi.fn() },
  },
}));

vi.mock('../../../auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/permissions', () => ({
  requireAuth: vi.fn(),
  requireRole: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

describe('Multi-Tenant Data Isolation em Associação de Entidades', () => {
  const mockTenantId = 'tenant-A';
  const mockUserId = 'user-1';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { tenantId: mockTenantId, id: mockUserId, role: 'operator' } } as any);
    vi.mocked(requireAuth).mockResolvedValue({ tenantId: mockTenantId, userId: mockUserId, role: 'admin', isSuperAdmin: false });
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
      vi.mocked(prisma.customer.findFirst).mockResolvedValue({ id: 'valid-customer', tenantId: mockTenantId } as any);
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
      vi.mocked(prisma.customer.findFirst).mockResolvedValue({ id: 'valid-customer', tenantId: mockTenantId } as any);
      // A Fatura informada é roubada de outro tenant:
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue(null);

      await expect(createTask({ customerId: 'valid-customer', invoiceId: 'fatura-tenant-Z', title: 'Test', dueDate: '2024-01-01' }))
        .rejects.toThrow('Invoice not found or invalid tenant');

      expect(prisma.task.create).not.toHaveBeenCalled();
    });
  });
});
