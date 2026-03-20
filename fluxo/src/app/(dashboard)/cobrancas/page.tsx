import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Plus, FileText, ArrowUpDown, MoreHorizontal } from "lucide-react"

export default function CobrancasPage() {
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
                {[
                  { id: "INV-2026-001", emitido: "10/Out/2026", cliente: "Tech Solutions Inc.", responsavel: "joao@techsolutions.com", valor: "R$ 1.500,00", badge: "success", status: "Pago Hoje" },
                  { id: "INV-2026-002", emitido: "08/Out/2026", cliente: "Agência Digital & Co", responsavel: "financeiro@agencia.com", valor: "R$ 2.300,00", badge: "warning", status: "Vence Amanhã" },
                  { id: "INV-2026-003", emitido: "01/Out/2026", cliente: "Loja do Centro LTDA", responsavel: "contato@lojadocentro.com.br", valor: "R$ 850,00", badge: "destructive", status: "Atrasado (5d)" },
                  { id: "INV-2026-004", emitido: "05/Out/2026", cliente: "Clínica Vida Saúde", responsavel: "adm@clinicavida.com", valor: "R$ 3.200,00", badge: "success", status: "Pago (Pix)" },
                  { id: "INV-2026-005", emitido: "15/Out/2026", cliente: "Construtora Silva", responsavel: "contas@silvaconstrutora.com", valor: "R$ 12.000,00", badge: "indigo", status: "Enviado" },
                  { id: "INV-2026-006", emitido: "16/Out/2026", cliente: "StartUp NovaEra", responsavel: "hello@novaera.app", valor: "R$ 4.500,00", badge: "indigo", status: "Processando" },
                ].map((item, i) => (
                  <tr key={i} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold font-mono tracking-tight text-indigo-700">{item.id}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Criado em {item.emitido}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-obsidian group-hover:text-indigo-600 transition-colors">{item.cliente}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.responsavel}</div>
                    </td>
                    <td className="px-6 py-4">
                      {/* @ts-ignore */}
                      <Badge variant={item.badge} className="px-2.5 py-1 whitespace-nowrap">
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-bold font-mono text-obsidian text-right text-[15px]">
                      {item.valor}
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
