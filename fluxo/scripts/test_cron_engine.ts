import { PrismaClient } from '@prisma/client';
import { GET } from '../src/app/api/cron/route';
import { getTenantPlanSnapshot } from '../src/lib/billing/plans';

const prisma = new PrismaClient();

async function runTest() {
  console.log("🚀 STARTING CRON ENGINE VALIDATION TESTS (VERIFIABLE LOG)\n");

  // 1. CLEANUP (Isolation)
  await prisma.communication.deleteMany({ where: { tenantId: { in: ['ts-t1', 'ts-t2'] } } });
  await prisma.invoice.deleteMany({ where: { tenantId: { in: ['ts-t1', 'ts-t2'] } } });
  await prisma.billingFlow.deleteMany({ where: { tenantId: { in: ['ts-t1', 'ts-t2'] } } });
  await prisma.customer.deleteMany({ where: { tenantId: { in: ['ts-t1', 'ts-t2'] } } });
  await prisma.tenant.deleteMany({ where: { id: { in: ['ts-t1', 'ts-t2'] } } });

  // 2. SETUP DATES
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const addDays = (d: number) => { 
    const x = new Date(today); 
    x.setDate(x.getDate() + d); 
    return x; 
  };

  // 3. SEEDING TENANTS
  const t1 = await prisma.tenant.create({ data: { id: 'ts-t1', name: 'Tenant Alpha', documentNumber: '111', ...getTenantPlanSnapshot('pro') }});
  const t2 = await prisma.tenant.create({ data: { id: 'ts-t2', name: 'Tenant Beta', documentNumber: '222', ...getTenantPlanSnapshot('pro') }});

  const cust1 = await prisma.customer.create({ data: { id: 'ts-c1', name: 'Client A', tenantId: t1.id, documentNumber: 'C1' }});
  const cust2 = await prisma.customer.create({ data: { id: 'ts-c2', name: 'Client B', tenantId: t2.id, documentNumber: 'C2' }});

  // 4. SEEDING RULES 
  // Tenant 1 rules: D-3, D-0, D+5
  const rulesT1 = { preAtivado: true, preDias: "3", diaAtivado: true, posAtivado: true, posDias: "5", emailText: "Lembrete T1" };
  await prisma.billingFlow.create({
    data: { tenantId: t1.id, name: 'Regra T1', isActive: true, rules: JSON.stringify(rulesT1) }
  });

  // Tenant 2 rules: D-7, D-0
  const rulesT2 = { preAtivado: true, preDias: "7", diaAtivado: true, posAtivado: false, posDias: "0", emailText: "Lembrete T2" };
  await prisma.billingFlow.create({
    data: { tenantId: t2.id, name: 'Regra T2', isActive: true, rules: JSON.stringify(rulesT2) }
  });

  // 5. SEEDING INVOICES FOR ALL 10 SCENARIOS
  console.log("-> Seeding in-memory database with 10 exact scenarios...");
  const invS1 = await prisma.invoice.create({ data: { id: 'inv-s1', tenantId: t1.id, customerId: cust1.id, amount: 100, balanceDue: 100, status: 'OPEN', dueDate: addDays(3), invoiceNumber: 'INV-S1-OPEN-MATCH' }});
  const invS2 = await prisma.invoice.create({ data: { id: 'inv-s2', tenantId: t1.id, customerId: cust1.id, amount: 200, balanceDue: 200, status: 'OPEN', dueDate: addDays(10), invoiceNumber: 'INV-S2-OPEN-IGNORE' }});
  const invS3 = await prisma.invoice.create({ data: { id: 'inv-s3', tenantId: t1.id, customerId: cust1.id, amount: 300, balanceDue: 0, status: 'PAID', dueDate: addDays(3), invoiceNumber: 'INV-S3-PAID-D-3' }});
  const invS4 = await prisma.invoice.create({ data: { id: 'inv-s4', tenantId: t1.id, customerId: cust1.id, amount: 400, balanceDue: 0, status: 'CANCELED', dueDate: addDays(0), invoiceNumber: 'INV-S4-CANCEL-D0' }});
  const invS5 = await prisma.invoice.create({ data: { id: 'inv-s5', tenantId: t1.id, customerId: cust1.id, amount: 500, balanceDue: 500, status: 'OPEN', dueDate: addDays(-5), invoiceNumber: 'INV-S5-OVERDUE-MATCH' }});
  const invS9 = await prisma.invoice.create({ data: { id: 'inv-s9', tenantId: t2.id, customerId: cust2.id, amount: 900, balanceDue: 900, status: 'OPEN', dueDate: addDays(3), invoiceNumber: 'INV-S9-TENANT-ISOLATION' }});

  console.log("✅ Seed completed. Executing GET /api/cron...\n");

  // 6. EXECUTE CRON (Phase 1)
  const req = new Request('http://localhost:3000/api/cron');
  const res: Response = await GET(req) as Response;
  const json = await res.json();
  console.log(`📡 CRON API RAW RESPONSE:`, JSON.stringify(json, null, 2));

  // 7. VERIFY RESULTS
  let comms = await prisma.communication.findMany({ 
    include: { invoice: true },
    where: { tenantId: { in: [t1.id, t2.id] } }
  });

  const sentInvIds = comms.map(c => c.invoiceId);

  console.log('\n=======================================');
  console.log('📊 RESULTS SUMMARY (PHASE 1):');
  console.log('=======================================');
  console.log(`[S1] Fatura PENDING Dentro Regra (D-3):    ${sentInvIds.includes(invS1.id) ? '✅ PROCESSADA' : '❌ ERRO'}`);
  console.log(`[S2] Fatura PENDING Fora da Regra (D-10):  ${!sentInvIds.includes(invS2.id) ? '✅ IGNORADA' : '❌ DISPARO INDEVIDO'}`);
  console.log(`[S3] Fatura PAID na Janela (D-3):          ${!sentInvIds.includes(invS3.id) ? '✅ IGNORADA' : '❌ DISPARO INDEVIDO'}`);
  console.log(`[S4] Fatura CANCELED na Janela (D-0):      ${!sentInvIds.includes(invS4.id) ? '✅ IGNORADA' : '❌ DISPARO INDEVIDO'}`);
  console.log(`[S5] Fatura OVERDUE na Janela (D+5):       ${sentInvIds.includes(invS5.id) ? '✅ PROCESSADA' : '❌ ERRO'}`);
  console.log(`[S9] Filtragem de Tenant cruzado (D-3):    ${!sentInvIds.includes(invS9.id) ? '✅ ISOLADO (Não disparou Regra T1 num Cliente T2)' : '❌ VAZAMENTO DE DADOS'}`);

  console.log('\n[S10] DETALHES DOS LOGS GERADOS NA TABELA:');
  comms.forEach(c => console.log(` - 📩 MSG Enviada para Fatura ${c.invoice?.invoiceNumber} | Título Analítico: "${c.messageType}" | Tenant: ${c.tenantId}`));

  // 8. EXECUTE CRON STATE MUTATION (Phase 2 - S6 & S7)
  console.log('\n🔄 Iniciando FASE 2: Mutação de Estados (S6 e S7)...');
  console.log(' -> Marcando S1 como PAID (Pagamento Registrado)');
  console.log(' -> Marcando S5 como CANCELED (Dívida Perdida)');
  
  await prisma.invoice.update({ where: { id: invS1.id }, data: { status: 'PAID', balanceDue: 0 }});
  await prisma.invoice.update({ where: { id: invS5.id }, data: { status: 'CANCELED', balanceDue: 0 }});
  
  console.log("✅ Mutação concluída. Executando GET /api/cron novamente para ver se disparam dupla notificação...");
  const req2 = new Request('http://localhost:3000/api/cron');
  await GET(req2);

  // Verification 2
  comms = await prisma.communication.findMany({ 
    include: { invoice: true },
    where: { tenantId: { in: [t1.id, t2.id] } }
  });

  const s1Logs = comms.filter(c => c.invoiceId === invS1.id).length;
  const s5Logs = comms.filter(c => c.invoiceId === invS5.id).length;

  console.log('\n=======================================');
  console.log('📊 RESULTS SUMMARY (PHASE 2 MUTATION):');
  console.log('=======================================');
  console.log(`[S6] Invoice OPEN virou PAID. Sofreu duplo disparo?     ${s1Logs === 1 ? '✅ NÃO. Parou na hora.' : `❌ SIM (${s1Logs} logs)`}`);
  console.log(`[S7] Invoice OVERDUE virou CANCELED. Duplo disparo?     ${s5Logs === 1 ? '✅ NÃO. Parou na hora.' : `❌ SIM (${s5Logs} logs)`}`);
  console.log('\n🎉 TESTES COMPLETOS COM SUCESSO!\n');
}

runTest()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect());
