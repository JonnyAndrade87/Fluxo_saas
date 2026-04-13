/**
 * viewer-readonly.test.ts
 *
 * Testes provando que o perfil 'viewer' é hard-blocked no backend
 * para realizar qualquer mutação (criação, edição, exclusão, mudança de status)
 * em Faturas e Tarefas, conforme exigido.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createInvoice, updateInvoice, markInvoiceAsPaid, 
  cancelInvoice, reopenInvoice, deleteInvoice, registerPromiseToPay 
} from '@/actions/invoices';
import { createTask, completeTask, cancelTask } from '@/actions/tasks';
import prisma from '@/lib/prisma';
import { auth } from '../../../auth';
import { requireAuth } from '@/lib/permissions';

vi.mock('@/lib/prisma', () => ({
  default: {
    customer: { findFirst: vi.fn() },
    invoice: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    task: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    communication: { create: vi.fn() }
  }
}));
vi.mock('../../../auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/permissions', () => ({ requireAuth: vi.fn(), requireRole: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

describe('Enforcement de Somente Leitura (Viewer) no Backend', () => {

  const mockTenantId = 'tenant-A';
  const mockUserId = 'user-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Faturas (Invoices Mutações)', () => {
    beforeEach(() => {
      // Simula uma sessão ativa válida onde a pessoa é STRICTLY "viewer"
      vi.mocked(auth).mockResolvedValue({ 
        user: { tenantId: mockTenantId, id: mockUserId, role: 'viewer' } 
      } as any);
    });

    it('bloqueia createInvoice para viewer', async () => {
      await expect(createInvoice({ customerId: 'c1', amount: 100, dueDate: '2024-01-01' }))
        .rejects.toThrow('Forbidden: Acesso somente leitura');
    });

    it('bloqueia updateInvoice para viewer', async () => {
      await expect(updateInvoice('inv-1', { amount: 200, dueDate: '2024-01-02' }))
        .rejects.toThrow('Forbidden: Acesso somente leitura');
    });

    it('bloqueia markInvoiceAsPaid para viewer', async () => {
      await expect(markInvoiceAsPaid('inv-1')).rejects.toThrow('Forbidden: Acesso somente leitura');
    });

    it('bloqueia cancelInvoice para viewer', async () => {
      await expect(cancelInvoice('inv-1', 'motivo xyz')).rejects.toThrow('Forbidden: Acesso somente leitura');
    });

    it('bloqueia reopenInvoice para viewer', async () => {
      await expect(reopenInvoice('inv-1')).rejects.toThrow('Forbidden: Acesso somente leitura');
    });

    it('bloqueia deleteInvoice para viewer', async () => {
      await expect(deleteInvoice('inv-1')).rejects.toThrow('Forbidden: Acesso somente leitura');
    });

    it('bloqueia registerPromiseToPay para viewer', async () => {
      await expect(registerPromiseToPay('inv-1', '2024-02-01')).rejects.toThrow('Forbidden: Acesso somente leitura');
    });
  });

  describe('Tarefas (Tasks Mutações)', () => {
    beforeEach(() => {
      // Simula context de requireAuth() com role "viewer"
      vi.mocked(requireAuth).mockResolvedValue({ 
        tenantId: mockTenantId, userId: mockUserId, role: 'viewer', isSuperAdmin: false 
      } as any);
    });

    it('bloqueia createTask para viewer', async () => {
      await expect(createTask({ customerId: 'c1', title: 'T1', dueDate: '2024-01-01' }))
        .rejects.toThrow('Forbidden: Acesso somente leitura');
    });

    it('bloqueia completeTask para viewer', async () => {
      await expect(completeTask('task-1')).rejects.toThrow('Forbidden: Acesso somente leitura');
    });

    it('bloqueia cancelTask para viewer', async () => {
      await expect(cancelTask('task-1')).rejects.toThrow('Forbidden: Acesso somente leitura');
    });
  });

  describe('Enforcement Permitido: Papéis válidos', () => {
    beforeEach(() => {
      // Simula context de requireAuth() e auth() com role "operator"
      vi.mocked(auth).mockResolvedValue({ 
        user: { tenantId: mockTenantId, id: mockUserId, role: 'operator' } 
      } as any);

      vi.mocked(requireAuth).mockResolvedValue({ 
        tenantId: mockTenantId, userId: mockUserId, role: 'operator', isSuperAdmin: false 
      } as any);

      // Simular recursos no banco, assim a ação passa o check de ownership e segue sem erro
      vi.mocked(prisma.customer.findFirst).mockResolvedValue({ id: 'valid-c1', tenantId: mockTenantId } as any);
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue({ id: 'valid-inv1', tenantId: mockTenantId, amount: 100 } as any);
      vi.mocked(prisma.task.findFirst).mockResolvedValue({ id: 'valid-task1', tenantId: mockTenantId } as any);

      // Limpar métodos de create/update para retornar definidos
      vi.mocked(prisma.invoice.create).mockResolvedValue({ id: 'new-inv1' } as any);
      vi.mocked(prisma.invoice.update).mockResolvedValue({ id: 'valid-inv1' } as any);
      vi.mocked(prisma.task.create).mockResolvedValue({ id: 'new-task1' } as any);
      vi.mocked(prisma.task.update).mockResolvedValue({ id: 'valid-task1' } as any);
    });

    it('papel permitido (operator) consegue criar e editar invoices normalmente', async () => {
      // Create path
      await expect(createInvoice({ customerId: 'valid-c1', amount: 100, dueDate: '2024-01-01' })).resolves.toBeDefined();
      
      // Update path
      await expect(updateInvoice('valid-inv1', { amount: 150, dueDate: '2024-01-02' })).resolves.toBeDefined();
    });

    it('papel permitido consegue executar mutação crítica (markAsPaid) na invoice', async () => {
      // Simula a injeção do communication
      vi.mocked(prisma.communication.create).mockResolvedValue({} as any);

      await expect(markInvoiceAsPaid('valid-inv1')).resolves.toBeDefined();
    });

    it('papel permitido consegue criar uma task com sucesso', async () => {
      await expect(createTask({ customerId: 'valid-c1', title: 'T1', dueDate: '2024-01-01' })).resolves.toBeDefined();
    });

    it('papel permitido consegue concluir ou cancelar tasks com sucesso', async () => {
      await expect(completeTask('valid-task1')).resolves.toBeDefined();
      await expect(cancelTask('valid-task1')).resolves.toBeDefined();
    });
  });

});
