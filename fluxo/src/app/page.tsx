'use client';

import { useState, useEffect, useRef, useMemo } from "react";

import Link from "next/link";
import Image from "next/image";
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  AlertTriangle, 
  PlayCircle, 
  BarChart3,
  LayoutList,
  Target,
  BarChart2
} from "lucide-react";
import logoLogin from "@/assets/logo_dashboard.png";
import { LeadForm } from "@/components/landing/LeadForm";
import { ParticlesBackground } from "@/components/ui/ParticlesBackground";
import { motion, useMotionValue, useTransform, useMotionValueEvent, useScroll, useSpring, AnimatePresence } from "framer-motion";

// ════════════════════════════════════════════════════════════════════════
// TIMELINE SECTION COMPONENT
// ════════════════════════════════════════════════════════════════════════
function TimelineSection() {
  const sectionRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const particles = useRef<any[]>([]);

  useEffect(() => {
    setMounted(true);
    if (particles.current.length === 0) {
      particles.current = [...Array(12)].map(() => ({
        x: Math.random() * 100 + "%",
        duration: 5 + Math.random() * 10,
        delay: Math.random() * 5
      }));
    }
  }, []);
  
  // Track continuous scroll progress for the central line
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 70%", "end 80%"]
  });

  // Track scroll progress for the final statement box tilt
  const { scrollYProgress: boxScroll } = useScroll({
    target: sectionRef,
    offset: ["start end", "end end"]
  });

  // Tilt transforms for the final card
  const rotateX = useTransform(boxScroll, [0.7, 1], [15, 0]);
  const rotateY = useTransform(boxScroll, [0.7, 1], [-8, 0]);
  const translateZ = useTransform(boxScroll, [0.7, 1], [-50, 0]);
  const boxScale = useTransform(boxScroll, [0.7, 1], [0.92, 1]);

  // Smooth line growth
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const timelineSteps = [
    {
      day: "D-3",
      title: "Ninguém age antes do vencimento",
      desc: "A fatura foi emitida, mas não existe acompanhamento estruturado. O time ainda está no escuro.",
      color: "bg-brand-green",
      glow: "shadow-[0_0_30px_rgba(0,176,179,0.4)]",
      metric: "Risco Latente: 12%"
    },
    {
      day: "D0",
      title: "O vencimento chega sem contexto",
      desc: "Quando a data vira, a cobrança começa sem critério claro, sem prioridade e sem visão completa da operação.",
      color: "bg-brand-green/80",
      glow: "shadow-[0_0_30px_rgba(0,176,179,0.3)]",
      metric: "Aging: 0 dias"
    },
    {
      day: "D+3",
      title: "A equipe reage no susto",
      desc: "Em vez de seguir uma régua, o time corre atrás do que grita mais alto. O processo vira improviso.",
      color: "bg-amber-400",
      glow: "shadow-[0_0_30px_rgba(251,191,36,0.4)]",
      metric: "Perda de Processo"
    },
    {
      day: "D+7",
      title: "O atraso cresce e a previsibilidade cai",
      desc: "Sem clareza sobre risco e andamento, o contas a receber perde consistência e o caixa começa a sentir.",
      color: "bg-orange-500",
      glow: "shadow-[0_0_30px_rgba(249,115,22,0.4)]",
      metric: "DSO ↑ 15%"
    },
    {
      day: "D+15",
      title: "O problema já não é só cobrança",
      desc: "Agora é retrabalho, pressão operacional e menos confiança no que realmente tende a entrar.",
      color: "bg-rose-500",
      glow: "shadow-[0_0_40px_rgba(244,63,94,0.5)]",
      metric: "Pressão de Caixa"
    }
  ];

  return (
    <section ref={sectionRef} className="relative bg-[#fcfcfd] py-32 lg:py-48 overflow-hidden" id="problema">
      {/* ── Visual Backdrop ── */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 grid-lines-light opacity-[0.4]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-green/[0.02] to-rose-500/[0.03]" />
        
        {/* Ambient numbers/titles in background for depth */}
        <div className="hidden lg:block absolute left-10 top-1/4 text-[12rem] font-manrope font-black text-black/[0.02] select-none tracking-tighter uppercase">OPERAÇÃO</div>
        <div className="hidden lg:block absolute right-10 top-2/3 text-[12rem] font-manrope font-black text-black/[0.02] select-none tracking-tighter uppercase">EROSÃO</div>
        
        {/* Immersive Noise Texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
        
        {/* Immersive Background Animation: Data Flow Points */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {mounted && particles.current.map((p, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-brand-green/20 rounded-full"
              initial={{ 
                x: p.x, 
                y: "100%", 
                opacity: 0 
              }}
              animate={{ 
                y: "-10%", 
                opacity: [0, 0.5, 0] 
              }}
              transition={{ 
                duration: p.duration, 
                repeat: Infinity, 
                delay: p.delay,
                ease: "linear"
              }}
            />
          ))}
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-40">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/10 border border-brand-green/20 text-[10px] font-mono font-bold text-brand-green tracking-[0.2em] uppercase mb-8"
          >
            <Clock className="w-3 h-3" />
            Vulnerabilidades da cobrança B2B
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-6xl lg:text-7xl font-manrope font-extrabold tracking-tight text-slate-950 mb-8 leading-[0.95]"
          >
            O problema não começa no atraso.<br />
            <span className="text-gray-300 italic font-medium">Começa antes.</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-xl text-slate-500 max-w-2xl mx-auto font-geist leading-relaxed"
          >
            A desorganização em faturas a vencer é o gatilho silencioso que corrói a saúde financeira da sua operação.
          </motion.p>
        </div>

        {/* ── Timeline Construction ── */}
        <div className="relative max-w-6xl mx-auto">
          
          {/* Active Axis Path */}
          <div className="absolute left-[30px] lg:left-1/2 top-0 bottom-0 w-[4px] bg-gray-100 lg:-translate-x-1/2 rounded-full overflow-hidden">
            <motion.div 
              style={{ scaleY, transformOrigin: "top" }}
              className="w-full h-full bg-gradient-to-b from-brand-green via-amber-400 to-rose-500"
            />
          </div>

          <div className="space-y-40 lg:space-y-64 relative">
            {timelineSteps.map((step, i) => (
              <motion.div 
                key={i}
                className={`flex flex-col lg:flex-row items-center w-full relative ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
              >
                {/* 1. Content Card Column */}
                <div className="w-full lg:w-[45%] z-20">
                   <motion.div
                     initial={{ opacity: 0, x: i % 2 === 0 ? -60 : 60, filter: "blur(10px)" }}
                     whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                     viewport={{ once: true, margin: "-150px" }}
                     transition={{ duration: 0.8, type: "spring", damping: 20 }}
                     className="bg-white p-10 lg:p-12 rounded-[3rem] border border-gray-100 shadow-[0_30px_100px_rgba(0,0,0,0.04)] hover:shadow-[0_40px_120px_rgba(0,0,0,0.08)] transition-all group relative overflow-hidden active-highlight"
                   >
                     {/* Horizontal Anchor Connector - Animated Drawing */}
                     <div className={`hidden lg:block absolute top-1/2 flex items-center ${i % 2 === 0 ? '-right-24' : '-left-24'} -translate-y-1/2`}>
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: 80 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.5, duration: 1, ease: "circOut" }}
                          className="h-[1px] bg-gradient-to-r from-gray-300 via-gray-200 to-transparent" 
                        />
                        <motion.div 
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          transition={{ delay: 1.2 }}
                          className={`w-1.5 h-1.5 rounded-full ${step.color} shadow-sm`}
                        />
                     </div>

                     <div className="relative z-10">
                       <span className="inline-block text-[10px] font-mono font-bold text-brand-green/60 uppercase tracking-widest mb-4">Fase de Deterioração</span>
                       <h3 className="text-2xl lg:text-3xl font-manrope font-extrabold text-slate-950 mb-4 tracking-tight group-hover:translate-x-1 transition-transform">
                         {step.title}
                       </h3>
                       <p className="text-base lg:text-lg text-slate-500 font-geist leading-relaxed">
                         {step.desc}
                       </p>
                     </div>
                     
                     {/* Subtle icon/metric backdrop inside card */}
                     <div className="absolute -right-4 -bottom-4 text-7xl font-black text-black/[0.02] italic">{step.day}</div>
                   </motion.div>
                </div>

                {/* 2. Visual Pivot (Marker) */}
                <div className="absolute left-[30px] lg:left-1/2 top-1/2 lg:top-1/2 -translate-y-1/2 -translate-x-[15px] lg:-translate-x-1/2 z-30">
                   <motion.div 
                     initial={{ scale: 0, rotate: -45 }}
                     whileInView={{ scale: 1, rotate: 0 }}
                     viewport={{ once: true, margin: "-150px" }}
                     className={`w-14 h-14 lg:w-16 lg:h-16 rounded-2xl border-4 border-white ${step.color} ${step.glow} flex items-center justify-center font-mono text-xs lg:text-sm font-black text-white shadow-xl animate-pulse-subtle`}
                   >
                     {step.day}
                   </motion.div>
                </div>

                {/* 3. Empty/Detail Column (Desktop) */}
                <div className="hidden lg:flex lg:w-[45%] justify-center items-center pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity">
                   <div className="flex flex-col items-center gap-2">
                      <div className="text-sm font-mono font-bold uppercase tracking-[0.3em] text-slate-400">{step.metric}</div>
                      <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Closing High-Impact Statement ── */}
        <div className="mt-64 relative" style={{ perspective: "2000px" }}>
          <div className="absolute inset-0 flex items-center justify-center -z-10">
             <div className="w-[80%] h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          </div>

          <motion.div 
            style={{ 
              rotateX, 
              rotateY, 
              scale: boxScale,
              transformStyle: "preserve-3d" 
            }}
            className="bg-slate-950 rounded-[4rem] p-12 lg:p-24 shadow-[0_50px_100px_rgba(0,0,0,0.3)] relative overflow-hidden group border border-white/5"
          >
            {/* Background elements for the closing card */}
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle at center, rgba(0, 176, 179, 0.4) 0%, transparent 70%)', transform: "translateZ(10px)" }} />
            
            <div className="flex flex-col lg:flex-row items-center gap-16 relative z-10" style={{ transform: "translateZ(30px)" }}>
              <div className="flex-1 text-center lg:text-left">
                <h4 className="text-4xl lg:text-6xl font-manrope font-extrabold text-white tracking-tighter leading-[0.95] mb-8">
                  Mais do que atrasos.<br />
                  <span className="text-brand-green">Perda de controle total.</span>
                </h4>
                <p className="text-lg text-white/40 max-md:mx-auto max-w-md">
                  Quando a régua de cobrança é reativa, o custo operacional consome o que deveria ser lucro líquido.
                </p>
              </div>
              
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="bg-white/[0.03] backdrop-blur-3xl rounded-[3rem] p-10 lg:p-12 border border-white/10 max-w-lg shadow-2xl relative"
              >
                <AlertTriangle className="absolute -top-6 -left-6 w-12 h-12 text-amber-500 blur-[2px]" />
                <p className="text-lg lg:text-2xl text-white font-medium font-geist leading-relaxed italic">
                  “O Fluxeer interrompe esse ciclo: automatizando a régua, ditando prioridades e devolvendo a previsibilidade para seu caixa.”
                </p>
                <div className="mt-8 h-[2px] w-12 bg-brand-green" />
              </motion.div>
            </div>
          </motion.div>

          {/* CTA Below Statement */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-20 flex flex-col items-center gap-6"
          >
            <p className="text-sm font-mono text-slate-400 uppercase tracking-widest">Resolva a causa raiz da inadimplência</p>
            <Link 
              href="#contact" 
              className="group relative px-10 py-5 bg-brand-green text-white font-manrope font-bold text-lg rounded-full overflow-hidden shadow-2xl transition-all hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <span className="relative flex items-center gap-3">
                Quero conhecer a automação
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════
// SOLUTION SECTION (FOLD 3) - REBUILT AS IMMERSIVE COMMAND CENTER
// ════════════════════════════════════════════════════════════════════════
function SolutionSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const chapters = [
    {
      id: 0,
      marker: "01",
      title: "Régua organizada",
      desc: "Estruture o acompanhamento da cobrança com mais consistência, menos improviso e mais controle sobre cada etapa.",
      evidence: "Menos esforço manual. Mais processo.",
      focus: "automation"
    },
    {
      id: 1,
      marker: "02",
      title: "Prioridades visíveis",
      desc: "Saiba com mais clareza quais clientes e faturas exigem ação primeiro, antes que o atraso cresça.",
      evidence: "Ação antes do problema virar pressão.",
      focus: "priorities"
    },
    {
      id: 2,
      marker: "03",
      title: "Caixa mais previsível",
      desc: "Tenha uma visão mais confiável do que tende a entrar e opere com mais segurança no dia a dia.",
      evidence: "Mais clareza para decidir melhor.",
      focus: "forecast"
    }
  ];

  return (
    <section className="relative bg-[#fcfcfd] py-32 lg:py-56 overflow-hidden" id="solucao">
      {/* ── Visual Backdrop Cinema ── */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* Subtle Radial Stage */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(0,176,179,0.04)_0%,transparent_60%)]" />
        
        {/* Technical Grid Enhancement */}
        <div className="absolute inset-0 grid-lines-light opacity-[0.4]" />
        
        {/* Ambient Decorative Accents */}
        <div className="absolute top-1/2 left-10 w-4 h-4 text-slate-200 opacity-40"><span className="font-mono text-xl">+</span></div>
        <div className="absolute top-1/4 right-20 w-4 h-4 text-slate-200 opacity-40"><span className="font-mono text-xl">+</span></div>
        <div className="absolute bottom-1/4 left-1/4 w-4 h-4 text-slate-200 opacity-40"><span className="font-mono text-xl">+</span></div>
        
        {/* Ambient Keywords */}
        <div className="absolute top-[20%] left-[5%] text-[8rem] font-manrope font-extrabold text-slate-900/[0.02] tracking-tighter select-none rotate-[-5deg]">MÉTODO</div>
        <div className="absolute bottom-[20%] right-[3%] text-[9rem] font-manrope font-extrabold text-slate-900/[0.02] tracking-tighter select-none rotate-[3deg]">LÓGICA</div>

        {/* Ambient Noise */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

        {/* Localized Floating Particles */}
        {mounted && [...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: "110%", x: Math.random() * 100 + "%", opacity: 0 }}
            animate={{ y: "-10%", opacity: [0, 0.4, 0] }}
            transition={{ duration: 15 + Math.random() * 10, repeat: Infinity, delay: i * 2 }}
            className="absolute w-px h-12 bg-gradient-to-t from-brand-green/20 to-transparent"
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header Block */}
        <div className="max-w-4xl mb-32 lg:mb-48">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/10 border border-brand-green/20 text-[10px] font-mono font-bold text-brand-green tracking-[0.2em] uppercase mb-8"
          >
            Quando o processo entra, o caos recua
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl lg:text-8xl font-manrope font-extrabold tracking-tight text-slate-950 mb-8 leading-[0.9] lg:-ml-1"
          >
            Sua cobrança volta a operar com <span className="text-brand-green/40">lógica.</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-500 max-w-2xl font-geist leading-relaxed"
          >
            O Fluxeer organiza recebíveis, mostra prioridades e traz mais previsibilidade para o caixa.
          </motion.p>
        </div>

        {/* ── IMMERSIVE GRID ── */}
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-32 relative">
          
          {/* Lado Esquerdo: Capítulos Narrativos com Trilho de Progresso */}
          <div className="lg:w-[45%] relative pl-12 lg:pl-16 space-y-32 lg:space-y-48 pb-12">
             {/* Progress Rail */}
             <div className="absolute left-4 top-4 bottom-4 w-px bg-slate-200">
                <motion.div 
                  className="absolute top-0 left-0 w-full bg-brand-green origin-top"
                  style={{ 
                    height: "100%",
                    scaleY: (activeStep + 1) / chapters.length,
                    transition: "scaleY 0.7s cubic-bezier(0.16, 1, 0.3, 1)"
                  }}
                />
             </div>

             {chapters.map((chap, i) => (
                <motion.div 
                  key={chap.id}
                  onViewportEnter={() => setActiveStep(i)}
                  viewport={{ margin: "-45% 0px -45% 0px" }}
                  className={`relative flex flex-col group transition-all duration-700 ${activeStep === i ? 'opacity-100 scale-100' : 'opacity-20 scale-95 blur-[0.5px]'}`}
                >
                  {/* Step Connector Point with Pulse */}
                  <div className={`absolute -left-[45px] top-4 w-3 h-3 rounded-full border-2 bg-white transition-all duration-500 flex items-center justify-center ${activeStep === i ? 'border-brand-green scale-125' : 'border-slate-200'}`}>
                     {activeStep === i && (
                       <motion.div 
                         initial={{ scale: 0 }}
                         animate={{ scale: [1, 2.5, 1] }}
                         transition={{ repeat: Infinity, duration: 2 }}
                         className="absolute inset-0 bg-brand-green/20 rounded-full"
                       />
                     )}
                     <div className={`w-1 h-1 rounded-full ${activeStep === i ? 'bg-brand-green' : 'bg-slate-200'}`} />
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                     <span className="text-[10px] font-mono font-bold text-brand-green tracking-widest uppercase bg-brand-green/10 px-2 py-0.5 rounded">Capítulo {chap.marker}</span>
                     <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">
                       {i === 0 ? "Estrutura" : i === 1 ? "Inteligência" : "Previsão"}
                     </span>
                  </div>

                  <h3 className="text-3xl lg:text-5xl font-manrope font-extrabold text-slate-950 mb-6 tracking-tighter">
                    {chap.title}
                  </h3>
                  
                  <p className="text-lg text-slate-500 font-geist leading-relaxed mb-6 max-w-sm">
                    {chap.desc}
                  </p>

                  <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm self-start px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                     <div className="w-1.5 h-1.5 rounded-full bg-brand-green shadow-[0_0_8px_rgba(0,176,179,0.5)]" />
                     <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">{chap.evidence}</span>
                  </div>
                </motion.div>
             ))}
          </div>

          {/* Lado Direito: Mockup Sticky Reativo */}
          <div className="lg:w-[55%] hidden lg:block">
             <div className="sticky top-24">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
                  whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                  className="perspective-2000 group/mockup"
                >
                   {/* "Interactive Stage" Background Glow */}
                   <div className="absolute -inset-20 bg-brand-green/[0.08] blur-[100px] rounded-full transition-all duration-1000" />
                   
                   {/* Main Chassis */}
                   <div className="bg-slate-900 rounded-[3rem] p-4 shadow-[0_60px_150px_rgba(0,0,0,0.15)] border border-white/10 relative overflow-hidden">
                      {/* Scanning Light Effect */}
                      <motion.div 
                        animate={{ y: ["-100%", "200%"] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                        className="absolute inset-0 w-full h-[100px] bg-gradient-to-b from-transparent via-brand-green/[0.05] to-transparent z-30 pointer-events-none"
                      />

                      <div className="bg-slate-950 rounded-[2.5rem] overflow-hidden border border-white/5 relative h-[580px]">
                         
                         {/* Dashboard Overlay Highlights */}
                         <AnimatePresence mode="wait">
                            <motion.div
                              key={activeStep}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 z-20 pointer-events-none"
                            >
                               {activeStep === 0 && (
                                  <div className="absolute inset-0 bg-brand-green/5 border-[6px] border-brand-green/20 rounded-[2.5rem] p-10 flex flex-col justify-end">
                                     <div className="bg-brand-green text-white text-[10px] font-bold px-3 py-1 rounded-full w-fit mb-4">Mapeando Automação...</div>
                                  </div>
                               )}
                               {activeStep === 1 && (
                                  <div className="absolute inset-0 bg-amber-400/5 border-[6px] border-amber-400/20 rounded-[2.5rem] p-10">
                                     <motion.div 
                                       animate={{ scale: [1, 1.02, 1] }}
                                       transition={{ repeat: Infinity, duration: 2 }}
                                       className="bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-bold px-3 py-1 rounded-full w-fit"
                                     >
                                       Sinalizando Prioridades
                                     </motion.div>
                                  </div>
                               )}
                               {activeStep === 2 && (
                                  <div className="absolute inset-0 bg-brand-green/5 border-[6px] border-brand-green/30 rounded-[2.5rem] p-10 flex items-center justify-center">
                                     <div className="text-center">
                                       <div className="text-brand-green text-xs font-mono mb-2">MODO PREVISIBILIDADE</div>
                                       <div className="h-0.5 w-16 bg-brand-green mx-auto" />
                                     </div>
                                  </div>
                               )}
                            </motion.div>
                         </AnimatePresence>

                         {/* Actual Product Visualization */}
                         <div className="p-10 flex flex-col h-full bg-grid-white/[0.02]">
                            {/* Top Stats */}
                            <div className={`grid grid-cols-2 gap-4 mb-8 transition-all duration-700 ${activeStep === 2 ? 'scale-105 opacity-100' : 'opacity-40 grayscale blur-[2px]'}`}>
                               <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                  <div className="text-[9px] font-mono text-white/40 uppercase mb-2">Recebíveis Previstos</div>
                                  <div className="text-xl font-bold text-white">R$ 1.250.000</div>
                               </div>
                               <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                  <div className="text-[9px] font-mono text-white/40 uppercase mb-2">Aging Médio</div>
                                  <div className="text-xl font-bold text-white">12 Dias <span className="text-brand-green text-[10px] font-normal">↓ 4d</span></div>
                               </div>
                            </div>

                            {/* Middle: Automation/List Section */}
                            <div className="flex-1 space-y-4">
                               <div className="flex justify-between items-center mb-4 px-2">
                                  <div className="text-[10px] font-mono text-white/40 uppercase">Fluxo de Cobrança / Prioridade</div>
                               </div>
                               
                               {[
                                 { name: "Global Logistics SA", status: "Automação D-3", risk: "LOW", active: activeStep === 0 },
                                 { name: "Vortex Retail Tech", status: "Crítico / Prioridade 1", risk: "HIGH", active: activeStep === 1 },
                                 { name: "Mainstream Tech", status: "Confirmado D0", status_color: "text-brand-green", active: false }
                               ].map((row, i) => (
                                 <motion.div 
                                   key={i} 
                                   animate={{ 
                                      scale: row.active ? 1.05 : 1, 
                                      x: row.active ? 10 : 0,
                                      opacity: row.active ? 1 : 0.3,
                                      filter: row.active ? "blur(0px)" : "blur(1px)"
                                   }}
                                   className={`p-5 rounded-2xl border transition-all duration-500 ${row.active ? 'bg-white/10 border-brand-green/30 shadow-2xl z-30 relative' : 'bg-white/5 border-white/5'}`}
                                 >
                                    <div className="flex justify-between items-center">
                                       <span className="text-sm font-semibold text-white">{row.name}</span>
                                       <span className="text-[9px] font-mono font-bold text-white/40">{row.status}</span>
                                    </div>
                                    {row.risk && (
                                      <div className={`mt-2 text-[9px] font-bold ${row.risk === 'HIGH' ? 'text-amber-400' : 'text-brand-green'} font-mono`}>RISCO: {row.risk}</div>
                                    )}
                                 </motion.div>
                               ))}
                            </div>

                            {/* Bottom Wave - Appears for Step 2 */}
                            <motion.div 
                               animate={{ 
                                  opacity: activeStep === 2 ? 1 : 0, 
                                  y: activeStep === 2 ? 0 : 20 
                               }}
                               className="mt-8 pt-8 border-t border-white/5"
                            >
                               <div className="h-10 w-full flex items-end gap-1 px-1">
                                  {[30, 45, 35, 60, 50, 80, 55, 90, 70, 100].map((h, i) => (
                                    <div key={i} className="flex-1 bg-brand-green/40 hover:bg-brand-green transition-all cursor-pointer rounded-t-sm" style={{ height: `${h}%` }} />
                                  ))}
                               </div>
                            </motion.div>
                         </div>
                      </div>
                   </div>

                   {/* Floating "Method" labels - Multi-context hotspots */}
                   <div className="absolute inset-0 pointer-events-none">
                      <motion.div 
                        animate={{ 
                           opacity: activeStep === 0 ? 1 : 0,
                           x: activeStep === 0 ? 0 : -20 
                        }}
                        className="absolute -left-12 top-[20%] bg-white p-4 rounded-xl shadow-xl border border-gray-100 z-30"
                      >
                          <div className="flex items-center gap-2 mb-1">
                             <div className="w-2 h-2 rounded-full bg-brand-green" />
                             <span className="text-[9px] font-mono font-bold text-slate-900">AUTO-RULE-ACTIVE</span>
                          </div>
                      </motion.div>

                      <motion.div 
                        animate={{ 
                           opacity: activeStep === 1 ? 1 : 0,
                           x: activeStep === 1 ? 0 : 20 
                        }}
                        className="absolute -right-8 top-[40%] bg-amber-400 text-white p-4 rounded-xl shadow-xl z-30"
                      >
                          <div className="flex items-center gap-2 mb-1">
                             <AlertTriangle className="w-3 h-3" />
                             <span className="text-[9px] font-mono font-bold">RISK-ALGORITHM-ON</span>
                          </div>
                      </motion.div>
                   </div>
                </motion.div>
             </div>
          </div>
        </div>

        {/* ── Closing Synthesis Panel: Precise REFINEMENT ── */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-32 max-w-[1280px] mx-auto relative px-6 md:px-0"
        >
           {/* Background cinematic glow */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-[radial-gradient(circle,rgba(0,176,179,0.03)_0%,transparent_70%)] pointer-events-none -z-10" />

           <div className="bg-[#fcfcfd] border border-slate-200/60 shadow-[0_30px_80px_rgba(0,0,0,0.02)] rounded-[40px] overflow-hidden p-0 relative">
              
              <div className="flex flex-col lg:grid lg:grid-cols-[68%_32%] items-stretch">
                 
                 {/* COLUNA ESQUERDA (68%) */}
                 <div className="p-8 lg:p-14 lg:border-r border-slate-100 flex flex-col justify-center">
                    <div className="mb-10">
                       {/* 1. Eyebrow */}
                       <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100/50 border border-slate-200 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] mb-8">
                         CONCLUSÃO OPERACIONAL
                       </div>
                       
                       {/* 2. Título */}
                       <h4 className="text-4xl lg:text-[4.5rem] font-manrope font-extrabold text-slate-950 tracking-tighter leading-[0.95] mb-8 max-w-2xl">
                         Do improviso ao <br />
                         <span className="text-brand-green">controle da operação.</span>
                       </h4>
                       
                       {/* 3. Subtítulo */}
                       <p className="text-lg lg:text-xl text-slate-500 font-geist leading-snug max-w-xl mb-12">
                         Com mais visibilidade, prioridade e método, a cobrança deixa de ser reação e volta a funcionar como processo.
                       </p>

                       {/* 4. Linha divisória */}
                       <div className="h-px w-full bg-slate-100 mb-12" />

                       {/* 5. Microblocos de síntese */}
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          {[
                            { title: "Régua organizada", sub: "Consistência operacional", icon: <CheckCircle2 className="w-4 h-4 text-brand-green" /> },
                            { title: "Prioridades claras", sub: "Ação estratégica", icon: <Target className="w-4 h-4 text-brand-green" /> },
                            { title: "Caixa previsível", sub: "Decisões seguras", icon: <BarChart2 className="w-4 h-4 text-brand-green" /> }
                          ].map((item, i) => (
                            <div key={i} className="flex flex-col gap-2">
                               <div className="flex items-center gap-2">
                                  {item.icon}
                                  <span className="text-sm font-manrope font-bold text-slate-900 leading-tight">{item.title}</span>
                               </div>
                               <p className="text-xs text-slate-400 font-mono pl-6 uppercase tracking-tight">{item.sub}</p>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* COLUNA DIREITA (32%) */}
                 <div className="bg-[#f5f5f5] p-8 lg:p-14 flex flex-col justify-center gap-10">
                    
                    <div className="space-y-8 flex flex-col items-center">
                       {/* 1. Microheadline */}
                       <p className="text-xs lg:text-[13px] font-mono font-bold text-slate-700 uppercase tracking-[0.1em] leading-tight text-center">
                         VEJA COMO O FLUXEER PODE<br />
                         ESTRUTURAR SEU CONTAS A RECEBER.
                       </p>

                       {/* 2. Chips */}
                       <div className="flex flex-wrap justify-center gap-2">
                          {["Demonstração guiada", "Resposta < 24h", "Sem compromisso"].map((chip, i) => (
                            <span key={i} className="text-[10px] font-mono font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-md whitespace-nowrap shadow-sm">
                              {chip}
                            </span>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-4">
                       {/* 3. CTA */}
                       <Link 
                         href="#contact" 
                         className="btn-shimmer bg-brand-green text-white px-8 py-4.5 lg:py-5 rounded-full font-manrope font-bold text-base shadow-[0_15px_40px_rgba(0,176,179,0.25)] hover:scale-105 active:scale-95 transition-all text-center w-full block h-fit"
                         style={{ paddingBlock: '1.1rem' }}
                       >
                         Quero Conhecer o Fluxeer
                       </Link>

                       {/* 4. Microcopy inferior */}
                       <p className="text-center text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                         Agenda aberta para esta semana
                       </p>
                    </div>
                    
                 </div>

              </div>
           </div>
        </motion.div>

      </div>
    </section>
  );
}

// Maps a pixel scroll value to 0-1 between two pixel thresholds
function mapRange(value: number, inMin: number, inMax: number): number {
  return Math.min(1, Math.max(0, (value - inMin) / (inMax - inMin)));
}

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Use window-level scroll for pixel-precise control
  const { scrollY } = useScroll();

  // Each element has its own start/end pixel scrollY for the fade
  // Hero is ~90vh tall; by ~600px scroll the last element should be gone
  // Cascade: top elements disappear first (lower px range)

  // MotionValues for each element (start at 1 = fully visible)
  const mvHeader = useMotionValue(1);
  const mvOp1 = useMotionValue(1);   // Eyebrow
  const mvOp2 = useMotionValue(1);   // Headline
  const mvOp3 = useMotionValue(1);   // Subheadline
  const mvOp4 = useMotionValue(1);   // List
  const mvOp5 = useMotionValue(1);   // CTA
  const mvMockup = useMotionValue(1);
  const mvBlur = useMotionValue(0);

  useMotionValueEvent(scrollY, "change", (y) => {
    // Stagger: each element starts fading at progressively higher scroll positions
    // All should be 0 by ~60% of hero height (viewport ~90vh → ~576px on 640px screen)
    // We target: fully faded by ~500px of scroll
    mvHeader.set(1 - mapRange(y, 0,   120));
    mvOp1.set(   1 - mapRange(y, 0,   180));
    mvOp2.set(   1 - mapRange(y, 30,  260));
    mvOp3.set(   1 - mapRange(y, 70,  330));
    mvOp4.set(   1 - mapRange(y, 110, 410));
    mvOp5.set(   1 - mapRange(y, 150, 480));
    mvMockup.set(1 - mapRange(y, 0,   550));
    mvBlur.set(  mapRange(y, 0, 500) * 20); // 0 to 20px blur
  });

  const blurHero = useTransform(mvBlur, v => `blur(${v}px)`);
  const scaleHero = useTransform(mvOp2, [1, 0], [1, 0.94]);
  const mockupBrightness = useTransform(mvMockup, [1, 0], [1, 2.5]);
  const mockupFilter = useTransform(
    [mvBlur, mockupBrightness],
    ([b, br]) => `blur(${Math.min(40, (b as number) * 2)}px) brightness(${br})`
  );

  return (
    <div className="bg-gray-50 text-gray-900 antialiased overflow-x-hidden" ref={containerRef}>

      {/* ══════════════════════ HERO (EDITORIAL & PREMIUM) ══════════════════════ */}
      <section 
        className="relative min-h-[90vh] overflow-hidden bg-slate-950 flex flex-col" 
        id="hero"
      >

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
        <motion.header 
          style={{ opacity: mvHeader }}
          className="relative z-[20] w-full pt-8 px-6 flex justify-center"
        >
          <nav className="bg-transparent py-2 flex items-center justify-between w-full max-w-7xl">
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
        </motion.header>

        {/* ── HERO BODY ── */}
        <div className="relative z-[10] flex-1 flex items-center pb-20">
          <div className="w-full max-w-7xl mx-auto px-6 py-12 md:py-0">

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

              {/* ── Left: Editorial Copy ── */}
              <div className="lg:col-span-5 flex flex-col text-center lg:text-left z-20">

                <motion.p 
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  style={{ opacity: mvOp1, filter: blurHero }}
                  className="self-center lg:self-start text-[10px] font-mono font-bold text-brand-green tracking-[0.25em] uppercase mb-6"
                >
                  Inteligência para cobrança B2B
                </motion.p>

                <motion.h1 
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  style={{ opacity: mvOp2, filter: blurHero, scale: scaleHero }}
                  className="font-manrope font-extrabold tracking-tight leading-[1.0] text-white mb-6 text-5xl sm:text-6xl lg:text-[4.5rem]"
                >
                  Controle o que entra.<br />
                  <span className="text-brand-green">Antecipe o que atrasa.</span>
                </motion.h1>

                <motion.p 
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  style={{ opacity: mvOp3, filter: blurHero }}
                  className="text-lg text-white/60 leading-relaxed mb-8 max-w-md mx-auto lg:mx-0 font-geist"
                >
                  O Fluxeer organiza seus recebíveis, mostra prioridades e dá mais previsibilidade para o seu caixa.
                </motion.p>
                
                {/* Micro-proofs */}
                <motion.ul 
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  style={{ opacity: mvOp4, filter: blurHero }}
                  className="mb-10 flex flex-col gap-3 text-left w-full max-w-md mx-auto lg:mx-0"
                >
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
                </motion.ul>

                <motion.div 
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  style={{ opacity: mvOp5, filter: blurHero }}
                  className="flex flex-col sm:flex-row items-center gap-4"
                >
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
                </motion.div>
              </div>

              {/* ── Right: Premium Product Mockup ── */}
              <motion.div 
                style={{ opacity: mvMockup, filter: mockupFilter }}
                className="lg:col-span-7 w-full relative perspective-normal mt-10 lg:mt-0 anim-float"
              >
                
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
              </motion.div>

            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ TIMELINE: A EROSÃO DA OPERAÇÃO ══════════════════════ */}
      <TimelineSection />




      <SolutionSection />

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
