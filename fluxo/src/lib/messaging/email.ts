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
}/**
 * Shared header/footer helpers for Fluxeer branded emails
 */
function emailHeader(title: string, subtitle?: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#4F46E5 0%,#6D28D9 100%);padding:32px 40px;">
      <tr>
        <td>
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:14px;vertical-align:middle;">
                <div style="width:36px;height:36px;background:rgba(255,255,255,0.15);border-radius:8px;display:flex;align-items:center;justify-content:center;">
                  <span style="color:#fff;font-size:20px;font-weight:900;font-family:sans-serif;">F</span>
                </div>
              </td>
              <td style="vertical-align:middle;">
                <span style="color:#ffffff;font-size:20px;font-weight:800;font-family:sans-serif;letter-spacing:-0.5px;">Fluxo</span>
                <br/>
                <span style="color:rgba(255,255,255,0.7);font-size:11px;font-family:sans-serif;text-transform:uppercase;letter-spacing:1px;">by Fluxeer</span>
              </td>
            </tr>
          </table>
          <h1 style="margin:20px 0 0;color:#ffffff;font-size:22px;font-weight:700;font-family:sans-serif;letter-spacing:-0.5px;">${title}</h1>
          ${subtitle ? `<p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;font-family:sans-serif;">${subtitle}</p>` : ''}
        </td>
      </tr>
    </table>
  `;
}

function emailFooter(): string {
  const year = new Date().getFullYear();
  return `
    <tr>
      <td style="background:#F8FAFC;padding:24px 40px;border-top:1px solid #E2E8F0;">
        <p style="margin:0;color:#94A3B8;font-size:12px;text-align:center;font-family:sans-serif;line-height:1.6;">
          Fluxeer &copy; ${year} &nbsp;&bull;&nbsp; Plataforma de Cobran&ccedil;a Inteligente<br/>
          Voc&ecirc; est&aacute; recebendo este e-mail pois tem uma conta ativa no Fluxo.<br/>
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
  <title>Fluxo</title>
</head>
<body style="margin:0;padding:0;background-color:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
        ${bodyRows}
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
  loginUrl = 'https://fluxeer.com.br/login',
}: {
  name: string;
  companyName: string;
  email: string;
  loginUrl?: string;
}): string {
  const firstName = name.split(' ')[0];
  const body = `
    <tr><td>${emailHeader('Bem-vindo ao Fluxo!', 'Sua plataforma de cobran\u00e7a inteligente est\u00e1 pronta.')}</td></tr>
    <tr>
      <td style="padding:40px;">
        <p style="margin:0 0 20px;color:#1E293B;font-size:16px;font-weight:600;">Ol\u00e1, ${firstName}! 👋</p>
        <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.7;">
          O ambiente corporativo para <strong style="color:#1E293B;">${companyName}</strong> foi implantado com sucesso.
          Agora voc\u00ea tem acesso completo ao seu cockpit financeiro.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;margin:24px 0;">
          <tr><td style="padding:20px 24px;">
            <p style="margin:0 0 8px;color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">O que voc\u00ea pode fazer agora</p>
            <ul style="margin:0;padding-left:20px;color:#475569;font-size:14px;line-height:2;">
              <li>Cadastrar clientes e emitir faturas</li>
              <li>Monitorar o score de risco da sua carteira</li>
              <li>Disparar cobran\u00e7as inteligentes com r\u00e9gua autom\u00e1tica</li>
              <li>Acompanhar KPIs financeiros no Cockpit Executivo</li>
            </ul>
          </td></tr>
        </table>
        <p style="margin:0 0 8px;color:#94A3B8;font-size:13px;">Seu acesso:</p>
        <p style="margin:0 0 32px;color:#1E293B;font-size:14px;font-weight:600;font-family:monospace;background:#F1F5F9;padding:10px 16px;border-radius:8px;display:inline-block;">${email}</p>
        <div style="text-align:center;">
          <a href="${loginUrl}" style="background:linear-gradient(135deg,#4F46E5,#6D28D9);color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;display:inline-block;letter-spacing:-0.2px;">Acessar Minha Plataforma &rarr;</a>
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
    <tr><td>${emailHeader('Redefini\u00e7\u00e3o de Senha', 'Link seguro com validade de 2 horas.')}</td></tr>
    <tr>
      <td style="padding:40px;">
        <p style="margin:0 0 20px;color:#1E293B;font-size:16px;font-weight:600;">Ol\u00e1, ${firstName}!</p>
        <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.7;">
          Recebemos uma solicita\u00e7\u00e3o para redefinir a senha da sua conta no <strong style="color:#4F46E5;">Fluxo</strong>.
          Se foi voc\u00ea, clique no bot\u00e3o abaixo para criar uma nova senha em segura.
        </p>
        <div style="text-align:center;margin:36px 0;">
          <a href="${resetUrl}" style="background:linear-gradient(135deg,#4F46E5,#6D28D9);color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;display:inline-block;">Redefinir Minha Senha &rarr;</a>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:10px;margin-bottom:24px;">
          <tr><td style="padding:16px 20px;">
            <p style="margin:0;color:#92400E;font-size:13px;line-height:1.6;">
              &#9888;&#65039; Este link expira automaticamente em <strong>2 horas</strong>.<br/>
              Se n\u00e3o foi voc\u00ea, basta ignorar este e-mail. Sua conta continua 100% protegida.
            </p>
          </td></tr>
        </table>
        <p style="margin:0;color:#94A3B8;font-size:12px;text-align:center;">Se o bot\u00e3o n\u00e3o funcionar, copie e cole o link abaixo no navegador:</p>
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
    <tr><td>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1A3A5F 0%,#0A5F8A 100%);padding:36px 40px;">
        <tr>
          <td>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:14px;vertical-align:middle;">
                  <div style="width:40px;height:40px;background:rgba(0,210,200,0.2);border-radius:10px;display:flex;align-items:center;justify-content:center;">
                    <span style="color:#00D2C8;font-size:22px;font-weight:900;font-family:sans-serif;">F</span>
                  </div>
                </td>
                <td style="vertical-align:middle;">
                  <span style="color:#ffffff;font-size:22px;font-weight:800;font-family:sans-serif;letter-spacing:-0.5px;">Fluxeer<span style="color:#00D2C8;">.</span></span>
                </td>
              </tr>
            </table>
            <h1 style="margin:24px 0 0;color:#ffffff;font-size:24px;font-weight:700;font-family:sans-serif;">Ative sua conta</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:14px;font-family:sans-serif;">Um clique e seu workspace está pronto.</p>
          </td>
        </tr>
      </table>
    </td></tr>
    <tr>
      <td style="padding:40px;">
        <p style="margin:0 0 20px;color:#1A3A5F;font-size:16px;font-weight:700;">Olá, ${firstName}! 👋</p>
        <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.7;">
          Sua conta na <strong style="color:#1A3A5F;">${companyName}</strong> foi criada no Fluxeer. 
          Para ativá-la e configurar seu espaço financeiro, clique no botão abaixo.
        </p>
        <div style="text-align:center;margin:36px 0;">
          <a href="${activationUrl}" 
             style="background:linear-gradient(135deg,#1A3A5F,#00D2C8);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:12px;font-weight:800;font-size:16px;display:inline-block;letter-spacing:-0.3px;box-shadow:0 8px 24px rgba(26,58,95,0.3);">
            Ativar Minha Conta &rarr;
          </a>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FFFE;border:1px solid #00D2C8;border-radius:10px;margin-bottom:24px;">
          <tr><td style="padding:16px 20px;">
            <p style="margin:0;color:#0A5F8A;font-size:13px;line-height:1.6;">
              ⏳ Este link expira em <strong>24 horas</strong>.<br/>
              Se você não criou essa conta, ignore este e-mail com segurança.
            </p>
          </td></tr>
        </table>
        <p style="margin:0;color:#94A3B8;font-size:12px;text-align:center;">Se o botão não funcionar, copie e cole abaixo:</p>
        <p style="margin:8px 0 0;color:#64748B;font-size:11px;text-align:center;word-break:break-all;">${activationUrl}</p>
      </td>
    </tr>
    ${emailFooter()}
  `;
  return wrapEmailLayout(body);
}
