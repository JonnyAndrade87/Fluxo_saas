'use server';

import prisma from '@/lib/prisma';
import { auth } from '../../auth';
import { revalidatePath } from 'next/cache';
import { requireAuthFresh, requireRole, AUDIT_ACTIONS } from '@/lib/permissions';
import { getRiskScoreForCustomer } from './risk-score';
import { isInvoiceOverdue } from '@/lib/invoice-utils';
import { logAudit } from '@/lib/audit';
import { createTenantLimitGuard } from '@/lib/billing/limits';

interface SessionUser {
  tenantId: string | null;
  id: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
}

export interface CustomerInput {
  id?: string;
  name: string;
  documentNumber: string;
  email?: string;
  phone?: string;
  status?: string;
  tags?: string;
  address?: string;
  notes?: string;
  assignedUserId?: string;
}

export interface FinancialContactInput {
  id?: string;
  customerId: string;
  name: string;
  email: string;
  phone?: string;
  isPrimary?: boolean;
}

export async function getCustomersList(search?: string, riskFilter?: string) {
  const session = await auth();
  const tenantId = (session?.user as SessionUser)?.tenantId;

  if (!tenantId) {
    throw new Error("Unauthorized Access: No active B2B Tenant found.");
  }

  const whereClause: import('@prisma/client').Prisma.CustomerWhereInput = { tenantId };
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
        select: { status: true, amount: true, updatedAmount: true, dueDate: true }
      },
      assignee: {
        select: { fullName: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Calcular score de risco para cada cliente usando o serviço centralizado
  // ────────────────────────────────────────────────────────────────────────────
  const enhancedCustomers = await Promise.all(
    customersRaw.map(async (customer) => {
      const riskScoreData = await getRiskScoreForCustomer(customer.id, tenantId);
      const contact = customer.financialContacts[0] || null;

      // Fallback para valores legados se score não puder ser calculado
      let totalLtv = 0;
      let totalRisk = 0;
      let overdueCount = 0;

      customer.invoices.forEach(inv => {
        if (inv.status === 'PAID') {
          totalLtv += inv.amount;
        }
        if (isInvoiceOverdue(inv)) {
          totalRisk += inv.updatedAmount || inv.amount;
          overdueCount++;
        }
      });

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
        // Score numérico 0-100 e nível de risco (do novo serviço)
        riskScore: riskScoreData?.score ?? 0,
        riskLevel: riskScoreData?.level ?? 'Baixo',
        riskJustification: riskScoreData?.justification ?? '',
        riskRecommendation: riskScoreData?.recommendation ?? '',
        // Compatibilidade com UI existente
        latestDelay: riskScoreData?.metadata.maxDelayDays ?? 0,
        metrics: {
          totalLtv,
          totalRisk,
          overdueCount,
          totalInvoices: customer.invoices.length,
          // Novos dados de auditoria do score
          ...(riskScoreData && {
            riskComponents: riskScoreData.components,
            riskMetadata: riskScoreData.metadata
          })
        }
      };
    })
  );

  if (riskFilter && riskFilter !== 'Todos' && riskFilter !== 'all') {
    return enhancedCustomers.filter((c) => c.riskLevel.toLowerCase() === riskFilter.toLowerCase());
  }

  return enhancedCustomers;
}

export async function getCustomers() {
  return await getCustomersList();
}

export async function getCustomerDetails(customerId: string) {
  const session = await auth();
  const tenantId = (session?.user as SessionUser)?.tenantId;

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

  if (!customer) return null;

  const riskScoreData = await getRiskScoreForCustomer(customer.id, tenantId);

  return {
    ...customer,
    riskScore: riskScoreData?.score ?? 0,
    riskLevel: riskScoreData?.level ?? 'Baixo',
    riskJustification: riskScoreData?.justification ?? '',
    riskRecommendation: riskScoreData?.recommendation ?? '',
    riskMetadata: riskScoreData?.metadata ?? null,
  };
}

export async function upsertCustomer(data: CustomerInput) {
  const ctx = await requireAuthFresh();
  requireRole(['admin'], ctx);
  const { tenantId, userId } = ctx; // requireAuthFresh() guarantees both are non-empty strings

  const { id, name, documentNumber, email, phone, status, tags, address, notes, assignedUserId } = data;

  let customer;
  if (id) {
    customer = await prisma.customer.update({
      where: { id, tenantId },
      data: { name, documentNumber, email, phone, status, tags, address, notes, assignedUserId }
    });
  } else {
    const limitGuard = await createTenantLimitGuard(tenantId, ['customers']);
    limitGuard.assertCanCreateCustomer();

    customer = await prisma.customer.create({
      data: { tenantId, name, documentNumber, email, phone, status, tags, address, notes, assignedUserId }
    });
    limitGuard.registerCreatedCustomer();
    
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

  // Log activity using the new robust audit utility
  await logAudit({
    tenantId,
    userId,
    userRole: ctx.role,
    action: id ? AUDIT_ACTIONS.CUSTOMER_UPDATED : AUDIT_ACTIONS.CUSTOMER_CREATED,
    entityType: 'customer',
    entityId: customer.id,
    metadata: { name: customer.name, documentNumber: customer.documentNumber }
  });

  revalidatePath('/clientes');
  return customer;
}

export async function addCustomerNote(customerId: string, content: string) {
  const ctx = await requireAuthFresh(); // any authenticated user can add notes
  const { tenantId, userId } = ctx;

  // Validate ownership
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId }
  });
  if (!customer) throw new Error("Customer not found or invalid tenant");

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

export async function upsertFinancialContact(data: FinancialContactInput) {
  const ctx = await requireAuthFresh();
  requireRole(['admin'], ctx);
  const { tenantId } = ctx;

  const { id, customerId, name, email, phone, isPrimary } = data;

  // Validate ownership of the customer
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId }
  });
  if (!customer) throw new Error("Customer not found or invalid tenant");

  if (isPrimary) {
     await prisma.financialContact.updateMany({
        where: { customerId, tenantId },
        data: { isPrimary: false }
     });
  }

  let contact;
  if (id) {
    // Validate ownership of the contact being updated
    const existing = await prisma.financialContact.findFirst({
      where: { id, tenantId }
    });
    if (!existing) throw new Error("Contact not found or invalid tenant");

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
