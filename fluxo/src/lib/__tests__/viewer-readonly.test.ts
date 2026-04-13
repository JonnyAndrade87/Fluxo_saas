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
import { auth } from '../../../auth';
import { requireAuth } from '@/lib/permissions';

vi.mock('@/lib/prisma', () => ({ default: {} }));
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

});
