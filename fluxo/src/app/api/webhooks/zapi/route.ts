import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/zapi
 * Receives delivery/read status events from Z-API.
 *
 * Z-API event types (relevant ones):
 *   DELIVERY_ACK   → delivered to device
 *   READ           → read by recipient
 *   MESSAGE_ERROR  → send failed
 *
 * Configure in Z-API dashboard → Webhooks.
 * Add ZAPI_WEBHOOK_TOKEN env var to verify requests.
 */
export async function POST(request: Request) {
  try {
    // Optional token verification
    const zapiToken = process.env.ZAPI_WEBHOOK_TOKEN;
    if (zapiToken) {
      const token = request.headers.get('x-zapi-token') ?? request.headers.get('authorization');
      if (token !== zapiToken && token !== `Bearer ${zapiToken}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.text();
    let event: any;
    try {
      event = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Z-API sends events as { type, messageId, ... } or { event, zaapId, ... }
    const type: string = event?.type ?? event?.event ?? '';
    const messageId: string = event?.messageId ?? event?.zaapId ?? event?.id ?? '';

    if (!messageId) {
      return NextResponse.json({ ok: true, skipped: 'no messageId' });
    }

    const comm = await prisma.communication.findFirst({
      where: { externalId: messageId }
    });

    if (!comm) {
      console.log(`[WEBHOOK/ZAPI] No Communication found for messageId: ${messageId}`);
      return NextResponse.json({ ok: true, skipped: 'communication not found' });
    }

    const now = new Date();
    let updateData: any = {};

    // Normalize event types from different Z-API versions
    const typeUpper = type.toUpperCase();

    if (typeUpper.includes('DELIVERY') || typeUpper === 'DELIVERY_ACK') {
      updateData = { status: 'delivered', deliveredAt: now };
    } else if (typeUpper === 'READ' || typeUpper.includes('READ')) {
      updateData = { status: 'read', readAt: now };
    } else if (typeUpper.includes('ERROR') || typeUpper.includes('FAIL')) {
      updateData = { status: 'failed', errorMessage: event?.error ?? `Z-API event: ${type}` };
    } else {
      console.log(`[WEBHOOK/ZAPI] Unhandled event type: ${type}`);
      return NextResponse.json({ ok: true, skipped: `unhandled type: ${type}` });
    }

    await prisma.communication.update({
      where: { id: comm.id },
      data: updateData,
    });

    console.log(`[WEBHOOK/ZAPI] Updated comm ${comm.id} → ${updateData.status}`);
    return NextResponse.json({ ok: true, updated: comm.id, status: updateData.status });

  } catch (err: any) {
    console.error('[WEBHOOK/ZAPI ERROR]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
