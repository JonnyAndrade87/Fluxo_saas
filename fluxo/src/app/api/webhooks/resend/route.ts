import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyResendSignature } from '@/lib/webhookVerify';

export const dynamic = 'force-dynamic';

function logAuthFailure(code?: string) {
  console.warn(`[WEBHOOK/RESEND] Authentication failed (${code ?? 'unknown'})`);
}

// Simple in-memory rate limit store
const webhookRateLimitStore = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string, limit: number = 1000, windowMs: number = 60000): boolean {
  const now = Date.now();
  const entry = webhookRateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    webhookRateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (entry.count < limit) {
    entry.count++;
    return false;
  }

  return true;
}

/**
 * POST /api/webhooks/resend
 * Receives delivery status events from Resend.
 * Signature verified via svix (WEBHOOK_SECRET_RESEND env var).
 */
export async function POST(request: Request) {
  try {
    // ── Rate limiting (prevent abuse) ──────────────────────────────────────
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(`resend-webhook:${clientIp}`, 1000, 60000)) {
      console.warn(`[WEBHOOK/RESEND] Rate limit exceeded for IP: ${clientIp}`);
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const body = await request.text();

    // ── Signature verification (hardening) ──────────────────────────────────
    const verification = await verifyResendSignature(body, request.headers);
    if (!verification.valid) {
      logAuthFailure(verification.code);
      return NextResponse.json(
        { error: 'Unauthorized webhook request', code: verification.code },
        { status: verification.status ?? 401 },
      );
    }

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

    // Find the Communication by externalId and verify it exists
    const comm = await prisma.communication.findFirst({
      where: { externalId: messageId }
    });

    if (!comm) {
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

    // Validate tenant ownership before updating
    if (!comm.tenantId) {
      console.warn(`[WEBHOOK/RESEND] Communication ${comm.id} has no tenantId - skipping update`);
      return NextResponse.json({ ok: true, skipped: 'invalid communication record' });
    }

    await prisma.communication.update({
      where: { id: comm.id },
      data: updateData,
    });

    console.log(`[WEBHOOK/RESEND] Updated comm ${comm.id} (tenant: ${comm.tenantId}) → ${updateData.status}`);
    return NextResponse.json({ ok: true, updated: comm.id, status: updateData.status });

  } catch (err: any) {
    console.error('[WEBHOOK/RESEND] Internal error');
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
