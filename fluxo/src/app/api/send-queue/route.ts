import { NextResponse } from 'next/server';
import { processQueue } from '@/lib/queue';
import { requireInternalEndpointAuth } from '@/lib/internalEndpointAuth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/send-queue
 * Retry endpoint — processes all queued/failed messages.
 * Protected by the same CRON_SECRET as the billing cron.
 */
export async function POST(request: Request) {
  const auth = requireInternalEndpointAuth(request);
  if (!auth.ok) {
    console.warn('[SEND-QUEUE] Internal authentication rejected');
    return auth.response;
  }

  try {
    const result = await processQueue(100);
    return NextResponse.json({ success: true, ...result });
  } catch {
    console.error('[SEND-QUEUE] Internal execution error');
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

/**
 * GET /api/send-queue — queue stats (admin debugging)
 */
export async function GET(request: Request) {
  const auth = requireInternalEndpointAuth(request);
  if (!auth.ok) {
    console.warn('[SEND-QUEUE] Internal authentication rejected');
    return auth.response;
  }

  const { default: prisma } = await import('@/lib/prisma');
  const [queued, sent, failed] = await Promise.all([
    prisma.messageQueue.count({ where: { status: 'queued' } }),
    prisma.messageQueue.count({ where: { status: 'sent' } }),
    prisma.messageQueue.count({ where: { status: 'failed' } }),
  ]);

  return NextResponse.json({ success: true, stats: { queued, sent, failed } });
}
