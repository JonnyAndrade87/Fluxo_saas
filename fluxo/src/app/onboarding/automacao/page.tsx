import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Smartphone, Check, PlayCircle, ToggleRight, MessageSquare } from "lucide-react"

export default function OnboardingAutomationPage() {
  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 w-full flex flex-col">
      
      {/* Stepper Header */}
      <div className="mb-8 w-full">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-border/60 -z-10" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-600 -z-10 transition-all duration-1000" style={{ width: '100%' }} />
          
           <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-[#FDFDFE]">
              ✓
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-700">Importar</span>
          </div>
          
           <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-[#FDFDFE]">
              ✓
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-700">Validar</span>
          </div>
          
          <div className="flex flex-col items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-indigo-600 text-white border border-transparent flex items-center justify-center font-bold text-sm ring-4 ring-[#FDFDFE]">
              3
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-700">Automação</span>
          </div>
        </div>
      </div>

      <div className="text-center mb-8 space-y-3">
        <h1 className="text-3xl font-heading font-extrabold tracking-tight text-obsidian">
          Coloque sua recuperação no Piloto Automático
        </h1>
        <p className="text-muted-foreground text-sm max-w-xl mx-auto">
          Preparado para ver o saldo entrar na conta? Sugerimos a <strong>Régua Padrão Ofensiva</strong> para o seu segmento de Serviços. Ative-a agora.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 mb-10 w-full">
        {/* Toggle List */}
        <div className="w-full md:w-1/2 space-y-4 pt-2">
          {/* Card 1 */}
          <div className="p-4 rounded-xl border-2 border-indigo-600 bg-indigo-50/30 flex items-start gap-3 relative shadow-sm">
            <div className="absolute top-4 right-4 text-indigo-600">
               <ToggleRight className="w-6 h-6" />
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
               <span className="text-xs font-bold">-3</span>
            </div>
            <div>
              <h4 className="font-bold text-obsidian text-sm">Lembrete Suave</h4>
              <p className="text-[11px] text-muted-foreground mt-1">Dispara 3 dias antes do vencimento com o PDF do título.</p>
              <div className="flex items-center gap-1.5 mt-2.5">
                 <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#25D366]/10 text-[#25D366] flex items-center gap-1 border border-[#25D366]/20"><MessageSquare className="w-2.5 h-2.5" /> WhatsApp</span>
              </div>
            </div>
          </div>
          
          {/* Card 2 */}
          <div className="p-4 rounded-xl border-2 border-indigo-600 bg-indigo-50/30 flex items-start gap-3 relative shadow-sm">
             <div className="absolute top-4 right-4 text-indigo-600">
               <ToggleRight className="w-6 h-6" />
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
               <span className="text-xs font-bold">D0</span>
            </div>
            <div>
              <h4 className="font-bold text-obsidian text-sm">Cobrança Frontal</h4>
              <p className="text-[11px] text-muted-foreground mt-1">Dispara exactly no dia do Vencimento às 09h da manhã.</p>
              <div className="flex items-center gap-1.5 mt-2.5">
                 <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#25D366]/10 text-[#25D366] flex items-center gap-1 border border-[#25D366]/20"><MessageSquare className="w-2.5 h-2.5" /> WhatsApp</span>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-4 rounded-xl border border-border/80 bg-white/50 flex items-start gap-3 relative opacity-60">
             <div className="absolute top-4 right-4 text-muted-foreground">
               <ToggleRight className="w-6 h-6 rotate-180" />
            </div>
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
               <span className="text-xs font-bold">+2</span>
            </div>
            <div>
              <h4 className="font-bold text-obsidian text-sm">Notificação de Atraso</h4>
              <p className="text-[11px] text-muted-foreground mt-1">Aciona 2 dias corridos após o atraso (Desativado).</p>
            </div>
          </div>
        </div>

        {/* iPhone Mockup Preview */}
        <div className="w-full md:w-1/2 flex justify-center items-center">
            <div className="w-[280px] h-[580px] rounded-[40px] border-[12px] border-obsidian bg-[#efeae2] shadow-2xl relative overflow-hidden ring-4 ring-black/5">
                <div className="absolute top-0 w-full h-6 bg-obsidian/10 flex justify-center rounded-b-xl backdrop-blur-md">
                   <div className="w-24 h-4 bg-obsidian rounded-b-xl absolute top-0" />
                </div>
                
                {/* Header App */}
                <div className="w-full h-16 bg-[#075e54] text-white flex items-end pb-3 px-4 font-bold text-sm">
                   Fluxo Bot (Financeiro)
                </div>

                {/* Messages Chat */}
                <div className="p-4 flex flex-col gap-3 pt-6 relative z-10">
                   
                   <div className="bg-white p-3 rounded-xl rounded-tl-sm shadow-sm max-w-[85%] text-[13px] leading-relaxed relative">
                     <span className="font-semibold text-xs block mb-1 text-slate-500">Lembrete Suave (D-3)</span>
                     Olá João da <strong>Agência Digital XYZ</strong> 👋<br/><br/>
                     Lembrando que sua fatura nº #4509 no valor de <strong>R$ 5.400,00</strong> da *Fluxo* vence dentro de 3 dias.<br/><br/>
                     Deseja o código Pix para adiantar o fluxo?
                     <div className="text-[10px] text-right text-muted-foreground mt-1">09:00</div>
                   </div>

                   <div className="bg-[#dcf8c6] self-end p-2.5 px-4 rounded-xl rounded-tr-sm shadow-sm max-w-[85%] text-[13px] relative mt-2">
                     Pode mandar o pix!
                     <div className="text-[10px] text-right text-emerald-700/60 mt-0.5">09:05 ✓✓</div>
                   </div>

                </div>

            </div>
        </div>
      </div>

      <div className="flex justify-center w-full mt-4">
        <Link href="/">
           <Button variant="beam" className="h-12 px-12 text-base">
             <PlayCircle className="w-5 h-5 mr-3" /> Blindar meu Caixa Agora
           </Button>
        </Link>
      </div>

    </div>
  )
}
