import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Clock, ShieldCheck, TrendingUp, AlertTriangle, PlayCircle, BarChart3 } from "lucide-react";
import logoLogin from "@/assets/logo_dashboard.png";
import { LeadForm } from "@/components/landing/LeadForm";
import { ParticlesBackground } from "@/components/ui/ParticlesBackground";

export default function LandingPage() {
  return (
    <div className="bg-gray-50 text-gray-900 antialiased overflow-x-hidden">

      {/* ══════════════════════ HERO (EDITORIAL & PREMIUM) ══════════════════════ */}
      <section className="relative min-h-[90vh] overflow-hidden bg-slate-950 flex flex-col" id="hero">

        <ParticlesBackground />

        {/* Minimal ambient glow */}
        <div className="absolute inset-0 z-[1] pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(0, 176, 179, 0.4) 0%, transparent 70%)', filter: 'blur(100px)' }} />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent" />
        </div>

        {/* Subdued Grid lines */}
        <div className="pointer-events-none absolute inset-0 z-[2] grid-lines-dark overflow-hidden opacity-50">
          <div className="gl-v left-[20%]" />
          <div className="gl-v left-[50%]" />
          <div className="gl-v left-[80%]" />
        </div>

        {/* ── REFINED NAV ── */}
        <header className="relative z-[20] w-full pt-8 px-6 flex justify-center">
          <nav className="anim-fade-slide-0 bg-transparent py-2 flex items-center justify-between w-full max-w-7xl">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              {/* @ts-ignore */}
              <Image src={logoLogin} alt="Fluxeer" width={148} height={32} className="w-auto h-8 object-contain" />
            </Link>

            <div className="flex items-center gap-4">
              <Link
                className="inline-flex items-center justify-center py-2 px-5 rounded-full bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-xl border border-white/10 text-white/70 hover:text-white text-sm font-medium transition-all shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
                href="/login"
              >
                Entrar
              </Link>
              <a
                className="btn-shimmer btn-shimmer-dark inline-flex items-center gap-2 bg-white/10 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-white/15 transition-colors border border-white/10 backdrop-blur-md"
                href="#contact"
              >
                Solicitar demonstração
              </a>
            </div>
          </nav>
        </header>

        {/* ── HERO BODY ── */}
        <div className="relative z-[10] flex-1 flex items-center pb-20">
          <div className="w-full max-w-7xl mx-auto px-6 py-12 md:py-0">

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

              {/* ── Left: Editorial Copy ── */}
              <div className="lg:col-span-5 flex flex-col text-center lg:text-left z-20">

                <p className="anim-fade-slide-1 self-center lg:self-start text-[10px] font-mono font-bold text-brand-green tracking-[0.25em] uppercase mb-6">
                  Inteligência para cobrança B2B
                </p>

                <h1 className="anim-fade-slide-2 font-manrope font-extrabold tracking-tight leading-[1.0] text-white mb-6 text-5xl sm:text-6xl lg:text-[4.5rem]">
                  Controle o que entra.<br />
                  <span className="text-brand-green">Antecipe o que atrasa.</span>
                </h1>

                <p className="anim-fade-slide-3 text-lg text-white/60 leading-relaxed mb-8 max-w-md mx-auto lg:mx-0 font-geist">
                  O Fluxeer organiza seus recebíveis, mostra prioridades e dá mais previsibilidade para o seu caixa.
                </p>
                
                {/* Micro-proofs */}
                <ul className="anim-fade-up-4 mb-10 flex flex-col gap-3 text-left w-full max-w-md mx-auto lg:mx-0">
                  {[
                    "Prioridades de cobrança em tempo real",
                    "Visão de risco por cliente e fatura",
                    "Mais previsibilidade para o caixa"
                  ].map((text, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-white/90 font-semibold transform-gpu">
                      <div className="w-5 h-5 rounded-full bg-brand-green/20 flex items-center justify-center shrink-0 border border-brand-green/30">
                        <CheckCircle2 className="w-3 h-3 text-brand-green" />
                      </div>
                      {text}
                    </li>
                  ))}
                </ul>

                <div className="anim-fade-slide-5 flex flex-col sm:flex-row items-center gap-4">
                  <a
                    href="#contact"
                    className="w-full sm:w-auto group btn-shimmer btn-shimmer-dark inline-flex items-center justify-center gap-2 bg-brand-green text-slate-950 text-sm font-bold px-7 py-3.5 rounded-xl hover:bg-brand-green-hover transition-colors shadow-[0_0_24px_rgba(0,176,179,0.25)] active:scale-[0.98]"
                  >
                    Quero ver o Fluxeer funcionando
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                  <Link
                    href="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-xl border border-white/10 text-white/80 hover:text-white text-sm font-medium transition-all shadow-[0_4px_20px_rgba(0,0,0,0.1)] active:scale-[0.98]"
                  >
                    Entrar
                  </Link>
                </div>
              </div>

              {/* ── Right: Premium Product Mockup ── */}
              <div className="lg:col-span-7 w-full relative perspective-normal mt-10 lg:mt-0 anim-float">
                
                {/* Main Mockup Chassis */}
                <div className="relative w-full max-w-2xl mx-auto lg:ml-auto lg:mr-0 transform rotate-y-[-8deg] rotate-x-[4deg] translate-z-[-20px] transition-transform duration-700 hover:rotate-y-[-2deg] hover:rotate-x-[1deg]">
                  
                  {/* Outer edge glow */}
                  <div className="absolute -inset-[1px] bg-gradient-to-b from-white/20 to-transparent rounded-3xl" />
                  
                  {/* Chassis bg */}
                  <div className="relative bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    
                    {/* Fake App Header */}
                    <div className="h-12 border-b border-white/10 bg-white/5 flex items-center px-4 gap-2">
                       <div className="flex gap-1.5 flex-1">
                         <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                         <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                         <div className="w-2.5 h-2.5 rounded-full bg-brand-green/80" />
                       </div>
                       <div className="flex-1 flex justify-center">
                         <div className="w-32 h-4 bg-white/10 rounded-full" />
                       </div>
                       <div className="flex-1" />
                    </div>

                    {/* App Content */}
                    <div className="p-6">
                      <div className="flex justify-between items-end mb-6">
                        <div>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono mb-1">Previsão de Recebimento</p>
                          <h3 className="text-3xl font-manrope font-bold text-white tracking-tight">R$ 428.500</h3>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-brand-green font-mono py-1 px-2.5 bg-brand-green/10 rounded-md border border-brand-green/20">
                          <TrendingUp className="w-3 h-3" />
                          +14.2%
                        </div>
                      </div>

                      {/* Fake Chart graphic */}
                      <div className="h-32 w-full relative mb-6 rounded-xl overflow-hidden bg-slate-950/50 border border-white/5">
                        <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chart-grad1" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#00b0b3" stopOpacity="0.4"/>
                              <stop offset="100%" stopColor="#00b0b3" stopOpacity="0"/>
                            </linearGradient>
                            <linearGradient id="chart-grad2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3"/>
                              <stop offset="100%" stopColor="#818cf8" stopOpacity="0"/>
                            </linearGradient>
                          </defs>
                          {/* Background wave (gray/indigo) */}
                          <path d="M0,80 C50,70 100,90 150,60 C200,30 250,70 300,50 C350,30 400,60 400,60" fill="none" stroke="#818cf8" strokeOpacity="0.5" strokeWidth="2" style={{strokeDasharray: 800, animation: 'chart-draw 3s ease-out both'}} />
                          <path d="M0,80 C50,70 100,90 150,60 C200,30 250,70 300,50 C350,30 400,60 400,60 L400,100 L0,100 Z" fill="url(#chart-grad2)" />
                          {/* Primary wave (brand-green) */}
                          <path d="M0,60 C40,50 80,70 120,40 C160,10 200,50 250,30 C300,10 350,40 400,20" fill="none" stroke="#00b0b3" strokeWidth="3" style={{strokeDasharray: 800, animation: 'chart-draw 2s ease-out 0.2s both'}} />
                          <path d="M0,60 C40,50 80,70 120,40 C160,10 200,50 250,30 C300,10 350,40 400,20 L400,100 L0,100 Z" fill="url(#chart-grad1)" />
                        </svg>
                      </div>

                      {/* Fake table rows */}
                      <div className="space-y-3">
                        {[
                          { name: "Acme Corp", val: "R$ 45.000", badge: "Amanhã", col: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
                          { name: "Global Tech", val: "R$ 18.200", badge: "Hoje", col: "text-brand-green", bg: "bg-brand-green/10", border: "border-brand-green/20" },
                        ].map((r, i) => (
                           <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors">
                             <div className="flex flex-col">
                               <span className="text-sm text-white/90 font-medium">{r.name}</span>
                               <span className="text-xs text-white/40">{r.val}</span>
                             </div>
                             <div className={`text-[10px] px-2 py-1 rounded-md font-mono ${r.col} ${r.bg} ${r.border} border`}>
                               {r.badge}
                             </div>
                           </div>
                        ))}
                      </div>

                    </div>
                  </div>

                  {/* ── Overlay Insight 1: Ranking de Risco ── */}
                  <div className="absolute top-16 -right-6 lg:-right-12 w-48 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl anim-float" style={{ animationDelay: '1s' }}>
                    <div className="flex items-center gap-2 mb-2">
                       <AlertTriangle className="w-4 h-4 text-rose-400" />
                       <span className="text-[10px] font-mono text-white/60 uppercase tracking-wider">Alto Risco</span>
                    </div>
                    <p className="text-sm font-semibold text-white truncate">MegaStore SA</p>
                    <p className="text-xs text-rose-400 font-mono mt-1">PDD 85% • R$ 32k</p>
                  </div>

                  {/* ── Overlay Insight 2: Régua Ativa ── */}
                  <div className="absolute bottom-8 -left-6 lg:-left-12 w-56 bg-brand-green/10 backdrop-blur-xl border border-brand-green/20 rounded-2xl p-4 shadow-2xl anim-float-reverse" style={{ animationDelay: '0.5s' }}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                         <PlayCircle className="w-4 h-4 text-brand-green" />
                         <span className="text-[10px] font-mono text-brand-green uppercase tracking-wider opacity-80">Régua Ativa</span>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
                    </div>
                    <p className="text-sm font-medium text-white">Lembrete Vencimento</p>
                    <div className="mt-2 h-1 w-full bg-black/20 rounded-full overflow-hidden">
                      <div className="h-full w-[80%] bg-brand-green rounded-full" />
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ CAPTATION SECTION ══════════════════════ */}
      <section className="relative py-24 bg-slate-900 border-t border-white/5 overflow-hidden" id="contact">
        <div className="pointer-events-none absolute inset-0 z-[0] opacity-50" style={{ background: 'radial-gradient(ellipse at center, rgba(0, 176, 179, 0.05) 0%, transparent 60%)' }} />
        
        <div className="max-w-xl mx-auto px-6 relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-manrope font-extrabold text-white tracking-tight mb-3">
              Pronto para ter clareza financeira?
            </h2>
            <p className="text-sm text-white/50">
              Agende uma demonstração e veja como a nossa inteligência se adapta ao fluxo da sua empresa.
            </p>
          </div>
          <LeadForm />
        </div>
      </section>

      {/* ══════════════════════ SOLUTION (LIGHT) ══════════════════════ */}
      <section className="relative bg-gray-50 pt-24 pb-24 px-6 overflow-hidden" id="solucao">
        <div className="pointer-events-none absolute inset-0 grid-lines-light overflow-hidden z-0">
          <div className="gl-v left-[25%]" />
          <div className="gl-v left-[50%]" />
          <div className="gl-v left-[75%]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-start mb-16 gap-8">
            <div>
              <p className="text-[10px] text-brand-green uppercase tracking-[0.25em] font-mono font-bold mb-4">A Plataforma</p>
              <h2 className="text-4xl md:text-5xl font-manrope font-extrabold tracking-tighter text-gray-900 leading-[0.95]">
                Tudo o que você precisa<br />para cobrar melhor.
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Clock className="w-6 h-6 text-brand-green" />,
                bg: "bg-[#f0fffe] border-[#e0fffd]",
                title: "Fim do trabalho manual",
                desc: "Réguas nativas disparam mensagens e cobranças sem depender de intervenção humana."
              },
              {
                icon: <TrendingUp className="w-6 h-6 text-indigo-600" />,
                bg: "bg-indigo-50 border-indigo-100",
                title: "Conciliação nativa",
                desc: "Controle de aging e recebimentos provisionados sincronizados em tempo real."
              },
              {
                icon: <ShieldCheck className="w-6 h-6 text-slate-700" />,
                bg: "bg-slate-50 border-slate-200",
                title: "Proteção de margem",
                desc: "Diminua o risco de atrasos recorrentes transformando faturas alvo em saldo líquido."
              }
            ].map((item, i) => (
              <div key={i} className="bg-white border border-gray-150 rounded-2xl p-7 card-raise shadow-sm">
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-5 ${item.bg}`}>
                  {item.icon}
                </div>
                <h3 className="font-manrope text-lg font-bold text-gray-900 mb-2 tracking-tight">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ FOOTER ══════════════════════ */}
      <footer className="bg-slate-950 border-t border-white/5 py-8 flex flex-col md:flex-row items-center justify-between px-6 lg:px-12 gap-4">
        <p className="text-xs text-white/30 font-mono">© 2026 Fluxeer. Todos os direitos reservados.</p>
        <Link href="/login" className="text-xs text-white/30 hover:text-white/70 transition-colors font-medium">
          Acesso de Clientes
        </Link>
      </footer>
    </div>
  );
}
