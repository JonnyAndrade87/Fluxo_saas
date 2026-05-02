'use server';

import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/safe-auth';
import { revalidatePath } from 'next/cache';
import { checkBrandingPermission } from '@/lib/permissions';

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
