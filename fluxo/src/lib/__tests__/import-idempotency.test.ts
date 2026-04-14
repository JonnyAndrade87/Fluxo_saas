import { describe, it, expect, vi, beforeEach } from 'vitest';
import { importReceivables, ParsedReceivable } from '@/actions/import';

// Mock auth
vi.mock('../../../auth', () => ({
  auth: vi.fn(),
}));
import { auth } from '../../../auth';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    invoice: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    customer: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    financialContact: {
      create: vi.fn(),
    },
  },
}));
import prisma from '@/lib/prisma';

const mockSession = { user: { tenantId: 'tenant-A', role: 'admin' } };

const validRow: ParsedReceivable = {
  customerName: 'Empresa X',
  document: '12.345.678/0001-90',
  email: 'fin@x.com',
  phone: null,
  description: 'Fatura Março',
  amount: 1500.00,
  dueDate: '2025-03-31',
  invoiceNumber: 'FAT-001',
  status: 'open',
};

describe('Importação Idempotente e Resiliente de Faturas', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.customer.findFirst).mockResolvedValue({ id: 'cust-1' } as any);
    vi.mocked(prisma.invoice.findFirst).mockResolvedValue(null); // No existing invoice
    vi.mocked(prisma.invoice.create).mockResolvedValue({} as any);
  });

  // ─── 1. Operação válida funcionando normalmente ─────────────────────────────
  it('operação válida cria fatura normalmente e retorna created=1', async () => {
    const result = await importReceivables([validRow]);

    expect(result.success).toBe(true);
    expect(result.created).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(prisma.invoice.create).toHaveBeenCalledOnce();
  });

  // ─── 2. Data inválida tratada com segurança ─────────────────────────────────
  it('data inválida é reportada por linha sem derrubar as demais', async () => {
    const rows: ParsedReceivable[] = [
      { ...validRow, invoiceNumber: 'FAT-002', dueDate: 'não-é-uma-data' },
      { ...validRow, invoiceNumber: 'FAT-003', dueDate: '2025-04-15' }, // Válida
    ];

    const result = await importReceivables(rows);

    expect(result.success).toBe(true);
    expect(result.created).toBe(1); // Só a segunda passou
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(1);
    expect(result.errors[0].reason).toMatch(/Data de vencimento inválida/);
  });

  it('data em formato pt-BR (DD/MM/YYYY) é aceita corretamente', async () => {
    const result = await importReceivables([{ ...validRow, dueDate: '31/03/2025' }]);

    expect(result.success).toBe(true);
    expect(result.created).toBe(1);
    expect(result.errors).toHaveLength(0);
  });

  // ─── 3. Linha inválida reportada sem derrubar as demais ────────────────────
  it('linha sem customerName é reportada sem cancelar as outras', async () => {
    const rows: ParsedReceivable[] = [
      { ...validRow, customerName: '', invoiceNumber: 'FAT-010' },
      { ...validRow, invoiceNumber: 'FAT-011' },
    ];

    const result = await importReceivables(rows);

    expect(result.created).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].reason).toMatch(/Nome do cliente ausente/);
  });

  it('linha com valor zero ou negativo é reportada como inválida', async () => {
    const result = await importReceivables([{ ...validRow, amount: 0 }]);

    expect(result.created).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].reason).toMatch(/Valor inválido/);
  });

  // ─── 4. Reimportação sem invoiceNumber não duplica ──────────────────────────
  it('reimportação do mesmo CSV sem invoiceNumber não duplica (chave estável)', async () => {
    // Simulate that the stable auto-key already exists in the DB
    vi.mocked(prisma.invoice.findFirst).mockResolvedValue({ id: 'existing-inv' } as any);

    const rowWithoutNumber: ParsedReceivable = { ...validRow, invoiceNumber: null };
    const result = await importReceivables([rowWithoutNumber]);

    expect(result.success).toBe(true);
    expect(result.created).toBe(0);
    expect(result.skipped).toBe(1); // Correctly detected as duplicate
    expect(prisma.invoice.create).not.toHaveBeenCalled();
  });

  it('reimportação com o mesmo invoiceNumber não cria segunda fatura', async () => {
    vi.mocked(prisma.invoice.findFirst).mockResolvedValue({ id: 'existing-inv' } as any);

    const result = await importReceivables([validRow]);

    expect(result.success).toBe(true);
    expect(result.skipped).toBe(1);
    expect(result.created).toBe(0);
    expect(prisma.invoice.create).not.toHaveBeenCalled();
  });

  // ─── 5. Unauthorized ────────────────────────────────────────────────────────
  it('sessão sem tenant bloqueia a importação completamente', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { tenantId: null } } as any);

    const result = await importReceivables([validRow]);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Unauthorized/);
    expect(prisma.invoice.create).not.toHaveBeenCalled();
  });
});
