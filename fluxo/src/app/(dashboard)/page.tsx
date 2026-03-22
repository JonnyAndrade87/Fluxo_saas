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
  XCircle,
  Users
} from "lucide-react"
import { getDashboardMetrics } from "@/actions/dashboard"
import DashboardChart from "./DashboardChart"

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val).replace('R$', '').trim();
}

export default async function Dashboard() {
  const metrics = await getDashboardMetrics();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      
      {/* Dynamic Critical Alerts Banner */}
      {metrics.criticalAlerts.length > 0 && (
        <div className="flex flex-col gap-3">
          {metrics.criticalAlerts.map(alert => (
            <div key={alert.id} className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-r from-rose-100/50 to-transparent"></div>
               <div className="flex items-center gap-3 relative z-10 w-full">
                 <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                   {alert.type === 'broken_promise' ? <Clock className="w-5 h-5 text-rose-600 animate-pulse" /> :
                    alert.type === 'delivery_failed' ? <XCircle className="w-5 h-5 text-rose-600" /> :
                    <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />}
                 </div>
                 <div className="flex-1">
                   <h4 className="font-bold text-sm tracking-tight">{alert.title}</h4>
                   <p className="text-xs opacity-90 font-medium mt-0.5">{alert.description}</p>
                 </div>
                 <Link href={alert.actionUrl}>
                   <Button variant="destructive" size="sm" className="relative z-10 shadow-sm shrink-0 whitespace-nowrap hidden sm:flex font-semibold">
                     Resolver
                   </Button>
                 </Link>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50/50 border border-indigo-100/50 text-xs font-semibold text-indigo-700 mb-2 shadow-sm focus:outline-none">
            <Sparkles className="w-3.5 h-3.5" />
            Cockpit Financeiro
          </div>
          <h1 className="text-3xl font-sans font-semibold tracking-tighter text-obsidian">Visão Operacional</h1>
        </div>
        <div className="flex items-center gap-3">
           <Link href="/relatorios">
             <Button variant="outline" className="shadow-sm font-semibold rounded-lg bg-white border-border text-obsidian hover:bg-gray-50">Exportar Relatório</Button>
           </Link>
           <Link href="/cobrancas">
             <Button className="btn-beam shadow-lg rounded-lg overflow-hidden relative group border-none bg-obsidian text-white hover:bg-black">
                <span className="relative z-10 flex items-center gap-2 font-semibold">
                  <DollarSign className="w-4 h-4" /> Nova Fatura
                </span>
             </Button>
           </Link>
        </div>
      </div>

      {/* 6 KPIs Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        
        {/* KPI 1: Total a Receber */}
        <Card className="premium-card relative overflow-hidden group rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-subtle uppercase tracking-wider">A Receber</CardTitle>
            <Activity className="w-4 h-4 text-indigo-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-sans font-bold tracking-tight text-obsidian flex items-baseline gap-1">
              <span className="text-sm text-subtle font-medium">R$</span>
              {formatCurrency(metrics.kpis.totalPending)}
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Em Atraso */}
        <Card className="premium-card relative overflow-hidden group rounded-2xl border-rose-100">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-rose-700 uppercase tracking-wider">Vencido</CardTitle>
            <ArrowDownRight className="w-4 h-4 text-rose-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-sans font-bold tracking-tight text-rose-700 flex items-baseline gap-1">
              <span className="text-sm text-rose-500/80 font-medium">R$</span>
              {formatCurrency(metrics.kpis.totalOverdue)}
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: A Vencer (7 dias) */}
        <Card className="premium-card relative overflow-hidden group rounded-2xl border-amber-100">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-amber-700 uppercase tracking-wider">Previsão (7d)</CardTitle>
            <CalendarDays className="w-4 h-4 text-amber-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-sans font-bold tracking-tight text-amber-600 flex items-baseline gap-1">
               <span className="text-sm text-amber-500/80 font-medium">R$</span>
               {formatCurrency(metrics.kpis.dueNext7Days)}
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Recebido no Mês */}
        <Card className="premium-card relative overflow-hidden group rounded-2xl border-emerald-100">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Recebido Mês</CardTitle>
            <ArrowUpRight className="w-4 h-4 text-emerald-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-sans font-bold tracking-tight text-emerald-600 flex items-baseline gap-1">
               <span className="text-sm text-emerald-500/80 font-medium">R$</span>
               {formatCurrency(metrics.kpis.paidThisMonth)}
            </div>
          </CardContent>
        </Card>

        {/* KPI 5: Índice Inadimplência */}
        <Card className="premium-card relative overflow-hidden group rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-subtle uppercase tracking-wider">Inadimplência</CardTitle>
            <TrendingUp className="w-4 h-4 text-obsidian shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-sans font-bold tracking-tight text-obsidian">
               {metrics.kpis.defaultRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        {/* KPI 6: Clientes Críticos */}
        <Card className="premium-card relative overflow-hidden group rounded-2xl">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-subtle uppercase tracking-wider">Riscos Críticos</CardTitle>
            <Users className="w-4 h-4 text-rose-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-sans font-bold tracking-tight text-rose-600">
               {metrics.kpis.criticalCustomersCount}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Main Sections Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* Próximos Vencimentos */}
        <Card className="premium-card rounded-3xl lg:col-span-8 flex flex-col overflow-hidden">
          <CardHeader className="border-b border-border bg-[#FAFAFB] pb-5 px-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-sans font-bold text-obsidian flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-indigo-500" /> Próximos Vencimentos
                </CardTitle>
                <CardDescription className="text-sm mt-1 font-medium">
                  Títulos para os próximos 7 dias. Priorize altos valores.
                </CardDescription>
              </div>
              <Link href="/cobrancas">
                <Button variant="link" className="text-indigo-600 font-semibold px-0 text-sm hover:text-indigo-800">Ver todos</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 pb-4 overflow-x-auto">
            <div className="space-y-2">
              {metrics.upcomingDues.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all cursor-pointer group/row">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex justify-center items-center font-bold ${inv.isHighValue ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                            {inv.isHighValue ? <AlertTriangle className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-obsidian">{inv.customerName}</p>
                            <p className="text-xs text-subtle mt-0.5 font-medium flex items-center gap-1">Vence: {inv.dueDate.toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>
                    <div className="text-right">
                       <span className="font-sans font-bold text-obsidian">R$ {formatCurrency(inv.amount)}</span>
                       {inv.isHighValue && <div className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-0.5">Alto Valor</div>}
                    </div>
                </div>
              ))}
              {metrics.upcomingDues.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-subtle font-medium text-sm">Sem vencimentos nos próximos 7 dias. 🎉</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tarefas do Dia */}
        <Card className="premium-card rounded-3xl lg:col-span-4 flex flex-col overflow-hidden">
          <CardHeader className="border-b border-border bg-[#FAFAFB] pb-5 px-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-sans font-bold text-obsidian flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Tarefas do Dia
                </CardTitle>
                <CardDescription className="text-sm mt-1 font-medium">
                  Follow-ups pendentes.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 overflow-y-auto max-h-[400px] bg-white">
            <div className="space-y-3">
              {metrics.todaysTasks.map(task => (
                <div key={task.id} className={`p-4 rounded-2xl border transition-all hover:bg-gray-50 ${task.overdue ? 'border-rose-200 bg-rose-50/30' : 'border-border bg-white shadow-sm'}`}>
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h5 className="text-sm font-bold text-obsidian">{task.title}</h5>
                      <p className="text-xs text-subtle mt-1 font-medium">{task.customerName}</p>
                    </div>
                    {task.overdue ? (
                      <Badge variant="destructive" className="bg-rose-100 text-rose-700 text-[10px] border-rose-200 uppercase tracking-widest px-2 py-0.5">Atrasada</Badge>
                    ) : (
                      <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[10px] uppercase tracking-widest px-2 py-0.5 shadow-sm">Hoje</Badge>
                    )}
                  </div>
                </div>
              ))}
              {metrics.todaysTasks.length === 0 && (
                <div className="py-10 text-center">
                   <div className="w-12 h-12 rounded-full border border-dashed border-gray-300 flex items-center justify-center mx-auto mb-3">
                     <CheckCircle2 className="w-5 h-5 text-gray-400" />
                   </div>
                   <p className="text-subtle font-medium text-sm">Sua fila operacional está limpa.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Row 3: Gráfico e Ranking */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Evolução de Recebimentos */}
        <Card className="premium-card rounded-3xl lg:col-span-8 flex flex-col overflow-hidden">
           <CardHeader className="border-b border-border/50 pb-5 px-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-sans font-bold text-obsidian flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-500" /> Fluxo de Recebimentos
                </CardTitle>
                <CardDescription className="text-sm mt-1 font-medium">
                  30 dias anteriores vs 30 dias projetados
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 bg-[#FAFAFB]">
             <DashboardChart data={metrics.receiptsChart} />
          </CardContent>
        </Card>

        {/* Ranking de Risco (Light UI) */}
        <Card className="premium-card rounded-3xl lg:col-span-4 flex flex-col overflow-hidden">
          <CardHeader className="border-b border-border bg-[#FAFAFB] pb-5 px-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-sans font-bold text-obsidian flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-500" /> Ranking de Risco (0-100)
                </CardTitle>
                <CardDescription className="text-sm mt-1 font-medium">
                  Clientes classificados por score de risco.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 overflow-y-auto max-h-[400px] bg-white">
               <div className="space-y-2">
                  {metrics.riskRanking.map((rank, idx) => (
                    <div key={rank.customerId} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all cursor-pointer group/risk">
                       <div className="flex items-center gap-3 flex-1">
                          <div className="w-8 h-8 rounded-full flex justify-center items-center text-xs font-bold font-mono border flex-shrink-0" style={{
                            backgroundColor: rank.level === 'Baixo' ? '#ecfdf5' :
                                            rank.level === 'Médio' ? '#fef3c7' :
                                            rank.level === 'Alto' ? '#ffedd5' :
                                            '#fee2e2',
                            color: rank.level === 'Baixo' ? '#059669' :
                                   rank.level === 'Médio' ? '#d97706' :
                                   rank.level === 'Alto' ? '#ea580c' :
                                   '#dc2626',
                            borderColor: rank.level === 'Baixo' ? '#a7f3d0' :
                                        rank.level === 'Médio' ? '#fcd34d' :
                                        rank.level === 'Alto' ? '#fed7aa' :
                                        '#fecaca'
                          }}>
                             {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className="text-sm font-semibold text-obsidian truncate">{rank.customerName}</p>
                             <p className="text-xs text-muted-foreground mt-0.5 truncate" title={rank.justification}>{rank.justification}</p>
                          </div>
                       </div>
                       <div className="text-right flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                          <div className="flex items-center gap-2">
                            <div className="text-lg font-black" style={{
                              color: rank.level === 'Baixo' ? '#059669' :
                                     rank.level === 'Médio' ? '#d97706' :
                                     rank.level === 'Alto' ? '#ea580c' :
                                     '#dc2626'
                            }}>
                              {rank.score}
                            </div>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md" style={{
                              backgroundColor: rank.level === 'Baixo' ? '#d1fae5' :
                                              rank.level === 'Médio' ? '#fed7aa' :
                                              rank.level === 'Alto' ? '#fed7aa' :
                                              '#fee2e2',
                              color: rank.level === 'Baixo' ? '#047857' :
                                     rank.level === 'Médio' ? '#92400e' :
                                     rank.level === 'Alto' ? '#92400e' :
                                     '#7f1d1d'
                            }}>
                              {rank.level}
                            </span>
                          </div>
                          <span className="font-mono text-xs font-bold text-rose-600">R$ {formatCurrency(rank.overdueAmount)}</span>
                       </div>
                    </div>
                  ))}
                  {metrics.riskRanking.length === 0 && (
                     <div className="py-10 text-center">
                        <p className="text-subtle text-sm font-medium">Sem clientes na base. 🚀</p>
                     </div>
                  )}
               </div>
          </CardContent>
        </Card>

      </div>

    </div>
  )
}
