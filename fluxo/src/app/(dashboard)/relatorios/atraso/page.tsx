import { Metadata } from 'next';
import { Suspense } from 'react';
import { AlertTriangle, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CustomerDelayReportClient } from '@/components/reports/CustomerDelayReportClient';

export const metadata: Metadata = {
  title: 'Clientes com Maior Atraso',
  description: 'Ranking de clientes com maior volume de atraso',
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

export default function CustomerDelayReportPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-orange-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Clientes com Maior Atraso</h1>
              <p className="text-gray-600 mt-1">
                Análise por cliente mostrando quantidade, valor e antiguidade dos atrasos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-orange-50 border-orange-200 p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-orange-800">
          <p className="font-semibold mb-1">Análise por Cliente</p>
          <p>
            Visualize quais clientes possuem o maior volume e valor em atraso. Use essa informação
            para priorizar cobranças e negociações.
          </p>
        </div>
      </Card>

      {/* Report */}
      <Suspense fallback={<ReportSkeleton />}>
        <CustomerDelayReportClient />
      </Suspense>
    </div>
  );
}
