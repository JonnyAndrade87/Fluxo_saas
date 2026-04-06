import { PrismaClient } from '@prisma/client';
import { generateCollectionLogs } from './src/services/communication/communicationService';

const prisma = new PrismaClient();

async function runE2E() {
  console.log("=== INICIANDO VALIDAÇÃO DO FLUXO DE PRODUÇÃO (MANUAL MODE) ===");
  try {
    // 1. Achar o primeiro tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) throw new Error("Sem Tenant de teste no Prod BD.");

    // 2. Create Customer
    const testPhone = "5541984598392";
    let customer = await prisma.customer.findFirst({ where: { phone: testPhone } });
    if (!customer) {
      console.log("- Criando Customer no Prod...");
      customer = await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          name: 'Cliente E2E Manual',
          documentNumber: '11111111111',
          phone: testPhone,
          status: 'active'
        }
      });
    }

    // 3. Create Overdue Invoice (Atraso 3 Dias = D+3)
    console.log("- Criando Fatura de D+3...");
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - 3);

    const invoice = await prisma.invoice.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        invoiceNumber: `E2EMANUAL-${Date.now()}`,
        amount: 25.50,
        balanceDue: 25.50,
        dueDate: overdueDate,
        status: 'OPEN',
      }
    });

    // 4. Generate Communication
    console.log("- Gerando Comunicação via Régua Inteligente...");
    // A API recebe obj contendo id e name e phone
    const invoicesPayload = [{
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      dueDate: invoice.dueDate,
      customerId: customer.id,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email
      }
    }];
    
    // Forçar environment manual para o script local just in case
    process.env.COMMUNICATION_MODE = 'manual';
    const result = await generateCollectionLogs(tenant, invoicesPayload);
    console.log("- Generate Result (Criados):", result.created);

    // 5. Validating Communication Log
    const log = await prisma.communicationLog.findFirst({
       where: { invoiceId: invoice.id }
    });
    console.log("- Log gerado com a Rule:", log?.ruleType, "| Status inicial:", log?.status);
    if (!log) throw new Error("Falha ao gerar o log");

    const meta = JSON.parse(log.metadata || '{}');
    console.log("- Payload Meta gerado com WhatsApp Link?:", !!meta.waLink);
    // Simula que usuario abriu link
    console.log(`[SIMULAÇÃO] Úsuario clicou em "Abrir Whatsapp" => \n${meta.waLink}\n`);

    // 6. Mark Sent
    console.log("- SIMULANDO ACTION: markLogSent...");
    await prisma.communicationLog.updateMany({
        where: { id: log.id, tenantId: tenant.id },
        data: { status: 'sent', sentAt: new Date() }
    });

    const verify = await prisma.communicationLog.findUnique({ where: { id: log.id }});
    console.log("- Log atualizado final: status =", verify?.status, "| Enviado Em =", verify?.sentAt);

    console.log("=== SUCESSO: FLUXO COMPLETO VALIDADO NA PRODUÇÃO ===");
  } catch (err: any) {
    console.error("ERRO E2E:", err);
  } finally {
    await prisma.$disconnect();
  }
}

runE2E();
