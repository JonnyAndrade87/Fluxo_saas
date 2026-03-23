'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { getExecutiveReport } from '@/actions/reports-extended';
import { executiveSummaryCSV, downloadCSV } from '@/lib/export-utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ExecutiveSummary } from '@/lib/reports';

type PeriodType = '30d' | '60d' | '90d' | '180d';

function getHealthBadgeColor(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'Crítico':
      return 'destructive';
    case 'Alto':
      return 'destructive';
    case 'Médio':
      return 'secondary';
    case 'Baixo':
      return 'default';
    default:
      return 'outline';
  }
}

export function ExecutiveReportClient() {
  const [data, setData] = useState<ExecutiveSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodType>('90d');

  // Load report data when period changes
  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      setError(null);
      try {
        const report = await getExecutiveReport(period);
        setData(report);
      } catch (err) {
        setError('Falha ao carregar resumo executivo');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [period]);

  const handleExport = async () => {
    if (data) {
      const csv = executiveSummaryCSV(data);
      downloadCSV(csv, `resumo-executivo-${new Date().toISOString().split('T')[0]}.csv`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 no-print">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center py-4 px-6 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Período:</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodType)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white"
          >
            <option value="30d">Últimos 30 dias</option>
            <option value="60d">Últimos 60 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="180d">Últimos 180 dias</option>
          </select>
        </div>

        <div className="flex-1" />

        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            🖨️ Imprimir
          </button>
          <button
            onClick={handleExport}
            disabled={loading || !data}
            className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            ⬇️ Exportar CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Faturado */}
            <Card className="p-4">
              <div className="text-xs font-medium text-gray-600 mb-1">Total Faturado</div>
              <div className="text-2xl font-bold text-gray-900">
                R$ {data.totalBilled.toFixed(2)}
              </div>
            </Card>

            {/* Total Recuperado */}
            <Card className="p-4">
              <div className="text-xs font-medium text-gray-600 mb-1">Total Recuperado</div>
              <div className="text-2xl font-bold text-green-600">
                R$ {data.totalRecovered.toFixed(2)}
              </div>
            </Card>

            {/* Total Vencido */}
            <Card className="p-4">
              <div className="text-xs font-medium text-gray-600 mb-1">Total Vencido</div>
              <div className="text-2xl font-bold text-red-600">
                R$ {data.totalOverdue.toFixed(2)}
              </div>
            </Card>

            {/* Total a Vencer */}
            <Card className="p-4">
              <div className="text-xs font-medium text-gray-600 mb-1">Total a Vencer</div>
              <div className="text-2xl font-bold text-blue-600">
                R$ {data.totalPending.toFixed(2)}
              </div>
            </Card>
          </div>

          {/* Indicators Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Rates & Metrics */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Indicadores</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Taxa de Inadimplência</span>
                  <span className="text-lg font-bold text-red-600">{data.defaultRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full"
                    style={{ width: `${Math.min(data.defaultRate, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center pt-4">
                  <span className="text-sm text-gray-700">Taxa de Recuperação</span>
                  <span className="text-lg font-bold text-green-600">{data.recoveryRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${Math.min(data.recoveryRate, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center pt-4">
                  <span className="text-sm text-gray-700">Dias Médio de Atraso</span>
                  <span className="text-lg font-bold text-gray-900">
                    {data.avgDaysOverdue} dias
                  </span>
                </div>
              </div>
            </Card>

            {/* Right Column: Customers & Status */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Clientes & Status</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Total de Clientes</span>
                  <span className="text-lg font-bold text-gray-900">{data.totalCustomers}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Clientes com Atraso</span>
                  <span className="text-lg font-bold text-red-600">
                    {data.customersWithOverdue}
                  </span>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-700 mb-2">Status de Saúde</div>
                  <Badge variant={getHealthBadgeColor(data.healthStatus)}>
                    {data.healthStatus}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>

          {/* Top Overdue Customer */}
          {data.topOverdueCustomer && (
            <Card className="p-6 bg-yellow-50 border-yellow-200">
              <h3 className="font-semibold text-gray-900 mb-2">Cliente com Maior Atraso</h3>
              <div className="flex justify-between items-center">
                <span className="text-lg text-gray-900">{data.topOverdueCustomer.name}</span>
                <span className="text-lg font-bold text-red-600">
                  R$ {data.topOverdueCustomer.value.toFixed(2)}
                </span>
              </div>
            </Card>
          )}

          {/* Footer */}
          <div className="text-xs text-gray-500 text-right">
            Gerado em {data.generatedAt} | Período: {data.periodLabel}
          </div>
        </div>
      ) : null}
    </div>
  );
}
