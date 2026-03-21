'use server';

import prisma from '@/lib/db';
import { auth } from '../../auth';

export async function getCustomersList(search?: string) {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) {
    throw new Error("Unauthorized Access: No active B2B Tenant found.");
  }

  // Fetch Customers along with their primary financial contact and invoices for aggregations
  const whereClause: any = { tenantId };
  if (search && search.trim() !== '') {
    whereClause.OR = [
      { name: { contains: search } },
      { documentNumber: { contains: search } },
      { financialContacts: { some: { email: { contains: search } } } }
    ];
  }

  const customersRaw = await prisma.customer.findMany({
    where: whereClause,
    include: {
      financialContacts: {
        where: { isPrimary: true },
        take: 1
      },
      invoices: {
        select: { status: true, amount: true, balanceDue: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Aggregate LTV (Life Time Value) and Risk
  const enhancedCustomers = customersRaw.map(customer => {
    let totalLtv = 0;
    let totalRisk = 0;
    let overdueCount = 0;

    customer.invoices.forEach(inv => {
      if (inv.status === 'paid') {
        totalLtv += inv.amount;
      }
      if (inv.status === 'overdue') {
        totalRisk += inv.balanceDue;
        overdueCount++;
      }
    });

    const contact = customer.financialContacts[0] || null;

    return {
      id: customer.id,
      name: customer.name,
      documentNumber: customer.documentNumber,
      status: customer.status,
      contactName: contact?.name || 'Sem Contato',
      contactEmail: contact?.email || '',
      contactPhone: contact?.phone || '',
      metrics: {
        totalLtv,
        totalRisk,
        overdueCount,
        totalInvoices: customer.invoices.length
      }
    };
  });

  return enhancedCustomers;
}

// Keep old signature working if needed, but point to new
export async function getCustomers() {
  return await getCustomersList();
}

// Action for fetching full Customer details (Drawer timeline)
export async function getCustomerDetails(customerId: string) {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) throw new Error("Unauthorized");

  const customer = await prisma.customer.findUnique({
    where: { id: customerId, tenantId },
    include: {
      financialContacts: true,
      invoices: {
        orderBy: { dueDate: 'desc' },
        take: 15 // Last 15 invoices for Timeline
      }
    }
  });

  return customer;
}
