'use server';

import prisma from '@/lib/db';
import { auth } from '../../auth';

export async function getCustomers() {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) {
    throw new Error("Unauthorized Access: No active B2B Tenant found.");
  }

  // Fetch Customers along with their primary financial contact
  const customers = await prisma.customer.findMany({
    where: { tenantId },
    include: {
      financialContacts: {
        where: { isPrimary: true },
        take: 1
      },
      _count: {
        select: { invoices: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return customers;
}
