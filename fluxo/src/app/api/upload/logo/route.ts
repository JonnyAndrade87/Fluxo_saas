import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';

// Max 500KB — enough for a logo, keeps dashboard fast
const MAX_SIZE_BYTES = 500 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];

export async function POST(req: NextRequest) {
  try {
    // 1. Check token via JWT directly (works in Route Handlers, no redirect)
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json({ ok: false, error: 'Sessão expirada. Faça login novamente.' }, { status: 401 });
    }

    const tenantId = token.tenantId as string | undefined;
    if (!tenantId) {
      return NextResponse.json({ ok: false, error: 'Tenant não identificado.' }, { status: 403 });
    }

    const userId = token.sub || (token as any).id;
    if (userId) {
      const tenantUser = await prisma.tenantUser.findUnique({
        where: { tenantId_userId: { tenantId, userId: userId as string } }
      });
      // Allow if admin. If we need to allow operators as well, we can relax this.
      // The user prompt: "Usuário sem permissão não pode alterar logo. Confirmar: admin pode alterar, operator/viewer não devem alterar se a regra atual impedir"
      if (!tenantUser || tenantUser.role !== 'admin') {
        return NextResponse.json({ ok: false, error: 'Acesso negado. Apenas administradores podem alterar o logotipo da empresa.' }, { status: 403 });
      }
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: 'Formato inválido. Use PNG, JPG, SVG ou WebP.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { ok: false, error: `O arquivo precisa ter até 500KB.` },
        { status: 400 }
      );
    }

    // MVP Fallback: Convert to base64 Data URL and save directly to DB
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { logoUrl: dataUrl }
    });

    // Logging without sensitive data
    console.log(`[upload/logo] Upload realizado com sucesso. Tenant: ${tenantId}, Tipo: ${file.type}, Tamanho: ${file.size} bytes`);

    return NextResponse.json({ ok: true, logoUrl: dataUrl }, { status: 200 });
  } catch (err: any) {
    console.error('[upload/logo] Erro geral:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Erro interno ao fazer upload.' }, { status: 500 });
  }
}
