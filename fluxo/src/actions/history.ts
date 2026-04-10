'use server';

import prisma from '@/lib/prisma';
import { isInvoiceOverdue } from '@/lib/invoice-utils';
import { auth } from '../../auth';

export interface CollectionCustomerSummary {
  id: string;
  name: string;
  documentNumber: string;
  status: string;
  email: string | null;
  phone: string | null;
  openInvoices: number;
  overdueInvoices: number;
  lastEventAt: Date | null;
  totalOverdue: number;
}

export interface TimelineEvent {
  id: string;
  type: 'communication' | 'note' | 'promise' | 'activity' | 'task';
  createdAt: Date;
  // Communication fields
  channel?: string;
  messageType?: string;
  content?: string;
  status?: string;
  invoiceId?: string | null;
  invoiceNumber?: string | null;
  invoiceAmount?: number | null;
  // Note fields
  authorName?: string;
  // Promise fields
  promisedDate?: Date;
  promiseAmount?: number;
  promiseStatus?: string;
  promiseNotes?: string | null;
  // Activity fields
  action?: string;
  entityType?: string;
  // Task fields
  title?: string;
  description?: string | null;
  dueDate?: Date;
  completedAt?: Date | null;
  assigneeName?: string | null;
}

export interface CollectionDetail {
  customer: {
    id: string;
    name: string;
    documentNumber: string;
    status: string;
    email: string | null;
    phone: string | null;
    notes: string | null;
    tags: string | null;
    assignee: { fullName: string } | null;
  };
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    amount: number;
    updatedAmount: number;
    paidAmount: number | null;
    dueDate: Date;
    status: string;
  }>;
  timeline: TimelineEvent[];
}

export async function getCollectionCustomers(filters?: {
  search?: string;
  status?: string;
}): Promise<CollectionCustomerSummary[]> {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) throw new Error('Unauthorized');

  const where: any = { tenantId };

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { documentNumber: { contains: filters.search } },
      { email: { contains: filters.search } },
    ];
  }

  if (filters?.status && filters.status !== 'all') {
    where.status = filters.status;
  }

  const customers = await prisma.customer.findMany({
    where,
    include: {
      invoices: {
        select: { id: true, status: true, amount: true, updatedAt: true }
      },
      communications: {
        orderBy: { sentAt: 'desc' },
        take: 1,
        select: { sentAt: true }
      },
      customerNotes: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return customers.map(c => {
    const invoiceList = c.invoices || [];
    const open = invoiceList.filter((i: any) => i.status === 'OPEN' || i.status === 'PROMISE_TO_PAY');
    const overdue = invoiceList.filter((i: any) => isInvoiceOverdue(i));
    const totalOverdue = overdue.reduce((s: number, i: any) => s + (i.updatedAmount || i.amount), 0);
    const lastComm = c.communications?.[0]?.sentAt ?? null;
    const lastNote = c.customerNotes?.[0]?.createdAt ?? null;
    const lastEventAt = lastComm && lastNote
      ? lastComm > lastNote ? lastComm : lastNote
      : lastComm ?? lastNote;

    return {
      id: c.id,
      name: c.name,
      documentNumber: c.documentNumber,
      status: c.status,
      email: c.email,
      phone: c.phone,
      openInvoices: open.length,
      overdueInvoices: overdue.length,
      lastEventAt,
      totalOverdue
    };
  });
}

export async function getCollectionDetail(customerId: string): Promise<CollectionDetail | null> {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) throw new Error('Unauthorized');

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId },
    include: {
      assignee: { select: { fullName: true } },
      invoices: {
        select: { id: true, invoiceNumber: true, amount: true, updatedAmount: true, paidAmount: true, dueDate: true, status: true },
        orderBy: { dueDate: 'desc' }
      },
      communications: {
        include: { invoice: { select: { invoiceNumber: true, amount: true } } },
        orderBy: { sentAt: 'desc' }
      },
      customerNotes: {
        include: { user: { select: { fullName: true } } },
        orderBy: { createdAt: 'desc' }
      },
    }
  });

  if (!customer) return null;

  // Get payment promises linked to customer invoices
  const invoiceIds = (customer as any).invoices.map((i: any) => i.id);
  const promises = await prisma.paymentPromise.findMany({
    where: { tenantId, invoiceId: { in: invoiceIds } },
    include: {
      user: { select: { fullName: true } },
      invoice: { select: { invoiceNumber: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Get tasks linked to customer
  const tasks = await prisma.task.findMany({
    where: { tenantId, customerId },
    include: {
      assignee: { select: { fullName: true } },
      invoice: { select: { invoiceNumber: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Build unified timeline
  const timeline: TimelineEvent[] = [];

  for (const comm of customer.communications) {
    timeline.push({
      id: comm.id,
      type: 'communication',
      createdAt: comm.sentAt,
      channel: comm.channel,
      messageType: comm.messageType,
      content: comm.content,
      status: comm.status,
      invoiceId: comm.invoiceId,
      invoiceNumber: comm.invoice?.invoiceNumber ?? null,
      invoiceAmount: comm.invoice?.amount ?? null,
    });
  }

  for (const note of customer.customerNotes) {
    timeline.push({
      id: note.id,
      type: 'note',
      createdAt: note.createdAt,
      content: note.content,
      authorName: note.user.fullName,
    });
  }

  for (const promise of promises) {
    timeline.push({
      id: promise.id,
      type: 'promise',
      createdAt: promise.createdAt,
      promisedDate: promise.promisedDate,
      promiseAmount: promise.amount,
      promiseStatus: promise.status,
      promiseNotes: promise.notes,
      authorName: promise.user.fullName,
      invoiceNumber: promise.invoice.invoiceNumber,
      invoiceId: promise.invoiceId,
    });
  }

  for (const task of tasks) {
    timeline.push({
      id: task.id,
      type: 'task',
      createdAt: task.createdAt,
      title: task.title,
      description: task.description,
      status: task.status,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      assigneeName: task.assignee?.fullName,
      invoiceNumber: task.invoice?.invoiceNumber ?? null,
      invoiceId: task.invoiceId,
    });
  }

  // Sort all events newest first
  timeline.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      documentNumber: customer.documentNumber,
      status: customer.status,
      email: customer.email,
      phone: customer.phone,
      notes: customer.notes,
      tags: customer.tags,
      assignee: customer.assignee,
    },
    invoices: customer.invoices,
    timeline,
  };
}
