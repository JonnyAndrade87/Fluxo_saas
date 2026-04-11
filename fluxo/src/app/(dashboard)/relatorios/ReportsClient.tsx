'use client';

import { useState, useTransition } from 'react';
import { getReportMetrics, ReportMetrics } from '@/actions/reports';
import { generateReportPdf } from '@/lib/pdf/reportPdf';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  TrendingUp, AlertTriangle, BarChart3, CircleDollarSign,
  Users, ArrowUpRight, ArrowDownRight, Loader2, ShieldAlert, CheckCircle2, Download
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtShort = (v: number) => {
  if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}k`;
  return fmt.format(v);
};
const fmtY = (v: any) => {
  const n = Number(v) || 0;
  if (n >= 1000000) return `R$ ${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `R$ ${(n / 1000).toFixed(0)}k`;
  return `R$ ${n}`;
};

const RISK_STYLE: Record<string, string> = {
  'Crítico': 'bg-rose-50 text-rose-700 border-rose-200',
  'Alto':    'bg-orange-50 text-orange-700 border-orange-200',
  'Médio':   'bg-amber-50 text-amber-700 border-amber-200',
  'Baixo':   'bg-emerald-50 text-emerald-700 border-emerald-200',
};

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, accent, icon: Icon, trend
}: {
  label: string; value: string; sub?: string;
  accent: string; icon: any; trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card className="premium-card relative overflow-hidden group hover:shadow-md transition-shadow duration-200">
      <div className={`absolute top-0 left-0 w-1 h-full ${accent}`} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider leading-tight max-w-[70%]">{label}</p>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            accent.includes('indigo') ? 'bg-indigo-50 text-indigo-600' :
            accent.includes('emerald') ? 'bg-emerald-50 text-emerald-600' :
            accent.includes('rose') ? 'bg-rose-50 text-rose-600' :
            accent.includes('amber') ? 'bg-amber-50 text-amber-600' :
            'bg-slate-100 text-slate-600'
          }`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <p className={`text-2xl font-extrabold font-mono tracking-tight ${
          accent.includes('rose') ? 'text-rose-600' :
          accent.includes('emerald') ? 'text-emerald-700' :
          'text-obsidian'
        }`}>{value}</p>
        {sub && (
          <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
            {trend === 'up' && <ArrowUpRight className="w-3 h-3 text-emerald-500" />}
            {trend === 'down' && <ArrowDownRight className="w-3 h-3 text-rose-500" />}
            {sub}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Period Pills ─────────────────────────────────────────────────────────────

const PERIODS = [
  { v: '1m', l: '1 mês' },
  { v: '3m', l: '3 meses' },
  { v: '6m', l: '6 meses' },
  { v: '12m', l: '12 meses' },
] as const;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReportsClient({ initialData }: { initialData: ReportMetrics }) {
  const [data, setData] = useState<ReportMetrics>(initialData);
  const [period, setPeriod] = useState<'1m' | '3m' | '6m' | '12m'>('6m');
  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);

  const changePeriod = (p: typeof period) => {
    setPeriod(p);
    startTransition(async () => {
      const fresh = await getReportMetrics(p);
      if (fresh) setData(fresh);
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await generateReportPdf(data, 'Fluxo', period);
    } catch (e) {
      console.error('Erro ao gerar PDF:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`space-y-7 transition-opacity duration-300 w-full max-w-full min-w-0 ${isPending ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>

      {/* Period Selector + Export */}
      <div className="space-y-3">
        {/* Period pills — full width on mobile, equal-sized buttons */}
        <div className="bg-white border border-border/60 rounded-xl p-1 shadow-sm flex flex-wrap w-full max-w-full gap-1 min-w-0">
          {PERIODS.map(opt => (
            <button
              key={opt.v}
              onClick={() => changePeriod(opt.v)}
              className={`flex-1 min-w-[70px] py-1.5 px-1 rounded-lg text-[13px] font-bold transition-all duration-150 ${
                period === opt.v
                  ? 'bg-fluxeer-blue text-white shadow-sm'
                  : 'text-slate-500 hover:text-obsidian hover:bg-slate-50'
              }`}
            >
              <span className="truncate block mx-auto">{opt.l}</span>
            </button>
          ))}
        </div>
        {/* Export row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground font-medium">
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span className="hidden sm:inline">{data.periodLabel}</span>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-white text-[13px] font-semibold text-obsidian hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isExporting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando PDF...</>
              : <><Download className="w-4 h-4" /> Exportar PDF</>
            }
          </button>
        </div>
      </div>

      {/* 6 KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 w-full min-w-0">
        <KpiCard
          label="Faturamento Bruto no Período"
          value={fmtShort(data.totalBilled)}
          sub={`${data.totalCustomers} clientes • ${data.periodLabel}`}
          accent="bg-indigo-500"
          icon={BarChart3}
        />
        <KpiCard
          label="Caixa Realizado (Pago)"
          value={fmtShort(data.totalPaid)}
          sub={`${data.recoveryRate.toFixed(1)}% de recuperação`}
          accent="bg-emerald-500"
          icon={CheckCircle2}
          trend="up"
        />
        <KpiCard
          label="Inadimplência em Aberto"
          value={fmtShort(data.totalOverdue)}
          sub={`${data.defaultRate.toFixed(1)}% do faturado • ${data.customersWithOverdue} clientes`}
          accent="bg-rose-500"
          icon={AlertTriangle}
          trend="down"
        />
        <KpiCard
          label="A Receber (Pendente)"
          value={fmtShort(data.totalPending)}
          sub="Títulos ainda dentro do prazo"
          accent="bg-amber-400"
          icon={CircleDollarSign}
        />
        <KpiCard
          label="Ticket Médio"
          value={fmtShort(data.avgTicket)}
          sub="Valor médio por fatura emitida"
          accent="bg-slate-400"
          icon={TrendingUp}
          trend="neutral"
        />
        <KpiCard
          label="Clientes com Atraso"
          value={`${data.customersWithOverdue} / ${data.totalCustomers}`}
          sub={data.customersWithOverdue > 0 ? 'Ação de cobrança necessária' : 'Carteira saudável'}
          accent={data.customersWithOverdue > 0 ? 'bg-rose-500' : 'bg-emerald-500'}
          icon={data.customersWithOverdue > 0 ? ShieldAlert : Users}
          trend={data.customersWithOverdue > 0 ? 'down' : 'up'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 xl:grid-cols-12 w-full min-w-0">

        {/* Bar Chart — Monthly Cashflow */}
        <Card className="col-span-12 xl:col-span-8 premium-card shadow-sm w-full min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-obsidian text-base font-bold">Fluxo de Faturamento Mensal</CardTitle>
            <CardDescription className="text-xs">Emitido × Recebido × Inadimplente por mês</CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-4">
            <div className="h-[220px] sm:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyCashflow} margin={{ top: 10, right: 20, left: 0, bottom: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={fmtY} dx={-4} width={55} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '12px' }}
                    formatter={(v: any) => fmt.format(Number(v))}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
                  <Bar dataKey="faturado" name="Faturado" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} animationDuration={1200} />
                  <Bar dataKey="recebido" name="Recebido" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} animationDuration={1400} />
                  <Bar dataKey="atrasado" name="Atrasado" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={32} animationDuration={1600} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart — Status Distribution */}
        <Card className="col-span-12 xl:col-span-4 premium-card shadow-sm w-full min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-obsidian text-base font-bold">Distribuição da Carteira</CardTitle>
            <CardDescription className="text-xs">Fatia de capital preso vs líquido</CardDescription>
          </CardHeader>
          <CardContent>
            {data.statusDistribution.length > 0 ? (
              <>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip
                        formatter={(v: any) => fmt.format(Number(v))}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      />
                      <Pie
                        data={data.statusDistribution}
                        cx="50%" cy="50%"
                        innerRadius={60} outerRadius={88}
                        paddingAngle={4}
                        dataKey="value" animationDuration={1200} stroke="none"
                      >
                        {data.statusDistribution.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2.5 mt-3">
                  {data.statusDistribution.map((item, i) => {
                    const pct = data.totalBilled > 0 ? ((item.value / data.totalBilled) * 100).toFixed(1) : '0';
                    return (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-[12px] font-semibold text-obsidian">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-bold text-obsidian">{fmtShort(item.value)}</span>
                          <span className="text-[10px] text-muted-foreground ml-1">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                Nenhuma fatura no período selecionado.
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Per-client Ranking Table */}
      <Card className="premium-card shadow-sm w-full min-w-0 overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-[#FAFAFB] rounded-t-2xl pb-4">
          <CardTitle className="text-base font-bold text-obsidian flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" /> Ranking por Cliente
          </CardTitle>
          <CardDescription className="text-xs">Ordenado por volume faturado no período</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {data.clientRanking.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Nenhuma fatura no período selecionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[700px]">
                <thead className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold border-b border-border/60 bg-slate-50/40">
                  <tr>
                    <th className="px-5 py-3">#</th>
                    <th className="px-5 py-3">Cliente</th>
                    <th className="px-5 py-3 text-right">Faturado</th>
                    <th className="px-5 py-3 text-right">Recebido</th>
                    <th className="px-5 py-3 text-right">Em Atraso</th>
                    <th className="px-5 py-3 text-center">Faturas</th>
                    <th className="px-5 py-3 text-center">Risco</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {data.clientRanking.map((client, i) => {
                    const clientRecovery = client.totalBilled > 0
                      ? ((client.totalPaid / client.totalBilled) * 100).toFixed(0)
                      : '0';
                    return (
                      <tr key={client.id} className="hover:bg-indigo-50/20 transition-colors group">
                        <td className="px-5 py-3.5">
                          <span className="text-[12px] font-bold text-muted-foreground">#{i + 1}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-obsidian text-[13px] group-hover:text-indigo-700 transition-colors">{client.name}</p>
                          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{client.documentNumber}</p>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <p className="font-bold text-obsidian text-[13px] font-mono">{fmtShort(client.totalBilled)}</p>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <p className="font-bold text-emerald-700 text-[13px] font-mono">{fmtShort(client.totalPaid)}</p>
                          <p className="text-[10px] text-muted-foreground">{clientRecovery}% recup.</p>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {client.totalOverdue > 0 ? (
                            <p className="font-bold text-rose-600 text-[13px] font-mono">{fmtShort(client.totalOverdue)}</p>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-semibold">Limpo</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="text-[12px] font-bold text-obsidian">{client.invoiceCount}</span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${RISK_STYLE[client.riskLevel]}`}>
                            {client.riskLevel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
