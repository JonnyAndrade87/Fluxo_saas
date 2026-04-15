import { headers } from 'next/headers';
import prisma from './prisma';

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

/**
 * Retorna o IP do request de forma consistente.
 */
export async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return headersList.get('x-real-ip') || '127.0.0.1';
}

/**
 * Enforces rate limits using a distributed PostgreSQL/Prisma table,
 * guaranteeing multi-instance consistency for serverless lambdas.
 */
export async function enforceRateLimit(
  actionName: string,
  identifier: string,
  config: RateLimitConfig
): Promise<void> {
  const key = `${actionName}:${identifier}`;
  const now = new Date();

  let record = await prisma.rateLimit.findUnique({ where: { key } });

  if (!record) {
    try {
      record = await prisma.rateLimit.create({
        data: {
          key,
          count: 1,
          resetAt: new Date(now.getTime() + config.windowMs)
        }
      });
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err.code === 'P2002') { // Unique constraint violation (Race Condition)
        record = await prisma.rateLimit.update({
          where: { key },
          data: { count: { increment: 1 } }
        });
      } else throw e;
    }
  } else if (now > record.resetAt) {
    // Expired: reset counter
    record = await prisma.rateLimit.update({
      where: { key },
      data: {
        count: 1,
        resetAt: new Date(now.getTime() + config.windowMs)
      }
    });
  } else {
    // Active window: increment
    record = await prisma.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } }
    });
  }

  // Evaluate Threshold
  if (record.count > config.limit) {
    const minLeft = Math.ceil((record.resetAt.getTime() - now.getTime()) / 60000);
    const secsLeft = Math.ceil((record.resetAt.getTime() - now.getTime()) / 1000);
    
    if (minLeft > 1) {
      throw new Error(`Muitas requisições. Tente novamente em ${minLeft} minutos.`);
    } else {
      throw new Error(`Muitas requisições. Tente novamente em ${secsLeft} segundos.`);
    }
  }
}
