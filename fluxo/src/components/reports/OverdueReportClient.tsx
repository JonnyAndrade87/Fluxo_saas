'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { getOverdueReport, getCustomersForFilter } from '@/actions/reports-extended';
import { overdueTitlesCSV, downloadCSV } from '@/lib/export-utils';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { ReportTable } from '@/components/reports/ReportTable';
import type { OverdueTitle } from '@/lib/reports';

type PeriodType = '30d' | '60d' | '90d' | '180d';

export function OverdueReportClient() {
  const [data, setData] = useState<OverdueTitle[]>([]);
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodType>('90d');
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
        const report = await getOverdueReport(period, selectedCustomerId || undefined);
        setData(report);
      } catch (err) {
        setError('Falha ao carregar relatório de títulos vencidos');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [period, selectedCustomerId]);

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const csv = overdueTitlesCSV(data);
      downloadCSV(csv, `titulos-vencidos-${new Date().toISOString().split('T')[0]}.csv`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 no-print">
      <ReportFilters
        reportType="overdue"
        customers={customers}
        showPeriodFilter={true}
        showCustomerFilter={true}
        onPeriodChange={setPeriod}
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
            Total de {data.length} título(s) vencido(s)
          </div>

          <ReportTable
            columns={[
              { key: 'invoiceNumber', label: 'Nota Fiscal' },
              { key: 'customerName', label: 'Cliente' },
              { key: 'dueDate', label: 'Data Vencimento' },
              {
                key: 'daysOverdue',
                label: 'Dias Vencido',
                align: 'center',
                format: (v) => `${v} dias`,
              },
              {
                key: 'balanceDue',
                label: 'Saldo Devedor',
                align: 'right',
                format: (v) => `R$ ${v.toFixed(2)}`,
              },
              { key: 'riskLevel', label: 'Risco' },
            ]}
            data={data}
            emptyMessage="Nenhum título vencido encontrado"
          />
        </>
      )}
    </div>
  );
}
