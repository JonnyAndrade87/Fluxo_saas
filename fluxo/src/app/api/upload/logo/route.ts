import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenantApi } from '@/lib/safe-auth';
import { checkBrandingPermission } from '@/lib/permissions-shared';

const MAX_SIZE_BYTES = 500 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export async function POST(req: NextRequest) {
  try {
    const authData = await requireTenantApi();
    
    if (!authData) {
      console.warn('[upload/logo] 401: No session found.');
      return NextResponse.json({ 
        ok: false, 
        code: 'UNAUTHENTICATED', 
        error: 'Sua sessão expirou. Faça login novamente.' 
      }, { status: 401 });
    }

    const { user, tenantId } = authData;
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, plan: true, subscriptionStatus: true }
    });

    const permission = checkBrandingPermission(user, tenant);

    // EXTREME DIAGNOSTIC LOG (SAFE)
    const userKeys = Object.keys(user);
    const maskedUser = { ...user } as any;
    if (maskedUser.email) maskedUser.email = maskedUser.email.substring(0,3) + '...@' + maskedUser.email.split('@')[1];
    if (maskedUser.id) maskedUser.id = maskedUser.id.substring(0,8) + '...';
    if (maskedUser.tenantId) maskedUser.tenantId = maskedUser.tenantId.substring(0,8) + '...';

    console.log(`[upload/logo] Deep Checkup:
      User Keys: ${userKeys.join(', ')}
      User Data: ${JSON.stringify(maskedUser)}
      Tenant ID: ${tenantId.substring(0,8)}...
      Tenant Plan: ${tenant?.plan}
      Tenant Status: ${tenant?.subscriptionStatus}
      Permission: ${permission.canCustomize ? 'GRANTED' : 'DENIED (' + permission.reason + ')'}
    `);

    // MASKED DIAGNOSTIC FOR USER RESPONSE
    const diag = {
      userId: user.id.substring(0, 8) + '...',
      email: user.email?.substring(0, 3) + '...@' + user.email?.split('@')[1],
      tenantId: tenantId.substring(0, 8) + '...',
      tenantName: tenant?.name,
      plan: tenant?.plan,
      subscriptionStatus: tenant?.subscriptionStatus,
      role: user.role,
      authenticated: true,
      roleIsAdmin: user.role === 'admin',
      planAllowsBranding: tenant?.plan === 'pro' || tenant?.plan === 'scale',
      canUploadLogo: permission.canCustomize,
      sessionKeys: userKeys
    };

    if (!permission.canCustomize) {
      return NextResponse.json({ 
        ok: false, 
        code: permission.reason, 
        error: permission.message,
        diag // Including masked diagnostic in the response for debugging
      }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ ok: false, code: 'BAD_REQUEST', error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ ok: false, code: 'INVALID_FILE_TYPE', error: 'Envie uma imagem PNG, JPG ou WebP.' }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ ok: false, code: 'FILE_TOO_LARGE', error: 'O arquivo precisa ter até 500KB.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { logoUrl: dataUrl }
    });

    return NextResponse.json({ ok: true, logoUrl: dataUrl }, { status: 200 });
  } catch (err: any) {
    console.error('[upload/logo] Error:', err);
    return NextResponse.json({ 
      ok: false, 
      code: 'INTERNAL_ERROR', 
      error: 'Não foi possível salvar o logotipo agora.' 
    }, { status: 500 });
  }
}
