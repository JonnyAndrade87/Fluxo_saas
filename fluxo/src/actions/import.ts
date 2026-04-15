'use server';

import prisma from '@/lib/prisma';
import { auth } from '../../auth';
import { enforceRateLimit } from '@/lib/api-rate-limiter';
import {
  createTenantLimitGuard,
  isBillingLimitExceededError,
  type TenantLimitGuard,
} from '@/lib/billing/limits';

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

export type ImportResult = {
  success: boolean;
  created: number;
  skipped: number;
  errors: { row: number; reason: string }[];
  error?: string;
};

/**
 * Parse and validate a date string. Returns null if the string is not a valid date.
 * Accepts ISO dates (YYYY-MM-DD) and common pt-BR formats (DD/MM/YYYY).
 */
function parseDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;

  const trimmed = raw.trim();

  // Try pt-BR format first: DD/MM/YYYY
  const ptBrMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ptBrMatch) {
    const [, day, month, year] = ptBrMatch;
    const date = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    if (!isNaN(date.getTime())) return date;
  }

  // Try ISO / any other parseable format
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) return date;

  return null; // Explicitly invalid
}

/**
 * Build a stable, deterministic deduplication key for a row without an invoiceNumber.
 * This makes re-importing the same CSV idempotent even when invoiceNumber is absent.
 * Key: tenantId + sanitized document + amount (cents) + ISO date
 */
function buildStableInvoiceKey(
  tenantId: string,
  document: string,
  amount: number,
  dueDate: Date
): string {
  const amountCents = Math.round(amount * 100);
  const dateKey = dueDate.toISOString().split('T')[0]; // YYYY-MM-DD
  return `AUTO-${tenantId.slice(0, 8)}-${document}-${amountCents}-${dateKey}`;
}

export async function importReceivables(data: ParsedReceivable[]): Promise<ImportResult> {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    return { success: false, created: 0, skipped: 0, errors: [], error: 'Unauthorized: No active session or tenant.' };
  }

  try {
    await enforceRateLimit('import-csv', tenantId, { limit: 10, windowMs: 60 * 60 * 1000 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Muitas tentativas';
    return { success: false, created: 0, skipped: 0, errors: [], error: message };
  }

  if (!data || data.length === 0) {
    return { success: false, created: 0, skipped: 0, errors: [], error: 'O arquivo CSV está vazio ou o mapeamento falhou.' };
  }

  let limitGuard: TenantLimitGuard;

  try {
    limitGuard = await createTenantLimitGuard(tenantId, ['customers', 'invoices']);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao validar os limites do plano.';
    return { success: false, created: 0, skipped: 0, errors: [], error: message };
  }

  let created = 0;
  let skipped = 0;
  const errors: { row: number; reason: string }[] = [];

  // Process each row independently to be resilient: one bad row never aborts valid rows.
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 1;

    try {
      // ── Row Validation ─────────────────────────────────────────────────────────
      if (!row.customerName?.trim()) {
        errors.push({ row: rowNum, reason: 'Nome do cliente ausente.' });
        continue;
      }
      if (!row.document?.trim()) {
        errors.push({ row: rowNum, reason: 'Documento (CPF/CNPJ) ausente.' });
        continue;
      }
      if (!row.amount || row.amount <= 0) {
        errors.push({ row: rowNum, reason: `Valor inválido: ${row.amount}.` });
        continue;
      }

      // ── Date Validation ────────────────────────────────────────────────────────
      const parsedDate = parseDate(row.dueDate);
      if (!parsedDate) {
        errors.push({ row: rowNum, reason: `Data de vencimento inválida: "${row.dueDate}". Use YYYY-MM-DD ou DD/MM/YYYY.` });
        continue;
      }

      const cleanDocument = row.document.replace(/\D/g, '');

      // ── Idempotency Key ────────────────────────────────────────────────────────
      // If the importer provided an invoiceNumber, use it as-is.
      // Otherwise build a stable, deterministic key so reimports don't duplicate.
      const invNumber = row.invoiceNumber?.trim()
        ? row.invoiceNumber.trim()
        : buildStableInvoiceKey(tenantId, cleanDocument, row.amount, parsedDate);

      // ── Check if already imported ──────────────────────────────────────────────
      const existingInvoice = await prisma.invoice.findFirst({
        where: { tenantId, invoiceNumber: invNumber },
        select: { id: true }
      });
      if (existingInvoice) {
        skipped++;
        continue;
      }

      // ── Upsert Customer ────────────────────────────────────────────────────────
      const existingCustomer = await prisma.customer.findFirst({
        where: { tenantId, documentNumber: cleanDocument },
        select: { id: true }
      });

      const shouldCreateCustomer = !existingCustomer;

      if (shouldCreateCustomer) {
        limitGuard.assertCanCreateCustomer();
      }

      limitGuard.assertCanCreateInvoice();

      let customer = existingCustomer;

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            tenantId,
            name: row.customerName.trim(),
            documentNumber: cleanDocument,
            status: 'active'
          }
        });

        if (row.email?.trim()) {
          await prisma.financialContact.create({
            data: {
              tenantId,
              customerId: customer.id,
              name: 'Contato Financeiro Padrão',
              email: row.email.trim(),
              phone: row.phone?.trim() || null,
              isPrimary: true
            }
          });
        }

        limitGuard.registerCreatedCustomer();
      }

      // ── Create Invoice ─────────────────────────────────────────────────────────
      const statusMap: Record<string, string> = {
        paid: 'PAID',
        pago: 'PAID',
        canceled: 'CANCELED',
        cancelado: 'CANCELED',
        cancelada: 'CANCELED',
      };
      const invoiceStatus = (row.status && statusMap[row.status.toLowerCase()]) || 'OPEN';

      await prisma.invoice.create({
        data: {
          tenantId,
          customerId: customer.id,
          invoiceNumber: invNumber,
          amount: row.amount,
          balanceDue: invoiceStatus === 'PAID' ? 0 : row.amount,
          dueDate: parsedDate,
          status: invoiceStatus,
          externalReferenceId: row.description?.trim() || 'Importado via CSV'
        }
      });
      limitGuard.registerCreatedInvoice();

      created++;
    } catch (rowError: unknown) {
      const msg = rowError instanceof Error ? rowError.message : 'Erro desconhecido.';
      console.error(`[IMPORT] Erro na linha ${rowNum}:`, msg);
      errors.push({
        row: rowNum,
        reason: isBillingLimitExceededError(rowError) ? msg : `Erro interno: ${msg}`,
      });
    }
  }

  return {
    success: true,
    created,
    skipped,
    errors,
  };
}
