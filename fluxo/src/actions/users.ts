'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { requireAuth, requireAuthFresh, requireRole, AUDIT_ACTIONS } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

/**
 * List all team members for the current tenant.
 */
export async function getTeamMembers() {
  const ctx = await requireAuth();

  const members = await prisma.tenantUser.findMany({
    where: { tenantId: ctx.tenantId },
    include: {
      user: {
        select: { id: true, email: true, fullName: true, createdAt: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  return members.map(m => ({
    id: m.id,
    userId: m.userId,
    role: m.role,
    joinedAt: m.createdAt,
    email: m.user.email,
    fullName: m.user.fullName,
    createdAt: m.user.createdAt,
    isCurrentUser: m.userId === ctx.userId,
  }));
}

/**
 * Invite a new user to the tenant. Admin-only.
 * If the email already exists in the system, adds them to this tenant.
 * If not, creates a new User with a temp password they must reset.
 */
export async function inviteUser(formData: FormData) {
  const ctx = await requireAuthFresh();
  requireRole(['admin'], ctx);

  const email = (formData.get('email') as string)?.toLowerCase().trim();
  const role = (formData.get('role') as string) || 'operator';
  const fullName = (formData.get('fullName') as string)?.trim() || email;

  if (!email) return { error: 'E-mail obrigatório.' };
  if (!['admin', 'operator', 'viewer'].includes(role)) return { error: 'Papel inválido.' };

  // Check if already in this tenant
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    const alreadyMember = await prisma.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId: ctx.tenantId, userId: existingUser.id } }
    });
    if (alreadyMember) return { error: 'Este usuário já é membro da equipe.' };

    await prisma.tenantUser.create({
      data: { tenantId: ctx.tenantId, userId: existingUser.id, role }
    });

    await logAudit({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      userRole: ctx.role,
      action: AUDIT_ACTIONS.USER_CREATED,
      entityType: 'USER',
      entityId: existingUser.id,
      metadata: { email, role, fullName, status: 'added_existing' }
    });
  } else {
    // Create new user with temp password (they'll need to reset it)
    const tempPassword = await bcrypt.hash(`fluxo@${Date.now()}`, 10);
    const newUser = await prisma.user.create({
      data: { email, fullName, password: tempPassword }
    });
    await prisma.tenantUser.create({
      data: { tenantId: ctx.tenantId, userId: newUser.id, role }
    });

    await logAudit({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      userRole: ctx.role,
      action: AUDIT_ACTIONS.USER_CREATED,
      entityType: 'USER',
      entityId: newUser.id,
      metadata: { email, role, fullName, status: 'created_new' }
    });
  }

  revalidatePath('/configuracoes');
  return { success: true };
}

/**
 * Update a team member's role. Admin-only.
 */
export async function updateUserRole(tenantUserId: string, newRole: string) {
  const ctx = await requireAuthFresh();
  requireRole(['admin'], ctx);

  if (!['admin', 'operator', 'viewer'].includes(newRole)) {
    return { error: 'Papel inválido.' };
  }

  // Authorize and prevent downgrading yourself
  const tu = await prisma.tenantUser.findUnique({
    where: { id: tenantUserId }
  });
  if (!tu || tu.tenantId !== ctx.tenantId) {
    return { error: 'Membro não encontrado ou sem permissão.' };
  }
  if (tu.userId === ctx.userId) return { error: 'Você não pode alterar seu próprio papel.' };

  await prisma.tenantUser.update({
    where: { id: tenantUserId },
    data: { role: newRole }
  });

  await logAudit({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    userRole: ctx.role,
    action: AUDIT_ACTIONS.USER_UPDATED,
    entityType: 'USER',
    entityId: tu.userId,
    metadata: { newRole, previousRole: tu.role }
  });

  revalidatePath('/configuracoes');
  return { success: true };
}

/**
 * Remove a team member from the tenant. Admin-only.
 */
export async function removeTeamMember(tenantUserId: string) {
  const ctx = await requireAuthFresh();
  requireRole(['admin'], ctx);

  const tu = await prisma.tenantUser.findUnique({
    where: { id: tenantUserId }
  });
  if (!tu || tu.tenantId !== ctx.tenantId) {
    return { error: 'Membro não encontrado ou sem permissão.' };
  }

  // Cannot remove yourself
  if (tu.userId === ctx.userId) {
    return { error: 'Você não pode remover a si mesmo da equipe.' };
  }

  // Ensure at least one admin remains
  if (tu.role === 'admin') {
    const adminCount = await prisma.tenantUser.count({
      where: { tenantId: ctx.tenantId, role: 'admin' }
    });
    if (adminCount <= 1) {
      return { error: 'Deve existir ao menos um administrador na equipe.' };
    }
  }

  const userToRemove = await prisma.user.findUnique({ where: { id: tu.userId } });

  await prisma.tenantUser.delete({ where: { id: tenantUserId } });

  await logAudit({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    userRole: ctx.role,
    action: AUDIT_ACTIONS.USER_DELETED,
    entityType: 'USER',
    entityId: tu.userId,
    metadata: { email: userToRemove?.email || 'unknown' }
  });

  revalidatePath('/configuracoes');
  return { success: true };
}
