import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Users, 
  Activity, 
  ExternalLink,
  Sparkles,
  TrendingUp,
  CreditCard,
  BarChart3
} from "lucide-react"
import { getDashboardMetrics } from "@/actions/dashboard"

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val).replace('R$', '').trim();
}

export default async function Dashboard() {
  const metrics = await getDashboardMetrics();

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50/50 border border-border text-xs font-semibold text-indigo-700 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Visão Geral Diária
          </div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-obsidian">Previsibilidade e Caixa</h1>
          <p className="text-muted-foreground text-sm max-w-lg">
            Monitoramento em tempo real da saúde financeira, cobranças pendentes e taxa de inadimplência da sua operação.
          </p>
        </div>
        <Button variant="beam" className="gap-2 shadow-sm rounded-full px-6">
          <DollarSign className="w-4 h-4" /> Nova Cobrança
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <Card className="premium-card relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Receita Total (Mês)</CardTitle>
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-heading font-extrabold tracking-tight text-obsidian flex items-baseline gap-1">
              <span className="text-lg text-muted-foreground font-medium">R$</span>
              {formatCurrency(metrics.totalReceivables)}
            </div>
            <p className="text-xs font-medium mt-2 flex items-center text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-full border border-emerald-100">
              <ArrowUpRight className="h-3 w-3 mr-1" /> 
              +20.1% <span className="text-muted-foreground font-normal ml-1">vs. último mês</span>
            </p>
          </CardContent>
        </Card>

        {/* KPI 2 */}
        <Card className="premium-card group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">A Receber</CardTitle>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Activity className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-heading font-extrabold tracking-tight text-obsidian flex items-baseline gap-1">
              <span className="text-lg text-muted-foreground font-medium">R$</span>
              {formatCurrency(metrics.receivedAmount)}
            </div>
            <p className="text-xs font-medium mt-2 text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {metrics.counts.paid} boletos liquidados
            </p>
          </CardContent>
        </Card>

        {/* KPI 3 (Alert) */}
        <Card className="premium-card group relative overflow-hidden border-rose-100">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-transparent to-transparent opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-rose-700">Inadimplência</CardTitle>
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-heading font-extrabold tracking-tight text-rose-700 flex items-baseline gap-1">
              <span className="text-lg text-rose-500/80 font-medium">R$</span>
              {formatCurrency(metrics.pastDueAmount)}
            </div>
            <p className="text-[11px] font-bold mt-2 flex items-center text-rose-600 uppercase tracking-wider">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              Ação necessária ({metrics.counts.overdue} faturas)
            </p>
          </CardContent>
        </Card>

        {/* KPI 4 */}
        <Card className="premium-card group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Novos Clientes</CardTitle>
            <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-heading font-extrabold tracking-tight text-obsidian flex items-baseline gap-1">
              {metrics.defaultRate}<span className="text-xl text-muted-foreground font-medium">%</span>
            </div>
            <p className="text-xs font-medium mt-2 text-muted-foreground">
              Taxa de Default do Portfólio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Sections */}
      <div className="grid gap-6 lg:grid-cols-7">
        
        {/* Chart Section */}
        <Card className="premium-card lg:col-span-4 flex flex-col">
          <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Projeção de Entradas</CardTitle>
                <CardDescription className="text-xs mt-1">
                  Expectativa de liquidez para os próximos 14 dias (boletos pendentes vs pagos)
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="h-8">Detalhar</Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <div className="h-[320px] w-full flex flex-col items-center justify-center technical-grid py-12 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              <div className="w-16 h-16 rounded-2xl bg-white border border-border shadow-sm flex items-center justify-center mb-4 relative z-10">
                <BarChart3 className="w-6 h-6 text-indigo-300" />
              </div>
              <span className="text-muted-foreground text-sm font-semibold relative z-10">Agregando dados contábeis...</span>
              <p className="text-xs text-muted-foreground/60 mt-1">O Recharts será injetado aqui via Componente Reativo.</p>
            </div>
          </CardContent>
        </Card>

        {/* Collections List Section */}
        <Card className="premium-card lg:col-span-3 flex flex-col">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-500" /> Atividade Recente
                </CardTitle>
              </div>
              <Button variant="ghost" size="sm" className="h-8 text-xs text-indigo-600">Ver todas</Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <div className="divide-y divide-border">
              {[
                { cliente: "Tech Solutions Inc.", valor: "R$ 1.500,00", badge: "success", status: "Pago Hoje", time: "10:23 AM" },
                { cliente: "Agência Digital & Co", valor: "R$ 2.300,00", badge: "warning", status: "Vence Amanhã", time: "Ontem" },
                { cliente: "Loja do Centro LTDA", valor: "R$ 850,00", badge: "destructive", status: "Atrasado (5d)", time: "Há 2h" },
                { cliente: "Clínica Vida Saúde", valor: "R$ 3.200,00", badge: "success", status: "Pago (Pix)", time: "Há 4h" },
                { cliente: "Construtora Silva", valor: "R$ 12.000,00", badge: "indigo", status: "Nota Emitida", time: "Há 1d" },
              ].map((item, i) => (
                <div key={i} className="group flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer relative overflow-hidden">
                  <div className="relative z-10 space-y-1">
                    <p className="text-sm font-semibold text-obsidian group-hover:text-indigo-600 transition-colors">{item.cliente}</p>
                    <p className="text-xs text-muted-foreground font-mono">{item.time}</p>
                  </div>
                  <div className="relative z-10 flex flex-col items-end gap-1.5">
                    <span className="text-sm font-bold font-mono text-foreground tracking-tight">{item.valor}</span>
                    {/* @ts-ignore */}
                    <Badge variant={item.badge}>{item.status}</Badge>
                  </div>
                  {/* Subtle hover effect layer */}
                  <div className="shimmer-layer absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 z-0" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
