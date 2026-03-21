/**
 * WhatsApp provider wrapper — Z-API
 *
 * Env vars required:
 *   ZAPI_INSTANCE_ID=your-instance-id
 *   ZAPI_TOKEN=your-token
 *   ZAPI_BASE_URL=https://api.z-api.io  (optional, defaults to this)
 *   ZAPI_CLIENT_TOKEN=your-client-token  (optional, for security)
 *
 * Fails gracefully if unconfigured.
 * Phone numbers should be in E.164 format without '+': e.g. "5511999999999"
 */

export interface SendWhatsAppOptions {
  to: string;       // phone in E.164 without +: "5511999999999"
  message: string;  // plain text message
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function isConfigured(): boolean {
  return !!(process.env.ZAPI_INSTANCE_ID && process.env.ZAPI_TOKEN);
}

/**
 * Normalize phone: remove all non-digits, ensure it starts without +
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export async function sendWhatsApp(opts: SendWhatsAppOptions): Promise<SendResult> {
  if (!isConfigured()) {
    console.warn('[WHATSAPP] ZAPI credentials not configured — message queued but not sent.');
    return { success: false, error: 'ZAPI credentials not configured' };
  }

  const baseUrl = process.env.ZAPI_BASE_URL ?? 'https://api.z-api.io';
  const instanceId = process.env.ZAPI_INSTANCE_ID!;
  const token = process.env.ZAPI_TOKEN!;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;

  const phone = normalizePhone(opts.to);
  if (!phone || phone.length < 10) {
    return { success: false, error: `Invalid phone number: "${opts.to}"` };
  }

  const url = `${baseUrl}/instances/${instanceId}/token/${token}/send-text`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (clientToken) headers['Client-Token'] = clientToken;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        phone,
        message: opts.message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.message ?? data?.error ?? `HTTP ${response.status}`;
      console.error('[WHATSAPP] Z-API error:', errMsg);
      return { success: false, error: errMsg };
    }

    // Z-API returns { zaapId, messageId, id } on success
    const messageId = data?.id ?? data?.messageId ?? data?.zaapId;
    console.log(`[WHATSAPP] Sent to ${phone} — messageId: ${messageId}`);
    return { success: true, messageId };
  } catch (err: any) {
    console.error('[WHATSAPP] Fetch error:', err);
    return { success: false, error: err.message ?? 'Network error' };
  }
}
