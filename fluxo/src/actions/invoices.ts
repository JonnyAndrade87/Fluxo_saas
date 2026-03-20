'use server';

import prisma from '@/lib/db';
import { auth } from '../../auth';

export async function getInvoices() {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) {
    throw new Error("Unauthorized Access: No active B2B Tenant found.");
  }

  // Fetch Invoices, including Customer relationship directly
  const invoices = await prisma.invoice.findMany({
    where: { tenantId },
    include: {
      customer: {
        select: {
          name: true,
          documentNumber: true
        }
      }
    },
    orderBy: {
      dueDate: 'asc'
    }
  });

  return invoices;
}
