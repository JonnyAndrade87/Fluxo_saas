import { PrismaClient } from '@prisma/client';
import { sendWhatsAppTemplate } from './src/lib/messaging/whatsapp';

const prisma = new PrismaClient();

async function runE2E() {
  console.log("=== INICIANDO E2E FLOW (WHATSAPP & TIMELINE) ===");

  try {
    // 1. Achar o primeiro tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) throw new Error("Sem Tenant para testar.");

    // 2. Create/Find Customer
    const testPhone = "5541984598392"; // user provided this on prompt history
    let customer = await prisma.customer.findFirst({ where: { phone: testPhone } });
    
    if (!customer) {
      console.log("- Criando Customer E2E...");
      customer = await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          name: 'Jonattan E2E Test',
          documentNumber: '00000000000',
          phone: testPhone,
          status: 'active'
        }
      });
    }

    // 3. Create Invoice
    console.log("- Criando Fatura...");
    const invoice = await prisma.invoice.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        invoiceNumber: `E2E-${Date.now()}`,
        amount: 15.99,
        balanceDue: 15.99,
        dueDate: new Date(Date.now() + 86400000), // tomorrow
        status: 'OPEN',
      }
    });

    // 4. Trigger WhatsApp send
    console.log("- Acionando WA API (fluxo_aviso_vencimento_hoje) fallback para teste...");
    const sendResult = await sendWhatsAppTemplate({
      to: testPhone,
      templateName: 'fluxo_cobranca_atraso_inicial', // Testing first overdue template
      languageCode: 'pt_BR',
      components: [
        {
          type: 'body',
          parameters: [
             { type: 'text', text: customer.name },
             { type: 'text', text: invoice.invoiceNumber },
             { type: 'text', text: "Amanhã" },
             { type: 'text', text: "R$ 15,99" }
          ]
        }
      ]
    });

    console.log("- Resultado DISPARO META:", sendResult);

    // 5. Persist Timeline/History (Simulation of what happens in background)
    if (sendResult.success) {
      console.log("- Salvando Communication no BD (wamid:", sendResult.messageId, ")...");
      await prisma.communication.create({
        data: {
          tenantId: tenant.id,
          customerId: customer.id,
          invoiceId: invoice.id,
          channel: 'whatsapp',
          messageType: 'late_notice',
          content: 'Disparo automatizado E2E de teste via template Meta',
          status: 'sent',
          externalId: sendResult.messageId
        }
      });

      // Confirm timeline persists
      const history = await prisma.communication.findFirst({
         where: { externalId: sendResult.messageId }
      });
      console.log("- Timeline Persistida com SUCESSO. Gravado como status:", history?.status);
    } else {
       console.log("X Falha ao enviar, pulando gravacao positiva da timeline.");
    }
    
    console.log("=== E2E FINALIZADO ===");

  } catch (err: any) {
    console.error("E2E CRASH:", err.message || err);
  } finally {
    await prisma.$disconnect();
  }
}

runE2E();
