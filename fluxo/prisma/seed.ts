import prisma from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Iniciando Seeding do Banco B2B Fluxo...');

  // 1. Criar Senha Base Realística
  const defaultPassword = await bcrypt.hash('123456', 10);

  // 2. Criar Tenant e User Admin (CEO)
  const tenant = await prisma.tenant.create({
    data: {
      name: 'TechCorp Solutions',
      documentNumber: '12.345.678/0001-90',
      planType: 'enterprise',
      users: {
        create: [
          {
            role: 'admin',
            user: {
              create: {
                email: 'admin@techcorp.com',
                fullName: 'Roberto CEO',
                password: defaultPassword,
              }
            }
          }
        ]
      }
    }
  });

  console.log(`✅ Tenant e Admin criados: ${tenant.name}`);

  // 3. Criar Clientes Recorrentes (Customers)
  const customer1 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: 'Alpha Software LTDA',
      documentNumber: '99.888.777/0001-55',
      financialContacts: {
        create: [
          { name: 'Joana Financeiro', email: 'fin@alpha.com', phone: '11999999999', isPrimary: true, tenantId: tenant.id }
        ]
      }
    }
  });

  const customer2 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: 'Beta Cloud Services',
      documentNumber: '11.222.333/0001-44',
      financialContacts: {
        create: [
          { name: 'Mario Pagamentos', email: 'pagamentos@betacloud.com', phone: '11888888888', isPrimary: true, tenantId: tenant.id }
        ]
      }
    }
  });

  console.log(`✅ Clientes cadastrados: ${customer1.name}, ${customer2.name}`);

  // 4. Criar Invoices (Histórico, Abertos e Atrasados)
  const now = new Date();
  const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const future10 = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
  const overdue5 = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

  // Fatura Paga 1
  await prisma.invoice.create({
    data: {
      tenantId: tenant.id, customerId: customer1.id, invoiceNumber: 'INV-2024-001',
      amount: 4500.00, balanceDue: 0, status: 'PAID', issueDate: past30, dueDate: past30
    }
  });

  // Fatura Pendente Normal (10 dias)
  await prisma.invoice.create({
    data: {
      tenantId: tenant.id, customerId: customer1.id, invoiceNumber: 'INV-2024-002',
      amount: 4500.00, balanceDue: 4500.00, status: 'OPEN', issueDate: now, dueDate: future10
    }
  });

  // Fatura Atrasada
  const invoiceOverdue = await prisma.invoice.create({
    data: {
      tenantId: tenant.id, customerId: customer2.id, invoiceNumber: 'INV-2024-089',
      amount: 12500.00, balanceDue: 12500.00, status: 'overdue', issueDate: past30, dueDate: overdue5
    }
  });

  // Fatura Pendente Grande
  await prisma.invoice.create({
    data: {
      tenantId: tenant.id, customerId: customer2.id, invoiceNumber: 'INV-2024-090',
      amount: 18000.00, balanceDue: 18000.00, status: 'OPEN', issueDate: now, dueDate: future10
    }
  });

  console.log(`✅ Invoices (Faturamentos) simulados e inseridos.`);

  // 5. Histórico e Automação B2B (Métricas Ricas)
  const user = await prisma.user.findUnique({ where: { email: 'admin@techcorp.com' } });
  
  if (user) {
    // Promise de pagamento (Negociação) na fatura atrasada
    await prisma.paymentPromise.create({
      data: {
        tenantId: tenant.id,
        invoiceId: invoiceOverdue.id,
        userId: user.id,
        amount: 12500.00,
        promisedDate: future10,
        notes: 'Cliente prometeu pagar após entrada de recebível deles dia 10',
        status: 'OPEN'
      }
    });

    // Activity Log de envio de WhatsApp B2B
    await prisma.activityLog.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        action: 'WHATSAPP_REMINDER_SENT',
        entityType: 'invoice',
        entityId: invoiceOverdue.id,
        metadata: JSON.stringify({ message: 'Cobrança enviada para Financeiro via API' })
      }
    });
  }

  console.log(`✅ Eventos de Registro de Auditoria criados.`);
  console.log('🌲 Seed Finalizado com sucesso!');
  console.log('\n--- CREDENCIAIS PARA TESTE ---');
  console.log('Email: admin@techcorp.com');
  console.log('Senha: 123456');
  console.log('------------------------------\n');
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
