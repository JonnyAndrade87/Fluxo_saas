import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'
import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Activity,
  AlertTriangle,
  Clock,
  Sparkles,
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
} from "lucide-react"
import { getDashboardMetrics } from "@/actions/dashboard"
import { getOnboardingStatus } from "@/actions/onboarding"
import DashboardChart from "./DashboardChart"
import OnboardingChecklist from "@/components/onboarding/OnboardingChecklist"
import { CashForecast } from "@/components/dashboard/CashForecast"
import WelcomeModal from "@/components/dashboard/WelcomeModal"

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatCurrency = (val: number) => fmt.format(val).replace('R$\u00a0', '').replace('R$ ', '').trim();
const fmtCurrencyFull = (val: number) => fmt.format(val);

const RULE_LABELS: Record<string, string> = {
  pre_due_3d: 'D-3',
  due_today: 'D0',
  overdue_1d: 'D+1',
  overdue_3d: 'D+3',
  overdue_7d: 'D+7',
  overdue_15d: 'D+15',
  custom: 'Custom',
};

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp_manual: 'WhatsApp',
  email_manual: 'E-mail',
  internal: 'Interno',
};

const AGING_COLORS = [
  { bar: '#4F46E5', text: 'text-indigo-600', bg: 'bg-indigo-500' },
  { bar: '#F59E0B', text: 'text-amber-600', bg: 'bg-amber-400' },
  { bar: '#F97316', text: 'text-orange-600', bg: 'bg-orange-500' },
  { bar: '#EF4444', text: 'text-rose-600', bg: 'bg-rose-500' },
  { bar: '#7F1D1D', text: 'text-red-900', bg: 'bg-red-900' },
];

export default async function Dashboard() {
  const [metrics, onboardingStatus] = await Promise.all([
    getDashboardMetrics(),
    getOnboardingStatus(),
  ]);

  const totalAgingAmount = metrics.agingDistribution.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">

      {/* ── Modal de Boas-vindas (detecta ?welcome=1 após onboarding) ── */}
      <WelcomeModal />

      {/* ── Onboarding Checklist (hidden once complete or dismissed) ──── */}
      {!onboardingStatus.isComplete && (
        <OnboardingChecklist status={onboardingStatus} />
      )}

      {/* Critical Alerts Banner */}
      {metrics.criticalAlerts.length > 0 && (
        <div className="flex flex-col gap-3">
          {metrics.criticalAlerts.map(alert => (
            <div key={alert.id} className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-100/50 to-transparent" />
              <div className="flex items-center gap-3 relative z-10 w-full">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  {alert.type === 'broken_promise'
                    ? <Clock className="w-5 h-5 text-rose-600 animate-pulse" />
                    : alert.type === 'delivery_failed'
                    ? <XCircle className="w-5 h-5 text-rose-600" />
                    : <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm tracking-tight">{alert.title}</h4>
                  <p className="text-xs opacity-90 font-medium mt-0.5">{alert.description}</p>
                </div>
                <Link href={alert.actionUrl}>
                  <Button variant="destructive" size="sm" className="relative z-10 shadow-sm shrink-0 whitespace-nowrap hidden sm:flex font-semibold">Resolver</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50/50 border border-indigo-100/50 text-xs font-semibold text-indigo-700 mb-2 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" /> Cockpit Financeiro
          </div>
          <h1 className="text-3xl font-sans font-semibold tracking-tighter text-obsidian">Visão Executiva</h1>
          <p className="text-muted-foreground text-sm">Painel de controle de recebíveis, inadimplência e cobrança.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/relatorios">
            <Button variant="outline" className="shadow-sm font-semibold rounded-lg bg-white border-border text-obsidian hover:bg-gray-50">Exportar Relatório</Button>
          </Link>
          <Link href="/cobrancas">
            <Button className="btn-beam shadow-lg rounded-lg overflow-hidden relative group border-none bg-fluxeer-blue text-white hover:bg-fluxeer-blue-hover">
              <span className="relative z-10 flex items-center gap-2 font-semibold">
                <DollarSign className="w-4 h-4" /> Nova Fatura
              </span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ── 8 KPI Cards ────────────────────────────────────────────────────── */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 xl:grid-cols-8">

        {/* 1. Total a Receber */}
        <Card className="premium-card relative overflow-hidden rounded-2xl col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">A Receber</CardTitle>
            <Activity className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-black tracking-tight text-obsidian">
              <span className="text-xs text-muted-foreground font-medium mr-0.5">R$</span>
              {formatCurrency(metrics.kpis.totalPending)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Em aberto</p>
          </CardContent>
        </Card>

        {/* 2. Vencido */}
        <Card className="premium-card relative overflow-hidden rounded-2xl border-rose-100 col-span-1">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 rounded-l-2xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
            <CardTitle className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Vencido</CardTitle>
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-black tracking-tight text-rose-700">
              <span className="text-xs text-rose-400 font-medium mr-0.5">R$</span>
              {formatCurrency(metrics.kpis.totalOverdue)}
            </div>
            <p className="text-[10px] text-rose-500 mt-1 font-semibold">Em atraso</p>
          </CardContent>
        </Card>

        {/* 3. Previsão 7d */}
        <Card className="premium-card relative overflow-hidden rounded-2xl border-amber-100 col-span-1">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-400 rounded-l-2xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
            <CardTitle className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Previsão 7d</CardTitle>
            <CalendarDays className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-black tracking-tight text-amber-600">
              <span className="text-xs text-amber-400 font-medium mr-0.5">R$</span>
              {formatCurrency(metrics.kpis.dueNext7Days)}
            </div>
            <p className="text-[10px] text-amber-600 mt-1">Próximos 7 dias</p>
          </CardContent>
        </Card>

        {/* 4. Recebido no Mês */}
        <Card className="premium-card relative overflow-hidden rounded-2xl border-emerald-100 col-span-1">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-2xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
            <CardTitle className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Recebido</CardTitle>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-black tracking-tight text-emerald-700">
              <span className="text-xs text-emerald-400 font-medium mr-0.5">R$</span>
              {formatCurrency(metrics.kpis.paidThisMonth)}
            </div>
            <p className="text-[10px] text-emerald-600 mt-1">Este mês</p>
          </CardContent>
        </Card>

        {/* 5. Taxa de Inadimplência */}
        <Card className="premium-card relative overflow-hidden rounded-2xl col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Inadimp.</CardTitle>
            <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className={`text-xl font-black tracking-tight ${metrics.kpis.defaultRate > 20 ? 'text-rose-600' : metrics.kpis.defaultRate > 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {metrics.kpis.defaultRate.toFixed(1)}%
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Do total emitido</p>
          </CardContent>
        </Card>

        {/* 6. Taxa de Recuperação */}
        <Card className="premium-card relative overflow-hidden rounded-2xl col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recuperação</CardTitle>
            <RefreshCw className="w-3.5 h-3.5 text-teal-500 shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className={`text-xl font-black tracking-tight ${metrics.kpis.recoveryRate > 50 ? 'text-emerald-600' : metrics.kpis.recoveryRate > 20 ? 'text-amber-600' : 'text-slate-500'}`}>
              {metrics.kpis.recoveryRate.toFixed(1)}%
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Inadimp. recuperada</p>
          </CardContent>
        </Card>

        {/* 7. Clientes Críticos */}
        <Card className="premium-card relative overflow-hidden rounded-2xl col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Alto Risco</CardTitle>
            <Users className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-black tracking-tight text-rose-600">
              {metrics.kpis.criticalCustomersCount}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Clientes &gt;60d</p>
          </CardContent>
        </Card>

        {/* 8. Comunicações Pendentes */}
        <Card className="premium-card relative overflow-hidden rounded-2xl col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Comun. Pend.</CardTitle>
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className={`text-xl font-black tracking-tight ${metrics.kpis.pendingCommsCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {metrics.kpis.pendingCommsCount}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Aguardando envio</p>
          </CardContent>
        </Card>

      </div>

      {/* ── Linha Principal: Projeção de Caixa Ponderada ───────────────────── */}
      <div className="w-full">
        <CashForecast />
      </div>

      {/* ── Row 2: Próximos Vencimentos + Tarefas do Dia ─────────────────── */}
      <div className="grid gap-6 lg:grid-cols-12">

        {/* Próximos Vencimentos */}
        <Card className="premium-card rounded-3xl lg:col-span-8 flex flex-col overflow-hidden">
          <CardHeader className="border-b border-border bg-[#FAFAFB] pb-5 px-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-sans font-bold text-obsidian flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-indigo-500" /> Próximos Vencimentos
                </CardTitle>
                <CardDescription className="text-xs mt-1">Títulos a vencer nos próximos 7 dias.</CardDescription>
              </div>
              <Link href="/cobrancas"><Button variant="link" className="text-indigo-600 font-semibold px-0 text-sm">Ver todos</Button></Link>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 overflow-x-auto">
            <div className="space-y-1">
              {metrics.upcomingDues.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex justify-center items-center ${inv.isHighValue ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                      {inv.isHighValue ? <AlertTriangle className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-obsidian">{inv.customerName}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {inv.dueDate.toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[13px] text-obsidian">R$ {formatCurrency(inv.amount)}</span>
                    {inv.isHighValue && <div className="text-[9px] text-amber-600 font-bold uppercase tracking-widest">Alto Valor</div>}
                  </div>
                </div>
              ))}
              {metrics.upcomingDues.length === 0 && (
                <div className="py-10 text-center">
                  <p className="text-muted-foreground text-sm">Sem vencimentos nos próximos 7 dias. 🎉</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tarefas do Dia */}
        <Card className="premium-card rounded-3xl lg:col-span-4 flex flex-col overflow-hidden">
          <CardHeader className="border-b border-border bg-[#FAFAFB] pb-5 px-8">
            <CardTitle className="text-base font-sans font-bold text-obsidian flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Tarefas do Dia
            </CardTitle>
            <CardDescription className="text-xs mt-1">Follow-ups pendentes.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-4 overflow-y-auto max-h-[340px] bg-white">
            <div className="space-y-2">
              {metrics.todaysTasks.map(task => (
                <div key={task.id} className={`p-3 rounded-xl border transition-all ${task.overdue ? 'border-rose-200 bg-rose-50/30' : 'border-border bg-white shadow-sm'}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h5 className="text-sm font-bold text-obsidian">{task.title}</h5>
                      <p className="text-xs text-muted-foreground mt-0.5">{task.customerName}</p>
                    </div>
                    {task.overdue
                      ? <Badge variant="destructive" className="text-[9px] uppercase tracking-widest px-1.5 py-0.5">Atrasada</Badge>
                      : <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[9px] uppercase tracking-widest px-1.5 py-0.5">Hoje</Badge>
                    }
                  </div>
                </div>
              ))}
              {metrics.todaysTasks.length === 0 && (
                <div className="py-8 text-center">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-muted-foreground text-sm">Fila operacional limpa.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ── Row 3: Gráfico de Recebimentos + Aging Distribution ──────────── */}
      <div className="grid gap-6 lg:grid-cols-12">

        {/* Evolução de Recebimentos */}
        <Card className="premium-card rounded-3xl lg:col-span-8 flex flex-col overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-5 px-8">
            <CardTitle className="text-base font-sans font-bold text-obsidian flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" /> Fluxo de Recebimentos
            </CardTitle>
            <CardDescription className="text-xs mt-1">Últimos 30 dias (recebido) vs. próximos 30 dias (a receber)</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-4 bg-[#FAFAFB]">
            <DashboardChart data={metrics.receiptsChart} />
          </CardContent>
        </Card>

        {/* Aging Distribution */}
        <Card className="premium-card rounded-3xl lg:col-span-4 flex flex-col overflow-hidden">
          <CardHeader className="border-b border-border bg-[#FAFAFB] pb-5 px-8">
            <CardTitle className="text-base font-sans font-bold text-obsidian flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" /> Aging de Recebíveis
            </CardTitle>
            <CardDescription className="text-xs mt-1">Distribuição por prazo de vencimento.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-6 bg-white">
            {metrics.agingDistribution.every(b => b.amount === 0)
              ? <p className="text-center text-sm text-muted-foreground py-8">Sem recebíveis em aberto.</p>
              : (
                <div className="space-y-4">
                  {metrics.agingDistribution.map((bucket, idx) => {
                    const pct = totalAgingAmount > 0 ? (bucket.amount / totalAgingAmount) * 100 : 0;
                    const color = AGING_COLORS[idx] ?? AGING_COLORS[4];
                    return (
                      <div key={bucket.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-obsidian">{bucket.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">{bucket.count} títulos</span>
                            <span className={`text-xs font-bold ${color.text}`}>{fmtCurrencyFull(bucket.amount)}</span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${color.bg} transition-all duration-500`} style={{ width: `${Math.max(pct, 2)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            }
          </CardContent>
        </Card>

      </div>

      {/* ── Row 4: Overdue Snapshot + Recent Comms + Risk Ranking ─────────── */}
      <div className="grid gap-6 lg:grid-cols-12">

        {/* Overdue Snapshot */}
        <Card className="premium-card rounded-3xl lg:col-span-5 flex flex-col overflow-hidden">
          <CardHeader className="border-b border-border bg-[#FAFAFB] pb-5 px-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-sans font-bold text-obsidian flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" /> Faturas Vencidas
                </CardTitle>
                <CardDescription className="text-xs mt-1">As mais críticas por prazo e valor.</CardDescription>
              </div>
              <Link href="/cobrancas?status=overdue"><Button variant="link" className="text-rose-600 font-semibold px-0 text-sm">Ver todas</Button></Link>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 overflow-y-auto max-h-[380px] bg-white">
            {metrics.overdueSnapshot.length === 0
              ? <div className="py-10 text-center"><CheckCircle2 className="w-8 h-8 mx-auto text-emerald-300 mb-2" /><p className="text-sm text-muted-foreground">Sem faturas vencidas! 🎉</p></div>
              : (
                <div className="space-y-2">
                  {metrics.overdueSnapshot.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl border border-rose-100 bg-rose-50/20 hover:bg-rose-50/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                          <FileText className="w-3.5 h-3.5 text-rose-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-obsidian truncate">{inv.customerName}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">#{inv.invoiceNumber}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-sm font-bold text-rose-700">{fmtCurrencyFull(inv.amount)}</p>
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">{inv.daysOverdue}d atraso</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </CardContent>
        </Card>

        {/* Recent Communication Activity */}
        <Card className="premium-card rounded-3xl lg:col-span-3 flex flex-col overflow-hidden">
          <CardHeader className="border-b border-border bg-[#FAFAFB] pb-5 px-8">
            <CardTitle className="text-base font-sans font-bold text-obsidian flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-500" /> Comunicações
            </CardTitle>
            <CardDescription className="text-xs mt-1">Atividade recente do fluxo de cobrança.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-4 overflow-y-auto max-h-[380px] bg-white">
            {metrics.recentCommActivity.length === 0
              ? <p className="text-center text-sm text-muted-foreground py-8">Nenhuma comunicação registrada.</p>
              : (
                <div className="space-y-2">
                  {metrics.recentCommActivity.map(comm => {
                    const isSent = comm.status === 'sent';
                    const isSkipped = comm.status === 'skipped';
                    const isFailed = comm.status === 'failed';
                    return (
                      <div key={comm.id} className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isSent ? 'bg-emerald-100' : isSkipped ? 'bg-amber-100' : isFailed ? 'bg-rose-100' : 'bg-slate-100'
                        }`}>
                          {isSent ? <Send className="w-3 h-3 text-emerald-600" />
                            : isSkipped ? <SkipForward className="w-3 h-3 text-amber-600" />
                            : isFailed ? <XCircle className="w-3 h-3 text-rose-600" />
                            : <Clock className="w-3 h-3 text-slate-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-obsidian truncate">{comm.customerName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[10px] bg-slate-100 rounded px-1.5 py-0.5 font-mono text-slate-600">
                              {RULE_LABELS[comm.ruleType] ?? comm.ruleType}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {CHANNEL_LABELS[comm.channel] ?? comm.channel}
                            </span>
                          </div>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                          isSent ? 'bg-emerald-50 text-emerald-700' :
                          isSkipped ? 'bg-amber-50 text-amber-700' :
                          isFailed ? 'bg-rose-50 text-rose-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {comm.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )
            }
          </CardContent>
        </Card>

        {/* Risk Ranking */}
        <Card className="premium-card rounded-3xl lg:col-span-4 flex flex-col overflow-hidden">
          <CardHeader className="border-b border-border bg-[#FAFAFB] pb-5 px-8">
            <CardTitle className="text-base font-sans font-bold text-obsidian flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" /> Ranking de Risco
            </CardTitle>
            <CardDescription className="text-xs mt-1">Clientes classificados por score 0–100.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-4 overflow-y-auto max-h-[380px] bg-white">
            <div className="space-y-1.5">
              {metrics.riskRanking.map((rank, idx) => (
                <div key={rank.customerId} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-full flex justify-center items-center text-xs font-bold font-mono border flex-shrink-0" style={{
                      backgroundColor: rank.level === 'Baixo' ? '#ecfdf5' : rank.level === 'Médio' ? '#fef3c7' : rank.level === 'Alto' ? '#ffedd5' : '#fee2e2',
                      color: rank.level === 'Baixo' ? '#059669' : rank.level === 'Médio' ? '#d97706' : rank.level === 'Alto' ? '#ea580c' : '#dc2626',
                      borderColor: rank.level === 'Baixo' ? '#a7f3d0' : rank.level === 'Médio' ? '#fcd34d' : rank.level === 'Alto' ? '#fed7aa' : '#fecaca',
                    }}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-obsidian truncate">{rank.customerName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{rank.justification}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-0.5 flex-shrink-0 ml-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black" style={{ color: rank.level === 'Baixo' ? '#059669' : rank.level === 'Médio' ? '#d97706' : rank.level === 'Alto' ? '#ea580c' : '#dc2626' }}>
                        {rank.score}
                      </span>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{
                        backgroundColor: rank.level === 'Baixo' ? '#d1fae5' : rank.level === 'Médio' ? '#fed7aa' : '#fee2e2',
                        color: rank.level === 'Baixo' ? '#047857' : rank.level === 'Médio' ? '#92400e' : '#7f1d1d',
                      }}>
                        {rank.level}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-rose-600">{fmtCurrencyFull(rank.overdueAmount)}</span>
                  </div>
                </div>
              ))}
              {metrics.riskRanking.length === 0 && (
                <div className="py-8 text-center"><p className="text-muted-foreground text-sm">Sem clientes na base.</p></div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>

    </div>
  )
}
