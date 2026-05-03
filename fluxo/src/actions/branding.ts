'use server';

import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/safe-auth';
import { revalidatePath } from 'next/cache';
import { checkBrandingPermission } from '@/lib/permissions-shared';
import { put } from '@vercel/blob';

export async function uploadLogoAction(formData: FormData) {
  const { user, tenantId } = await requireTenant();
  
  // Security check
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true }
  });

  const permission = checkBrandingPermission(user, tenant);
  if (!permission.canCustomize) {
    return { ok: false, error: permission.message };
  }

  const file = formData.get('file') as File;
  if (!file) return { ok: false, error: 'Nenhum arquivo enviado.' };

  // Validation
  const MAX_KB = 500;
  if (file.size > MAX_KB * 1024) return { ok: false, error: 'Arquivo muito grande (máx 500KB).' };
  
  const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!allowed.includes(file.type)) return { ok: false, error: 'Formato inválido.' };

  try {
    const filename = `logo-${tenantId}-${Date.now()}.${file.type.split('/')[1]}`;
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    return { ok: true, logoUrl: blob.url };
  } catch (error) {
    console.error('[uploadLogoAction] Error:', error);
    return { ok: false, error: 'Erro ao salvar imagem no storage.' };
  }
}

export async function getTenantBranding() {
  const { tenantId } = await requireTenant();
  
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      plan: true,
      logoUrl: true,
      primaryColor: true,
      accentColor: true
    }
  });

  return tenant;
}

export async function updateTenantBranding(data: {
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}) {
  const { user, tenantId } = await requireTenant();
  
  // Security check: only allow pro/scale to update branding
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true }
  });

  const permission = checkBrandingPermission(user, tenant);
  if (!permission.canCustomize) {
    throw new Error(permission.message);
  }
  
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      logoUrl: data.logoUrl,
      primaryColor: data.primaryColor,
      accentColor: data.accentColor
    }
  });

  revalidatePath('/(dashboard)', 'layout');
  revalidatePath('/configuracoes');
  
  return { success: true };
}
