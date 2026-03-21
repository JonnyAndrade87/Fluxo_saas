import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const customerId = "55929fc4-7527-4c72-8980-6de5156ba0cb";
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  
  if (!customer) return console.log("No test customer in DB");
  console.log("Test Customer found:", customer.id);
  
  try {
    const res = await prisma.customer.findFirst({
      where: { id: customer.id },
      include: {
        assignee: { select: { fullName: true } },
        invoices: {
          select: { id: true, invoiceNumber: true, amount: true, balanceDue: true, dueDate: true, status: true },
          orderBy: { dueDate: 'desc' }
        },
        communications: {
          include: { invoice: { select: { invoiceNumber: true, amount: true } } },
          orderBy: { sentAt: 'desc' }
        },
        customerNotes: {
          include: { user: { select: { fullName: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    const invoiceIds = res?.invoices.map(i => i.id) || [];
    const promises = await prisma.paymentPromise.findMany({
      where: { invoiceId: { in: invoiceIds } },
      include: {
        user: { select: { fullName: true } },
        invoice: { select: { invoiceNumber: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const tasks = await prisma.task.findMany({
      where: { customerId: customer.id },
      include: {
        assignee: { select: { fullName: true } },
        invoice: { select: { invoiceNumber: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log("Success fetching details and tasks!", res?.invoices.length, promises.length, tasks.length);
  } catch (err: any) {
    console.error("Error fetching:", err.message);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
