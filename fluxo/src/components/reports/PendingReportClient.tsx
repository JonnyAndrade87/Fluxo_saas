'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { getPendingReport, getCustomersForFilter } from '@/actions/reports-extended';
import { pendingTitlesCSV, downloadCSV } from '@/lib/export-utils';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { ReportTable } from '@/components/reports/ReportTable';
import type { PendingTitle } from '@/lib/reports';

export function PendingReportClient() {
  const [data, setData] = useState<PendingTitle[]>([]);
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Load customers for filter
  useEffect(() => {
    async function loadCustomers() {
      try {
        const custs = await getCustomersForFilter();
        setCustomers(custs);
      } catch (err) {
        console.error('Failed to load customers:', err);
      }
    }
    loadCustomers();
  }, []);

  // Load report data when filters change
  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      setError(null);
      try {
        const report = await getPendingReport(selectedCustomerId || undefined);
        setData(report);
      } catch (err) {
        setError('Falha ao carregar relatório de carteira a vencer');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [selectedCustomerId]);

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const csv = pendingTitlesCSV(data);
      downloadCSV(csv, `carteira-a-vencer-${new Date().toISOString().split('T')[0]}.csv`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 no-print">
      <ReportFilters
        reportType="pending"
        customers={customers}
        showPeriodFilter={false}
        showCustomerFilter={true}
        onCustomerChange={setSelectedCustomerId}
        onExport={handleExport}
        onPrint={handlePrint}
        isLoading={loading}
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-600">
            Total de {data.length} título(s) a vencer nos próximos 30 dias
          </div>

          <ReportTable
            columns={[
              { key: 'invoiceNumber', label: 'Nota Fiscal' },
              { key: 'customerName', label: 'Cliente' },
              { key: 'dueDate', label: 'Data Vencimento' },
              {
                key: 'daysUntilDue',
                label: 'Dias para Vencer',
                align: 'center',
                format: (v) => `${v} dias`,
              },
              {
                key: 'amount',
                label: 'Valor',
                align: 'right',
                format: (v) => `R$ ${v.toFixed(2)}`,
              },
              { key: 'riskLevel', label: 'Risco' },
            ]}
            data={data}
            emptyMessage="Nenhum título a vencer encontrado"
          />
        </>
      )}
    </div>
  );
}
