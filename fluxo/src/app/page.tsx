import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BarChart3, Bell, CheckCircle2, Clock, CreditCard, ShieldCheck, TrendingUp } from "lucide-react";
import logoLogin from "../../assets/logo_dashboard.png";
import { LeadForm } from "@/components/landing/LeadForm";
import { ParticlesBackground } from "@/components/ui/ParticlesBackground";

export default function LandingPage() {
  return (
    <div className="bg-gray-50 text-gray-900 antialiased overflow-x-hidden font-geist">
      {/* ═══════════════════════════════════════════════
          HERO SECTION (DARK THEME) + WHITE PARTICLES
      ════════════════════════════════════════════════ */}
      <section className="relative min-h-[95vh] overflow-hidden bg-slate-950 flex flex-col rounded-b-[3rem] shadow-2xl z-20" id="hero">
        
        <ParticlesBackground />

        {/* Dark Grid Lines bg */}
        <div className="pointer-events-none absolute inset-0 z-[2] grid-lines-dark overflow-hidden">
          <div className="gl-v left-[12.5%]" />
          <div className="gl-v left-[25%]" />
          <div className="gl-v left-[37.5%]" />
          <div className="gl-v left-[50%] bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          <div className="gl-v left-[62.5%]" />
          <div className="gl-v left-[75%]" />
          <div className="gl-v left-[87.5%]" />
        </div>

        {/* Background Gradients for Premium Dark Look */}
        <div className="absolute inset-0 z-[1]">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(16,185,129,0.15) 0%, transparent 100%)' }} />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent" />
        </div>

        {/* NAV (Dark style) */}
        <header className="relative z-[20] w-full pt-8 flex justify-center">
          <nav className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-full py-2 px-4 flex items-center gap-3 animate-[fadeSlideIn_0.8s_ease-out_0.1s_both]">
            {/* Logo */}
            <div className="flex items-center gap-2 pr-3 border-r border-white/10">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="font-geist font-semibold text-sm text-white tracking-tight">Fluxeer</span>
            </div>
            
            <a className="text-xs font-medium text-white/50 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-white/5 font-geist" href="#solucao">A Solução</a>
            <a className="text-xs font-medium text-white/50 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-white/5 font-geist" href="#demonstracao">Demonstração</a>
            <Link className="text-xs font-medium text-white/50 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-white/5 font-geist" href="/login">Entrar</Link>
            
            <a className="ml-1 btn-shimmer btn-shimmer-dark inline-flex items-center gap-1.5 bg-white text-slate-950 text-xs font-semibold px-5 py-2 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)]" href="#demonstracao">
              Solicitar demonstração
            </a>
          </nav>
        </header>

        {/* Hero Content */}
        <main className="relative z-[10] flex-1 flex items-center pb-20">
          <div className="max-w-7xl mx-auto px-6 md:px-8 w-full pt-16 md:pt-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

              {/* Left: Headline */}
              <div className="lg:col-span-6 xl:col-span-5">
                <div className="inline-flex text-[11px] font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6 py-1.5 px-3 gap-2 items-center animate-[fadeSlideIn_1s_ease-out_0.1s_both] font-mono tracking-widest uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Elimine a Inadimplência
                </div>

                <h1 className="text-5xl md:text-6xl xl:text-7xl font-manrope font-medium tracking-tighter leading-[1.05] text-white mb-6 animate-[fadeSlideIn_1s_ease-out_0.2s_both]">
                  Recebíveis<br/>no controle. <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300 font-bold">Caixa previsível.</span>
                </h1>

                <p className="text-lg text-white/60 leading-relaxed mb-10 max-w-lg animate-[fadeSlideIn_1s_ease-out_0.3s_both] font-geist">
                  A complexidade das cobranças B2B drena a sua margem e rouba seu tempo. Unificamos faturas, automatizamos os follow-ups e trazemos a inteligência exata de quando o dinheiro entra na conta.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 animate-[fadeSlideIn_1s_ease-out_0.4s_both]">
                  <a href="#demonstracao" className="group btn-shimmer btn-shimmer-dark inline-flex items-center justify-center gap-2 bg-emerald-500 text-white text-sm font-semibold px-6 py-3.5 rounded-xl hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95">
                    <span>Quero ver o Fluxeer funcionando</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-white/5 text-white/80 text-sm font-medium px-6 py-3.5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors active:scale-95">
                    Já sou cliente — Entrar
                  </Link>
                </div>
              </div>

              {/* Right: Floating Dark/Light UI Mockups */}
              <div className="lg:col-span-6 xl:col-span-7 hidden lg:block relative h-[580px] perspective-normal">
                {/* Back layer modal (dark) */}
                <div className="absolute right-12 top-20 w-[350px] bg-slate-900/90 backdrop-blur-xl rounded-[2rem] border border-white/5 p-6 shadow-2xl transform rotate-y-[-10deg] rotate-x-[5deg] translate-z-[-50px] animate-[float-reverse_8s_ease-in-out_infinite] [animation:fadeSlideIn_1s_ease-out_0.4s_both]">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="h-2 w-24 bg-white/10 rounded-full" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-10 w-full bg-white/5 rounded-xl border border-white/5" />
                    <div className="h-10 w-full bg-white/5 rounded-xl border border-white/5" />
                    <div className="h-10 w-2/3 bg-indigo-500/20 rounded-xl border border-indigo-500/30 mt-4" />
                  </div>
                </div>

                {/* Main card: Light Dashboard Preview overlapping the dark hero */}
                <div className="absolute right-0 top-32 w-[400px] bg-white rounded-[2rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-gray-100 p-6 transform translate-z-[50px] animate-[float_6s_ease-in-out_infinite] [animation:fadeSlideIn_1s_ease-out_0.6s_both]">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono font-semibold mb-1">Caixa Presvisto</p>
                      <p className="text-4xl font-manrope font-semibold text-gray-900 tracking-tight">R$ 842.500,00</p>
                    </div>
                  </div>
                  
                  <div className="h-24 w-full relative mb-6">
                    <svg viewBox="0 0 300 60" className="w-full h-full" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      <path d="M0,50 L30,40 L60,45 L100,20 L150,30 L200,5 L250,15 L300,10" stroke="#10b981" strokeWidth="2" fill="none" style={{strokeDasharray: 600, animation: 'chart-draw 2s ease-out both'}} />
                      <path d="M0,50 L30,40 L60,45 L100,20 L150,30 L200,5 L250,15 L300,10 V60 H0 Z" fill="url(#chart-grad)" />
                    </svg>
                  </div>

                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-100 text-gray-500">
                          <CreditCard className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold font-geist text-gray-900">Fatura Paga</h4>
                          <p className="text-[11px] text-gray-400 font-mono">Hoje, 14:40</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold font-manrope text-emerald-600">+ R$ 2.400</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </section>

      {/* ═══════════════════════════════════════════════
          LIGHT MODE DASHBOARD BODY
      ════════════════════════════════════════════════ */}
      <section className="relative bg-transparent pt-32 pb-24 px-6 overflow-hidden" id="solucao">
        <div className="pointer-events-none absolute inset-0 grid-lines-light overflow-hidden z-0">
          <div className="gl-v left-[25%]" />
          <div className="gl-v left-[50%]" />
          <div className="gl-v left-[75%]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-start mb-16 gap-8">
            <div>
              <p className="text-[11px] text-emerald-600 uppercase tracking-[0.2em] font-mono font-semibold mb-3">01 — A Operação</p>
              <h2 className="text-5xl md:text-6xl font-manrope font-medium tracking-tighter text-gray-900 leading-[0.95]">Visão Geral <br/>da Solução</h2>
            </div>
            <div className="max-w-sm">
              <p className="text-gray-500 leading-relaxed text-base font-geist">Automação de ponta a ponta projetada para aumentar a eficiência financeira, diminuir a inadimplência e estabilizar sua margem.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white border border-gray-200 rounded-[2rem] p-8 card-raise shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-6">
                <Clock className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-manrope text-xl font-medium text-gray-900 mb-3">Menos Trabalho Manual</h3>
              <p className="text-gray-500 font-geist text-sm leading-relaxed">Réguas nativas que disparam mensagens e cobranças sem depender de pessoas. Foque no que realmente importa em seu negócio.</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-[2rem] p-8 card-raise shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-manrope text-xl font-medium text-gray-900 mb-3">Conciliação Automática</h3>
              <p className="text-gray-500 font-geist text-sm leading-relaxed">Controle de aging e recebimentos provisionados sincronizados em tempo real, fornecendo informações financeiras limpas e claras.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-[2rem] p-8 card-raise shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="font-manrope text-xl font-medium text-gray-900 mb-3">Proteção de Margem</h3>
              <p className="text-gray-500 font-geist text-sm leading-relaxed">Diminua o risco por atrasos constantes transformando faturas no alvo em saldo líquido direto e contínuo para sua empresa.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent w-full" />

      {/* ═══════════════════════════════════════════════
          CONVERSION SECTION (DARK HYBRID FORM)
      ════════════════════════════════════════════════ */}
      <section className="relative py-24 px-6 overflow-hidden bg-slate-950" id="demonstracao">
        <div className="pointer-events-none absolute inset-0 grid-lines-dark overflow-hidden z-0">
          <div className="gl-v left-[25%]" />
          <div className="gl-v left-[50%]" />
          <div className="gl-v left-[75%]" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center">
          <div className="text-center mb-12 max-w-2xl">
             <p className="text-[11px] text-emerald-400 uppercase tracking-[0.2em] font-mono font-semibold mb-3">02 — Conversão</p>
             <h2 className="text-4xl md:text-5xl font-manrope font-medium tracking-tighter text-white mb-4">Assuma a liderança do seu caixa</h2>
             <p className="text-white/60 font-geist leading-relaxed">
               Nossa equipe entrará em contato para entender a estrutura dos seus recebíveis e apresentar a melhor configuração no Fluxeer para o seu perfil comercial.
             </p>
          </div>

          <div className="w-full max-w-md">
            <LeadForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-white/10 py-10 text-center flex flex-col md:flex-row items-center justify-between px-6 lg:px-12">
        <p className="font-geist text-sm text-white/40">© 2026 Fluxeer. Todos os direitos reservados.</p>
        <div className="mt-4 md:mt-0 space-x-6">
           <Link href="/login" className="font-geist text-sm text-white/40 hover:text-white transition-colors">Entrar na Plataforma</Link>
        </div>
      </footer>
    </div>
  );
}
