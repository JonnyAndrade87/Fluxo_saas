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
import { maskEmail } from '../utils';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

let resendClient: Resend | null = null;

export function getAuthEmailFrom(): string {
  return process.env.RESEND_AUTH_FROM_EMAIL ?? 'no-reply@fluxeer.com.br';
}

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

  const from = opts.from ?? process.env.RESEND_FROM_EMAIL ?? 'no-reply@fluxeer.com.br';

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

    console.log(`[EMAIL] Sent to ${maskEmail(opts.to)} — messageId: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (err: unknown) {
    console.error('[EMAIL] Unexpected error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Build a professional billing email HTML.
 */
/**
 * Build a professional billing email HTML.
 */
export function buildBillingEmailHtml({
  customerName,
  invoiceNumber,
  amount,
  dueDate,
  messageBody,
  senderName = 'Fluxeer',
}: {
  customerName: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  messageBody: string;
  senderName?: string;
}): string {
  const body = `
    <tr><td>${emailHeader('Aviso de Cobran\u00e7a', senderName)}</td></tr>
    <tr>
      <td style="padding:40px;">
        <p style="margin:0 0 24px;color:#1E293B;font-size:16px;">Ol\u00e1, <strong>${customerName}</strong></p>
        <p style="margin:0 0 32px;color:#475569;font-size:15px;line-height:1.6;">${messageBody}</p>
        
        <!-- Invoice Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;margin-bottom:32px;">
          <tr><td style="padding:24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:#64748B;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Fatura</td>
                <td align="right" style="color:#1E293B;font-size:13px;font-weight:700;">#${invoiceNumber}</td>
              </tr>
              <tr><td colspan="2" style="padding:8px 0;border-bottom:1px solid #E2E8F0;"></td></tr>
              <tr>
                <td style="padding-top:16px;color:#64748B;font-size:13px;">Valor Total</td>
                <td align="right" style="padding-top:16px;color:#4F46E5;font-size:20px;font-weight:800;">${amount}</td>
              </tr>
              <tr>
                <td style="padding-top:8px;color:#64748B;font-size:13px;">Vencimento</td>
                <td align="right" style="padding-top:8px;color:#1E293B;font-size:13px;font-weight:600;">${dueDate}</td>
              </tr>
            </table>
          </td></tr>
        </table>

        <div style="text-align:center;margin-top:8px;">
          <p style="margin:0;color:#94A3B8;font-size:12px;">Para realizar o pagamento ou contestar, acesse sua \u00e1rea do cliente.</p>
        </div>
      </td>
    </tr>
    ${emailFooter()}
  `;
  return wrapEmailLayout(body);
}/**
 * Shared header/footer helpers for Fluxeer branded emails
 */
/**
 * Shared header/footer helpers for Fluxeer branded emails
 */
function emailHeader(title: string, subtitle?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.fluxeer.com.br';
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 40px 32px;text-align:center;background:#ffffff;">
      <tr>
        <td align="center">
          <img src="${baseUrl}/logo_fluxeer.png" alt="Fluxeer" width="160" style="height:auto;max-width:160px;display:block;margin:0 auto;" />
          <h1 style="margin:24px 0 0;color:#1E293B;font-size:24px;font-weight:800;font-family:sans-serif;letter-spacing:-0.5px;">${title}</h1>
          ${subtitle ? `<p style="margin:8px 0 0;color:#64748B;font-size:14px;font-family:sans-serif;line-height:1.5;">${subtitle}</p>` : ''}
        </td>
      </tr>
    </table>
  `;
}

function emailFooter(): string {
  const year = new Date().getFullYear();
  return `
    <tr>
      <td style="background:#F8FAFC;padding:32px 40px;border-top:1px solid #E2E8F0;">
        <p style="margin:0;color:#94A3B8;font-size:12px;text-align:center;font-family:sans-serif;line-height:1.8;">
          <strong>Fluxeer</strong> &bull; Plataforma de Cobran&ccedil;a Inteligente<br/>
          &copy; ${year} Todos os direitos reservados.<br/>
          Voc&ecirc; recebeu este e-mail por ser um usu&aacute;rio oficial da plataforma.<br/>
          N&atilde;o responda a este e-mail.
        </p>
      </td>
    </tr>
  `;
}

function wrapEmailLayout(bodyRows: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fluxeer</title>
</head>
<body style="margin:0;padding:0;background-color:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:40px 16px;">
    <tr><td align="center">
      <!-- Main Container -->
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.04);">
        ${bodyRows}
      </table>
      
      <!-- Utility Links -->
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;margin-top:24px;">
        <tr>
          <td align="center">
            <p style="margin:0;color:#94A3B8;font-size:11px;font-family:sans-serif;">
              <a href="https://www.fluxeer.com.br" style="color:#64748B;text-decoration:none;">Website</a> &nbsp;&bull;&nbsp; 
              <a href="https://www.fluxeer.com.br/ajuda" style="color:#64748B;text-decoration:none;">Central de Ajuda</a> &nbsp;&bull;&nbsp; 
              <a href="https://www.fluxeer.com.br/termos" style="color:#64748B;text-decoration:none;">Termos de Uso</a>
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

/**
 * Build Fluxeer branded welcome email after tenant registration.
 */
export function buildWelcomeEmailHtml({
  name,
  companyName,
  email,
  loginUrl = 'https://www.fluxeer.com.br/login',
}: {
  name: string;
  companyName: string;
  email: string;
  loginUrl?: string;
}): string {
  const firstName = name.split(' ')[0];
  const body = `
    <tr><td>${emailHeader('Bem-vindo ao Fluxeer!', 'Sua plataforma de cobran\u00e7a inteligente est\u00e1 pronta.')}</td></tr>
    <tr>
      <td style="padding:40px;">
        <p style="margin:0 0 20px;color:#1E293B;font-size:16px;font-weight:600;">Ol\u00e1, ${firstName}! 👋</p>
        <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.7;">
          O ambiente corporativo para <strong style="color:#1E293B;">${companyName}</strong> foi implantado com sucesso.
          Agora voc\u00ea tem acesso completo ao seu cockpit financeiro.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;margin:24px 0;">
          <tr><td style="padding:20px 24px;">
            <p style="margin:0 0 12px;color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Pr\u00f3ximos passos</p>
            <ul style="margin:0;padding-left:20px;color:#475569;font-size:14px;line-height:2;">
              <li>Cadastrar clientes e emitir faturas</li>
              <li>Monitorar o score de risco da sua carteira</li>
              <li>Disparar cobran\u00e7as inteligentes com r\u00e9gua manual</li>
              <li>Acompanhar KPIs financeiros no Dashboard</li>
            </ul>
          </td></tr>
        </table>
        <p style="margin:0 0 8px;color:#94A3B8;font-size:12px;">Seu acesso:</p>
        <p style="margin:0 0 32px;color:#1E293B;font-size:14px;font-weight:700;font-family:monospace;background:#F1F5F9;padding:12px 20px;border-radius:10px;display:inline-block;border:1px solid #E2E8F0;">${email}</p>
        <div style="text-align:center;">
          <a href="${loginUrl}" style="background:#4F46E5;color:#ffffff;padding:16px 36px;text-decoration:none;border-radius:14px;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 10px 20px rgba(79,70,229,0.2);">Acessar Minha Plataforma &rarr;</a>
        </div>
      </td>
    </tr>
    ${emailFooter()}
  `;
  return wrapEmailLayout(body);
}

/**
 * Build Fluxeer branded password reset email.
 */
export function buildPasswordResetEmailHtml({
  name,
  resetUrl,
}: {
  name: string;
  resetUrl: string;
}): string {
  const firstName = name.split(' ')[0];
  const body = `
    <tr><td>${emailHeader('Redefini\u00e7\u00e3o de Senha', 'Link seguro para sua prote\u00e7\u00e3o.')}</td></tr>
    <tr>
      <td style="padding:40px;">
        <p style="margin:0 0 20px;color:#1E293B;font-size:16px;font-weight:600;">Ol\u00e1, ${firstName}!</p>
        <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.7;">
          Recebemos uma solicita\u00e7\u00e3o para redefinir a senha da sua conta no <strong style="color:#4F46E5;">Fluxeer</strong>.
          Se foi voc\u00ea, clique no bot\u00e3o abaixo para criar uma nova senha agora.
        </p>
        <div style="text-align:center;margin:40px 0;">
          <a href="${resetUrl}" style="background:#4F46E5;color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:14px;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 10px 20px rgba(79,70,229,0.2);">Redefinir Minha Senha &rarr;</a>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;margin-bottom:32px;">
          <tr><td style="padding:20px;">
            <p style="margin:0;color:#92400E;font-size:13px;line-height:1.6;">
              <strong>Aten\u00e7\u00e3o:</strong> Este link expira automaticamente em <strong>2 horas</strong> por seguran\u00e7a.<br/>
              Se n\u00e3o foi voc\u00ea, basta ignorar este e-mail.
            </p>
          </td></tr>
        </table>
        <p style="margin:0;color:#94A3B8;font-size:12px;text-align:center;">Se o bot\u00e3o n\u00e3o funcionar, use o link abaixo:</p>
        <p style="margin:8px 0 0;color:#64748B;font-size:11px;text-align:center;word-break:break-all;">${resetUrl}</p>
      </td>
    </tr>
    ${emailFooter()}
  `;
  return wrapEmailLayout(body);
}

/**
 * Build Fluxeer branded account activation email.
 */
export function buildActivationEmailHtml({
  name,
  companyName,
  activationUrl,
}: {
  name: string;
  companyName: string;
  activationUrl: string;
}): string {
  const firstName = name.split(' ')[0];
  const body = `
    <tr><td>${emailHeader('Ative sua conta', 'Tudo pronto para come\u00e7ar sua jornada.')}</td></tr>
    <tr>
      <td style="padding:40px;">
        <p style="margin:0 0 20px;color:#1E293B;font-size:16px;font-weight:700;">Ol\u00e1, ${firstName}! 👋</p>
        <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.7;">
          Sua conta na <strong style="color:#4F46E5;">${companyName}</strong> foi criada com sucesso no Fluxeer. 
          Clique no bot\u00e3o abaixo para ativar seu acesso e configurar seu cockpit financeiro.
        </p>
        <div style="text-align:center;margin:40px 0;">
          <a href="${activationUrl}" 
             style="background:#4F46E5;color:#ffffff;padding:18px 40px;text-decoration:none;border-radius:16px;font-weight:800;font-size:16px;display:inline-block;box-shadow:0 12px 24px rgba(79,70,229,0.25);">
            Ativar Minha Conta &rarr;
          </a>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F9FF;border:1px solid #BAE6FD;border-radius:12px;margin-bottom:32px;">
          <tr><td style="padding:20px;">
            <p style="margin:0;color:#0369A1;font-size:13px;line-height:1.6;">
              <strong>Validade:</strong> Este link expira em 24 horas.<br/>
              Se voc\u00ea n\u00e3o solicitou esta conta, pode ignorar este e-mail.
            </p>
          </td></tr>
        </table>
        <p style="margin:0;color:#94A3B8;font-size:12px;text-align:center;">Se o bot\u00e3o n\u00e3o funcionar, copie o link abaixo:</p>
        <p style="margin:8px 0 0;color:#64748B;font-size:11px;text-align:center;word-break:break-all;">${activationUrl}</p>
      </td>
    </tr>
    ${emailFooter()}
  `;
  return wrapEmailLayout(body);
}
