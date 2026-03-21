import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  MessageCircle,
  Megaphone
} from "lucide-react"
import { getDashboardMetrics } from "@/actions/dashboard"
import DashboardChart from "./DashboardChart"

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val).replace('R$', '').trim();
}

export default async function Dashboard() {
  const metrics = await getDashboardMetrics();

  const criticalRiskAmount = metrics.riskDistribution['60_plus_days'] || 0;
  const highRiskAmount = metrics.riskDistribution['31_60_days'] || 0;
  
  const hasCriticalAlert = criticalRiskAmount > 0;
  const hasHighAlert = !hasCriticalAlert && highRiskAmount > 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      
      {/* Dynamic Alert Banner based on Aging Distribution */}
      {hasCriticalAlert && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4 shadow-sm relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-r from-rose-100/50 to-transparent"></div>
           <div className="flex items-center gap-3 relative z-10">
             <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
               <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />
             </div>
             <div>
               <h4 className="font-bold text-sm">Alerta Crítico de Risco na Carteira</h4>
               <p className="text-xs opacity-90">Você possui R$ {formatCurrency(criticalRiskAmount)} em faturas vencidas há mais de 60 dias. Reage!</p>
             </div>
           </div>
           <Button variant="destructive" size="sm" className="relative z-10 shadow-lg whitespace-nowrap">
             Ver Devedores Críticos
           </Button>
        </div>
      )}

      {hasHighAlert && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm relative overflow-hidden">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
               <AlertTriangle className="w-4 h-4 text-amber-600" />
             </div>
             <div>
               <h4 className="font-bold text-sm">Atenção ao Fluxo de Caixa</h4>
               <p className="text-xs opacity-90">R$ {formatCurrency(highRiskAmount)} repousam na faixa de 31 a 60 dias de atraso. Inicie os contatos.</p>
             </div>
           </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50/50 border border-border text-xs font-semibold text-indigo-700 mb-2 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Cockpit Financeiro
          </div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-obsidian">Hub Central</h1>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="shadow-sm">Exportar PDF</Button>
           <Button className="btn-beam shadow-md rounded-lg overflow-hidden relative group">
              <span className="relative z-10 flex items-center gap-2 font-semibold">
                <DollarSign className="w-4 h-4" /> Nova Cobrança
              </span>
           </Button>
        </div>
      </div>

      {/* 5 KPIs Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        
        {/* KPI 1 */}
        <Card className="premium-card relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-[13px] font-semibold text-muted-foreground w-full truncate pr-2">Total a Receber</CardTitle>
            <Activity className="w-4 h-4 text-indigo-500 shrink-0" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-heading font-extrabold tracking-tight text-obsidian flex items-baseline gap-1">
              <span className="text-sm text-muted-foreground font-medium">R$</span>
              {formatCurrency(metrics.totalPending)}
            </div>
            <p className="text-[10px] uppercase font-bold mt-2 text-indigo-600 tracking-wider">Montante Emitido</p>
          </CardContent>
        </Card>

        {/* KPI 2 */}
        <Card className="premium-card group relative overflow-hidden border-rose-100">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
          <div className="absolute inset-0 bg-gradient-to-br from-rose-50/40 via-transparent to-transparent opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-[13px] font-semibold text-rose-700 w-full truncate pr-2">Valor Vencido</CardTitle>
            <ArrowDownRight className="w-4 h-4 text-rose-500 shrink-0" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-heading font-extrabold tracking-tight text-rose-700 flex items-baseline gap-1">
              <span className="text-sm text-rose-500/80 font-medium">R$</span>
              {formatCurrency(metrics.totalOverdue)}
            </div>
            <p className="text-[10px] uppercase font-bold mt-2 text-rose-600 tracking-wider">Inadimplência Ativa</p>
          </CardContent>
        </Card>

        {/* KPI 3 */}
        <Card className="premium-card relative overflow-hidden group border-amber-200">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-[13px] font-semibold text-amber-700 w-full truncate pr-2">Vencem Hoje</CardTitle>
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-heading font-extrabold tracking-tight text-amber-600 flex items-baseline gap-1">
               <span className="text-sm text-amber-500/80 font-medium">R$</span>
               {formatCurrency(metrics.dueToday)}
            </div>
            <p className="text-[10px] uppercase font-bold mt-2 text-amber-600 tracking-wider">Atenção Imediata</p>
          </CardContent>
        </Card>

        {/* KPI 4 */}
        <Card className="premium-card relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-[13px] font-semibold text-muted-foreground w-full truncate pr-2">Previsão (7 dias)</CardTitle>
            <CalendarDays className="w-4 h-4 text-emerald-500 shrink-0" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-heading font-extrabold tracking-tight text-obsidian flex items-baseline gap-1">
               <span className="text-sm text-muted-foreground font-medium">R$</span>
               {formatCurrency(metrics.expectedThisWeek)}
            </div>
            <p className="text-[10px] uppercase font-bold mt-2 text-emerald-600 tracking-wider">Liquidez Esperada</p>
          </CardContent>
        </Card>

        {/* KPI 5 (Distribution Stats) */}
        <Card className="premium-card relative overflow-hidden group xl:col-span-1 md:col-span-3 col-span-2">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <div className="text-xs font-semibold text-subtle uppercase tracking-widest mb-3">Mapa de Calote</div>
            <div className="space-y-2">
               <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-amber-600">1-30 dias</span>
                  <span className="font-bold">R$ {formatCurrency(metrics.riskDistribution['1_15_days'] + metrics.riskDistribution['16_30_days'])}</span>
               </div>
               <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 w-[60%]"></div>
               </div>
               
               <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <span className="text-rose-600">+60 dias</span>
                  <span className="font-bold">R$ {formatCurrency(metrics.riskDistribution['60_plus_days'])}</span>
               </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Main Sections */}
      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* Priority Queue / CRM Section */}
        <Card className="premium-card lg:col-span-8 flex flex-col overflow-hidden">
          <CardHeader className="border-b border-border/60 bg-[#FAFAFB] pb-4 px-6 relative">
            <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-indigo-50/50 to-transparent pointer-events-none"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-obsidian">
                  <ShieldAlert className="w-4 h-4 text-rose-500" /> Fila de Prioridades (Críticos)
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Ação requerida. Ordenado por Risco Crítico e Valor Exposto.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-x-auto">
            <table className="w-full text-sm text-left align-middle min-w-max">
               <thead className="bg-[#FAFAFB]">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-muted-foreground border-b border-border/50 text-xs uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground border-b border-border/50 text-xs uppercase tracking-wider">Risco</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground border-b border-border/50 text-xs uppercase tracking-wider text-right">Valor Atrasado</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground border-b border-border/50 text-xs uppercase tracking-wider text-right">Ação Rápida</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-border/40 bg-white">
                  {metrics.priorityList.map((item) => (
                    <tr key={item.id} className="hover:bg-indigo-50/20 transition-colors group">
                       <td className="px-6 py-3">
                          <p className="font-semibold text-obsidian ">{item.customerName}</p>
                          <p className="text-xs font-mono text-muted-foreground">{item.daysOverdue} dias de atraso</p>
                       </td>
                       <td className="px-6 py-3">
                          {item.riskLevel === 'critical' ? (
                            <Badge variant="destructive" className="bg-rose-100 text-rose-700 border border-rose-200">CRÍTICO</Badge>
                          ) : item.riskLevel === 'high' ? (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">ALTO</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-700">MÉDIO</Badge>
                          )}
                       </td>
                       <td className="px-6 py-3 text-right">
                          <span className="font-mono font-bold text-obsidian">R$ {formatCurrency(item.amount)}</span>
                       </td>
                       <td className="px-6 py-3 text-right w-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-2 justify-end">
                            <Button variant="outline" size="sm" className="h-8 text-xs gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                               <MessageCircle className="w-3.5 h-3.5" /> Notificar
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-subtle hover:text-obsidian bg-gray-50 border border-border">
                               <Megaphone className="w-3.5 h-3.5" /> Régua
                            </Button>
                          </div>
                       </td>
                    </tr>
                  ))}
                  
                  {metrics.priorityList.length === 0 && (
                     <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground text-sm">
                           Nenhuma fatura crítica ou atrasada na fila prioritária. 💎
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Small Cashflow Trend  */}
        <Card className="premium-card lg:col-span-4 flex flex-col">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" /> Entradas / Mês
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Fluxo Real vs Projetado Diário
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-2 bg-[#FAFAFB]">
             <DashboardChart data={metrics.cashflowTrend} />
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
