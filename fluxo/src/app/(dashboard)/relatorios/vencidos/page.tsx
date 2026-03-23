import { Metadata } from 'next';
import { Suspense } from 'react';
import { AlertCircle, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { OverdueReportClient } from '@/components/reports/OverdueReportClient';

export const metadata: Metadata = {
  title: 'Títulos Vencidos',
  description: 'Relatório de títulos vencidos ordenado por dias de atraso',
};

function ReportSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-12 bg-gray-200 rounded animate-pulse" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function OverdueReportPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-8 h-8 text-red-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Títulos Vencidos</h1>
              <p className="text-gray-600 mt-1">
                Visão detalhada de todos os títulos em atraso, ordenados por dias vencido
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-red-50 border-red-200 p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-red-800">
          <p className="font-semibold mb-1">Títulos Vencidos</p>
          <p>
            Este relatório mostra todos os títulos com status "vencido" dentro do período selecionado.
            Utilize os filtros para focar em um cliente específico ou período diferente.
          </p>
        </div>
      </Card>

      {/* Report */}
      <Suspense fallback={<ReportSkeleton />}>
        <OverdueReportClient />
      </Suspense>
    </div>
  );
}
