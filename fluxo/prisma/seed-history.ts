/**
 * seed-history.ts
 * Populates Communication, CustomerNote, and PaymentPromise records
 * for existing tenant data to give the /historico module real content.
 *
 * Run with: npx tsx prisma/seed-history.ts
 * Safe to re-run: skips if data already exists.
 */

import prisma from '../src/lib/prisma';

// ─── Date helpers ────────────────────────────────────────────────────────────

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);
const daysFromNow = (n: number) => new Date(Date.now() + n * 86400000);

// ─── Portuguese billing message templates ────────────────────────────────────

const WHATSAPP_TEMPLATES = {
  d_minus3: (name: string, invoiceNumber: string, amount: string, dueDate: string) =>
    `Olá, ${name}! 👋\n\nPassando para lembrar que a fatura *#${invoiceNumber}* no valor de *${amount}* vence em *3 dias* (${dueDate}).\n\nCaso já tenha efetuado o pagamento, desconsidere esta mensagem.\n\n_Fluxo Financeiro_`,

  d_zero: (name: string, invoiceNumber: string, amount: string) =>
    `${name}, sua fatura *#${invoiceNumber}* de *${amount}* vence *hoje*.\n\nEvite encargos e garanta a continuidade dos seus serviços realizando o pagamento ainda hoje.\n\nQualquer dúvida, estamos à disposição.\n\n_Fluxo Financeiro_`,

  d_plus2: (name: string, invoiceNumber: string, amount: string) =>
    `${name}, identificamos que a fatura *#${invoiceNumber}* (${amount}) encontra-se em aberto há 2 dias.\n\nCaso já tenha realizado o pagamento, desconsidere. Caso contrário, solicitamos gentilmente a regularização.\n\nAgradecemos a atenção. 🙏\n\n_Fluxo Financeiro_`,

  d_plus7: (name: string, invoiceNumber: string, amount: string) =>
    `${name}, a fatura *#${invoiceNumber}* no valor de *${amount}* está em atraso há 7 dias.\n\nSolicitamos a regularização urgente para evitar bloqueio de acesso e inclusão nos mecanismos de proteção ao crédito.\n\n_Fluxo Financeiro_`,
};

const EMAIL_TEMPLATES = {
  d_minus3: (name: string, invoiceNumber: string, amount: string, dueDate: string) =>
    `Prezado(a) ${name},\n\nEsperamos que esteja bem. Gostaríamos de lembrá-lo(a) que a fatura #${invoiceNumber}, no valor de ${amount}, vencerá em 3 dias (${dueDate}).\n\nPara sua comodidade, o pagamento pode ser realizado via PIX, boleto ou cartão de crédito.\n\nAtenciosamente,\nEquipe Fluxo Financeiro`,

  d_zero: (name: string, invoiceNumber: string, amount: string) =>
    `Prezado(a) ${name},\n\nA fatura #${invoiceNumber} de ${amount} vence hoje. Pedimos gentileza na regularização até o final do expediente para evitar encargos de mora.\n\nAtenciosamente,\nEquipe Fluxo Financeiro`,

  d_plus7: (name: string, invoiceNumber: string, amount: string) =>
    `Prezado(a) ${name},\n\nApesar dos comunicados anteriores, constatamos que a fatura #${invoiceNumber} (${amount}) permanece em aberto há 7 dias. Reforçamos a necessidade de regularização imediata.\n\nEm caso de negociação, entre em contato conosco.\n\nAtenciosamente,\nFluxo Financeiro`,
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 seed-history.ts: Iniciando inserção de dados históricos...\n');

  // Find the seeded tenant
  const tenant = await prisma.tenant.findFirst({
    where: { name: 'TechCorp Solutions' },
    include: {
      users: { include: { user: true }, take: 1 },
      customers: { include: { invoices: true } }
    }
  });

  if (!tenant) {
    console.error('❌ Tenant "TechCorp Solutions" não encontrado. Execute npx prisma db seed primeiro.');
    process.exit(1);
  }

  const adminUser = tenant.users[0]?.user;
  if (!adminUser) {
    console.error('❌ Nenhum usuário admin encontrado no tenant.');
    process.exit(1);
  }

  const tenantId = tenant.id;
  const userId = adminUser.id;

  console.log(`✅ Tenant: ${tenant.name}`);
  console.log(`✅ Admin: ${adminUser.fullName} (${adminUser.email})\n`);

  const customers = tenant.customers;
  if (customers.length < 2) {
    console.error('❌ Precisa de pelo menos 2 clientes. Execute npx prisma db seed primeiro.');
    process.exit(1);
  }

  // ── Check if history already seeded ──────────────────────────────────────
  const existing = await prisma.communication.count({ where: { tenantId } });
  if (existing > 10) {
    console.log(`ℹ️  Dados históricos já existem (${existing} comunicações). Pulando seed.`);
    console.log('   Para recriar, delete as comunicações manualmente e execute novamente.');
    return;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CUSTOMER 1 — Alpha Software LTDA (cliente em dia, mas com histórico rico)
  // ──────────────────────────────────────────────────────────────────────────
  const c1 = customers.find(c => c.name.includes('Alpha')) ?? customers[0];
  const c1Invoices = c1.invoices;
  const c1PaidInv = c1Invoices.find(i => i.status === 'PAID');
  const c1PendingInv = c1Invoices.find(i => i.status === 'OPEN');

  console.log(`📧 Inserindo histórico para: ${c1.name}`);

  // D-3 WhatsApp (35 days ago, before the invoice that was later paid)
  if (c1PaidInv) {
    await prisma.communication.create({ data: {
      tenantId, customerId: c1.id, invoiceId: c1PaidInv.id,
      channel: 'whatsapp', messageType: 'reminder',
      content: WHATSAPP_TEMPLATES.d_minus3(c1.name, c1PaidInv.invoiceNumber, 'R$ 4.500,00', '12/02/2026'),
      status: 'delivered', sentAt: daysAgo(33),
    }});

    // D-0 Email
    await prisma.communication.create({ data: {
      tenantId, customerId: c1.id, invoiceId: c1PaidInv.id,
      channel: 'email', messageType: 'reminder',
      content: EMAIL_TEMPLATES.d_zero(c1.name, c1PaidInv.invoiceNumber, 'R$ 4.500,00'),
      status: 'delivered', sentAt: daysAgo(30),
    }});

    // Thank you / confirmation message after payment
    await prisma.communication.create({ data: {
      tenantId, customerId: c1.id, invoiceId: c1PaidInv.id,
      channel: 'whatsapp', messageType: 'thank_you',
      content: `${c1.name}, confirmamos o recebimento do pagamento da fatura #${c1PaidInv.invoiceNumber}. Obrigado! 🎉\n\n_Fluxo Financeiro_`,
      status: 'read', sentAt: daysAgo(28),
    }});
  }

  // D-3 for pending invoice
  if (c1PendingInv) {
    await prisma.communication.create({ data: {
      tenantId, customerId: c1.id, invoiceId: c1PendingInv.id,
      channel: 'whatsapp', messageType: 'reminder',
      content: WHATSAPP_TEMPLATES.d_minus3(c1.name, c1PendingInv.invoiceNumber, 'R$ 4.500,00', '01/04/2026'),
      status: 'sent', sentAt: daysAgo(3),
    }});
    await prisma.communication.create({ data: {
      tenantId, customerId: c1.id, invoiceId: c1PendingInv.id,
      channel: 'email', messageType: 'reminder',
      content: EMAIL_TEMPLATES.d_minus3(c1.name, c1PendingInv.invoiceNumber, 'R$ 4.500,00', '01/04/2026'),
      status: 'delivered', sentAt: daysAgo(3),
    }});
  }

  // Internal notes for c1
  await prisma.customerNote.create({ data: {
    tenantId, customerId: c1.id, userId,
    content: 'Cliente com histórico limpo. Bom pagador. Média de 2 dias de atraso máximo nos últimos 12 meses.',
    createdAt: daysAgo(60),
  }});
  await prisma.customerNote.create({ data: {
    tenantId, customerId: c1.id, userId,
    content: 'Joana (financeiro) confirmou que preferem receber lembretes apenas por WhatsApp. E-mail cai em spam.',
    createdAt: daysAgo(45),
  }});
  await prisma.customerNote.create({ data: {
    tenantId, customerId: c1.id, userId,
    content: 'Conversa com CEO: expansão planejada para Q2. Possível aumento de contrato. Manter contato prioritário.',
    createdAt: daysAgo(10),
  }});

  console.log(`   ✅ ${c1.name}: ${c1Invoices.length} faturas, 4-5 comunicações, 3 notas`);

  // ──────────────────────────────────────────────────────────────────────────
  // CUSTOMER 2 — Beta Cloud Services (cliente com atraso, negociação em curso)
  // ──────────────────────────────────────────────────────────────────────────
  const c2 = customers.find(c => c.name.includes('Beta')) ?? customers[1];
  const c2Invoices = c2.invoices;
  const c2OverdueInv = c2Invoices.find(i => i.status === 'overdue');
  const c2PendingInv = c2Invoices.find(i => i.status === 'OPEN');

  console.log(`📧 Inserindo histórico para: ${c2.name}`);

  if (c2OverdueInv) {
    // Full dunning sequence for the overdue invoice
    await prisma.communication.create({ data: {
      tenantId, customerId: c2.id, invoiceId: c2OverdueInv.id,
      channel: 'whatsapp', messageType: 'reminder',
      content: WHATSAPP_TEMPLATES.d_minus3(c2.name, c2OverdueInv.invoiceNumber, 'R$ 12.500,00', '16/03/2026'),
      status: 'delivered', sentAt: daysAgo(8),
    }});

    await prisma.communication.create({ data: {
      tenantId, customerId: c2.id, invoiceId: c2OverdueInv.id,
      channel: 'email', messageType: 'reminder',
      content: EMAIL_TEMPLATES.d_zero(c2.name, c2OverdueInv.invoiceNumber, 'R$ 12.500,00'),
      status: 'delivered', sentAt: daysAgo(5),
    }});

    await prisma.communication.create({ data: {
      tenantId, customerId: c2.id, invoiceId: c2OverdueInv.id,
      channel: 'whatsapp', messageType: 'late_notice',
      content: WHATSAPP_TEMPLATES.d_plus2(c2.name, c2OverdueInv.invoiceNumber, 'R$ 12.500,00'),
      status: 'delivered', sentAt: daysAgo(3),
    }});

    await prisma.communication.create({ data: {
      tenantId, customerId: c2.id, invoiceId: c2OverdueInv.id,
      channel: 'email', messageType: 'late_notice',
      content: EMAIL_TEMPLATES.d_plus7(c2.name, c2OverdueInv.invoiceNumber, 'R$ 12.500,00'),
      status: 'sent', sentAt: daysAgo(1),
    }});

    // Manual message (operator sent directly)
    await prisma.communication.create({ data: {
      tenantId, customerId: c2.id, invoiceId: c2OverdueInv.id,
      channel: 'whatsapp', messageType: 'manual_message',
      content: `Mario, tudo bem? Aqui é da Fluxo Financeiro. Estamos tentando regularizar a fatura #${c2OverdueInv.invoiceNumber} de R$ 12.500,00. Pode me dizer qual a previsão de pagamento? Podemos negociar prazos. 🙏`,
      status: 'read', sentAt: daysAgo(2),
    }});

    // Payment promise linked to overdue invoice
    const existingPromise = await prisma.paymentPromise.count({ where: { tenantId, invoiceId: c2OverdueInv.id } });
    if (existingPromise === 0) {
      await prisma.paymentPromise.create({ data: {
        tenantId, invoiceId: c2OverdueInv.id, userId,
        amount: 12500.00,
        promisedDate: daysFromNow(5),
        notes: 'Mario (financeiro) ligou confirmando pagamento até dia 26/03. Entrada de recebíveis deles nessa data.',
        status: 'OPEN',
        createdAt: daysAgo(1),
      }});
    }
  }

  if (c2PendingInv) {
    // Send a D-3 warning for the pending invoice too
    await prisma.communication.create({ data: {
      tenantId, customerId: c2.id, invoiceId: c2PendingInv.id,
      channel: 'email', messageType: 'reminder',
      content: EMAIL_TEMPLATES.d_minus3(c2.name, c2PendingInv.invoiceNumber, 'R$ 18.000,00', '31/03/2026'),
      status: 'delivered', sentAt: daysAgo(4),
    }});
  }

  // Internal notes for c2
  await prisma.customerNote.create({ data: {
    tenantId, customerId: c2.id, userId,
    content: 'Cliente com histórico de atraso recorrente. Sempre paga, mas nunca na data. Média de 7-10 dias de delay.',
    createdAt: daysAgo(90),
  }});
  await prisma.customerNote.create({ data: {
    tenantId, customerId: c2.id, userId,
    content: 'Mario disse que empresa passou por reestruturação financeira em Jan/26. Aguardar estabilização antes de acionar jurídico.',
    createdAt: daysAgo(20),
  }});
  await prisma.customerNote.create({ data: {
    tenantId, customerId: c2.id, userId,
    content: '⚠️ Atenção: NÃO enviar cobrança por e-mail. Mario reportou que o e-mail cai sempre em spam. Usar APENAS WhatsApp.',
    createdAt: daysAgo(15),
  }});
  await prisma.customerNote.create({ data: {
    tenantId, customerId: c2.id, userId,
    content: 'Promessa de pagamento registrada para dia 26/03. Mario confirmou via WhatsApp às 14:32. Monitorar.',
    createdAt: daysAgo(1),
  }});

  console.log(`   ✅ ${c2.name}: ${c2Invoices.length} faturas, 6 comunicações, 1 promessa, 4 notas`);

  // ──────────────────────────────────────────────────────────────────────────
  // Create a 3rd customer directly (Gamma Industrias) with full history
  // ──────────────────────────────────────────────────────────────────────────
  const existingGamma = await prisma.customer.findFirst({ where: { tenantId, name: { contains: 'Gamma' } } });

  if (!existingGamma) {
    console.log(`📧 Criando 3º cliente: Gamma Indústrias...`);

    const c3 = await prisma.customer.create({ data: {
      tenantId,
      name: 'Gamma Indústrias SA',
      documentNumber: '33.444.555/0001-11',
      status: 'active',
      email: 'cobranca@gamma.ind.br',
      phone: '(11) 3456-7890',
      tags: 'industria,alto-volume,pagador-critico',
      financialContacts: {
        create: [{
          tenantId,
          name: 'Fernanda Tesouraria',
          email: 'fernanda@gamma.ind.br',
          phone: '(11) 94321-0987',
          isPrimary: true,
        }]
      }
    }});

    // 3 invoices for Gamma — one paid 60 days ago, one overdue 15 days, one future
    const gInv1 = await prisma.invoice.create({ data: {
      tenantId, customerId: c3.id, invoiceNumber: 'INV-2024-200',
      amount: 32000.00, balanceDue: 0, status: 'PAID',
      issueDate: daysAgo(75), dueDate: daysAgo(60),
    }});
    const gInv2 = await prisma.invoice.create({ data: {
      tenantId, customerId: c3.id, invoiceNumber: 'INV-2024-230',
      amount: 32000.00, balanceDue: 32000.00, status: 'overdue',
      issueDate: daysAgo(30), dueDate: daysAgo(15),
    }});
    const gInv3 = await prisma.invoice.create({ data: {
      tenantId, customerId: c3.id, invoiceNumber: 'INV-2024-250',
      amount: 32000.00, balanceDue: 32000.00, status: 'pending',
      issueDate: daysAgo(5), dueDate: daysFromNow(25),
    }});

    // Full dunning sequence for overdue (gInv2)
    const msgs = [
      { channel: 'whatsapp', type: 'reminder', content: WHATSAPP_TEMPLATES.d_minus3('Gamma Indústrias', gInv2.invoiceNumber, 'R$ 32.000,00', '06/03/2026'), status: 'delivered', sentAt: daysAgo(18) },
      { channel: 'email',    type: 'reminder', content: EMAIL_TEMPLATES.d_zero('Gamma Indústrias', gInv2.invoiceNumber, 'R$ 32.000,00'), status: 'delivered', sentAt: daysAgo(15) },
      { channel: 'whatsapp', type: 'late_notice', content: WHATSAPP_TEMPLATES.d_plus2('Gamma Indústrias', gInv2.invoiceNumber, 'R$ 32.000,00'), status: 'delivered', sentAt: daysAgo(13) },
      { channel: 'email',    type: 'late_notice', content: EMAIL_TEMPLATES.d_plus7('Gamma Indústrias', gInv2.invoiceNumber, 'R$ 32.000,00'), status: 'failed', sentAt: daysAgo(8) },
      { channel: 'whatsapp', type: 'late_notice', content: WHATSAPP_TEMPLATES.d_plus7('Gamma Indústrias', gInv2.invoiceNumber, 'R$ 32.000,00'), status: 'read', sentAt: daysAgo(8) },
      { channel: 'whatsapp', type: 'manual_message', content: 'Fernanda, preciso de uma posição urgente sobre a fatura #INV-2024-230 de R$ 32.000,00 em atraso há 15 dias. Podemos marcar uma reunião rápida?', status: 'delivered', sentAt: daysAgo(2) },
    ] as const;

    for (const m of msgs) {
      await prisma.communication.create({ data: {
        tenantId, customerId: c3.id, invoiceId: gInv2.id,
        channel: m.channel, messageType: m.type,
        content: m.content, status: m.status, sentAt: m.sentAt,
      }});
    }

    // Thank you for inv1 (paid)
    await prisma.communication.create({ data: {
      tenantId, customerId: c3.id, invoiceId: gInv1.id,
      channel: 'email', messageType: 'thank_you',
      content: 'Prezada Fernanda, confirmamos o recebimento de R$ 32.000,00 referente à fatura #INV-2024-200. Agradecemos a pontualidade!\n\nAtenciosamente, Fluxo Financeiro',
      status: 'delivered', sentAt: daysAgo(59),
    }});

    // Payment promise broken (she promised but didn't pay)
    await prisma.paymentPromise.create({ data: {
      tenantId, invoiceId: gInv2.id, userId,
      amount: 32000.00,
      promisedDate: daysAgo(5),
      notes: 'Fernanda prometeu pagar até dia 16/03. Promessa não cumprida. Escalar para jurídico se não houver posição até semana que vem.',
      status: 'broken',
      createdAt: daysAgo(10),
    }});

    // Notes
    await prisma.customerNote.create({ data: { tenantId, customerId: c3.id, userId, content: 'Cliente de alto volume. Contrato anual de R$ 384k. Tratar com cuidado — não acionar jurídico sem aprovação da diretoria.', createdAt: daysAgo(120) }});
    await prisma.customerNote.create({ data: { tenantId, customerId: c3.id, userId, content: 'Fernanda entrou de licença. Falar com o CFO interino: Marcos Silveira (marcos.cfo@gamma.ind.br / 11 99876-5432).', createdAt: daysAgo(12) }});
    await prisma.customerNote.create({ data: { tenantId, customerId: c3.id, userId, content: '⚠️ ALERTA: promessa quebrada. Atraso de 15 dias em fatura de R$ 32k. Aguardando retorno do CFO para negociar. Prazo limite: 28/03/2026.', createdAt: daysAgo(2) }});

    console.log(`   ✅ ${c3.name}: 3 faturas, 7 comunicações, 1 promessa quebrada, 3 notas`);
  } else {
    console.log(`   ℹ️ Gamma Indústrias já existe, pulando criação.`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────
  const totalComms = await prisma.communication.count({ where: { tenantId } });
  const totalNotes = await prisma.customerNote.count({ where: { tenantId } });
  const totalPromises = await prisma.paymentPromise.count({ where: { tenantId } });

  console.log('\n🌲 seed-history.ts Finalizado!');
  console.log(`   📨 Comunicações totais: ${totalComms}`);
  console.log(`   📝 Notas totais: ${totalNotes}`);
  console.log(`   🤝 Promessas totais: ${totalPromises}`);
  console.log('\n   Login: admin@techcorp.com / 123456\n');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
