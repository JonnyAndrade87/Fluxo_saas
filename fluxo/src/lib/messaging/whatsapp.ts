/**
 * WhatsApp provider — Meta WhatsApp Business API (Graph API v22.0)
 *
 * Env vars required:
 *   WHATSAPP_ACCESS_TOKEN      - permanent/long-lived access token from Meta
 *   WHATSAPP_PHONE_NUMBER_ID   - Phone Number ID from Meta Business Manager
 *   WHATSAPP_BUSINESS_ACCOUNT_ID - Business Account ID (used for webhooks/reporting)
 *
 * Phone numbers should be in E.164 format without '+': e.g. "5511999999999"
 *
 * IMPORTANT: The Meta API only allows sending FREE-FORM text messages within
 * a 24h customer-initiated session. For business-initiated messages you must
 * use approved templates. This lib sends free-text messages (suitable for
 * replies within a session) AND template messages.
 */

const GRAPH_API_VERSION = 'v22.0';
const GRAPH_API_BASE = 'https://graph.facebook.com';

export interface SendWhatsAppOptions {
  to: string;        // E.164 without '+': "5511999999999"
  message: string;   // plain text — sent as free-form text message
}

export interface SendWhatsAppTemplateOptions {
  to: string;
  templateName: string;    // must be an approved template in Meta Business Manager
  languageCode?: string;   // default: 'pt_BR'
  components?: object[];   // template variable substitutions
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/** Normalize phone: remove all non-digits */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function getConfig() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return { accessToken, phoneNumberId };
}

function isConfigured(): boolean {
  const { accessToken, phoneNumberId } = getConfig();
  return !!(accessToken && phoneNumberId);
}

/**
 * Send a free-text WhatsApp message via Meta Cloud API.
 * Works only inside an active 24h customer-initiated session window.
 */
export async function sendWhatsApp(opts: SendWhatsAppOptions): Promise<SendResult> {
  if (!isConfigured()) {
    console.warn('[WHATSAPP] Meta credentials not configured — message not sent.');
    return { success: false, error: 'WhatsApp credentials not configured' };
  }

  const phone = normalizePhone(opts.to);
  if (!phone || phone.length < 10) {
    return { success: false, error: `Invalid phone number: "${opts.to}"` };
  }

  const { accessToken, phoneNumberId } = getConfig();
  const url = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'text',
        text: { preview_url: false, body: opts.message },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.error?.message ?? `HTTP ${response.status}`;
      console.error('[WHATSAPP] Meta API error:', errMsg, data);
      return { success: false, error: errMsg };
    }

    const messageId = data?.messages?.[0]?.id;
    console.log(`[WHATSAPP] Sent to ${phone} — messageId: ${messageId}`);
    return { success: true, messageId };
  } catch (err: any) {
    console.error('[WHATSAPP] Fetch error:', err);
    return { success: false, error: err.message ?? 'Network error' };
  }
}

/**
 * Send a template-based WhatsApp message (business-initiated).
 * Templates must be approved in Meta Business Manager first.
 */
export async function sendWhatsAppTemplate(opts: SendWhatsAppTemplateOptions): Promise<SendResult> {
  if (!isConfigured()) {
    console.warn('[WHATSAPP] Meta credentials not configured — template not sent.');
    return { success: false, error: 'WhatsApp credentials not configured' };
  }

  const phone = normalizePhone(opts.to);
  if (!phone || phone.length < 10) {
    return { success: false, error: `Invalid phone number: "${opts.to}"` };
  }

  const { accessToken, phoneNumberId } = getConfig();
  const url = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
          name: opts.templateName,
          language: { code: opts.languageCode ?? 'pt_BR' },
          ...(opts.components ? { components: opts.components } : {}),
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.error?.message ?? `HTTP ${response.status}`;
      console.error('[WHATSAPP] Meta Template API error:', errMsg, data);
      return { success: false, error: errMsg };
    }

    const messageId = data?.messages?.[0]?.id;
    console.log(`[WHATSAPP] Template "${opts.templateName}" sent to ${phone} — messageId: ${messageId}`);
    return { success: true, messageId };
  } catch (err: any) {
    console.error('[WHATSAPP] Template fetch error:', err);
    return { success: false, error: err.message ?? 'Network error' };
  }
}

