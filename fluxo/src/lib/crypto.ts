/**
 * src/lib/crypto.ts
 *
 * Server-side AES-256-GCM encryption/decryption utility.
 * Used for encrypting sensitive fields at rest (e.g. mfaSecret).
 *
 * Key strategy:
 *   - Derives a 32-byte key from the env var MFA_SECRET_KEY via SHA-256 hash.
 *   - Each encryption call produces a unique random IV (12 bytes).
 *   - The IV and Auth Tag are stored alongside the ciphertext: "iv:authTag:ciphertext"
 *   - AES-256-GCM provides both confidentiality AND authenticity (AEAD).
 *
 * Environment requirement:
 *   MFA_SECRET_KEY=<min 32 chars random secret>
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM standard
// Auth tag is fixed at 16 bytes for AES-256-GCM (enforced by Node.js crypto module)

function getKey(): Buffer {
  const raw = process.env.MFA_SECRET_KEY;
  if (!raw) {
    throw new Error('[CRYPTO] MFA_SECRET_KEY environment variable is not set');
  }
  // SHA-256 hash of the key string to produce exactly 32 bytes
  return createHash('sha256').update(raw).digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a single string: "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':');
}

/**
 * Decrypts a ciphertext string produced by encrypt().
 * Throws if the auth tag does not match (tampered ciphertext).
 */
export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('[CRYPTO] Invalid encrypted format');
  }
  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Returns true if the value looks like an encrypted string (iv:tag:cipher).
 * Used to guard against double-encryption.
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':');
  return parts.length === 3 && parts[0].length === IV_LENGTH * 2;
}
