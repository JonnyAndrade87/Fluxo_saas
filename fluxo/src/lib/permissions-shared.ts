export type BrandingPermission = {
  canCustomize: boolean;
  reason: 'PLAN_REQUIRED' | 'FORBIDDEN' | 'UNAUTHENTICATED' | null;
  message: string;
};

/**
 * Single source of truth for branding customization permissions.
 * This function is SHARED between Frontend and Backend, so it must NOT
 * import server-only modules like prisma or next-auth.
 */
export function checkBrandingPermission(
  user: { role?: string | null } | null | undefined,
  tenant: { plan: string } | null | undefined
): BrandingPermission {
  if (!user) {
    return {
      canCustomize: false,
      reason: 'UNAUTHENTICATED',
      message: 'Sua sessão expirou. Faça login novamente.',
    };
  }

  if (user.role !== 'admin') {
    return {
      canCustomize: false,
      reason: 'FORBIDDEN',
      message: 'Você não tem permissão para alterar a personalização da conta. Apenas administradores podem realizar esta ação.',
    };
  }

  const isPro = tenant?.plan === 'pro' || tenant?.plan === 'scale';
  if (!isPro) {
    return {
      canCustomize: false,
      reason: 'PLAN_REQUIRED',
      message: 'A personalização do logotipo está disponível apenas no plano Pro ou superior.',
    };
  }

  return {
    canCustomize: true,
    reason: null,
    message: 'Permissão concedida.',
  };
}
