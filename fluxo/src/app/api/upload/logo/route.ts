import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/safe-auth';

// Max 500KB — enough for a logo, keeps dashboard fast
const MAX_SIZE_BYTES = 500 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];

export async function POST(req: NextRequest) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      console.error('[upload/logo] Erro: BLOB_READ_WRITE_TOKEN não encontrada no ambiente.');
      return NextResponse.json({ error: 'Configuração do servidor incompleta (Token ausente).' }, { status: 500 });
    }

    const { tenantId } = await requireTenant();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato inválido. Use PNG, JPG, SVG ou WebP.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Máximo permitido: 500KB. Seu arquivo tem ${Math.round(file.size / 1024)}KB.` },
        { status: 400 }
      );
    }

    const ext = file.name.split('.').pop() ?? 'png';
    const filename = `logos/${tenantId}-${Date.now()}.${ext}`;

    const blob = await put(filename, file, {
      access: 'public',
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url }, { status: 200 });
  } catch (err) {
    console.error('[upload/logo]', err);
    return NextResponse.json({ error: 'Erro interno ao fazer upload.' }, { status: 500 });
  }
}
