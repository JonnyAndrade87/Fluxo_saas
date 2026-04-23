import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BarChart3, Bell, CheckCircle2, Clock, CreditCard, ShieldCheck, TrendingUp } from "lucide-react";
import logoLogin from "@/assets/logo_dashboard.png";
import { LeadForm } from "@/components/landing/LeadForm";
import { ParticlesBackground } from "@/components/ui/ParticlesBackground";

export default function LandingPage() {
  return (
    <div className="bg-gray-50 text-gray-900 antialiased overflow-x-hidden font-geist">
      {/* ═══════════════════════════════════════════════
          HERO SECTION (DARK THEME) + WHITE PARTICLES
      ════════════════════════════════════════════════ */}
      <section className="relative min-h-screen overflow-hidden bg-slate-950 flex flex-col rounded-b-[3rem] shadow-2xl z-20" id="hero">
        
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
        <div className="absolute inset-0 z-[1] pointer-events-none">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(16,185,129,0.15) 0%, transparent 100%)' }} />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent" />
        </div>

        {/* NAV (Dark style) */}
        <header className="relative z-[20] w-full pt-8 flex justify-center px-4">
          <nav className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-full py-2 px-4 flex items-center justify-between gap-3 animate-[fadeSlideIn_0.8s_ease-out_0.1s_both] w-full max-w-4xl">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 pr-4 sm:pr-8 border-r border-white/10 hover:opacity-80 transition-opacity">
              {/* @ts-ignore */}
              <Image src={logoLogin} alt="Fluxeer" width={120} height={28} className="w-auto h-7 object-contain" />
            </Link>
            
            <div className="hidden sm:flex items-center gap-1">
              <a className="text-xs font-semibold text-white/60 hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-white/5 font-geist" href="#solucao">Visão Geral</a>
            </div>

            <div className="flex items-center gap-2">
              <Link className="text-xs font-bold text-white/70 hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-white/5 font-geist" href="/login">Entrar</Link>
              <a className="ml-1 btn-shimmer btn-shimmer-dark inline-flex items-center gap-1.5 bg-white text-slate-950 text-xs font-bold px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-transform hover:scale-105" href="#contact-form">
                Solicitar demonstração
              </a>
            </div>
          </nav>
        </header>

        {/* Hero Content */}
        <main className="relative z-[10] flex-1 flex flex-col justify-center pb-20 pt-12 md:pt-0">
          <div className="max-w-7xl mx-auto px-6 md:px-8 w-full">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

              {/* Left: Headline (Premium & Sophisticated) */}
              <div className="lg:w-1/2 flex flex-col justify-center text-center lg:text-left">
                <div className="inline-flex self-center lg:self-start text-[11px] font-bold text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 rounded-full mb-8 py-2 px-4 gap-2 items-center animate-[fadeSlideIn_1s_ease-out_0.1s_both] font-mono tracking-widest uppercase">
                  Cobrança B2B com mais controle e menos improviso
                </div>

                <h1 className="text-5xl sm:text-6xl lg:text-[4.5rem] font-manrope font-extrabold tracking-tighter leading-[1.05] text-white mb-6 animate-[fadeSlideIn_1s_ease-out_0.2s_both]">
                  Pare de cobrar no improviso antes que isso continue <br className="hidden lg:block"/>drenando seu <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">caixa.</span>
                </h1>

                <p className="text-lg text-white/70 leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0 animate-[fadeSlideIn_1s_ease-out_0.3s_both] font-geist font-medium">
                  Quando a cobrança roda sem processo, o time reage tarde, perde eficiência e o caixa perde previsibilidade. O <strong className="text-white">Fluxeer</strong> organiza seus recebíveis, estrutura o acompanhamento e mostra com mais clareza onde agir primeiro.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 animate-[fadeSlideIn_1s_ease-out_0.4s_both]">
                  <a href="#contact-form" className="w-full sm:w-auto group btn-shimmer btn-shimmer-dark inline-flex items-center justify-center gap-3 bg-emerald-500 text-white text-base font-bold px-8 py-4 rounded-xl hover:bg-emerald-400 transition-colors shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-95">
                    <span>Quero ver o Fluxeer funcionando</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <Link href="/login" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent text-white/70 text-sm font-bold px-6 py-4 rounded-xl hover:text-white hover:bg-white/5 transition-colors active:scale-95">
                    Entrar
                  </Link>
                </div>
              </div>

              {/* Right: Premium Embedded Form */}
              <div className="lg:w-[45%] w-full max-w-md mx-auto relative perspective-normal" id="contact-form">
                {/* Clean, subtle background glow */}
                <div className="absolute inset-0 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
                
                <div className="relative transform rotate-y-[-5deg] rotate-x-[2deg] translate-z-[-20px] shadow-2xl animate-[float_6s_ease-in-out_infinite] [animation:fadeSlideIn_1s_ease-out_0.5s_both]">
                  <div className="absolute -inset-0.5 bg-gradient-to-b from-white/10 to-white/0 rounded-[2.6rem] blur-sm opacity-50" />
                  
                  {/* The LeadForm is fully embedded as a functional block of the Hero */}
                  <LeadForm />
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
              <p className="text-[11px] text-emerald-600 uppercase tracking-[0.2em] font-mono font-bold mb-4">01 — Inteligência Operacional</p>
              <h2 className="text-5xl md:text-6xl font-manrope font-extrabold tracking-tighter text-gray-900 leading-[0.95]">Controle Absoluto <br/>do Caixa</h2>
            </div>
            <div className="max-w-md border-l-2 border-emerald-500 pl-6">
              <p className="text-gray-600 leading-relaxed text-lg font-geist font-medium">Automação de ponta a ponta projetada para aumentar a eficiência financeira, diminuir a inadimplência passiva e blindar a sua margem.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-gray-200 rounded-[2rem] p-8 card-raise shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-6 shadow-inner">
                <Clock className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="font-manrope text-2xl font-bold text-gray-900 mb-3 tracking-tight">Fim do trabalho manual</h3>
              <p className="text-gray-500 font-geist text-base leading-relaxed">Réguas nativas disparam mensagens e cobranças sem depender de intervenção humana. Seu time foca em métricas, não em boletos atrasados.</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-[2rem] p-8 card-raise shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6 shadow-inner">
                <TrendingUp className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 className="font-manrope text-2xl font-bold text-gray-900 mb-3 tracking-tight">Conciliação nativa</h3>
              <p className="text-gray-500 font-geist text-base leading-relaxed">Controle de aging e recebimentos provisionados sincronizados em tempo real, fornecendo informações financeiras limpas para tomada de decisão.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-[2rem] p-8 card-raise shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl rounded-full" />
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-6 shadow-inner relative z-10">
                <ShieldCheck className="w-7 h-7 text-rose-600" />
              </div>
              <h3 className="font-manrope text-2xl font-bold text-gray-900 mb-3 tracking-tight relative z-10">Proteção de Margem</h3>
              <p className="text-gray-500 font-geist text-base leading-relaxed relative z-10">Diminua o risco de atrasos recorrentes transformando faturas alvo em saldo líquido direto e contínuo para a sua empresa.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-white/10 py-10 text-center flex flex-col md:flex-row items-center justify-between px-6 lg:px-12 z-20 relative">
        <p className="font-geist text-sm text-white/40">© 2026 Fluxeer. Todos os direitos reservados.</p>
        <div className="mt-4 md:mt-0 space-x-6">
           <Link href="/login" className="font-geist text-sm text-white/40 hover:text-white transition-colors font-medium">Acesso de Clientes</Link>
        </div>
      </footer>
    </div>
  );
}
