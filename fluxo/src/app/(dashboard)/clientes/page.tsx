import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Plus, Users, Building2, MoreHorizontal, Mail, Phone } from "lucide-react"
import { getCustomers } from "@/actions/customers"

export default async function ClientesPage() {
  const customers = await getCustomers();

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-obsidian">Clientes</h1>
          <p className="text-muted-foreground text-sm max-w-lg">
            Gestão da carteira de empresas, contatos financeiros e histórico de faturamento B2B.
          </p>
        </div>
        <Button variant="beam" className="gap-2 shadow-sm rounded-full px-6">
          <Plus className="w-4 h-4" /> Cadastrar Cliente
        </Button>
      </div>

      <Card className="premium-card">
        <CardHeader className="border-b border-border/50 bg-muted/10">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-500" /> Diretório Corporativo
          </CardTitle>
          <CardDescription className="text-xs">
            Visualize e gerencie os contatos de cobrança e o status da sua carteira.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="relative w-full sm:max-w-md group">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
              <Input type="search" placeholder="Buscar por Razão Social, CNPJ ou email..." className="pl-9 h-9" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2 h-9">
                <Filter className="w-4 h-4" /> Filtros
              </Button>
            </div>
          </div>
          
          <div className="rounded-xl border border-border/60 overflow-hidden bg-white shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#F8F9FA] text-muted-foreground text-xs uppercase tracking-wider font-semibold border-b border-border/60">
                <tr>
                  <th className="px-6 py-4">Empresa (Sacado)</th>
                  <th className="px-6 py-4">Contato Financeiro</th>
                  <th className="px-6 py-4 text-center">Faturas</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-obsidian">
                {customers.map((customer) => {
                  const contact = customer.financialContacts[0];
                  
                  return (
                    <tr key={customer.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-obsidian group-hover:text-indigo-600 transition-colors">
                          {customer.name}
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                          {customer.documentNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {contact ? (
                          <div className="space-y-1">
                            <div className="font-medium text-obsidian text-[13px] flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-muted-foreground" /> {contact.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-3">
                              <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {contact.email}</span>
                              {contact.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {contact.phone}</span>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Sem contato primário</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                          {customer._count.invoices}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant={customer.status === "active" ? "success" : "secondary"} 
                           className="px-2.5 py-1 whitespace-nowrap"
                        >
                          {customer.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
                
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      <Users className="w-8 h-8 mx-auto mb-3 opacity-20" />
                      <p>Nenhum cliente cadastrado.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
