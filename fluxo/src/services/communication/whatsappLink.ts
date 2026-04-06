/**
 * whatsappLink.ts
 * Generates wa.me deep links with pre-filled messages.
 * Handles Brazilian phone number normalization.
 *
 * NOTE: This is the manual-mode sending helper.
 * It does NOT call any external API. It is compatible with future automated senders.
 */

/**
 * Normalizes a Brazilian phone number to E.164 format (55DDDNUMBER).
 * Accepts formats: (41) 9 9999-9999 / 41999999999 / +5541999999999
 */
export function normalizeBrazilianPhone(raw: string): string {
  // Strip everything except digits
  const digits = raw.replace(/\D/g, '');

  // If already has country code (55) and full length (12 or 13 digits)
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }

  // If 10 or 11 digits (DDD + number), prepend 55
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  // Return as-is if format is unrecognized — avoid silently breaking
  return digits;
}

/**
 * Builds a wa.me link with an optional pre-filled message.
 */
export function buildWhatsAppLink(phone: string, message?: string): string {
  const normalized = normalizeBrazilianPhone(phone);
  if (!message) {
    return `https://wa.me/${normalized}`;
  }
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${normalized}?text=${encoded}`;
}

/**
 * Returns true if the phone string can be normalized to a valid E.164 number.
 */
export function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  const normalized = normalizeBrazilianPhone(raw);
  return normalized.startsWith('55') && (digits.length >= 10 && digits.length <= 13);
}
