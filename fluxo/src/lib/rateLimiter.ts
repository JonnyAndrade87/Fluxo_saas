/**
 * Rate Limiter — Message Engine Hardening
 *
 * Checks whether a message to a given customer is within allowed send limits.
 * Defaults:
 *   - Per customer: 10 messages / hour, 30 messages / day
 *   - Per tenant:   50 messages / hour (burst), 200 / day
 *
 * Configurable via env vars:
 *   MSG_LIMIT_CUSTOMER_HOUR  (default: 10)
 *   MSG_LIMIT_CUSTOMER_DAY   (default: 30)
 *   MSG_LIMIT_TENANT_HOUR    (default: 50)
 *   MSG_LIMIT_TENANT_DAY     (default: 200)
 */

import prisma from '@/lib/db';

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfterMinutes?: number;
}

const CUSTOMER_LIMIT_HOUR = parseInt(process.env.MSG_LIMIT_CUSTOMER_HOUR ?? '10', 10);
const CUSTOMER_LIMIT_DAY  = parseInt(process.env.MSG_LIMIT_CUSTOMER_DAY ?? '30', 10);
const TENANT_LIMIT_HOUR   = parseInt(process.env.MSG_LIMIT_TENANT_HOUR ?? '50', 10);
const TENANT_LIMIT_DAY    = parseInt(process.env.MSG_LIMIT_TENANT_DAY ?? '200', 10);

export async function checkRateLimit(
  tenantId: string,
  customerId: string
): Promise<RateLimitResult> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo  = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Check customer hourly limit
  const customerHour = await prisma.communication.count({
    where: {
      tenantId,
      customerId,
      createdAt: { gte: oneHourAgo },
      status: { notIn: ['failed', 'queued'] },
    },
  });
  if (customerHour >= CUSTOMER_LIMIT_HOUR) {
    return {
      allowed: false,
      reason: `Customer rate limit exceeded: ${customerHour}/${CUSTOMER_LIMIT_HOUR} messages in the last hour`,
      retryAfterMinutes: 60,
    };
  }

  // Check customer daily limit
  const customerDay = await prisma.communication.count({
    where: {
      tenantId,
      customerId,
      createdAt: { gte: oneDayAgo },
      status: { notIn: ['failed', 'queued'] },
    },
  });
  if (customerDay >= CUSTOMER_LIMIT_DAY) {
    return {
      allowed: false,
      reason: `Customer daily limit exceeded: ${customerDay}/${CUSTOMER_LIMIT_DAY} messages today`,
      retryAfterMinutes: 60 * 24,
    };
  }

  // Check tenant hourly limit (burst protection)
  const tenantHour = await prisma.communication.count({
    where: {
      tenantId,
      createdAt: { gte: oneHourAgo },
      status: { notIn: ['failed', 'queued'] },
    },
  });
  if (tenantHour >= TENANT_LIMIT_HOUR) {
    return {
      allowed: false,
      reason: `Tenant hourly burst limit exceeded: ${tenantHour}/${TENANT_LIMIT_HOUR}`,
      retryAfterMinutes: 60,
    };
  }

  // Check tenant daily limit
  const tenantDay = await prisma.communication.count({
    where: {
      tenantId,
      createdAt: { gte: oneDayAgo },
      status: { notIn: ['failed', 'queued'] },
    },
  });
  if (tenantDay >= TENANT_LIMIT_DAY) {
    return {
      allowed: false,
      reason: `Tenant daily limit exceeded: ${tenantDay}/${TENANT_LIMIT_DAY}`,
      retryAfterMinutes: 60 * 24,
    };
  }

  return { allowed: true };
}
