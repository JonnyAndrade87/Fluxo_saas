import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CloudUpload, FileSpreadsheet, Download } from "lucide-react"

export default function OnboardingImportPage() {
  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 w-full flex flex-col">
      
      {/* Stepper Header */}
      <div className="mb-10 w-full">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-border/60 -z-10" />
          <div className="w-full absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-600 -z-10" style={{ width: '0%' }} />
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-[#FDFDFE]">
              1
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-700">Importar</span>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white border border-border/80 text-muted-foreground flex items-center justify-center font-bold text-sm ring-4 ring-[#FDFDFE]">
              2
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Validar</span>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white border border-border/80 text-muted-foreground flex items-center justify-center font-bold text-sm ring-4 ring-[#FDFDFE]">
              3
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Automação</span>
          </div>
        </div>
      </div>

      <div className="text-center mb-8 space-y-3">
        <h1 className="text-2xl font-heading font-extrabold tracking-tight text-obsidian">
          Alimente seu maquinário de cobrança
        </h1>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Deixe o Fluxo trabalhar por você. Suba a sua lista de clientes ou os títulos a receber pendentes que faremos a mágica.
        </p>
      </div>

      {/* Drag & Drop Zone */}
      <div className="w-full bg-white border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer group shadow-sm mb-6">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mb-6 group-hover:scale-110 transition-transform duration-300">
          <CloudUpload className="w-8 h-8" />
        </div>
        <h3 className="font-semibold text-obsidian text-lg mb-2">Arraste e solte sua planilha</h3>
        <p className="text-sm text-muted-foreground mb-6">Suportamos formados .CSV ou .XLSX de até 50MB.</p>
        <Button variant="outline" className="bg-white pointer-events-none">
          Procurar Arquivo
        </Button>
      </div>

      <div className="flex items-center justify-between w-full">
        <a href="#" className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
          <Download className="w-4 h-4" /> Baixar planilha modelo do Fluxo
        </a>
        
        <Link href="/onboarding/mapeamento">
           <Button variant="beam" className="h-10 px-6">
             Avançar Simulação
           </Button>
        </Link>
      </div>

    </div>
  )
}
