import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import {
  ArrowUpRight,
  DollarSign,
  Activity,
  AlertTriangle,
  Clock,
  CalendarDays,
  ShieldAlert,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  XCircle,
  Users,
  MessageSquare,
  Send,
  SkipForward,
  RefreshCw,
  FileText,
  Inbox,
  BarChart3,
} from "lucide-react"
import { getDashboardMetrics } from "@/actions/dashboard"
import { getOnboardingStatus } from "@/actions/onboarding"
import DashboardChart from "./DashboardChart"
import OnboardingSetup from "@/components/onboarding/OnboardingSetup"
import { CashForecast } from "@/components/dashboard/CashForecast"
import ActionsBanner from "@/components/dashboard/ActionsBanner"

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatCurrency = (val: number) => fmt.format(val).replace('R$\u00a0', '').replace('R$ ', '').trim();
const fmtCurrencyFull = (val: number) => fmt.format(val);


const AGING_COLORS = [
  { bar: '#4F46E5', text: 'text-indigo-600', bg: 'bg-indigo-500' },
  { bar: '#F59E0B', text: 'text-amber-600',  bg: 'bg-amber-400' },
  { bar: '#F97316', text: 'text-orange-600', bg: 'bg-orange-500' },
  { bar: '#EF4444', text: 'text-rose-600',   bg: 'bg-rose-500'  },
  { bar: '#7F1D1D', text: 'text-red-900',    bg: 'bg-red-900'   },
];

const COMM_STATUS_LABELS: Record<string, string> = {
  sent:    'Enviado',
  pending: 'Pendente',
  failed:  'Falhou',
  skipped: 'Pulado',
};


export default async function Dashboard() {
  const onboardingStatus = await getOnboardingStatus();

  // ── Tela de Setup Dedicada ───────────────────────────────────────────────
  // Exibida enquanto o tenant não atingiu a maturidade operacional mínima:
  // 1 cliente | 1 fatura | 1 régua ativa
  if (!onboardingStatus.isComplete) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14">
        <OnboardingSetup status={onboardingStatus} />
      </div>
    );
  }

  // ── Dashboard Completo (só carrega quando setup concluído) ──────────────
  const metrics = await getDashboardMetrics();
  const totalAgingAmount = metrics.agingDistribution.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-200 dark:screen-glow">Painel Operacional</h1>
          <p className="text-slate-500 text-sm mt-1 dark:text-zinc-500">Recebíveis, inadimplência e cobrança em tempo real.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/relatorios">
            <Button variant="outline" size="sm" className="font-semibold rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50">
              Exportar Relatório
            </Button>
          </Link>
          <Link href="/cobrancas">
            <Button size="sm" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5 shadow-sm">
              <DollarSign className="w-3.5 h-3.5" /> Nova Fatura
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Ações Recomendadas ────────────────────────────────────────── */}
      <ActionsBanner
        kpis={metrics.kpis}
        overdueSnapshot={metrics.overdueSnapshot}
        recentCommActivity={metrics.recentCommActivity}
        criticalAlerts={metrics.criticalAlerts}
      />

      {/* ── KPI Cards Primários (4 principais) ───────────────────────── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">

        {/* 1. Total a Receber */}
        <Card className="premium-card rounded-[2rem]">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Activity className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">À Vencer</span>
            </div>
            <p className="text-2xl font-black tracking-tight text-slate-900">
              <span className="text-sm font-semibold text-slate-400 mr-1">R$</span>
              {formatCurrency(metrics.kpis.totalPending)}
            </p>
            <p className="text-xs text-slate-500 mt-1.5">Total em aberto no sistema</p>
          </CardContent>
        </Card>

        {/* 2. Vencido */}
        <Card className="premium-card rounded-[2rem] dark:border-rose-500/20">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Vencido</span>
            </div>
            <p className="text-2xl font-black tracking-tight text-rose-700">
              <span className="text-sm font-semibold text-rose-300 mr-1">R$</span>
              {formatCurrency(metrics.kpis.totalOverdue)}
            </p>
            <p className="text-xs text-rose-500 mt-1.5 font-medium">Em atraso — exige ação</p>
          </CardContent>
        </Card>

        {/* 3. Recebido no Mês */}
        <Card className="premium-card rounded-[2rem] dark:border-emerald-500/20">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Recebido</span>
            </div>
            <p className="text-2xl font-black tracking-tight text-emerald-700">
              <span className="text-sm font-semibold text-emerald-300 mr-1">R$</span>
              {formatCurrency(metrics.kpis.paidThisMonth)}
            </p>
            <p className="text-xs text-emerald-600 mt-1.5">Confirmado este mês</p>
          </CardContent>
        </Card>

        {/* 4. Previsto 7 dias */}
        <Card className="premium-card rounded-[2rem] dark:border-amber-500/20">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Previsto</span>
            </div>
            <p className="text-2xl font-black tracking-tight text-amber-700">
              <span className="text-sm font-semibold text-amber-300 mr-1">R$</span>
              {formatCurrency(metrics.kpis.dueNext7Days)}
            </p>
            <p className="text-xs text-amber-600 mt-1.5">Para os próximos 7 dias</p>
          </CardContent>
        </Card>

      </div>

      {/* ── KPI Cards Secundários (4 indicadores operacionais) ──────────── */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">

        {/* Inadimplência */}
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50 dark:neu-panel dark:border-[#050505]">
          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 dark:neu-recessed dark:border-[#1a1a1c]">
            <TrendingDown className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <p className={`text-lg font-black ${
              metrics.kpis.defaultRate > 20 ? 'text-rose-600' :
              metrics.kpis.defaultRate > 10 ? 'text-amber-600' : 'text-emerald-600'
            }`}>{metrics.kpis.defaultRate.toFixed(1)}%</p>
            <p className="text-[10px] text-slate-500 font-medium leading-tight">Inadimplência</p>
          </div>
        </div>

        {/* Recuperação */}
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50">
          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 dark:neu-recessed dark:border-[#1a1a1c]">
            <RefreshCw className="w-4 h-4 text-teal-500" />
          </div>
          <div>
            <p className={`text-lg font-black ${
              metrics.kpis.recoveryRate > 50 ? 'text-emerald-600' :
              metrics.kpis.recoveryRate > 20 ? 'text-amber-600' : 'text-slate-500'
            }`}>{metrics.kpis.recoveryRate.toFixed(1)}%</p>
            <p className="text-[10px] text-slate-500 font-medium leading-tight">Recuperação</p>
          </div>
        </div>

        {/* Clientes Alto Risco */}
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50">
          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 dark:neu-recessed dark:border-[#1a1a1c]">
            <Users className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <p className={`text-lg font-black ${
              metrics.kpis.criticalCustomersCount > 0 ? 'text-rose-600' : 'text-slate-500'
            }`}>{metrics.kpis.criticalCustomersCount}</p>
            <p className="text-[10px] text-slate-500 font-medium leading-tight">Alto risco</p>
          </div>
        </div>

        {/* Comunicações Pendentes */}
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50">
          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 dark:neu-recessed dark:border-[#1a1a1c]">
            <MessageSquare className="w-4 h-4 text-indigo-500" />
          </div>
          <div>
            <p className={`text-lg font-black ${
              metrics.kpis.pendingCommsCount > 0 ? 'text-amber-600' : 'text-emerald-600'
            }`}>{metrics.kpis.pendingCommsCount}</p>
            <p className="text-[10px] text-slate-500 font-medium leading-tight">Msg. pendentes</p>
          </div>
        </div>

      </div>

      {/* ── Linha Principal: Projeção de Caixa Ponderada ───────────────────── */}
      <div className="w-full">
        <CashForecast />
      </div>

      {/* ── Row 2: Próximos Vencimentos + Tarefas do Dia ─────────────────── */}
      <div className="grid gap-6 lg:grid-cols-12">

        {/* Próximos Vencimentos */}
        <Card className="premium-card rounded-[2.5rem]">
          <CardHeader className="border-b border-slate-100 bg-slate-50/70 pb-4 px-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-indigo-500" /> Próximos Vencimentos
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">Títulos a vencer nos próximos 7 dias.</CardDescription>
              </div>
              <Link href="/cobrancas">
                <Button variant="link" size="sm" className="text-indigo-600 font-semibold px-0 text-xs">Ver todos</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 overflow-x-auto">
            {metrics.upcomingDues.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-300" />
                <p className="text-sm font-semibold text-slate-700">Nenhum vencimento nos próximos 7 dias</p>
                <p className="text-xs text-slate-400">Sua carteira está tranquila por agora.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {metrics.upcomingDues.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex justify-center items-center ${
                        inv.isHighValue ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        {inv.isHighValue ? <AlertTriangle className="w-3.5 h-3.5" /> : <DollarSign className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{inv.customerName}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {inv.dueDate.toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[13px] text-slate-800">R$ {formatCurrency(inv.amount)}</span>
                      {inv.isHighValue && <div className="text-[9px] text-amber-600 font-bold uppercase tracking-widest mt-0.5">Alto Valor</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>


        {/* Tarefas do Dia */}
        <Card className="premium-card rounded-[2.5rem]">
          <CardHeader className="border-b border-slate-100 bg-slate-50/70 pb-4 px-6">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Tarefas do Dia
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">Follow-ups pendentes para hoje.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-4 overflow-y-auto max-h-[340px]">
            {metrics.todaysTasks.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-300" />
                <p className="text-sm font-semibold text-slate-700">Fila operacional limpa</p>
                <p className="text-xs text-slate-400">Nenhuma tarefa pendente para hoje.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {metrics.todaysTasks.map(task => (
                  <div key={task.id} className={`p-3 rounded-xl border transition-all ${
                    task.overdue ? 'border-rose-200 bg-rose-50/40' : 'border-slate-200 bg-white'
                  }`}>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h5 className="text-sm font-semibold text-slate-800">{task.title}</h5>
                        <p className="text-xs text-slate-500 mt-0.5">{task.customerName}</p>
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-lg shrink-0 ${
                        task.overdue
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {task.overdue ? 'Atrasada' : 'Hoje'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>


      </div>

      {/* ── Row 3: Gráfico de Recebimentos + Aging Distribution ──────────── */}
      <div className="grid gap-6 lg:grid-cols-12">

        {/* Fluxo de Recebimentos */}
        <Card className="premium-card rounded-[2.5rem]">
          <CardHeader className="border-b border-slate-100 bg-slate-50/70 pb-4 px-6">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" /> Fluxo de Recebimentos
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">Últimos 30 dias vs. próximos 30 dias.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-4 bg-slate-50/50">
            <DashboardChart data={metrics.receiptsChart} />
          </CardContent>
        </Card>

        {/* Aging de Recebíveis */}
        <Card className="premium-card rounded-[2.5rem]">
          <CardHeader className="border-b border-slate-100 bg-slate-50/70 pb-4 px-6">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" /> Aging de Recebíveis
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">Distribuição por prazo de vencimento.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-5">
            {metrics.agingDistribution.every(b => b.amount === 0) ? (
              <div className="py-8 flex flex-col items-center gap-2 text-center">
                <BarChart3 className="w-8 h-8 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">Sem recebíveis em aberto</p>
                <p className="text-xs text-slate-400">O aging aparecerá assim que houver faturas ativas.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {metrics.agingDistribution.map((bucket, idx) => {
                  const pct = totalAgingAmount > 0 ? (bucket.amount / totalAgingAmount) * 100 : 0;
                  const color = AGING_COLORS[idx] ?? AGING_COLORS[4];
                  return (
                    <div key={bucket.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-slate-700">{bucket.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">{bucket.count} títulos</span>
                          <span className={`text-xs font-bold ${color.text}`}>{fmtCurrencyFull(bucket.amount)}</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${color.bg} transition-all duration-500`} style={{ width: `${Math.max(pct, 2)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>


      </div>

      {/* ── Row 4: Overdue Snapshot + Recent Comms + Risk Ranking ─────────── */}
      <div className="grid gap-6 lg:grid-cols-12">

        {/* Faturas Vencidas */}
        <Card className="premium-card rounded-[2.5rem] lg:col-span-5 flex flex-col overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/70 pb-4 px-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" /> Faturas Vencidas
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">As mais críticas por prazo e valor.</CardDescription>
              </div>
              <Link href="/cobrancas?status=overdue">
                <Button variant="link" size="sm" className="text-rose-600 font-semibold px-0 text-xs">Ver todas</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 overflow-y-auto max-h-[380px]">
            {metrics.overdueSnapshot.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-300" />
                <p className="text-sm font-semibold text-slate-700">Sem faturas vencidas</p>
                <p className="text-xs text-slate-400">Continue assim! Sua carteira está em dia.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {metrics.overdueSnapshot.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl border border-rose-100 bg-rose-50/20 hover:bg-rose-50/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5 text-rose-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{inv.customerName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">#{inv.invoiceNumber}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-bold text-rose-700">{fmtCurrencyFull(inv.amount)}</p>
                      <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">{inv.daysOverdue}d atraso</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>


        {/* Atividade de Comunicações */}
        <Card className="premium-card rounded-[2.5rem] lg:col-span-3 flex flex-col overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/70 pb-4 px-6">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-500" /> Comunicações
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">Atividade recente do fluxo de cobrança.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-4 overflow-y-auto max-h-[380px]">
            {metrics.recentCommActivity.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2 text-center">
                <Inbox className="w-8 h-8 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">Nenhuma comunicação ainda</p>
                <p className="text-xs text-slate-400 max-w-[160px]">
                  Configure a régua para que o sistema comece a disparar mensagens.
                </p>
                <Link href="/automacao">
                  <Button variant="outline" size="sm" className="mt-1 text-xs rounded-xl border-slate-200 font-semibold">Configurar Régua</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5">
                {metrics.recentCommActivity.map(comm => {
                  const isSent    = comm.status === 'sent';
                  const isSkipped = comm.status === 'skipped';
                  const isFailed  = comm.status === 'failed';
                  const label = COMM_STATUS_LABELS[comm.status] ?? comm.status;
                  return (
                    <div key={comm.id} className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSent ? 'bg-emerald-100' : isSkipped ? 'bg-amber-100' : isFailed ? 'bg-rose-100' : 'bg-slate-100'
                      }`}>
                        {isSent    ? <Send       className="w-3 h-3 text-emerald-600" />
                         : isSkipped ? <SkipForward className="w-3 h-3 text-amber-600" />
                         : isFailed  ? <XCircle    className="w-3 h-3 text-rose-600" />
                         :             <Clock      className="w-3 h-3 text-slate-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{comm.customerName}</p>
                        <p className="text-[10px] text-slate-400">{comm.channel}</p>
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md shrink-0 ${
                        isSent    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        isSkipped ? 'bg-amber-50  text-amber-700  border border-amber-100'  :
                        isFailed  ? 'bg-rose-50   text-rose-700   border border-rose-100'   :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>


        {/* Ranking de Risco */}
        <Card className="premium-card rounded-[2.5rem]">
          <CardHeader className="border-b border-slate-100 bg-slate-50/70 pb-4 px-6">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" /> Ranking de Risco
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">Clientes classificados por score 0–100.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-4 overflow-y-auto max-h-[380px]">
            {metrics.riskRanking.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2 text-center">
                <Users className="w-8 h-8 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">Sem clientes cadastrados</p>
                <p className="text-xs text-slate-400">Adicione clientes para visualizar o ranking de risco.</p>
                <Link href="/clientes">
                  <Button variant="outline" size="sm" className="mt-1 text-xs rounded-xl border-slate-200 font-semibold">Ir para Clientes</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5">
                {metrics.riskRanking.map((rank, idx) => (
                  <div key={rank.customerId} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="w-7 h-7 rounded-lg flex justify-center items-center text-xs font-bold font-mono border flex-shrink-0" style={{
                        backgroundColor: rank.level === 'Baixo' ? '#ecfdf5' : rank.level === 'Médio' ? '#fef3c7' : rank.level === 'Alto' ? '#ffedd5' : '#fee2e2',
                        color:           rank.level === 'Baixo' ? '#059669' : rank.level === 'Médio' ? '#d97706' : rank.level === 'Alto' ? '#ea580c' : '#dc2626',
                        borderColor:     rank.level === 'Baixo' ? '#a7f3d0' : rank.level === 'Médio' ? '#fcd34d' : rank.level === 'Alto' ? '#fed7aa' : '#fecaca',
                      }}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{rank.customerName}</p>
                        <p className="text-[10px] text-slate-400 truncate">{rank.justification}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-0.5 flex-shrink-0 ml-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black" style={{
                          color: rank.level === 'Baixo' ? '#059669' : rank.level === 'Médio' ? '#d97706' : rank.level === 'Alto' ? '#ea580c' : '#dc2626'
                        }}>{rank.score}</span>
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md" style={{
                          backgroundColor: rank.level === 'Baixo' ? '#d1fae5' : rank.level === 'Médio' ? '#fed7aa' : '#fee2e2',
                          color:           rank.level === 'Baixo' ? '#047857' : rank.level === 'Médio' ? '#92400e' : '#7f1d1d',
                        }}>{rank.level}</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-rose-600">{fmtCurrencyFull(rank.overdueAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
