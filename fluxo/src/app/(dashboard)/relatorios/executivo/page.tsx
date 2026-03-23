import { Metadata } from 'next';
import { Suspense } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ExecutiveReportClient } from '@/components/reports/ExecutiveReportClient';

export const metadata: Metadata = {
  title: 'Resumo Executivo',
  description: 'Visão executiva de alto nível com KPIs principais',
};

function ReportSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-12 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function ExecutiveReportPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Resumo Executivo</h1>
              <p className="text-gray-600 mt-1">
                Visão consolidada com KPIs principais da operação de recebíveis
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-indigo-50 border-indigo-200 p-4 flex gap-3">
        <TrendingUp className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-indigo-800">
          <p className="font-semibold mb-1">Visão de Negócio</p>
          <p>
            Dashboard com métricas consolidadas: faturamento, recuperação, inadimplência, clientes
            em atraso e status de saúde da carteira. Ideal para apresentações e decisões gerenciais.
          </p>
        </div>
      </Card>

      {/* Report */}
      <Suspense fallback={<ReportSkeleton />}>
        <ExecutiveReportClient />
      </Suspense>
    </div>
  );
}
