import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Plus, FileText, ArrowUpDown, MoreHorizontal } from "lucide-react"
import { getInvoices } from "@/actions/invoices"

export default async function CobrancasPage() {
  const invoices = await getInvoices();
  
  const formatDate = (date: Date) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  
  const getBadgeVariant = (status: string) => {
    switch(status) {
      case 'paid': return 'success';
      case 'overdue': return 'destructive';
      case 'pending': return 'warning';
      default: return 'indigo';
    }
  };

  const translateStatus = (status: string) => {
    switch(status) {
      case 'paid': return 'Pago';
      case 'overdue': return 'Atrasado';
      case 'pending': return 'Pendente';
      default: return status;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-obsidian">Cobranças</h1>
          <p className="text-muted-foreground text-sm max-w-lg">
            Gestão unificada de faturas, boletos e pix. Analise o status dos recebíveis em tempo real.
          </p>
        </div>
        <Button variant="beam" className="gap-2 shadow-sm rounded-full px-6">
          <Plus className="w-4 h-4" /> Nova Cobrança
        </Button>
      </div>

      <Card className="premium-card">
        <CardHeader className="border-b border-border/50 bg-muted/10">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" /> Registro Geral de Invoices
          </CardTitle>
          <CardDescription className="text-xs">
            Visualize, filtre e gerencie faturas emitidas da sua organização.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="relative w-full sm:max-w-md group">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
              <Input type="search" placeholder="Buscar por cliente, ID do documento ou valor..." className="pl-9 h-9" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2 h-9">
                <Filter className="w-4 h-4" /> Filtros Avançados
              </Button>
              <Button variant="outline" size="sm" className="gap-2 h-9 bg-muted/20">
                Exportar
              </Button>
            </div>
          </div>
          
          <div className="rounded-xl border border-border/60 overflow-hidden bg-white shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#F8F9FA] text-muted-foreground text-xs uppercase tracking-wider font-semibold border-b border-border/60">
                <tr>
                  <th className="px-6 py-4 cursor-pointer hover:text-obsidian transition-colors select-none">
                    <div className="flex items-center gap-1">Documento <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-obsidian transition-colors select-none">
                    <div className="flex items-center gap-1">Cliente <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 cursor-pointer hover:text-obsidian transition-colors select-none">
                    <div className="flex items-center justify-end gap-1">Valor <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="px-6 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-obsidian">
                {invoices.map((item, i) => (
                  <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold font-mono tracking-tight text-indigo-700">{item.invoiceNumber}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Criado em {formatDate(item.issueDate)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-obsidian group-hover:text-indigo-600 transition-colors">{item.customer.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Doc: {item.customer.documentNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getBadgeVariant(item.status) as any} className="px-2.5 py-1 whitespace-nowrap">
                        {translateStatus(item.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-bold font-mono text-obsidian text-right text-[15px]">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex items-center justify-between px-2 mt-4 text-xs text-muted-foreground">
            <span>Mostrando 6 de 123 registros</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-7 px-2" disabled>Anterior</Button>
              <Button variant="outline" size="sm" className="h-7 px-2">Próxima</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
