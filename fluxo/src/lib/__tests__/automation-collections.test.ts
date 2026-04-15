/**
 * automation-collections.test.ts
 *
 * Testes provando o enforcement correto de papéis (Roles) na gestão da
 * régua de cobrança automática e na execução/disparo das comunicações globais.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveBillingFlow } from '@/actions/automation';
import { triggerCollectionLogs, markLogSent, markLogSkipped } from '@/actions/communicationLog.actions';
import { requireAuth, requireAuthFresh } from '@/lib/permissions';
import prisma from '@/lib/prisma';

// Mocks do Next e libs internas
vi.mock('@/lib/prisma', () => ({
  default: {
    tenant: { findUnique: vi.fn() },
    billingFlow: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
    invoice: { findMany: vi.fn() },
    communicationLog: { updateMany: vi.fn() },
  }
}));

vi.mock('@/lib/permissions', () => ({ requireAuth: vi.fn(), requireAuthFresh: vi.fn(), requireRole: vi.fn() }));
vi.mock('@/services/communication/communicationService', () => ({
  generateCollectionLogs: vi.fn().mockResolvedValue({ created: 1, skipped: 0 })
}));
vi.mock('../../../auth', () => ({ auth: vi.fn() }));

describe('Segurança em Automações e Cobranças (Roles Verification)', () => {
  const mockTenantId = 'tenant-A';
  const mockUserId = 'user-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Automação Global (saveBillingFlow - automation.ts)', () => {
    it('bloqueia o papel "viewer" de alterar a automação global', async () => {
      vi.mocked(requireAuth).mockResolvedValue({ tenantId: mockTenantId, userId: mockUserId, role: 'viewer', isSuperAdmin: false } as any); vi.mocked(requireAuthFresh).mockResolvedValue({ tenantId: mockTenantId, userId: mockUserId, role: 'viewer', isSuperAdmin: false } as any);
      
      await expect(saveBillingFlow({ active: false }))
        .rejects.toThrow('Forbidden: Apenas administradores podem alterar a régua de cobrança');
      expect(prisma.billingFlow.update).not.toHaveBeenCalled();
    });

    it('bloqueia o papel "operator" de alterar a automação global (somente admin)', async () => {
      vi.mocked(requireAuth).mockResolvedValue({ tenantId: mockTenantId, userId: mockUserId, role: 'operator', isSuperAdmin: false } as any); vi.mocked(requireAuthFresh).mockResolvedValue({ tenantId: mockTenantId, userId: mockUserId, role: 'operator', isSuperAdmin: false } as any);
      
      await expect(saveBillingFlow({ active: false }))
        .rejects.toThrow('Forbidden: Apenas administradores podem alterar a régua de cobrança');
      expect(prisma.billingFlow.update).not.toHaveBeenCalled();
    });

    it('permite que um "admin" altere a automação global com sucesso', async () => {
      vi.mocked(requireAuth).mockResolvedValue({ tenantId: mockTenantId, userId: mockUserId, role: 'admin', isSuperAdmin: false } as any); vi.mocked(requireAuthFresh).mockResolvedValue({ tenantId: mockTenantId, userId: mockUserId, role: 'admin', isSuperAdmin: false } as any);
      vi.mocked(prisma.billingFlow.findFirst).mockResolvedValue({ id: 'flow-1' } as any);
      vi.mocked(prisma.billingFlow.update).mockResolvedValue({ id: 'flow-1' } as any);

      await expect(saveBillingFlow({ active: false })).resolves.toBeDefined();
      expect(prisma.billingFlow.update).toHaveBeenCalled();
    });
  });

  describe('Execução e Comunicação Global (communicationLog.actions.ts)', () => {
    it('bloqueia o papel "viewer" de rodar o triggerCollectionLogs()', async () => {
      vi.mocked(requireAuth).mockResolvedValue({ tenantId: mockTenantId, userId: mockUserId, role: 'viewer', isSuperAdmin: false } as any); vi.mocked(requireAuthFresh).mockResolvedValue({ tenantId: mockTenantId, userId: mockUserId, role: 'viewer', isSuperAdmin: false } as any);
      
      const result = await triggerCollectionLogs();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Forbidden: Acesso somente leitura');
    });

    it('bloqueia o papel "viewer" de avançar um LOG (markLogSent, markLogSkipped)', async () => {
      vi.mocked(requireAuth).mockResolvedValue({ tenantId: mockTenantId, userId: mockUserId, role: 'viewer', isSuperAdmin: false } as any); vi.mocked(requireAuthFresh).mockResolvedValue({ tenantId: mockTenantId, userId: mockUserId, role: 'viewer', isSuperAdmin: false } as any);
      
      const resultSent = await markLogSent('log-1');
      expect(resultSent.success).toBe(false);

      const resultSkipped = await markLogSkipped('log-1');
      expect(resultSkipped.success).toBe(false);
    });

    it('permite que um papel autorizado (ex: operator) rode triggerCollectionLogs() com sucesso', async () => {
      vi.mocked(requireAuth).mockResolvedValue({ tenantId: mockTenantId, userId: mockUserId, role: 'operator', isSuperAdmin: false } as any); vi.mocked(requireAuthFresh).mockResolvedValue({ tenantId: mockTenantId, userId: mockUserId, role: 'operator', isSuperAdmin: false } as any);
      vi.mocked(prisma.tenant.findUnique).mockResolvedValue({ id: mockTenantId, name: 'T' } as any);
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([]);

      const result = await triggerCollectionLogs();
      expect(result.success).toBe(true);
      expect(result.created).toBe(1); // Mocado no topo
    });

    it('permite que um papel autorizado avance um LOG', async () => {
      vi.mocked(requireAuth).mockResolvedValue({ tenantId: mockTenantId, userId: mockUserId, role: 'operator', isSuperAdmin: false } as any); vi.mocked(requireAuthFresh).mockResolvedValue({ tenantId: mockTenantId, userId: mockUserId, role: 'operator', isSuperAdmin: false } as any);
      
      const resultSent = await markLogSent('log-1');
      expect(resultSent.success).toBe(true);
      expect(prisma.communicationLog.updateMany).toHaveBeenCalled();
    });
  });
});
