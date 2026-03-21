'use server';

import prisma from '@/lib/db';
import { auth } from '../../auth';
import { revalidatePath } from 'next/cache';

export async function getCustomersList(search?: string) {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) {
    throw new Error("Unauthorized Access: No active B2B Tenant found.");
  }

  const whereClause: any = { tenantId };
  if (search && search.trim() !== '') {
    whereClause.OR = [
      { name: { contains: search } },
      { documentNumber: { contains: search } },
      { email: { contains: search } },
      { tags: { contains: search } }
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
        select: { status: true, amount: true, balanceDue: true, dueDate: true }
      },
      assignee: {
        select: { fullName: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const enhancedCustomers = customersRaw.map(customer => {
    let totalLtv = 0;
    let totalRisk = 0;
    let overdueCount = 0;
    let maxDelay = 0;

    const today = new Date();

    customer.invoices.forEach(inv => {
      if (inv.status === 'paid') {
        totalLtv += inv.amount;
      }
      if (inv.status === 'overdue') {
        totalRisk += inv.balanceDue;
        overdueCount++;
        const diffTime = today.getTime() - inv.dueDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > maxDelay) {
           maxDelay = diffDays;
        }
      }
    });

    const contact = customer.financialContacts[0] || null;

    let riskLevel: 'Crítico' | 'Alto' | 'Médio' | 'Baixo' = 'Baixo';
    if (maxDelay > 60 || totalRisk > 25000) riskLevel = 'Crítico';
    else if (maxDelay > 30 || totalRisk > 10000) riskLevel = 'Alto';
    else if (maxDelay > 0) riskLevel = 'Médio';

    return {
      id: customer.id,
      name: customer.name,
      documentNumber: customer.documentNumber,
      status: customer.status,
      email: customer.email || contact?.email,
      phone: customer.phone || contact?.phone,
      // Contact display fields (used by table)
      contactName: contact?.name || null,
      contactEmail: contact?.email || customer.email || null,
      contactPhone: contact?.phone || customer.phone || null,
      tags: customer.tags ? customer.tags.split(',').map(t => t.trim()) : [],
      assigneeName: customer.assignee?.fullName || 'Não atribuído',
      latestDelay: maxDelay,
      riskLevel,
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

export async function getCustomers() {
  return await getCustomersList();
}

export async function getCustomerDetails(customerId: string) {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) throw new Error("Unauthorized");

  const customer = await prisma.customer.findUnique({
    where: { id: customerId, tenantId },
    include: {
      financialContacts: true,
      assignee: true,
      customerNotes: {
        include: { user: { select: { fullName: true } } },
        orderBy: { createdAt: 'desc' },
      },
      communications: {
         orderBy: { sentAt: 'desc' },
         take: 15
      },
      invoices: {
        orderBy: { dueDate: 'desc' },
        take: 20
      }
    }
  });

  return customer;
}

export async function upsertCustomer(data: any) {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId;
  let userId = (session?.user as any)?.id;

  if (!tenantId) throw new Error("Unauthorized");

  // Fallback for old JWT sessions that don't have ID mapped
  if (!userId) {
     const tUser = await prisma.tenantUser.findFirst({ where: { tenantId } });
     userId = tUser?.userId;
  }

  const { id, name, documentNumber, email, phone, status, tags, address, notes, assignedUserId } = data;

  let customer;
  if (id) {
    customer = await prisma.customer.update({
      where: { id, tenantId },
      data: { name, documentNumber, email, phone, status, tags, address, notes, assignedUserId }
    });
  } else {
    customer = await prisma.customer.create({
      data: { tenantId, name, documentNumber, email, phone, status, tags, address, notes, assignedUserId }
    });
    
    // Auto-create a primary financial contact if email/phone was provided
    if (email || phone) {
       await prisma.financialContact.create({
          data: {
             tenantId,
             customerId: customer.id,
             name: "Contato Principal",
             email: email || "",
             phone: phone || "",
             isPrimary: true
          }
       });
    }
  }

  // Log activity
  await prisma.activityLog.create({
    data: {
      tenantId,
      userId,
      action: id ? 'CUSTOMER_UPDATED' : 'CUSTOMER_CREATED',
      entityType: 'customer',
      entityId: customer.id
    }
  });

  revalidatePath('/clientes');
  return customer;
}

export async function addCustomerNote(customerId: string, content: string) {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId;
  let userId = (session?.user as any)?.id;

  // Fallback for old JWT sessions
  if (!userId && tenantId) {
     const tUser = await prisma.tenantUser.findFirst({ where: { tenantId } });
     userId = tUser?.userId;
  }

  if (!tenantId || !userId) throw new Error("Unauthorized");

  const note = await prisma.customerNote.create({
    data: {
      tenantId,
      customerId,
      userId,
      content
    }
  });

  revalidatePath('/clientes');
  return note;
}

export async function upsertFinancialContact(data: any) {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) throw new Error("Unauthorized");

  const { id, customerId, name, email, phone, isPrimary } = data;

  if (isPrimary) {
     await prisma.financialContact.updateMany({
        where: { customerId, tenantId },
        data: { isPrimary: false }
     });
  }

  let contact;
  if (id) {
    contact = await prisma.financialContact.update({
      where: { id },
      data: { name, email, phone, isPrimary }
    });
  } else {
    contact = await prisma.financialContact.create({
      data: { tenantId, customerId, name, email, phone, isPrimary }
    });
  }

  revalidatePath(`/clientes/${customerId}`);
  return contact;
}

