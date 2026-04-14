/**
 * permissions-matrix.test.ts
 *
 * Asserting that the unified roles (admin, operator, viewer) apply
 * exactly the expected array and fallbacks natively.
 */

import { describe, it, expect, vi } from 'vitest';
import { hasPermission, hasAllPermissions, hasAnyPermission, requireAuth, requireRole, PERMISSIONS_MATRIX } from '@/lib/permissions';
import { auth } from '../../../auth';

vi.mock('../../../auth', () => ({ auth: vi.fn() }));

describe('Governança do Modelo Unificado de Roles', () => {

  describe('Matriz de Permissões: hasPermission e Acesso por Role', () => {
    it('role administrativa tem acesso a mutações e deleção (ex: invoices:delete)', () => {
      expect(hasPermission('admin', 'invoices:delete')).toBe(true);
      expect(hasPermission('admin', 'customers:create')).toBe(true);
      expect(hasPermission('admin', 'settings:update')).toBe(true);
    });

    it('role operacional pode criar entidades normais, mas NÃO deletar nem ver configurações', () => {
      // Positivos
      expect(hasPermission('operator', 'customers:create')).toBe(true);
      expect(hasPermission('operator', 'invoices:update')).toBe(true);
      expect(hasPermission('operator', 'collections:execute')).toBe(true);

      // Negativos
      expect(hasPermission('operator', 'invoices:delete')).toBe(false);
      expect(hasPermission('operator', 'settings:update')).toBe(false);
      expect(hasPermission('operator', 'users:create')).toBe(false);
    });

    it('role somente leitura (viewer) é bloqueado rigidamente de gerar mutações', () => {
      // Negativos (Blocked from mutations)
      expect(hasPermission('viewer', 'invoices:create')).toBe(false);
      expect(hasPermission('viewer', 'customers:update')).toBe(false);
      expect(hasPermission('viewer', 'collections:execute')).toBe(false);

      // Positivos (Allowed purely to view/read/export)
      expect(hasPermission('viewer', 'invoices:read')).toBe(true);
      expect(hasPermission('viewer', 'reports:export')).toBe(true);
      expect(hasPermission('viewer', 'dashboard:view')).toBe(true);
    });

    it('retorna false para role inválida/inconsistente no fluxo', () => {
      // @ts-expect-error force testing invalid role bypassing TS
      expect(hasPermission('super_hacker', 'dashboard:view')).toBe(false);
      expect(hasPermission(undefined, 'customers:read')).toBe(false);
    });
  });

  describe('Extra Helper Funcs', () => {
    it('hasAllPermissions obriga TODAS as permissões', () => {
      expect(hasAllPermissions('operator', ['invoices:create', 'invoices:delete'])).toBe(false);
      expect(hasAllPermissions('admin', ['invoices:create', 'invoices:delete'])).toBe(true);
    });

    it('hasAnyPermission obriga APENAS UMA das permissões', () => {
      expect(hasAnyPermission('operator', ['invoices:create', 'invoices:delete'])).toBe(true);
    });
  });

  describe('Context Sanitizer e Reject de Fallback Permissivo', () => {
    it('REJEITA role inválida ou legada ("financeiro") ao invés de usar fallback de "operator"', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: '1', tenantId: 't-1', role: 'financeiro' }
      } as any);

      await expect(requireAuth()).rejects.toThrow(/FORBIDDEN: Papel inválido ou legado detectado/);
    });

    it('REJEITA roles completamente inexistentes prevenindo Privilege Escalation pelo Gateway', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: '1', tenantId: 't-1', role: 'ceo_invalid_role' }
      } as any);

      await expect(requireAuth()).rejects.toThrow(/FORBIDDEN: Papel inválido ou legado detectado/);
    });

    it('mantém o role válido sem alterar', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: '1', tenantId: 't-1', role: 'admin' }
      } as any);

      const ctxAdmin = await requireAuth();
      expect(ctxAdmin.role).toBe('admin');

      vi.mocked(auth).mockResolvedValue({
        user: { id: '1', tenantId: 't-1', role: 'viewer' }
      } as any);

      const ctxViewer = await requireAuth();
      expect(ctxViewer.role).toBe('viewer');
    });

    it('requireRole() lança falha para bloqueio na validação de escopo inline', () => {
      expect(() => requireRole(['admin'], { userId: '1', tenantId: '1', role: 'operator' }))
        .toThrow(/FORBIDDEN: Required role/);
      
      expect(() => requireRole(['admin', 'operator'], { userId: '1', tenantId: '1', role: 'operator' }))
        .not.toThrow();
    });
  });

});
