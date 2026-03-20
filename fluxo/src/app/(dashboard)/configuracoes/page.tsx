import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Settings, 
  BellRing, 
  MessageSquare, 
  Mail, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Save,
  Zap
} from "lucide-react"

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-obsidian">Configurações</h1>
          <p className="text-muted-foreground text-sm max-w-lg">
            Defina a régua de cobrança automática e automatize a recuperação de crédito da sua operação.
          </p>
        </div>
        <Button variant="beam" className="gap-2 shadow-sm rounded-full px-6">
          <Save className="w-4 h-4" /> Salvar Alterações
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Settings Navigation */}
        <div className="lg:col-span-3 space-y-2">
          <nav className="flex flex-col gap-1">
            <a href="#" className="bg-indigo-50 text-indigo-700 font-semibold px-4 py-2.5 rounded-lg text-sm flex items-center gap-2">
              <BellRing className="w-4 h-4" /> Régua de Cobrança
            </a>
            <a href="#" className="text-muted-foreground hover:bg-muted/50 hover:text-obsidian font-medium px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors">
              <Settings className="w-4 h-4" /> Geral
            </a>
            <a href="#" className="text-muted-foreground hover:bg-muted/50 hover:text-obsidian font-medium px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors">
              <Zap className="w-4 h-4" /> Integrações (ERPs)
            </a>
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-9 space-y-6">
          <Card className="premium-card relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Automação de Lembretes</CardTitle>
              <CardDescription>
                Configure as mensagens que serão disparadas de forma automática baseada no vencimento das faturas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              
              {/* Event 1: Before Due Date */}
              <div className="p-5 rounded-xl border border-border/60 bg-[#FAFAFB] relative group hover:border-indigo-100 transition-colors">
                <div className="absolute -left-3 top-6 w-6 h-6 rounded-full bg-white border border-border flex items-center justify-center text-muted-foreground shadow-sm">
                  <Clock className="w-3 h-3" />
                </div>
                <div className="flex flex-col sm:flex-row gap-6 ml-4">
                  <div className="w-full sm:w-1/3 space-y-3">
                    <h4 className="font-semibold text-obsidian text-sm flex items-center gap-2">
                      Pré-Vencimento
                    </h4>
                    <p className="text-xs text-muted-foreground">Antecipe o recebimento lembrando seu cliente antes da data limite.</p>
                    
                    {/* Fake Toggle */}
                    <label className="flex items-center cursor-pointer mt-4">
                      <div className="relative">
                        <input type="checkbox" className="sr-only" defaultChecked />
                        <div className="block bg-indigo-500 w-10 h-6 rounded-full transition-colors"></div>
                        <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform translate-x-4"></div>
                      </div>
                      <div className="ml-3 text-xs font-semibold text-obsidian">
                        Ativado
                      </div>
                    </label>
                  </div>
                  
                  <div className="w-full sm:w-2/3 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-obsidian">Dias D- Menos</label>
                        <Input defaultValue="3" className="h-9 font-mono bg-white" type="number" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-obsidian">Horário de Disparo</label>
                        <Input defaultValue="09:00" className="h-9 font-mono bg-white" type="time" />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="gap-1 cursor-pointer bg-white text-indigo-700 border-indigo-200"><MessageSquare className="w-3 h-3" /> WhatsApp</Badge>
                      <Badge variant="outline" className="gap-1 cursor-pointer bg-white text-indigo-700 border-indigo-200"><Mail className="w-3 h-3" /> E-mail</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event 2: On Due Date */}
              <div className="p-5 rounded-xl border border-indigo-100 bg-indigo-50/30 relative group">
                <div className="absolute -left-3 top-6 w-6 h-6 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
                  <Zap className="w-3 h-3" />
                </div>
                <div className="flex flex-col sm:flex-row gap-6 ml-4">
                  <div className="w-full sm:w-1/3 space-y-3">
                    <h4 className="font-semibold text-indigo-900 text-sm flex items-center gap-2">
                      No Vencimento
                    </h4>
                    <p className="text-xs text-indigo-800/70">Aviso incisivo disparado exatamente na data do vencimento do título (Dia 0).</p>
                    
                    <label className="flex items-center cursor-pointer mt-4">
                      <div className="relative">
                        <input type="checkbox" className="sr-only" defaultChecked />
                        <div className="block bg-indigo-500 w-10 h-6 rounded-full transition-colors"></div>
                        <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform translate-x-4"></div>
                      </div>
                      <div className="ml-3 text-xs font-semibold text-indigo-900">
                        Ativado
                      </div>
                    </label>
                  </div>
                  
                  <div className="w-full sm:w-2/3 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-xs font-semibold text-indigo-900">Horário de Disparo</label>
                        <Input defaultValue="08:30" className="h-9 font-mono bg-white border-indigo-200" type="time" />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="gap-1 cursor-pointer bg-indigo-500 text-white border-transparent"><MessageSquare className="w-3 h-3" /> WhatsApp</Badge>
                      <Badge variant="outline" className="gap-1 cursor-pointer bg-white text-indigo-700 border-indigo-200 shadow-sm"><Mail className="w-3 h-3" /> E-mail</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event 3: After Due Date */}
              <div className="p-5 rounded-xl border border-rose-100 bg-rose-50/30 relative group">
                <div className="absolute -left-3 top-6 w-6 h-6 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm">
                  <AlertTriangle className="w-3 h-3" />
                </div>
                <div className="flex flex-col sm:flex-row gap-6 ml-4">
                  <div className="w-full sm:w-1/3 space-y-3">
                    <h4 className="font-semibold text-rose-900 text-sm flex items-center gap-2">
                      Pós-Vencimento (Atraso)
                    </h4>
                    <p className="text-xs text-rose-800/70">Disparo diário ou cíclico exigindo o pagamento e oferecendo código Pix atualizado.</p>
                    
                    <label className="flex items-center cursor-pointer mt-4">
                      <div className="relative">
                        <input type="checkbox" className="sr-only" defaultChecked />
                        <div className="block bg-rose-500 w-10 h-6 rounded-full transition-colors"></div>
                        <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform translate-x-4"></div>
                      </div>
                      <div className="ml-3 text-xs font-semibold text-rose-900">
                        Ativado
                      </div>
                    </label>
                  </div>
                  
                  <div className="w-full sm:w-2/3 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-rose-900">Dias D+ Atraso</label>
                        <Input defaultValue="1, 3, 5, 15" className="h-9 font-mono bg-white border-rose-200" type="text" />
                        <span className="text-[10px] text-rose-700/60 block mt-1">Separe os dias por vírgulas.</span>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-rose-900">Horário</label>
                        <Input defaultValue="10:00" className="h-9 font-mono bg-white border-rose-200" type="time" />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                       <Badge variant="outline" className="gap-1 cursor-pointer bg-rose-600 text-white border-transparent"><MessageSquare className="w-3 h-3" /> WhatsApp (Alta Prioridade)</Badge>
                    </div>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
