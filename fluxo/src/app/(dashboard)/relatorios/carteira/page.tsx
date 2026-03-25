import { Metadata } from 'next';
import { Suspense } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PendingReportClient } from '@/components/reports/PendingReportClient';

export const metadata: Metadata = {
  title: 'Carteira a Vencer',
  description: 'Relatório de títulos a vencer nos próximos 30 dias',
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

export default function PendingReportPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Carteira a Vencer</h1>
              <p className="text-gray-600 mt-1">
                Títulos a vencer nos próximos 30 dias, ordenados por data de vencimento
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200 p-4 flex gap-3">
        <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">Carteira a Vencer</p>
          <p>
            Este relatório apresenta todos os títulos que vencem nos próximos 30 dias com status
            {` "pendente" `}ou{` "em negociação"`}. Planeje cobranças antecipadas para evitar atrasos.
          </p>
        </div>
      </Card>

      {/* Report */}
      <Suspense fallback={<ReportSkeleton />}>
        <PendingReportClient />
      </Suspense>
    </div>
  );
}
