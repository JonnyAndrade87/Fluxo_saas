/**
 * Email provider wrapper — Resend
 *
 * Env vars required:
 *   RESEND_API_KEY=re_...
 *   RESEND_FROM_EMAIL=noreply@yourdomain.com
 *
 * Fails gracefully: returns { success: false, error } if unconfigured.
 */

import { Resend } from 'resend';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

export async function sendEmail(opts: SendEmailOptions): Promise<SendResult> {
  const client = getResend();

  if (!client) {
    console.warn('[EMAIL] RESEND_API_KEY not configured — message queued but not sent.');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  const from = process.env.RESEND_FROM_EMAIL ?? 'noreply@fluxo.app';

  try {
    const { data, error } = await client.emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });

    if (error) {
      console.error('[EMAIL] Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log(`[EMAIL] Sent to ${opts.to} — messageId: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (err: any) {
    console.error('[EMAIL] Unexpected error:', err);
    return { success: false, error: err.message ?? 'Unknown error' };
  }
}

/**
 * Build a professional billing email HTML.
 */
export function buildBillingEmailHtml({
  customerName,
  invoiceNumber,
  amount,
  dueDate,
  messageBody,
  senderName = 'Fluxo Financeiro',
}: {
  customerName: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  messageBody: string;
  senderName?: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aviso de Cobrança</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);padding:32px 40px;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Aviso de Cobrança</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">${senderName}</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 24px;color:#374151;font-size:16px;">Olá, <strong>${customerName}</strong></p>
            <p style="margin:0 0 32px;color:#6B7280;font-size:15px;line-height:1.6;">${messageBody}</p>
            <!-- Invoice Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;margin-bottom:32px;">
              <tr><td style="padding:24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#6B7280;font-size:13px;">Fatura</td>
                    <td align="right" style="color:#111827;font-size:13px;font-weight:600;">#${invoiceNumber}</td>
                  </tr>
                  <tr><td colspan="2" style="padding:8px 0;border-bottom:1px solid #E5E7EB;"></td></tr>
                  <tr>
                    <td style="padding-top:12px;color:#6B7280;font-size:13px;">Valor</td>
                    <td align="right" style="padding-top:12px;color:#111827;font-size:18px;font-weight:700;">${amount}</td>
                  </tr>
                  <tr>
                    <td style="padding-top:8px;color:#6B7280;font-size:13px;">Vencimento</td>
                    <td align="right" style="padding-top:8px;color:#6B7280;font-size:13px;">${dueDate}</td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#F9FAFB;padding:24px 40px;border-top:1px solid #E5E7EB;">
            <p style="margin:0;color:#9CA3AF;font-size:12px;text-align:center;">
              Mensagem automática enviada por ${senderName}.<br>Não responda a este e-mail.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
}
