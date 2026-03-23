import { Metadata } from 'next';
import { Suspense } from 'react';
import { TrendingUp, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { RiskRankingReportClient } from '@/components/reports/RiskRankingReportClient';

export const metadata: Metadata = {
  title: 'Ranking por Risco',
  description: 'Classificação de clientes por nível de risco',
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

export default function RiskRankingReportPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ranking por Risco</h1>
              <p className="text-gray-600 mt-1">
                Classificação de clientes por nível de risco, integrado com Score de Risco
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-purple-50 border-purple-200 p-4 flex gap-3">
        <TrendingUp className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-purple-800">
          <p className="font-semibold mb-1">Score de Risco Integrado</p>
          <p>
            Este relatório mostra clientes ordenados por nível de risco (Crítico, Alto, Médio, Baixo)
            com base no Score de Risco centralizado. Compare exposure vs risco.
          </p>
        </div>
      </Card>

      {/* Report */}
      <Suspense fallback={<ReportSkeleton />}>
        <RiskRankingReportClient />
      </Suspense>
    </div>
  );
}
