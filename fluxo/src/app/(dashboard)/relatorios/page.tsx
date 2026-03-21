import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getReportMetrics } from "@/actions/reports"
import ReportsCharts from "./charts"
import { BarChart3, TrendingUp, AlertTriangle, Download } from "lucide-react"

export default async function RelatoriosPage() {
  const metrics = await getReportMetrics();

  if (!metrics) {
    return <div className="p-8 text-center text-muted-foreground">Ocorreu um erro ao carregar o módulo analítico.</div>;
  }

  // Formatting utils
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const defaultRate = metrics.totalReceivables > 0 
    ? ((metrics.totalOverdue / metrics.totalReceivables) * 100).toFixed(1) 
    : '0.0';

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-obsidian">Inteligência Financeira</h1>
          <p className="text-muted-foreground text-sm max-w-lg">
            Acompanhe a saúde do seu caixa, volume de faturamento e taxas de recuperação (Últimos 6 meses).
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-border/80 rounded-lg text-sm font-medium text-obsidian hover:bg-muted/50 hover:border-indigo-200 transition-colors shadow-sm">
          <Download className="w-4 h-4 text-indigo-600" /> Exportar PDF
        </button>
      </div>

      {/* High Level KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        
        <Card className="premium-card relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento Bruto (6m)</CardTitle>
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
               <BarChart3 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-obsidian">{formatCurrency(metrics.totalReceivables)}</div>
          </CardContent>
        </Card>

        <Card className="premium-card relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Caixa Realizado (Recebido)</CardTitle>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
               <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-obsidian">{formatCurrency(metrics.totalPaid)}</div>
          </CardContent>
        </Card>

        <Card className="premium-card relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inadimplência Efetiva</CardTitle>
            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
               <AlertTriangle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold font-mono text-rose-600">{defaultRate}%</div>
              <span className="text-xs text-muted-foreground">({formatCurrency(metrics.totalOverdue)})</span>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Charts Grid */}
      <ReportsCharts 
        barData={metrics.monthlyCashflow} 
        pieData={metrics.statusDistribution} 
      />

    </div>
  )
}
