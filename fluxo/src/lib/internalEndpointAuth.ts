import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';

export type InternalAuthResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

function safeEqualStrings(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function extractBearerToken(headerValue: string | null): string | null {
  if (!headerValue) return null;
  if (!headerValue.startsWith('Bearer ')) return null;

  const token = headerValue.slice(7).trim();
  return token || null;
}

export function requireInternalEndpointAuth(
  request: Request,
  envName: string = 'CRON_SECRET',
): InternalAuthResult {
  const secret = process.env[envName]?.trim();

  if (!secret) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Service unavailable' },
        { status: 503 },
      ),
    };
  }

  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      ),
    };
  }

  if (!safeEqualStrings(token, secret)) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      ),
    };
  }

  return { ok: true };
}
