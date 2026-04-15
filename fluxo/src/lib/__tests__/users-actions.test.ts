/**
 * users-actions.test.ts
 *
 * Testes para comprovar o bloqueio e isolamento Multi-Tenant nas actions de gestão de equipe.
 * Cobre manipulação de cargo e exclusão de usuário.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { inviteUser, updateUserRole, removeTeamMember } from '@/actions/users';
import prisma from '@/lib/prisma';
import { requireAuth, requireAuthFresh, type AuthContext } from '@/lib/permissions';

// Mocks automáticos do Vitest
vi.mock('@/lib/prisma', () => ({
  default: {
    tenantUser: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    tenant: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/permissions', () => ({
  requireAuth: vi.fn(), requireAuthFresh: vi.fn(),
  requireRole: vi.fn(),
  AUDIT_ACTIONS: {
    USER_CREATED: 'USER_CREATED',
    USER_UPDATED: 'USER_UPDATED',
    USER_DELETED: 'USER_DELETED',
  },
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Isolamento Multi-Tenant: Gestão de Equipe', () => {
  const mockCtx: AuthContext = {
    userId: 'admin-user',
    tenantId: 'tenant-A',
    role: 'admin',
  };

  const mockFreshCtx = {
    ...mockCtx,
    mfaEnabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue(mockCtx);
    vi.mocked(requireAuthFresh).mockResolvedValue(mockFreshCtx);
  });

  describe('updateUserRole (Alteração de Cargo)', () => {
    it('bloqueia alteração de membro pertencente a outro tenant', async () => {
      // Retorna um TenantUser que pertence ao 'tenant-B', diferente do 'tenant-A' do chamador
      vi.mocked(prisma.tenantUser.findUnique).mockResolvedValue({
        id: 'target-tu-id',
        tenantId: 'tenant-B',
        userId: 'other-user',
        role: 'operator',
        createdAt: new Date(),
      });

      const result = await updateUserRole('target-tu-id', 'admin');

      // Verifica que barra com a mensagem correta e não chega a chamar update
      expect(result).toEqual({ error: 'Membro não encontrado ou sem permissão.' });
      expect(prisma.tenantUser.update).not.toHaveBeenCalled();
    });

    it('permite a alteração no mesmo tenant', async () => {
      // Retorna um TenantUser que pertence ao MESMO tenant ('tenant-A')
      vi.mocked(prisma.tenantUser.findUnique).mockResolvedValue({
        id: 'target-tu-id',
        tenantId: 'tenant-A',
        userId: 'other-user',
        role: 'operator',
        createdAt: new Date(),
      });

      const result = await updateUserRole('target-tu-id', 'admin');

      // Verifica sucesso absoluto e execução ativada
      expect(result).toEqual({ success: true });
      expect(prisma.tenantUser.update).toHaveBeenCalledWith({
        where: { id: 'target-tu-id' },
        data: { role: 'admin' },
      });
    });
  });

  describe('inviteUser (Limite de Plano)', () => {
    it('retorna erro amigável quando o tenant já atingiu o limite de usuários', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'existing-user',
        email: 'member@tenant.com',
        fullName: 'Existing Member',
        password: 'hash',
        googleId: null,
        emailVerified: true,
        isActive: true,
        mfaEnabled: false,
        mfaSecret: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(prisma.tenantUser.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
        id: 'tenant-A',
        plan: 'starter',
        maxUsers: 1,
        maxCustomers: 300,
        maxInvoices: 1000,
      } as Awaited<ReturnType<typeof prisma.tenant.findUnique>>);
      vi.mocked(prisma.tenantUser.count).mockResolvedValue(1);

      const formData = new FormData();
      formData.set('email', 'member@tenant.com');
      formData.set('fullName', 'Member');
      formData.set('role', 'operator');

      const result = await inviteUser(formData);

      expect(result).toEqual({
        error: 'Limite do plano atingido: seu plano starter permite até 1 usuário na equipe. Ajuste o plano ou reduza o volume atual para continuar.',
      });
      expect(prisma.tenantUser.create).not.toHaveBeenCalled();
    });
  });

  describe('removeTeamMember (Exclusão de Cargo)', () => {
    it('bloqueia a exclusão de membro pertencente a outro tenant', async () => {
      vi.mocked(prisma.tenantUser.findUnique).mockResolvedValue({
        id: 'target-tu-id',
        tenantId: 'tenant-B',
        userId: 'other-user',
        role: 'operator',
        createdAt: new Date(),
      });

      const result = await removeTeamMember('target-tu-id');

      expect(result).toEqual({ error: 'Membro não encontrado ou sem permissão.' });
      expect(prisma.tenantUser.delete).not.toHaveBeenCalled();
    });

    it('permite a exclusão de um operador no mesmo tenant', async () => {
      vi.mocked(prisma.tenantUser.findUnique).mockResolvedValue({
        id: 'target-tu-id',
        tenantId: 'tenant-A',
        userId: 'other-user',
        role: 'operator',
        createdAt: new Date(),
      });

      // Simular contagem de admins que sobrevive se necessário na action
      vi.mocked(prisma.tenantUser.count).mockResolvedValue(2);

      const result = await removeTeamMember('target-tu-id');

      expect(result).toEqual({ success: true });
      expect(prisma.tenantUser.delete).toHaveBeenCalledWith({
        where: { id: 'target-tu-id' },
      });
    });
  });
});
