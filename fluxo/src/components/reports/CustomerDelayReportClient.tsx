'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { getCustomerDelayReport, getCustomersForFilter } from '@/actions/reports-extended';
import { customerDelayCSV, downloadCSV } from '@/lib/export-utils';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { ReportTable } from '@/components/reports/ReportTable';
import type { CustomerDelay } from '@/lib/reports';

type PeriodType = '30d' | '60d' | '90d' | '180d';

export function CustomerDelayReportClient() {
  const [data, setData] = useState<CustomerDelay[]>([]);
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodType>('90d');

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
        const report = await getCustomerDelayReport(period);
        setData(report);
      } catch (err) {
        setError('Falha ao carregar relatório de atrasos por cliente');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [period]);

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const csv = customerDelayCSV(data);
      downloadCSV(csv, `clientes-maior-atraso-${new Date().toISOString().split('T')[0]}.csv`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 no-print">
      <ReportFilters
        reportType="delay"
        customers={customers}
        showPeriodFilter={true}
        showCustomerFilter={false}
        onPeriodChange={setPeriod}
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
            Total de {data.length} cliente(s) com atraso
          </div>

          <ReportTable
            columns={[
              { key: 'customerName', label: 'Cliente' },
              {
                key: 'overdueCount',
                label: 'Qtd. Vencida',
                align: 'center',
              },
              {
                key: 'overdueValue',
                label: 'Valor Vencido',
                align: 'right',
                format: (v) => `R$ ${v.toFixed(2)}`,
              },
              {
                key: 'maxDaysOverdue',
                label: 'Dias Máximo',
                align: 'center',
                format: (v) => `${v} dias`,
              },
              { key: 'oldestOverdueDate', label: 'Título Mais Antigo' },
              { key: 'riskLevel', label: 'Risco' },
            ]}
            data={data}
            emptyMessage="Nenhum cliente com atraso encontrado"
          />
        </>
      )}
    </div>
  );
}
