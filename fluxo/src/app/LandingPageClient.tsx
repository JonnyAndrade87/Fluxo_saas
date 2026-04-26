'use client';

import { useState, useRef } from "react";

import Link from "next/link";
import Image from "next/image";
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Target,
  BarChart2,
  Layers,
  LayoutDashboard
} from "lucide-react";
import logoLogin from "@/assets/logo_dashboard.png";
import logoFluxeer from "@/assets/logo_fluxeer.png";
import logoIcon from "@/assets/logo-icone2.png";
import { ProductScreenPreview } from '@/components/landing/ProductScreenPreview';
import { LeadFormSection } from "@/components/landing/LeadFormSection";
import { ParticlesBackground } from "@/components/ui/ParticlesBackground";
import { landingFaqs, moneyPages } from '@/content/landing';
import { motion, useMotionValue, useTransform, useMotionValueEvent, useScroll, useSpring, AnimatePresence } from "framer-motion";

// ════════════════════════════════════════════════════════════════════════
// TIMELINE SECTION COMPONENT
// ════════════════════════════════════════════════════════════════════════

const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
  e.preventDefault();
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

const timelineParticles = [
  { x: '8%', duration: 9, delay: 0 },
  { x: '14%', duration: 11, delay: 0.6 },
  { x: '22%', duration: 8, delay: 1.1 },
  { x: '30%', duration: 12, delay: 1.7 },
  { x: '39%', duration: 10, delay: 2.4 },
  { x: '47%', duration: 13, delay: 3.1 },
  { x: '56%', duration: 9, delay: 3.8 },
  { x: '65%', duration: 11, delay: 4.4 },
  { x: '73%', duration: 14, delay: 5.1 },
  { x: '81%', duration: 10, delay: 5.8 },
  { x: '89%', duration: 12, delay: 6.4 },
  { x: '95%', duration: 8, delay: 7.1 },
];

const solutionAmbientParticles = [
  { x: '10%', duration: 15, delay: 0 },
  { x: '22%', duration: 16, delay: 2 },
  { x: '34%', duration: 17, delay: 4 },
  { x: '46%', duration: 18, delay: 6 },
  { x: '58%', duration: 19, delay: 8 },
  { x: '70%', duration: 20, delay: 10 },
  { x: '82%', duration: 21, delay: 12 },
  { x: '94%', duration: 22, delay: 14 },
];

function TimelineSection() {
  const sectionRef = useRef(null);
  
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
      metric: "Risco sem monitoramento"
    },
    {
      day: "D0",
      title: "O vencimento chega sem contexto",
      desc: "Quando a data vira, a cobrança começa sem critério claro, sem prioridade e sem visão completa da operação.",
      color: "bg-brand-green/80",
      glow: "shadow-[0_0_30px_rgba(0,176,179,0.3)]",
      metric: "Aging sem leitura útil"
    },
    {
      day: "D+3",
      title: "A equipe reage no susto",
      desc: "Em vez de seguir uma régua, o time corre atrás do que grita mais alto. O processo vira improviso.",
      color: "bg-amber-400",
      glow: "shadow-[0_0_30px_rgba(251,191,36,0.4)]",
      metric: "Prioridade fora de ordem"
    },
    {
      day: "D+7",
      title: "O atraso cresce e a previsibilidade cai",
      desc: "Sem clareza sobre risco e andamento, o contas a receber perde consistência e o caixa começa a sentir.",
      color: "bg-orange-500",
      glow: "shadow-[0_0_30px_rgba(249,115,22,0.4)]",
      metric: "DSO em alta"
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
          {timelineParticles.map((p, i) => (
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
            Inteligência em régua de cobrança e contas a receber
          </motion.div>
          
          <h2 className="text-5xl lg:text-[4.5rem] font-manrope font-extrabold tracking-tight text-slate-950 mb-8 leading-[0.95]">
            O problema não começa no atraso.<br />
            <span className="text-gray-300 italic font-medium">Começa antes.</span>
          </h2>
          
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
              href="#demonstracao" 
              className="group relative px-10 py-5 bg-brand-green text-white font-manrope font-bold text-lg rounded-full overflow-hidden shadow-2xl transition-all hover:scale-105 active:scale-95"
              data-track-cta="true"
              data-section="problema"
              data-cta-label="quero conhecer a automacao"
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

  const chapters = [
    {
      id: 0,
      marker: "01",
      title: "Régua de cobrança organizada",
      desc: "Estruture o acompanhamento da cobrança com mais consistência, menos improviso e mais controle sobre cada etapa.",
      evidence: "Menos esforço manual. Mais processo.",
      focus: "automation",
      href: "/regua-de-cobranca"
    },
    {
      id: 1,
      marker: "02",
      title: "Prioridades visíveis",
      desc: "Saiba com mais clareza quais clientes e faturas exigem ação primeiro, antes que o atraso cresça.",
      evidence: "Ação antes do problema virar pressão.",
      focus: "priorities",
      href: "/contas-a-receber"
    },
    {
      id: 2,
      marker: "03",
      title: "Caixa mais previsível",
      desc: "Tenha uma visão mais confiável do que tende a entrar e opere com mais segurança no dia a dia.",
      evidence: "Mais clareza para decidir melhor.",
      focus: "forecast",
      href: "/previsibilidade-de-caixa"
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
        {solutionAmbientParticles.map((particle, i) => (
          <motion.div
            key={i}
            initial={{ y: "110%", x: particle.x, opacity: 0 }}
            animate={{ y: "-10%", opacity: [0, 0.4, 0] }}
            transition={{ duration: particle.duration, repeat: Infinity, delay: particle.delay }}
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
            className="text-5xl lg:text-[4.5rem] font-manrope font-extrabold tracking-tight text-slate-950 mb-8 leading-[0.95] lg:-ml-1"
          >
            Sua cobrança volta a operar com <span className="text-brand-green/40">lógica.</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 max-w-2xl font-geist leading-relaxed"
          >
            O Fluxeer é o software de cobrança B2B que organiza contas a receber, automatiza a régua de cobrança e traz mais previsibilidade para o caixa.
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

                  <div className="flex flex-col sm:flex-row items-center gap-6 mt-8">
                    <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                       <div className="w-1.5 h-1.5 rounded-full bg-brand-green shadow-[0_0_8px_rgba(0,176,179,0.5)]" />
                       <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">{chap.evidence}</span>
                    </div>
                    
                    <Link 
                      href={chap.href} 
                      className="text-xs font-bold text-brand-green flex items-center gap-2 hover:translate-x-1 transition-transform group/link"
                    >
                      Ver detalhes da solução
                      <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                    </Link>
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
                   <div className="absolute -inset-20 bg-brand-green/[0.08] blur-[100px] rounded-full transition-all duration-1000" />
                   <div className="relative rounded-[3rem] border border-slate-200/10 bg-white/5 p-4 shadow-[0_60px_150px_rgba(0,0,0,0.15)] backdrop-blur-sm">
                     <ProductScreenPreview variant={activeStep === 0 ? 'regua' : activeStep === 1 ? 'risco' : 'caixa'} />
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
                       <h4 className="text-5xl lg:text-[4.5rem] font-manrope font-extrabold text-slate-950 tracking-tighter leading-[0.95] mb-8 max-w-2xl">
                         Do improviso ao <br />
                         <span className="text-brand-green">controle da operação.</span>
                       </h4>
                       
                       {/* 3. Subtítulo */}
                       <p className="text-xl text-slate-500 font-geist leading-snug max-w-xl mb-12">
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
                       <p className="text-[10px] font-mono font-bold text-slate-700 uppercase tracking-[0.2em] leading-tight text-center">
                         VEJA COMO O FLUXEER PODE<br />
                         ESTRUTURAR SEU CONTAS A RECEBER.
                       </p>

                       {/* 2. Chips */}
                       <div className="flex flex-wrap justify-center gap-2">
                          {["Demonstração guiada", "Resposta &lt; 24h", "Sem compromisso"].map((chip, i) => (
                            <span key={i} className="text-[10px] font-mono font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-md whitespace-nowrap shadow-sm">
                              {chip}
                            </span>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-4">
                       {/* 3. CTA */}
                       <Link 
                         href="#demonstracao" 
                         className="btn-shimmer bg-brand-green text-white px-8 py-4.5 lg:py-5 rounded-full font-manrope font-bold text-base shadow-[0_15px_40px_rgba(0,176,179,0.25)] hover:scale-105 active:scale-95 transition-all text-center w-full block h-fit"
                         data-track-cta="true"
                         data-section="solucao"
                         data-cta-label="quero conhecer o fluxeer solucao"
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
    <div className="bg-gray-50 text-gray-900 antialiased" ref={containerRef}>

      {/* ══════════════════════ HERO (EDITORIAL & PREMIUM) ══════════════════════ */}
      <section 
        className="relative min-h-[90vh] overflow-hidden bg-slate-950 flex flex-col" 
        id="hero"
      >

        <ParticlesBackground />

        {/* Large Brand Watermark */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden">
          <Image 
            src={logoIcon} 
            alt="" 
            aria-hidden="true"
            className="w-[800px] h-[800px] grayscale brightness-200 rotate-[-15deg] translate-x-[20%] translate-y-[-10%]" 
          />
        </div>

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
              <Image src={logoLogin} alt="Fluxeer - Inteligência em Cobrança B2B" width={148} height={32} className="w-auto h-8 object-contain" />
            </Link>

            <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
              <a href="#problema" onClick={(e) => scrollTo(e, 'problema')} className="text-sm font-medium text-white/60 hover:text-white transition-colors">Desafio</a>
              <a href="#solucao" onClick={(e) => scrollTo(e, 'solucao')} className="text-sm font-medium text-white/60 hover:text-white transition-colors">Solução</a>
              <a href="#plataforma" onClick={(e) => scrollTo(e, 'plataforma')} className="text-sm font-medium text-white/60 hover:text-white transition-colors">Plataforma</a>
              <a href="#faq" onClick={(e) => scrollTo(e, 'faq')} className="text-sm font-medium text-white/60 hover:text-white transition-colors">FAQ</a>
            </div>

            <div className="flex items-center gap-4">
              <Link
                className="inline-flex items-center justify-center py-2 px-5 rounded-full bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-xl border border-white/10 text-white/70 hover:text-white text-sm font-medium transition-all shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
                href="/login"
              >
                Entrar
              </Link>
              <a
                className="btn-shimmer btn-shimmer-dark inline-flex items-center gap-2 bg-white/10 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-white/15 transition-colors border border-white/10 backdrop-blur-md"
                href="#demonstracao"
                onClick={(e) => scrollTo(e, 'demonstracao')}
                data-track-cta="true"
                data-section="hero"
                data-cta-label="solicitar demonstracao header"
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
                  Inteligência em cobrança B2B
                </motion.p>

                <motion.h1 
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  style={{ opacity: mvOp2, filter: blurHero, scale: scaleHero }}
                  className="font-manrope font-extrabold tracking-tight leading-[1.0] text-white mb-6 text-5xl lg:text-[4.5rem]"
                >
                  Software de cobrança B2B<br />
                  <span className="text-brand-green">para organizar o contas a receber.</span>
                </motion.h1>

                <motion.p 
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  style={{ opacity: mvOp3, filter: blurHero }}
                  className="text-xl text-white/75 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0 font-geist"
                >
                  O Fluxeer ajuda times financeiros B2B a organizar contas a receber, priorizar risco por cliente e agir antes do atraso pressionar o caixa.
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
                    href="#demonstracao"
                    className="w-full sm:w-auto group btn-shimmer btn-shimmer-dark inline-flex items-center justify-center gap-2 bg-brand-green text-slate-950 text-sm font-bold px-7 py-3.5 rounded-xl hover:bg-brand-green-hover transition-colors shadow-[0_0_24px_rgba(0,176,179,0.25)] active:scale-[0.98]"
                    data-track-cta="true"
                    data-section="hero"
                    data-cta-label="solicitar demonstracao"
                  >
                    Solicitar demonstração
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

              {/* ── Right: Real Product Preview ── */}
              <motion.div 
                style={{ opacity: mvMockup, filter: mockupFilter }}
                className="lg:col-span-7 w-full relative perspective-normal mt-10 lg:mt-0 anim-float"
              >
                <div className="relative w-full max-w-3xl mx-auto lg:ml-auto lg:mr-0">
                  <div className="absolute -inset-8 rounded-[2.5rem] bg-brand-green/15 blur-3xl" aria-hidden="true" />
                  <div className="relative rounded-[2.5rem] border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                    <ProductScreenPreview variant="overview" />
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

      <PlatformSection />

      <SpecializedSolutions />
      <FAQSection />

      <LeadFormSection />

      <Footer />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// SPECIALIZED SOLUTIONS SECTION
// ════════════════════════════════════════════════════════════════════════
function SpecializedSolutions() {
  return (
    <section className="py-24 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-xl">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/10 border border-brand-green/20 text-[10px] font-mono font-bold text-brand-green tracking-[0.2em] uppercase mb-6">
               Ecossistema Fluxeer
             </div>
             <h2 className="text-3xl lg:text-4xl font-manrope font-extrabold text-slate-950 mb-6 tracking-tight">
               Soluções desenhadas para <span className="text-brand-green">cada desafio.</span>
             </h2>
             <p className="text-lg text-slate-500 font-geist">
               Além do controle operacional, oferecemos infraestrutura técnica para cenários específicos de recebimento e gestão de recebíveis B2B.
             </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 w-full md:w-auto">
             {moneyPages.map(page => (
               <Link key={page.href} href={page.href} className="p-8 rounded-[2.5rem] border border-slate-200 hover:border-brand-green/30 hover:bg-brand-green/[0.02] transition-all group bg-slate-50/50">
                  <span className="block text-lg font-manrope font-bold text-slate-950 mb-2 group-hover:text-brand-green">{page.title}</span>
                  <span className="block text-sm text-slate-600 font-geist leading-relaxed">{page.description}</span>
                  <span className="inline-flex items-center gap-2 mt-6 text-xs font-bold text-brand-green opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver solução <ArrowRight className="w-3 h-3" />
                  </span>
               </Link>
             ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════
// FAQ SECTION — PREMIUM DARK BOX | OBJECTION REDUCTION
// ════════════════════════════════════════════════════════════════════════
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section
      className="relative pt-20 pb-24 lg:pt-24 lg:pb-32 overflow-hidden"
      id="faq"
      style={{ background: 'linear-gradient(160deg, #10141a 0%, #0d1117 60%, #0a0f14 100%)' }}
    >
      {/* Subtle internal glow top-right */}
      <div className="absolute top-0 right-0 w-[50%] h-[40%] opacity-[0.07] pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, rgba(0,176,179,1) 0%, transparent 70%)' }}
      />
      {/* Faint large typography watermark */}
      <div className="absolute bottom-0 right-8 text-[14rem] font-manrope font-black text-white/[0.015] select-none pointer-events-none leading-none tracking-tighter">
        FAQ
      </div>

      <div className="max-w-5xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="relative z-10">

            {/* ── HEADER ── */}
            <div className="text-center mb-14 lg:mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-green/25 bg-brand-green/10 text-[10px] font-mono font-bold text-brand-green tracking-[0.25em] uppercase mb-8">
                FAQ
              </div>
              <h2 className="text-4xl lg:text-[3.5rem] font-manrope font-extrabold tracking-tighter leading-[0.95] text-white mb-6">
                Ainda com dúvidas?<br />
                <span className="text-brand-green">A gente responde.</span>
              </h2>
              <p className="text-base lg:text-lg text-white/65 font-geist leading-relaxed max-w-2xl mx-auto">
                Entenda com mais clareza como o Fluxeer organiza a cobrança, melhora a visibilidade da operação e traz mais previsibilidade para o caixa.
              </p>
            </div>

            {/* ── ACCORDION ── */}
            <div className="space-y-2 mb-14 lg:mb-16">
              {landingFaqs.map((faq, i) => {
                const isOpen = openIndex === i;
                return (
                  <motion.div
                    key={i}
                    className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                      isOpen
                        ? 'border-brand-green/20 bg-white/[0.05]'
                        : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                    }`}
                  >
                    <button
                      onClick={() => toggle(i)}
                      className="w-full flex items-center justify-between gap-6 px-7 py-6 text-left group"
                      aria-expanded={isOpen}
                    >
                      <span className={`text-base lg:text-lg font-manrope font-bold leading-snug transition-colors duration-300 ${
                        isOpen ? 'text-white' : 'text-white/70 group-hover:text-white'
                      }`}>
                        {faq.question}
                      </span>
                      <motion.div
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className={`shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-colors duration-300 ${
                          isOpen
                            ? 'border-brand-green/40 bg-brand-green/10 text-brand-green'
                            : 'border-white/10 text-white/30 group-hover:border-white/20 group-hover:text-white/50'
                        }`}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="answer"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-7 pb-7">
                            <div className="h-px w-full bg-white/[0.06] mb-5" />
                            <p className="text-sm lg:text-base text-white/75 font-geist leading-relaxed max-w-2xl">
                              {faq.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* ── CLOSING MICROBLOCK ── */}
            <div className="border-t border-white/[0.06] pt-12 flex flex-col items-center text-center gap-8">
              <p className="text-sm lg:text-base text-white/65 font-geist leading-relaxed max-w-lg">
                Se a sua cobrança ainda depende de improviso, talvez esteja na hora de estruturar a operação.
              </p>
              <Link
                href="#demonstracao"
                className="group relative inline-flex items-center gap-3 bg-brand-green text-slate-950 px-8 py-4 rounded-full font-manrope font-bold text-sm lg:text-base shadow-[0_15px_35px_rgba(0,176,179,0.25)] hover:shadow-[0_20px_45px_rgba(0,176,179,0.35)] hover:-translate-y-0.5 active:scale-95 transition-all"
                data-track-cta="true"
                data-section="faq"
                data-cta-label="quero ver o fluxeer funcionando faq"
              >
                Quero ver o Fluxeer funcionando
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <p className="text-[11px] font-mono font-bold text-white/20 uppercase tracking-[0.3em]">
                Demonstração guiada, sem compromisso.
              </p>
            </div>

          </div>
        </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════
// PLATFORM SECTION (FOLD 4) - THE FINAL CONVERGENCE
// ════════════════════════════════════════════════════════════════════════
function PlatformSection() {
  const [activeTab, setActiveTab] = useState(0);

  const modules = [
    {
      id: 0,
      name: "Régua de cobrança",
      headline: "Acompanhe cada etapa com lógica.",
      text: "Defina o fluxo da cobrança com mais consistência, menos improviso e mais controle sobre cada ação.",
      evidences: ["Etapas organizadas", "Ações mais previsíveis", "Menos esforço manual"],
      icon: <Layers className="w-5 h-5" />
    },
    {
      id: 1,
      name: "Prioridades e risco",
      headline: "Saiba o que pede ação primeiro.",
      text: "Visualize clientes e faturas com mais clareza para agir antes que o atraso cresça e a operação perca controle.",
      evidences: ["Priorização por risco", "Faturas críticas em destaque", "Mais clareza para agir"],
      icon: <Target className="w-5 h-5" />
    },
    {
      id: 2,
      name: "Previsibilidade de caixa",
      headline: "Veja melhor o que tende a entrar.",
      text: "Acompanhe uma visão mais confiável dos recebimentos para operar com mais segurança e menos reação.",
      evidences: ["Projeção mais clara", "Recebimentos previstos", "Mais confiança operacional"],
      icon: <BarChart2 className="w-5 h-5" />
    },
    {
      id: 3,
      name: "Operação centralizada",
      headline: "Menos informação espalhada.",
      text: "Reúna contexto, histórico e acompanhamento em um só lugar para a cobrança deixar de depender de planilhas, memória e controles paralelos.",
      evidences: ["Histórico visível", "Operação centralizada", "Mais contexto por cliente"],
      icon: <LayoutDashboard className="w-5 h-5" />
    }
  ];

  return (
    <section
      className="relative pt-32 pb-40 overflow-hidden"
      id="plataforma"
      style={{
        backgroundColor: '#f3f4f6',
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.6) 2px, transparent 2px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.6) 2px, transparent 2px)
        `,
        backgroundSize: '40px 40px',
      }}
    >
      {/* ── Visual Backdrop Construction ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Ambient top-fade so it blends gracefully with the section above */}
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-[#f3f7f9] to-transparent" />
        {/* Subtle brand glow */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(0,176,179,0.05)_0%,transparent_50%)]" />
        
        {/* Animated Glass Orbs */}
        <motion.div 
          animate={{ 
            y: [0, -30, 0],
            x: [0, 20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[10%] -left-20 w-[600px] h-[600px] bg-brand-green/5 rounded-full blur-[120px] mix-blend-multiply" 
        />
        <motion.div 
          animate={{ 
            y: [0, 40, 0],
            x: [0, -30, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] -right-20 w-[500px] h-[500px] bg-brand-green/5 rounded-full blur-[100px] mix-blend-multiply" 
        />

        {/* Parallax Background Typography */}
        <motion.div 
          initial={{ opacity: 0, x: 100 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: "circOut" }}
          className="absolute top-[15%] right-[-5%] text-[15rem] font-manrope font-black text-slate-900/[0.015] select-none uppercase tracking-tighter vertical-text"
          style={{ writingMode: 'vertical-rl' }}
        >
          PLATAFORMA
        </motion.div>

        {/* Technical Micro-accents */}
        <div className="absolute top-1/4 left-10 text-slate-200 opacity-30 font-mono text-xl">+</div>
        <div className="absolute bottom-1/3 right-12 text-slate-200 opacity-20 font-mono text-4xl">/ / /</div>
        
        {/* Grain Overlay */}
        <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-14 relative z-10">
        
        {/* Header */}
        <div className="max-w-4xl mb-24 lg:mb-32 text-center md:text-left">
           <motion.div 
             initial={{ opacity: 0, x: -20 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             className="inline-flex items-center gap-2 mb-6"
           >
              <div className="w-2 h-2 rounded-full bg-brand-green" />
              <span className="text-[10px] font-mono font-bold text-brand-green uppercase tracking-[0.25em]">A plataforma</span>
           </motion.div>

           <h2 className="text-5xl lg:text-[4.5rem] font-manrope font-extrabold text-slate-950 tracking-tighter leading-[0.95] mb-10">
             Tudo o que sua cobrança precisa,<br />
             em uma operação só.
           </h2>
           
           <p className="text-xl text-slate-500 font-geist leading-relaxed max-w-2xl mx-auto md:mx-0">
             Do acompanhamento da régua à previsibilidade de caixa, o Fluxeer organiza a cobrança em um fluxo mais claro, mais visível e mais confiável.
           </p>
        </div>

        {/* Main Grid: Modules + Preview */}
        <div className="flex flex-col lg:grid lg:grid-cols-[400px_1fr] gap-16 lg:gap-24 items-start">
           
           {/* Sidebar Navigation */}
           <motion.div 
             initial={{ opacity: 0, x: -30 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             className="w-full space-y-4"
           >
              {modules.map((mod, i) => (
                <button
                  key={mod.id}
                  onClick={() => setActiveTab(i)}
                  className={`w-full text-left p-6 lg:p-8 rounded-[2rem] transition-all duration-500 relative overflow-hidden group ${activeTab === i ? 'bg-white shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100' : 'hover:bg-white/50 opacity-60 hover:opacity-100'}`}
                >
                  <div className="flex items-start gap-4 lg:gap-6">
                     <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${activeTab === i ? 'bg-brand-green text-white shadow-[0_10px_20px_rgba(0,176,179,0.3)]' : 'bg-slate-200/50 text-slate-400 group-hover:bg-slate-200'}`}>
                        {mod.icon}
                     </div>
                     <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[10px] font-mono font-bold text-slate-300">0{i+1}</span>
                          <h3 className="text-xl font-manrope font-extrabold text-slate-950 tracking-tight">
                            {mod.name}
                          </h3>
                        </div>
                        <p className={`text-sm lg:text-base font-geist leading-snug transition-all duration-500 ${activeTab === i ? 'text-slate-500' : 'text-slate-400 opacity-0 group-hover:opacity-100'}`}>
                          {mod.headline}
                        </p>
                        
                        {/* Expandable details for active mode */}
                        <AnimatePresence>
                          {activeTab === i && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <p className="mt-4 text-sm text-slate-400 font-geist leading-relaxed">
                                {mod.text}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-5">
                                {mod.evidences.map((ev, idx) => (
                                  <span key={idx} className="text-[10px] font-mono font-bold text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                                    {ev}
                                  </span>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                     </div>
                  </div>
                </button>
              ))}
           </motion.div>

           {/* Large Preview Panel */}
           <motion.div 
             initial={{ opacity: 0, y: 40, rotateX: 5 }}
             whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
             className="w-full relative h-[650px] lg:h-[750px] group/preview"
           >
               <div className="absolute inset-0 bg-brand-green/10 rounded-[3rem] blur-3xl opacity-0 transition-opacity duration-1000 group-hover/preview:opacity-20" />
               <div className="relative rounded-[3rem] border border-slate-200/60 bg-white/80 p-4 shadow-[0_40px_100px_rgba(0,0,0,0.04)] backdrop-blur-sm">
                  <AnimatePresence mode="wait">
                     <motion.div
                       key={activeTab}
                       initial={{ opacity: 0, y: 24 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: -24 }}
                       transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                     >
                        <ProductScreenPreview
                          variant={activeTab === 0 ? 'regua' : activeTab === 1 ? 'risco' : activeTab === 2 ? 'caixa' : 'operacao'}
                        />
                     </motion.div>
                  </AnimatePresence>
               </div>
            </motion.div>
         </div>
      </div>

      {/* ── FINAL CLOSING: DECISIVE CTA ── */}
      <div className="mt-0 relative overflow-hidden" style={{
        backgroundColor: '#f3f4f6',
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.6) 2px, transparent 2px), linear-gradient(90deg, rgba(255, 255, 255, 0.6) 2px, transparent 2px)`,
        backgroundSize: '40px 40px',
      }}>
        {/* Decorative background number */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20rem] font-manrope font-black text-black/[0.012] select-none pointer-events-none -z-10">04</div>

        <div className="max-w-[1280px] mx-auto px-6 lg:px-14 pt-24 pb-16 lg:pt-32 lg:pb-24 text-center relative z-10 border-t border-slate-200/60">
          <div className="max-w-5xl mx-auto space-y-16">
              <div className="space-y-8 flex flex-col items-center">
                 <h3 className="text-5xl lg:text-[4.5rem] font-manrope font-extrabold text-slate-950 tracking-tighter leading-[0.9] mb-10 max-w-4xl">
                   Mais clareza para cobrar.<br />
                   <span className="text-brand-green">Mais controle para decidir.</span>
                 </h3>
                 <p className="text-xl text-slate-500 font-geist leading-relaxed max-w-3xl mx-auto">
                   Quando a operação fica visível, a cobrança deixa de ser improviso e volta a funcionar como processo.
                 </p>
              </div>

              <div className="flex flex-col items-center gap-14">
                 <Link 
                    href="#demonstracao" 
                    className="relative bg-brand-green text-white px-10 py-5 lg:px-12 lg:py-6 rounded-full font-manrope font-bold text-lg lg:text-xl shadow-[0_20px_40px_rgba(0,176,179,0.2)] hover:shadow-[0_25px_50px_rgba(0,176,179,0.3)] hover:-translate-y-1 active:scale-95 transition-all text-center flex items-center gap-4 group"
                    data-track-cta="true"
                    data-section="plataforma"
                    data-cta-label="quero conhecer o fluxeer plataforma"
                  >
                   Quero conhecer o Fluxeer
                   <motion.div
                     animate={{ x: [0, 5, 0] }}
                     transition={{ repeat: Infinity, duration: 2 }}
                   >
                     <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6" />
                   </motion.div>
                 </Link>
                 
                 <div className="space-y-6 flex flex-col items-center text-center">
                    <p className="text-[11px] lg:text-[13px] font-mono font-bold text-slate-400 uppercase tracking-[0.4em]">
                      Veja a plataforma em uma demonstração guiada.
                    </p>
                    <div className="flex items-center justify-center gap-8 lg:gap-12 saturate-0 opacity-40">
                       <span className="text-[9px] lg:text-[11px] font-mono font-bold text-slate-500">SEGURANÇA LGPD</span>
                       <span className="text-[9px] lg:text-[11px] font-mono font-bold text-slate-500">INTEGRAÇÃO NATIVA</span>
                       <span className="text-[9px] lg:text-[11px] font-mono font-bold text-slate-500">SUPORTE DEDICADO</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>
  );
}

// ════════════════════════════════════════════════════════════════════════
// FOOTER: PRECISE PREMIUM
// ════════════════════════════════════════════════════════════════════════
function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#f3f7f9] border-t border-slate-200/60 py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -bottom-20 -right-20 p-20 opacity-[0.03] pointer-events-none grayscale">
        <Image src={logoIcon} alt="" aria-hidden="true" className="w-96 h-auto" />
      </div>

      <div className="max-w-[1280px] mx-auto px-6 lg:px-14 flex flex-col md:flex-row justify-between items-start md:items-center gap-16 relative z-10">
        <div className="space-y-6">
           <div className="flex items-center gap-3">
              <Image src={logoFluxeer} alt="Fluxeer" className="h-8 w-auto" />
           </div>
           <p className="text-sm text-slate-500 max-w-[280px] leading-relaxed">
              Inteligência e controle para operações de cobrança B2B que buscam previsibilidade real.
            </p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-16 lg:gap-24 w-full md:w-auto">
           <div className="space-y-6">
              <h5 className="text-[11px] font-mono font-bold text-slate-950 uppercase tracking-[0.2em]">Produto</h5>
              <div className="flex flex-col gap-4">
                <a href="#problema" onClick={(e) => scrollTo(e, 'problema')} className="text-sm text-slate-500 hover:text-brand-green transition-colors">Desafio</a>
                <a href="#solucao" onClick={(e) => scrollTo(e, 'solucao')} className="text-sm text-slate-500 hover:text-brand-green transition-colors">Solução</a>
                <a href="#plataforma" onClick={(e) => scrollTo(e, 'plataforma')} className="text-sm text-slate-500 hover:text-brand-green transition-colors">Plataforma</a>
                <a href="#faq" onClick={(e) => scrollTo(e, 'faq')} className="text-sm text-slate-500 hover:text-brand-green transition-colors">FAQ</a>
              </div>
           </div>
           <div className="space-y-6">
              <h5 className="text-[11px] font-mono font-bold text-slate-950 uppercase tracking-[0.2em]">Soluções</h5>
              <div className="flex flex-col gap-4">
                <Link href="/software-de-cobranca" className="text-sm text-slate-500 hover:text-brand-green transition-colors">Software de Cobrança</Link>
                <Link href="/regua-de-cobranca" className="text-sm text-slate-500 hover:text-brand-green transition-colors">Régua de Cobrança</Link>
                <Link href="/contas-a-receber" className="text-sm text-slate-500 hover:text-brand-green transition-colors">Contas a Receber</Link>
                <Link href="/previsibilidade-de-caixa" className="text-sm text-slate-500 hover:text-brand-green transition-colors">Previsibilidade de Caixa</Link>
                <Link href="/cobranca-b2b" className="text-sm text-slate-500 hover:text-brand-green transition-colors">Cobrança B2B</Link>
              </div>
           </div>
           <div className="space-y-6">
              <h5 className="text-[11px] font-mono font-bold text-slate-950 uppercase tracking-[0.2em]">Suporte</h5>
              <div className="flex flex-col gap-4">
                <Link href="/suporte" className="text-sm text-slate-500 hover:text-brand-green transition-colors">Suporte</Link>
                <Link href="/privacidade" className="text-sm text-slate-500 hover:text-brand-green transition-colors">Privacidade</Link>
                <Link href="/termos" className="text-sm text-slate-500 hover:text-brand-green transition-colors">Termos</Link>
                <Link href="/contato" className="text-sm text-slate-500 hover:text-brand-green transition-colors">Contato</Link>
              </div>
           </div>
        </div>
      </div>
      
      <div className="max-w-[1280px] mx-auto px-6 lg:px-14 mt-20 pt-8 border-t border-slate-200/40 flex justify-between items-center text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
         <span suppressHydrationWarning>© {currentYear} Fluxeer Systems</span>
         <span className="opacity-40">Desenvolvido por Studio Elephill.</span>
      </div>
    </footer>
  );
}
