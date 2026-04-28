import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Mask PII for safe logging
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes('@')) return '***';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `****@${domain}`;
  return `${user.slice(0, 2)}***@${domain}`;
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '***';
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 4) return '****';
  return `****${clean.slice(-4)}`;
}

