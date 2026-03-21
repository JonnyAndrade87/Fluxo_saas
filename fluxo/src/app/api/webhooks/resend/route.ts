import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/resend
 * Receives delivery status events from Resend.
 *
 * Events handled:
 *   email.sent       → status: sent
 *   email.delivered  → status: delivered + deliveredAt
 *   email.opened     → status: read + readAt
 *   email.bounced    → status: failed + errorMessage
 *   email.complained → status: failed + errorMessage
 *
 * Configure in Resend dashboard → Webhooks → add your endpoint:
 *   https://yourdomain.com/api/webhooks/resend
 * Add secret as WEBHOOK_SECRET_RESEND env var for signature verification (optional).
 */
export async function POST(request: Request) {
  try {
    const body = await request.text();
    
    // Optional signature verification (Resend signs with svix)
    // For now we trust the payload — add svix verification for production
    let event: any;
    try {
      event = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const type: string = event?.type ?? '';
    const data = event?.data ?? {};
    const messageId: string = data?.email_id ?? data?.id ?? '';

    if (!messageId) {
      return NextResponse.json({ ok: true, skipped: 'no messageId' });
    }

    // Find the Communication by externalId
    const comm = await prisma.communication.findFirst({
      where: { externalId: messageId }
    });

    if (!comm) {
      // May not have been processed yet or is a test event
      console.log(`[WEBHOOK/RESEND] No Communication found for messageId: ${messageId}`);
      return NextResponse.json({ ok: true, skipped: 'communication not found' });
    }

    const now = new Date();
    let updateData: any = {};

    switch (type) {
      case 'email.sent':
        updateData = { status: 'sent' };
        break;
      case 'email.delivered':
        updateData = { status: 'delivered', deliveredAt: now };
        break;
      case 'email.opened':
        updateData = { status: 'read', readAt: now };
        break;
      case 'email.bounced':
      case 'email.complained':
        updateData = { status: 'failed', errorMessage: `Bounced: ${data?.bounce?.message ?? type}` };
        break;
      default:
        console.log(`[WEBHOOK/RESEND] Unhandled event type: ${type}`);
        return NextResponse.json({ ok: true, skipped: `unhandled type: ${type}` });
    }

    await prisma.communication.update({
      where: { id: comm.id },
      data: updateData,
    });

    console.log(`[WEBHOOK/RESEND] Updated comm ${comm.id} → ${updateData.status}`);
    return NextResponse.json({ ok: true, updated: comm.id, status: updateData.status });

  } catch (err: any) {
    console.error('[WEBHOOK/RESEND ERROR]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
