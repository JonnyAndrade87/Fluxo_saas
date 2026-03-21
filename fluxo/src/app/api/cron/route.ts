import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  // Simple Auth for Cron: In production, check an Authorization header matching process.env.CRON_SECRET
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeFlows = await prisma.billingFlow.findMany({
      where: { isActive: true }
    });

    let sentMessages = 0;

    for (const flow of activeFlows) {
      if (!flow.rules) continue;
      
      let rules;
      try {
        rules = JSON.parse(flow.rules);
      } catch (e) {
        continue;
      }
      
      const invoices = await prisma.invoice.findMany({
        where: { 
          tenantId: flow.tenantId,
          status: { in: ['pending', 'overdue'] } // Cuts out 'paid' or 'canceled', pausing the flow automatically
        },
        include: {
          customer: true
        }
      });

      for (const inv of invoices) {
        const invDate = new Date(inv.dueDate);
        invDate.setHours(0, 0, 0, 0);

        const diffTime = today.getTime() - invDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 
        // Note: > 0 means overdue (past due date), < 0 means future (not due yet)

        // 1. Pré-Vencimento
        if (rules.preAtivado && diffDays < 0 && Math.abs(diffDays) === Number(rules.preDias)) {
           await createLog(flow.tenantId, inv.customerId, inv.id, rules.emailText, 'Lembrete D-' + rules.preDias);
           sentMessages++;
        }
        
        // 2. Dia do Vencimento
        else if (rules.diaAtivado && diffDays === 0) {
           await createLog(flow.tenantId, inv.customerId, inv.id, rules.emailText, 'Aviso de Vencimento (Dia 0)');
           sentMessages++;
        }
        
        // 3. Pós-Vencimento (Atraso)
        else if (rules.posAtivado && diffDays > 0) {
           const posDaysArray = String(rules.posDias || '').split(',').map(s => Number(s.trim()));
           if (posDaysArray.includes(diffDays)) {
              await createLog(flow.tenantId, inv.customerId, inv.id, rules.emailText, 'Atraso D+' + diffDays);
              sentMessages++;
           }
        }
      }
    }

    return NextResponse.json({ success: true, processedFlows: activeFlows.length, sentMessages }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function createLog(tenantId: string, customerId: string, invoiceId: string, content: string, title: string) {
  // Mocks a communication payload log to explicitly show that the engine ran
  await prisma.communication.create({
    data: {
      tenantId,
      customerId,
      invoiceId,
      channel: 'email', 
      messageType: title,
      content: content || "Mensagem Padrão",
      status: 'delivered'
    }
  });
}
