'use server';

import prisma from '@/lib/db';
import { auth } from '../../auth';

export type ParsedReceivable = {
  customerName: string;
  document: string;
  email: string | null;
  phone: string | null;
  description: string | null;
  amount: number | null;
  dueDate: string | null;
  invoiceNumber: string | null;
  status: string | null;
};

export async function importReceivables(data: ParsedReceivable[]) {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    return { success: false, error: "Unauthorized Access: No active B2B Tenant found." };
  }

  if (!data || data.length === 0) {
    return { success: false, error: "O arquivo CSV está vazio ou o mapeamento falhou." };
  }

  try {
    let importCount = 0;
    
    // Utilize an atomic transaction to guarantee partial failures don't corrupt the database.
    await prisma.$transaction(async (tx) => {
      
      for (const row of data) {
        // Skip invalid rows without breaking the loop
        if (!row.customerName || !row.document || !row.amount || !row.dueDate) {
          continue; 
        }

        const cleanDocument = row.document.replace(/\D/g, ''); // Clear formatting

        // Upsert Customer (Create if not exists, Update if exists)
        // Since sqlite doesn't support complex upserts natively like Postgres, we do it in two steps.
        let customer = await tx.customer.findFirst({
          where: { tenantId, documentNumber: cleanDocument }
        });

        if (!customer) {
          customer = await tx.customer.create({
            data: {
              tenantId,
              name: row.customerName,
              documentNumber: cleanDocument,
              status: "active"
            }
          });

          // Create primary contact
          if (row.email) {
            await tx.financialContact.create({
              data: {
                tenantId,
                customerId: customer.id,
                name: "Contato Financeiro Padrão",
                email: row.email,
                phone: row.phone || null,
                isPrimary: true
              }
            });
          }
        }

        // Avoid Invoice Duplication by invoiceNumber if provided
        const invNumber = row.invoiceNumber || `IMP-${Date.now()}-${Math.floor(Math.random()*1000)}`;
        
        const existingInvoice = await tx.invoice.findFirst({
           where: { tenantId, invoiceNumber: invNumber }
        });

        if (!existingInvoice) {
          await tx.invoice.create({
            data: {
              tenantId,
              customerId: customer.id,
              invoiceNumber: invNumber,
              amount: row.amount,
              balanceDue: row.amount,
              dueDate: new Date(row.dueDate),
              status: row.status === 'paid' ? 'PAID' : row.status === 'canceled' ? 'CANCELED' : 'OPEN',
              externalReferenceId: row.description || "Importado via CSV"
            }
          });
          importCount++;
        }
      }
    });

    return { 
      success: true, 
      message: `${importCount} faturas inseridas/atualizadas com sucesso.`
    };
    
  } catch (error: any) {
    console.error("Import Error:", error);
    return { 
      success: false, 
      error: error.message || "Ocorreu um erro interno durante a importação." 
    };
  }
}
