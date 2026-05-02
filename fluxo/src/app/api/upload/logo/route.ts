import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenantApi } from '@/lib/safe-auth';

// Max 500KB — enough for a logo, keeps dashboard fast
const MAX_SIZE_BYTES = 500 * 1024;
// SVG removed as per instructions
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate and identify tenant
    const authData = await requireTenantApi();
    if (!authData) {
      return NextResponse.json({ 
        ok: false, 
        code: 'UNAUTHENTICATED',
        error: 'Sua sessão expirou. Faça login novamente.' 
      }, { status: 401 });
    }

    const { user, tenantId } = authData;

    // 2. Fetch tenant to check plan
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true }
    });

    if (!tenant) {
      return NextResponse.json({ 
        ok: false, 
        code: 'NOT_FOUND',
        error: 'Tenant não encontrado.' 
      }, { status: 404 });
    }

    // 3. Permission Check: Must be Admin
    if (user.role !== 'admin') {
      return NextResponse.json({ 
        ok: false, 
        code: 'FORBIDDEN',
        error: 'Você não tem permissão para alterar a personalização da conta.' 
      }, { status: 403 });
    }

    // 4. Plan Check: Must be Pro or Scale
    const isPro = tenant.plan === 'pro' || tenant.plan === 'scale';
    if (!isPro) {
      return NextResponse.json({ 
        ok: false, 
        code: 'PLAN_REQUIRED',
        error: 'Personalização disponível no plano Pro.' 
      }, { status: 403 });
    }

    // 5. Parse and validate file
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ 
        ok: false, 
        code: 'BAD_REQUEST',
        error: 'Nenhum arquivo enviado.' 
      }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        ok: false, 
        code: 'INVALID_FILE_TYPE',
        error: 'Envie uma imagem PNG, JPG ou WebP.' 
      }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ 
        ok: false, 
        code: 'FILE_TOO_LARGE',
        error: 'O arquivo precisa ter até 500KB.' 
      }, { status: 400 });
    }

    // 6. MVP Fallback: Convert to base64 and save to DB
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { logoUrl: dataUrl }
    });

    console.log(`[upload/logo] Success. Tenant: ${tenantId}, Plan: ${tenant.plan}, User: ${user.id}`);

    return NextResponse.json({ ok: true, logoUrl: dataUrl }, { status: 200 });
  } catch (err: any) {
    console.error('[upload/logo] Error:', err);
    return NextResponse.json({ 
      ok: false, 
      code: 'INTERNAL_ERROR',
      error: 'Não foi possível salvar o logotipo agora. Tente novamente em instantes.' 
    }, { status: 500 });
  }
}
