import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoLogin from "../../assets/logo_dashboard.png";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f1115] text-white selection:bg-[#00D2C8] selection:text-[#0f1115] overflow-x-hidden relative">
      {/* Background Decorators */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-[#10b981]/10 to-transparent blur-3xl opacity-50" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="px-6 lg:px-12 py-6 flex items-center justify-between border-b border-white/5 bg-[#0f1115]/80 backdrop-blur-md sticky top-0">
          <div className="flex items-center">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              {/* @ts-ignore */}
              <Image src={logoLogin} alt="Fluxeer" width={140} height={32} className="w-auto h-8 object-contain" />
            </Link>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-white hover:text-[#00D2C8] hover:bg-white/5 transition-colors hidden sm:flex">
                Entrar na Conta
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-[#00D2C8] hover:bg-[#00bda5] text-slate-900 font-semibold px-6 shadow-lg shadow-[#00D2C8]/20 transition-all hover:-translate-y-0.5">
                Começar Agora
              </Button>
            </Link>
          </nav>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 lg:px-12 py-20 lg:py-32 text-center max-w-5xl mx-auto w-full">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00D2C8]/30 bg-[#00D2C8]/10 text-[#00D2C8] text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D2C8] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D2C8]"></span>
            </span>
            A Nova Geração de Gestão de Recebíveis
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150 fill-mode-both">
            Transformando Complexidade em <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D2C8] to-[#10b981]">
              Caixa Previsível.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
            O Fluxeer é a plataforma B2B premium projetada para unificar seus recebíveis, combater a inadimplência e automatizar fluxos de cobrança. Foco absoluto no crescimento da sua operação.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500 fill-mode-both w-full sm:w-auto">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-[#00D2C8] hover:bg-[#00bda5] text-slate-900 font-bold px-8 h-14 text-base shadow-[0_0_40px_-10px_#00D2C8] transition-all hover:shadow-[0_0_60px_-15px_#00D2C8] hover:scale-105">
                Entrar na Plataforma
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>

          {/* Social Proof / Features */}
          <div className="mt-20 pt-10 border-t border-white/5 w-full grid grid-cols-1 sm:grid-cols-3 gap-8 text-left animate-in fade-in duration-1000 delay-700 fill-mode-both">
            <div className="flex flex-col gap-2">
              <CheckCircle2 className="w-6 h-6 text-[#00D2C8]" />
              <h3 className="font-semibold text-lg">Automação Inteligente</h3>
              <p className="text-slate-400 text-sm">Dispare cobranças e notificações nativas para seus clientes sem esforço manual.</p>
            </div>
            <div className="flex flex-col gap-2">
              <CheckCircle2 className="w-6 h-6 text-[#00D2C8]" />
              <h3 className="font-semibold text-lg">Concialiação em Tempo Real</h3>
              <p className="text-slate-400 text-sm">Controle exato do cashflow projetado com baixas automáticas e painéis claros.</p>
            </div>
            <div className="flex flex-col gap-2">
              <CheckCircle2 className="w-6 h-6 text-[#00D2C8]" />
              <h3 className="font-semibold text-lg">Redução da Inadimplência</h3>
              <p className="text-slate-400 text-sm">Régua de cobranças desenhada para converter recebíveis vencidos em dinheiro no caixa.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
