import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'fluxo-webhook-token-2026';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WA Webhook] Verificado com sucesso pela Meta.');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.object === 'whatsapp_business_account') {
      if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.statuses) {
        const statuses = body.entry[0].changes[0].value.statuses;
        for (const status of statuses) {
          const wamid = status.id;
          const msgStatus = status.status; // 'sent', 'delivered', 'read', 'failed'
          
          if (wamid) {
             const result = await prisma.communication.updateMany({
               where: { externalId: wamid },
               data: { status: msgStatus }
             });
             if (result.count > 0) {
                 console.log(`[WA Webhook] Mensagem ${wamid} atualizada para o status: ${msgStatus}`);
             }
          }
        }
      }
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Not a WhatsApp API event' }, { status: 404 });
    }
  } catch (error) {
    console.error('[WA Webhook] Internal Error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
