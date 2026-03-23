'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { getRiskRankingReport, getCustomersForFilter } from '@/actions/reports-extended';
import { riskRankingCSV, downloadCSV } from '@/lib/export-utils';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { ReportTable } from '@/components/reports/ReportTable';
import type { RiskRanking } from '@/lib/reports';

type PeriodType = '30d' | '60d' | '90d' | '180d';

export function RiskRankingReportClient() {
  const [data, setData] = useState<RiskRanking[]>([]);
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodType>('180d');

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
        const report = await getRiskRankingReport(period);
        setData(report);
      } catch (err) {
        setError('Falha ao carregar relatório de ranking por risco');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [period]);

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const csv = riskRankingCSV(data);
      downloadCSV(csv, `ranking-risco-${new Date().toISOString().split('T')[0]}.csv`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 no-print">
      <ReportFilters
        reportType="risk"
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
            Total de {data.length} cliente(s) classificado(s)
          </div>

          <ReportTable
            columns={[
              { key: 'customerName', label: 'Cliente' },
              { key: 'documentNumber', label: 'CNPJ/CPF' },
              { key: 'riskLevel', label: 'Nível Risco' },
              {
                key: 'riskScore',
                label: 'Score',
                align: 'center',
                format: (v) => `${v}/100`,
              },
              {
                key: 'totalBilled',
                label: 'Total Faturado',
                align: 'right',
                format: (v) => `R$ ${v.toFixed(2)}`,
              },
              {
                key: 'totalOverdue',
                label: 'Total Vencido',
                align: 'right',
                format: (v) => `R$ ${v.toFixed(2)}`,
              },
              {
                key: 'overdueTitles',
                label: 'Títulos Vencidos',
                align: 'center',
              },
            ]}
            data={data}
            emptyMessage="Nenhum cliente encontrado"
          />
        </>
      )}
    </div>
  );
}
