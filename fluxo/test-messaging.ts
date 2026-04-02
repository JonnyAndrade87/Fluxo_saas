import { sendEmail } from './src/lib/messaging/email';
import { sendWhatsAppTemplate } from './src/lib/messaging/whatsapp';
import { WHATSAPP_TEMPLATE_MAP } from './src/lib/messaging/whatsapp-templates';



async function run() {
  console.log("🚀 Iniciando Teste de Produção (Resend & Meta API)");

  // 1. Send Email
  try {
    console.log("Enviando e-mail para jonattan.passos@gmail.com...");
    const emailRes = await sendEmail({
      to: 'jonattan.passos@gmail.com',
      subject: 'Teste de Produção - Fluxo SaaS',
      html: '<div style="font-family: sans-serif; padding: 20px;"><h2>Integração Bem-sucedida! 🎉</h2><p>As chaves da Vercel estão ativas e o Resend está processando e-mails da sua plataforma Fluxo normalmente.</p></div>',
      text: 'Integração Bem-sucedida! As chaves da Vercel estão ativas.'
    });
    console.log("✅ Resultado E-mail:", emailRes);
  } catch(e) {
    console.error("❌ Erro E-mail:", e);
  }

  // 2. Send WhatsApp
  try {
    console.log("\\nEnviando WhatsApp para 5541984598392...");
    const templateName = 'fluxo_aviso_vencimento_hoje';
    const components = WHATSAPP_TEMPLATE_MAP['dia'].buildComponents({
      customerName: 'Jonattan',
      invoiceNumber: 'TESTE-001',
      amount: '990,00',
      dueDate: new Date().toLocaleDateString('pt-BR')
    });
    
    const waRes = await sendWhatsAppTemplate({
      to: '5541984598392', // Número fornecido
      templateName,
      languageCode: 'pt_BR',
      components
    });
    console.log("✅ Resultado WhatsApp:", waRes);
  } catch(e) {
    console.error("❌ Erro WhatsApp:", e);
  }
}

run().catch(console.error);
