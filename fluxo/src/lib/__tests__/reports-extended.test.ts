import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock, authMock, riskScoreMock } = vi.hoisted(() => ({
  prismaMock: {
    invoice: { findMany: vi.fn() },
  },
  authMock: vi.fn(),
  riskScoreMock: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: prismaMock,
}));

vi.mock('../../../auth', () => ({
  auth: authMock,
}));

vi.mock('@/actions/risk-score', () => ({
  getRiskScoreForCustomer: riskScoreMock,
}));

import { getPendingReport } from '@/actions/reports-extended';

describe('getPendingReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-16T12:00:00Z'));

    authMock.mockResolvedValue({ user: { tenantId: 'tenant-1' } });
    riskScoreMock.mockResolvedValue({ level: 'Baixo', score: 10 });
    prismaMock.invoice.findMany.mockResolvedValue([
      {
        id: 'invoice-1',
        invoiceNumber: 'INV-100',
        customerId: 'customer-1',
        status: 'OPEN',
        amount: 150,
        dueDate: new Date('2026-04-20T12:00:00Z'),
        customer: { id: 'customer-1', name: 'Cliente Exemplo' },
      },
      {
        id: 'invoice-2',
        invoiceNumber: 'INV-101',
        customerId: 'customer-2',
        status: 'PROMISE_TO_PAY',
        amount: 200,
        dueDate: new Date('2026-04-25T12:00:00Z'),
        customer: { id: 'customer-2', name: 'Cliente Acordo' },
      },
    ]);
  });

  it('busca carteira a vencer usando os status reais do schema', async () => {
    const report = await getPendingReport();

    expect(prismaMock.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          status: { in: ['OPEN', 'PROMISE_TO_PAY'] },
        }),
      }),
    );

    expect(report.map((row) => row.invoiceNumber)).toEqual(['INV-100', 'INV-101']);
  });
});
