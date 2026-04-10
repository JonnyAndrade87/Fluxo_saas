import { NextResponse } from 'next/server';
import { processQueue } from '@/lib/queue';

export const dynamic = 'force-dynamic';

/**
 * POST /api/send-queue
 * Retry endpoint — processes all queued/failed messages.
 * Protected by the same CRON_SECRET as the billing cron.
 */
export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const result = await processQueue(100);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[SEND-QUEUE ERROR]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/send-queue — queue stats (admin debugging)
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  const { default: prisma } = await import('@/lib/prisma');
  const [queued, sent, failed] = await Promise.all([
    prisma.messageQueue.count({ where: { status: 'queued' } }),
    prisma.messageQueue.count({ where: { status: 'sent' } }),
    prisma.messageQueue.count({ where: { status: 'failed' } }),
  ]);

  return NextResponse.json({ success: true, stats: { queued, sent, failed } });
}
