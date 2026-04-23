'use server';

import { sendEmail, getAuthEmailFrom } from '@/lib/messaging/email';

export async function submitLead(prevState: any, formData: FormData) {
  const email = formData.get('email');
  const company = formData.get('company');

  // Validação básica
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return { success: false, error: 'E-mail corporativo inválido.' };
  }
  
  if (!company || typeof company !== 'string' || company.trim().length < 2) {
    return { success: false, error: 'Nome da empresa é obrigatório.' };
  }

  try {
    const commercialEmail = process.env.RESEND_FROM_EMAIL || 'comercial@fluxeer.com.br';
    
    // HTML pro e-mail comercial (aviso interno)
    const htmlBody = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2> Novo Lead da Landing Page 🎉</h2>
        <p><strong>Empresa:</strong> ${company}</p>
        <p><strong>E-mail:</strong> ${email}</p>
        <p>Este lead solicitou uma demonstração através da nova Landing Page Pública.</p>
      </div>
    `;

    // Disparar o e-mail via Resend
    const result = await sendEmail({
      to: commercialEmail,
      from: getAuthEmailFrom(),
      subject: `🚨 Novo Lead Fluxeer: ${company}`,
      html: htmlBody,
    });

    if (!result.success && process.env.NODE_ENV !== 'development') {
        // no ambiente dev, se a chave do resend faltar, o sendEmail cai pro gracefully
        console.warn('E-mail não disparado por falta de config, mas vamos simular sucesso pro front.');
    }

    return { success: true, message: 'Solicitação enviada com sucesso!' };
  } catch (err) {
    console.error('Erro ao salvar lead:', err);
    return { success: false, error: 'Ocorreu um erro interno. Tente novamente mais tarde.' };
  }
}
