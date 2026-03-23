/**
 * Página de Previsão de Caixa (Cash Flow Forecast)
 * 
 * Mostra:
 * - Visão semanal/mensal
 * - Comparação nominal vs cenários (otimista, realista, conservador)
 * - Impacto por cliente
 * - Breakdown de risco
 */

import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, TrendingUp, DollarSign } from 'lucide-react';
import ForecastClient from './ForecastClient';

export const metadata = {
  title: 'Previsão de Caixa',
  description: 'Projete entradas futuras com base em títulos e comportamento histórico',
};

export default function ForecastPage() {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Previsão de Caixa</h1>
        </div>
        <p className="text-gray-600">
          Projete as entradas futuras com base em títulos a vencer, histórico de pagamento e score de risco.
        </p>
      </div>

      {/* Suspense Boundary */}
      <Suspense
        fallback={
          <div className="grid gap-4">
            {/* Loading skeleton */}
            <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        }
      >
        <ForecastClient />
      </Suspense>

      {/* Explicação de Limitações */}
      <Card className="mt-8 border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4" />
            Suposições e Limitações
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700 space-y-2">
          <p>
            <strong>Baseado em histórico:</strong> Análise dos últimos 90 dias de pagamentos para calibrar os cenários.
          </p>
          <p>
            <strong>Score de Risco:</strong> A probabilidade de recebimento é ajustada pelo Score de Risco do cliente. Clientes críticos têm expectativa de recebimento mais conservadora.
          </p>
          <p>
            <strong>Sem sazonalidade complexa:</strong> Não incorpora padrões sazonais ou ML. Ideal para projeções de curto prazo (próximos 60 dias).
          </p>
          <p>
            <strong>Títulos vencidos muito antigos:</strong> Não incluídos na projeção (considerados perdidos para análise).
          </p>
          <p>
            <strong>Cenários:</strong>
            <br />
            • <strong>Otimista:</strong> Assume melhora de 20-30% vs histórico
            <br />
            • <strong>Realista:</strong> Usa histórico ajustado por Score de Risco
            <br />
            • <strong>Conservador:</strong> Reduz expectativa em 30-50% vs histórico
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
