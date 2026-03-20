import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Eye, ArrowRight, ShieldCheck } from "lucide-react"

export default function OnboardingMappingPage() {
  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 w-full flex flex-col">
      
      {/* Stepper Header */}
      <div className="mb-10 w-full">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-border/60 -z-10" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-600 -z-10 transition-all duration-1000" style={{ width: '50%' }} />
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-[#FDFDFE]">
              ✓
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-700">Importar</span>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white border border-transparent flex items-center justify-center font-bold text-sm ring-4 ring-[#FDFDFE]">
              2
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-700">Validar</span>
          </div>
          
          <div className="flex flex-col items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-white border border-border/80 text-muted-foreground flex items-center justify-center font-bold text-sm ring-4 ring-[#FDFDFE]">
              3
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Automação</span>
          </div>
        </div>
      </div>

      <div className="text-center mb-10 space-y-3">
        <h1 className="text-2xl font-heading font-extrabold tracking-tight text-obsidian">
          Processamento Concluído!
        </h1>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Encontramos <strong>142 títulos financeiros</strong>. Confirme de forma rápida se amarramos as colunas corretamente antes de injetar os dados no Fluxo.
        </p>
      </div>

      {/* Mapping Card */}
      <div className="rounded-2xl border border-indigo-100 bg-white shadow-xl shadow-indigo-50/50 mb-10 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
            <Eye className="w-4 h-4" /> Pré-visualização das 3 primeiras linhas
          </div>
          <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">
            <ShieldCheck className="w-3 h-3 mr-1" /> Dados Sensíveis Ocultos
          </Badge>
        </div>

        <table className="w-full text-sm text-left align-top">
          <thead className="bg-[#FAFAFB]">
            <tr>
              <th className="px-6 py-4 font-semibold text-obsidian border-b border-border/50">
                <div className="mb-2 text-xs text-muted-foreground">Entende-se como</div>
                <select className="w-full max-w-[150px] h-8 text-sm outline-none bg-white border border-border/80 rounded px-2 hover:border-indigo-400 focus:border-indigo-500 font-medium">
                  <option>Sacado (Empresa)</option>
                  <option>Valor em R$</option>
                  <option>Vencimento</option>
                </select>
              </th>
              <th className="px-6 py-4 font-semibold text-obsidian border-b border-border/50">
                 <div className="mb-2 text-xs text-muted-foreground">Entende-se como</div>
                <select className="w-full max-w-[150px] h-8 text-sm outline-none bg-white border border-border/80 rounded px-2 hover:border-indigo-400 focus:border-indigo-500 font-medium cursor-pointer">
                  <option>Vencimento</option>
                  <option>Emissão</option>
                  <option>Ignorar Coluna</option>
                </select>
              </th>
              <th className="px-6 py-4 font-semibold text-obsidian border-b border-border/50">
                 <div className="mb-2 text-xs text-muted-foreground">Entende-se como</div>
                <select className="w-full max-w-[150px] h-8 text-sm outline-none bg-white border border-border/80 rounded px-2 hover:border-indigo-400 focus:border-indigo-500 font-medium cursor-pointer">
                  <option>Valor (R$)</option>
                  <option>Juros Mensal Base</option>
                </select>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-muted-foreground bg-white">
            <tr className="hover:bg-indigo-50/20">
              <td className="px-6 py-4 font-medium text-obsidian">Agência Digital XYZ LTDA</td>
              <td className="px-6 py-4">15/04/2026</td>
              <td className="px-6 py-4 font-mono font-bold text-obsidian">R$ 5.400,00</td>
            </tr>
             <tr className="hover:bg-indigo-50/20">
              <td className="px-6 py-4 font-medium text-obsidian">Construtora Base Forte</td>
              <td className="px-6 py-4">20/04/2026</td>
              <td className="px-6 py-4 font-mono font-bold text-obsidian">R$ 12.000,00</td>
            </tr>
             <tr className="hover:bg-indigo-50/20">
              <td className="px-6 py-4 font-medium text-obsidian">Studio Alpha</td>
              <td className="px-6 py-4 text-rose-600 font-bold">10/01/2026</td>
              <td className="px-6 py-4 font-mono font-bold text-obsidian">R$ 800,00</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between w-full">
        <Link href="/onboarding/importar" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-obsidian font-medium transition-colors">
          Refazer Upload
        </Link>
        <Link href="/onboarding/automacao">
           <Button variant="beam" className="h-11 px-8">
             Confirmar & Avançar <ArrowRight className="w-4 h-4 ml-2" />
           </Button>
        </Link>
      </div>

    </div>
  )
}
import { Badge } from "@/components/ui/badge";
