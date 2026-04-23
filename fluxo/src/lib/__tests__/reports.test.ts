import { describe, expect, it, vi } from 'vitest';

import { generatePendingReport } from '@/lib/reports';

describe('generatePendingReport', () => {
  it('inclui apenas faturas OPEN e PROMISE_TO_PAY que vencem nos proximos 30 dias', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-16T12:00:00Z'));

    const invoices = [
      {
        id: 'open-1',
        invoiceNumber: 'INV-001',
        customerId: 'customer-1',
        status: 'OPEN',
        amount: 100,
        dueDate: new Date('2026-04-20T12:00:00Z'),
        customer: { name: 'Cliente A' },
      },
      {
        id: 'promise-1',
        invoiceNumber: 'INV-002',
        customerId: 'customer-2',
        status: 'PROMISE_TO_PAY',
        amount: 200,
        dueDate: new Date('2026-04-25T12:00:00Z'),
        customer: { name: 'Cliente B' },
      },
      {
        id: 'paid-1',
        invoiceNumber: 'INV-003',
        customerId: 'customer-3',
        status: 'PAID',
        amount: 300,
        dueDate: new Date('2026-04-22T12:00:00Z'),
        customer: { name: 'Cliente C' },
      },
      {
        id: 'overdue-1',
        invoiceNumber: 'INV-004',
        customerId: 'customer-4',
        status: 'OPEN',
        amount: 400,
        dueDate: new Date('2026-04-10T12:00:00Z'),
        customer: { name: 'Cliente D' },
      },
    ] as any;

    const report = generatePendingReport(invoices, {
      'customer-1': { level: 'Baixo', score: 10 },
      'customer-2': { level: 'Alto', score: 70 },
    });

    expect(report).toHaveLength(2);
    expect(report.map((item) => item.invoiceNumber)).toEqual(['INV-001', 'INV-002']);
    expect(report.map((item) => item.riskLevel)).toEqual(['Baixo', 'Alto']);

    vi.useRealTimers();
  });
});
