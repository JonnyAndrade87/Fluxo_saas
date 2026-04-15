'use server';

import { verify, generateSecret } from 'otplib';
import QRCode from 'qrcode';
import prisma from '@/lib/prisma';
import { auth } from '../../auth';
import { cookies } from 'next/headers';
import { logAudit } from '@/lib/audit';
import { AUDIT_ACTIONS } from '@/lib/permissions';
import { encrypt, decrypt } from '@/lib/crypto';
import { createHmac, timingSafeEqual } from 'crypto';

// ─── MFA cookie helpers ───────────────────────────────────────────────────────

const MFA_COOKIE_TTL = 60 * 60 * 24; // 24 hours in seconds
const MFA_COOKIE_NAME = 'mfa_verified';

function getMfaCookieSecret(): string {
  const key = process.env.MFA_SECRET_KEY;
  if (!key) throw new Error('[MFA] MFA_SECRET_KEY is not set');
  return key;
}

/**
 * Creates an HMAC-signed cookie value bound to userId and expiry.
 * Format: "<userId>:<expiresAt>:<hmac>"
 */
function signMfaCookie(userId: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + MFA_COOKIE_TTL;
  const payload = `${userId}:${expiresAt}`;
  const sig = createHmac('sha256', getMfaCookieSecret()).update(payload).digest('hex');
  return `${payload}:${sig}`;
}

/**
 * Validates an HMAC-signed MFA cookie value.
 * Returns true only if the signature is valid, the userId matches, and the token hasn't expired.
 */
function verifyMfaCookie(cookieValue: string, expectedUserId: string): boolean {
  try {
    const parts = cookieValue.split(':');
    if (parts.length !== 3) return false;
    const [userId, expiresAt, sig] = parts;
    if (userId !== expectedUserId) return false;
    const now = Math.floor(Date.now() / 1000);
    if (parseInt(expiresAt, 10) < now) return false;
    const payload = `${userId}:${expiresAt}`;
    const expected = createHmac('sha256', getMfaCookieSecret()).update(payload).digest();
    const actual = Buffer.from(sig, 'hex');
    // Timing-safe comparison to prevent timing attacks
    if (expected.length !== actual.length) return false;
    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}


/**
 * Backend MFA gate — enforces that an admin has completed MFA before
 * executing sensitive server actions directly. This runs INDEPENDENTLY
 * of the middleware redirect, so it cannot be bypassed by direct API calls.
 *
 * Validates: cookie present + HMAC signature valid + userId matches session + not expired.
 */
async function requireMfaVerified(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('UNAUTHORIZED');

  const isAdmin = session.user.role === 'admin' || session.user.isSuperAdmin;
  if (!isAdmin) return; // non-admins not required

  const cookieStore = await cookies();
  const mfaCookie = cookieStore.get(MFA_COOKIE_NAME);
  if (!mfaCookie?.value || !verifyMfaCookie(mfaCookie.value, session.user.id)) {
    throw new Error('MFA_NOT_VERIFIED: Admin must complete MFA challenge before performing this action.');
  }
}

// Export for use in other server actions that need backend MFA enforcement
export { requireMfaVerified };

/**
 * Generates a new TOTP secret for the logged-in admin.
 * Returns ONLY the QR Code DataURL.
 * The raw secret is kept briefly in memory in the setup page — it is
 * NOT persisted here. Persistence happens in verifyAndEnableMfa only
 * after the user proves they own the authenticator.
 */
export async function generateMfaSecret() {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== 'admin' && !session.user.isSuperAdmin)) {
    throw new Error('Unauthorized for MFA setup');
  }

  const userEmail = session.user.email!;
  const secret = generateSecret();
  const otpauth = `otpauth://totp/Fluxeer:${encodeURIComponent(userEmail)}?secret=${secret}&issuer=Fluxeer`;
  const qrCodeUrl = await QRCode.toDataURL(otpauth);

  await logAudit({
    tenantId: session.user.tenantId || 'SYSTEM',
    userId: session.user.id,
    userRole: 'admin',
    action: AUDIT_ACTIONS.AUTH_MFA_SETUP,
    entityType: 'AUTH',
    entityId: session.user.id,
    metadata: { email: userEmail, stage: 'secret_generated' }
  });

  return { secret, qrCodeUrl };
}

/**
 * Verifies the first TOTP token and enables MFA for the user.
 * Encrypts the secret with AES-256-GCM BEFORE saving it to the database.
 * Sets the 'mfa_verified' HttpOnly cookie on success.
 */
export async function verifyAndEnableMfa(secret: string, token: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const isValid = verify({ token, secret });
  if (!isValid) {
    await logAudit({
      tenantId: session.user.tenantId || 'SYSTEM',
      userId: session.user.id,
      userRole: 'admin',
      action: AUDIT_ACTIONS.AUTH_MFA_FAILED,
      entityType: 'AUTH',
      entityId: session.user.id,
      metadata: { error: 'Invalid activation token', stage: 'setup' }
    });
    return { success: false, error: 'Código inválido' };
  }

  // Encrypt the raw TOTP secret before persisting.
  // Format stored in DB: "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
  const encryptedSecret = encrypt(secret);

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      mfaSecret: encryptedSecret,
      mfaEnabled: true,
    },
  });

  // Set session-bound verification cookie
  const cookieStore = await cookies();
  cookieStore.set(MFA_COOKIE_NAME, signMfaCookie(session.user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MFA_COOKIE_TTL,
    path: '/',
  });

  await logAudit({
    tenantId: session.user.tenantId || 'SYSTEM',
    userId: session.user.id,
    userRole: 'admin',
    action: AUDIT_ACTIONS.AUTH_MFA_VERIFIED,
    entityType: 'AUTH',
    entityId: session.user.id,
    metadata: { stage: 'setup_complete' }
  });

  return { success: true };
}

/**
 * Validates the MFA challenge for an already-enabled user.
 * Decrypts the stored AES-256-GCM secret before passing to TOTP verify.
 */
export async function verifyMfaChallenge(token: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { mfaSecret: true, mfaEnabled: true }
  });

  if (!user?.mfaEnabled || !user.mfaSecret) {
    throw new Error('MFA not enabled for this user');
  }

  // Decrypt before passing to the TOTP verifier
  const plainSecret = decrypt(user.mfaSecret);

  const isValid = verify({ token, secret: plainSecret });
  if (!isValid) {
    await logAudit({
      tenantId: session.user.tenantId || 'SYSTEM',
      userId: session.user.id,
      userRole: 'admin',
      action: AUDIT_ACTIONS.AUTH_MFA_FAILED,
      entityType: 'AUTH',
      entityId: session.user.id,
      metadata: { error: 'Invalid token' }
    });
    return { success: false, error: 'Código inválido' };
  }

  // Set session-bound verification cookie
  const cookieStore = await cookies();
  cookieStore.set(MFA_COOKIE_NAME, signMfaCookie(session.user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MFA_COOKIE_TTL,
    path: '/',
  });

  await logAudit({
    tenantId: session.user.tenantId || 'SYSTEM',
    userId: session.user.id,
    userRole: 'admin',
    action: AUDIT_ACTIONS.AUTH_MFA_VERIFIED,
    entityType: 'AUTH',
    entityId: session.user.id,
    metadata: { method: 'challenge' }
  });

  return { success: true };
}
