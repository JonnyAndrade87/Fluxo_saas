import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Clock, ShieldCheck, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoLogin from "../../assets/logo_dashboard.png";
import { LeadForm } from "@/components/landing/LeadForm";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f1115] text-white selection:bg-[#00D2C8] selection:text-[#0f1115] overflow-x-hidden relative flex flex-col">
      {/* Background Decorators */}
      <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-[#10b981]/15 via-[#0f1115]/50 to-transparent blur-3xl opacity-50 pointer-events-none" />

      {/* Header */}
      <header className="px-6 lg:px-12 py-5 flex items-center justify-between border-b border-white/5 bg-[#0f1115]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            {/* @ts-ignore */}
            <Image src={logoLogin} alt="Fluxeer" width={140} height={32} className="w-auto h-8 object-contain" />
          </Link>
        </div>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-medium">
              Entrar
            </Button>
          </Link>
          <a href="#demonstracao">
            <Button className="hidden sm:flex bg-[#00D2C8] hover:bg-[#00bda5] text-slate-900 font-semibold px-6 shadow-lg shadow-[#00D2C8]/20 transition-all hover:-translate-y-0.5">
              Solicitar demonstração
            </Button>
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="flex flex-col items-center text-center px-6 lg:px-12 pt-24 pb-20 lg:pt-32 lg:pb-28 max-w-5xl mx-auto relative z-10 w-full animate-in fade-in slide-in-from-bottom-8 duration-1000">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-bold uppercase tracking-widest mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            Elimine a Inadimplência
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
            Recebíveis no controle. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D2C8] to-[#10b981]">
              Caixa previsível.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-12">
            A complexidade das cobranças B2B drena a sua margem e rouba seu tempo. 
            No <strong>Fluxeer</strong>, unificamos faturas, automatizamos os follow-ups e trazemos a inteligência exata de quando o dinheiro entra na conta.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <a href="#demonstracao" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-[#00D2C8] hover:bg-[#00bda5] text-slate-900 font-bold px-8 h-14 text-base shadow-[0_0_40px_-10px_#00D2C8] transition-all hover:shadow-[0_0_60px_-15px_#00D2C8] hover:scale-105">
                Quero ver o Fluxeer funcionando
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </a>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-700 bg-transparent text-white hover:bg-slate-800 hover:text-white font-semibold h-14 px-8 transition-colors">
                Já sou cliente — Entrar
              </Button>
            </Link>
          </div>

          {/* Social Proof / Pillars */}
          <div className="mt-20 pt-10 border-t border-white/10 w-full grid grid-cols-1 sm:grid-cols-3 gap-8 text-left max-w-4xl mx-auto">
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#00D2C8]/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#00D2C8]" />
              </div>
              <h3 className="font-semibold text-lg">Menos Trabalho Manual</h3>
              <p className="text-slate-400 text-sm">Réguas nativas que disparam mensagens e cobranças sem depender de pessoas.</p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="font-semibold text-lg">Conciliação Automática</h3>
              <p className="text-slate-400 text-sm">Controle de aging e recebimentos provisionados sincronizados em tempo real.</p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-lg">Proteção de Margem</h3>
              <p className="text-slate-400 text-sm">Diminua o risco por atrasos constantes transformando faturas no alvo em saldo líquido.</p>
            </div>
          </div>

        </section>

        {/* Lead Capture Section */}
        <section id="demonstracao" className="py-24 bg-slate-900 border-t border-white/5 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#00D2C8]/50 to-transparent" />
          
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Assuma a liderança do seu caixa</h2>
            <p className="text-slate-400 mb-10 max-w-2xl mx-auto">
              Nossa equipe entrará em contato para entender a estrutura dos seus recebíveis e apresentar a melhor configuração no Fluxeer para o seu perfil comercial.
            </p>

            <LeadForm />
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6 lg:px-12 bg-[#0a0c0f] text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-slate-500 text-sm">© 2026 Fluxeer. Todos os direitos reservados.</p>
        <Link href="/login" className="text-slate-500 hover:text-white transition-colors text-sm font-medium">
          Acessar Painel de Cliente
        </Link>
      </footer>
    </div>
  );
}
