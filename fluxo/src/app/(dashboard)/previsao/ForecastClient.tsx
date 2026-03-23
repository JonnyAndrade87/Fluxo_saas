'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { getReceivablesForecast, getCustomerForecastImpact } from '@/actions/forecast';

// Utility: Format currency
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

interface ForecastData {
  forecast: any;
  customerImpact: any[];
}

export default function ForecastClient() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysisType, setAnalysisType] = useState<'weekly' | 'monthly'>('weekly');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadForecast = async () => {
      try {
        setLoading(true);
        const forecast = await getReceivablesForecast(analysisType, 60);
        const impact = await getCustomerForecastImpact();
        setData({ forecast, customerImpact: impact });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar previsão');
        console.error('Forecast error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadForecast();
  }, [analysisType]);

  if (loading) {
    return <div className="text-center py-10">Carregando previsão...</div>;
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-800">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return <div className="text-center py-10">Nenhum dado disponível</div>;
  }

  const { forecast, customerImpact } = data;

  // ─────────────────────────────────────────────────────────────────────────
  // CARDS PRINCIPAIS (Resumo)
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Controlesde Tipo */}
      <div className="flex gap-2">
        <button
          onClick={() => setAnalysisType('weekly')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            analysisType === 'weekly'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Semanal
        </button>
        <button
          onClick={() => setAnalysisType('monthly')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            analysisType === 'monthly'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Mensal
        </button>
      </div>

      {/* Cards Resumo */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Nominal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(forecast.summary.totalNominal)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total a receber (sem ajuste)</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Otimista</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(forecast.summary.totalOptimistic)}
            </div>
            <p className="text-xs text-green-600 mt-1">Melhor cenário</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Realista</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(forecast.summary.totalRealistic)}
            </div>
            <p className="text-xs text-blue-600 mt-1">Expectativa</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Conservador</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(forecast.summary.totalConservative)}
            </div>
            <p className="text-xs text-orange-600 mt-1">Pior cenário</p>
          </CardContent>
        </Card>
      </div>

      {/* Período Coberto */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Período da Análise</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{forecast.summary.periodCovered}</p>
        </CardContent>
      </Card>

      {/* Tabela de Períodos */}
      <Card>
        <CardHeader>
          <CardTitle>Projeção por {analysisType === 'weekly' ? 'Semana' : 'Mês'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    {analysisType === 'weekly' ? 'Semana' : 'Mês'}
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Nominal</th>
                  <th className="text-right px-4 py-3 font-medium text-green-600">Otimista</th>
                  <th className="text-right px-4 py-3 font-medium text-blue-600">Realista</th>
                  <th className="text-right px-4 py-3 font-medium text-orange-600">Conservador</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Items</th>
                </tr>
              </thead>
              <tbody>
                {forecast.periods.map((period: any, idx: number) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{period.period}</td>
                    <td className="text-right px-4 py-3 text-gray-700">
                      {formatCurrency(period.nominal)}
                    </td>
                    <td className="text-right px-4 py-3 text-green-700">
                      {formatCurrency(period.optimistic)}
                    </td>
                    <td className="text-right px-4 py-3 text-blue-700">
                      {formatCurrency(period.realistic)}
                    </td>
                    <td className="text-right px-4 py-3 text-orange-700">
                      {formatCurrency(period.conservative)}
                    </td>
                    <td className="text-center px-4 py-3 text-gray-600">
                      {period.itemCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Impacto por Cliente */}
      <Card>
        <CardHeader>
          <CardTitle>Impacto por Cliente (Top 10)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Nominal</th>
                  <th className="text-right px-4 py-3 font-medium text-blue-600">Realista</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Items</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {customerImpact.slice(0, 10).map((customer: any, idx: number) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {customer.customerName}
                    </td>
                    <td className="text-right px-4 py-3 text-gray-700">
                      {formatCurrency(customer.nominal)}
                    </td>
                    <td className="text-right px-4 py-3 text-blue-700">
                      {formatCurrency(customer.realistic)}
                    </td>
                    <td className="text-center px-4 py-3 text-gray-600">
                      {customer.itemCount}
                    </td>
                    <td className="text-center px-4 py-3">
                      <Badge
                        variant={
                          customer.avgRiskScore <= 25
                            ? 'success'
                            : customer.avgRiskScore <= 50
                              ? 'warning'
                              : 'destructive'
                        }
                      >
                        {customer.avgRiskScore}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Assumptions */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-sm">Suposições Utilizadas</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm text-gray-700">
            {forecast.assumptions.map((assumption: string, idx: number) => (
              <li key={idx} className="flex gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>{assumption}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
