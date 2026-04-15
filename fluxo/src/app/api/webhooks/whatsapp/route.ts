import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  verifyWhatsAppChallenge,
  verifyWhatsAppSignature,
} from '@/lib/webhookVerify';

function logAuthFailure(code?: string) {
  console.warn(`[WEBHOOK/WHATSAPP] Authentication failed (${code ?? 'unknown'})`);
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verification = verifyWhatsAppChallenge(mode, token);
  if (!verification.valid) {
    logAuthFailure(verification.code);
    return NextResponse.json(
      { error: 'Webhook challenge rejected', code: verification.code },
      { status: verification.status ?? 403 },
    );
  }

  return new NextResponse(challenge ?? '', { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const verification = verifyWhatsAppSignature(rawBody, req.headers);
    if (!verification.valid) {
      logAuthFailure(verification.code);
      return NextResponse.json(
        { error: 'Unauthorized webhook request', code: verification.code },
        { status: verification.status ?? 401 },
      );
    }

    interface WhatsAppWebhookBody {
      object: string;
      entry?: Array<{
        changes?: Array<{
          value?: {
            statuses?: Array<{
              id: string;
              status: string;
            }>;
          };
        }>;
      }>;
    }
    let body: WhatsAppWebhookBody;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    if (body.object === 'whatsapp_business_account') {
      const firstChange = body.entry?.[0]?.changes?.[0];
      if (firstChange?.value?.statuses) {
        const statuses = firstChange.value.statuses;
        for (const status of statuses) {
          const wamid = status.id;
          const msgStatus = status.status; // 'sent', 'delivered', 'read', 'failed'
          
          if (wamid) {
             const result = await prisma.communication.updateMany({
               where: { externalId: wamid },
               data: { status: msgStatus }
              });
              if (result && result.count > 0) {
                  console.log(`[WEBHOOK/WHATSAPP] Updated message status to ${msgStatus}`);
              }
           }
        }
      }
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Not a WhatsApp API event' }, { status: 404 });
    }
  } catch (error: unknown) {
    console.error('[WEBHOOK/WHATSAPP] Internal error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
