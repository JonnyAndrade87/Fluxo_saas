"use client";

import { useState } from "react";
import { ArrowRight, TrendingUp, ShieldCheck, Zap, BarChart3 } from "lucide-react";

export function AdvantagesSlider() {
  const advantages = [
    {
      title: "Recebíveis em Tempo Real",
      desc: "Monitore o caixa cruzando pagamentos com zero conciliação manual.",
      icon: <TrendingUp className="w-5 h-5 text-emerald-400 relative z-10" />,
      color: "from-emerald-500/20",
    },
    {
      title: "Automação Inteligente",
      desc: "Rotinas automáticas de cobrança via E-mail e WhatsApp sem esforço.",
      icon: <Zap className="w-5 h-5 text-emerald-400 relative z-10" />,
      color: "from-emerald-500/20",
    },
    {
      title: "Segurança de Dados",
      desc: "Informações protegidas para garantir a integridade da sua operação.",
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400 relative z-10" />,
      color: "from-emerald-500/20",
    },
    {
      title: "Inteligência Financeira",
      desc: "Relatórios preditivos focados no crescimento e saúde do seu negócio.",
      icon: <BarChart3 className="w-5 h-5 text-emerald-400 relative z-10" />,
      color: "from-emerald-500/20",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % advantages.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + advantages.length) % advantages.length);
  };

  const current = advantages[currentIndex];

  return (
    <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl p-3 md:p-4 pr-5 flex items-center justify-between gap-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] w-full max-w-[420px] relative overflow-hidden transition-all hover:bg-white/[0.06]">
      {/* subtle reflection */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none opacity-50" />
      
      <div className="flex items-center gap-4 relative z-10 w-full min-w-0">
        {/* Widget Card Icon Area */}
        <div className="w-[3.25rem] h-[3.75rem] rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center shrink-0 shadow-inner overflow-hidden relative transition-colors duration-500">
          <div className={`absolute inset-0 bg-gradient-to-tr ${current.color} to-transparent transition-colors duration-500`} />
          <div key={`icon-${currentIndex}`} className="animate-in zoom-in fade-in duration-300">
            {current.icon}
          </div>
        </div>
        {/* Text */}
        <div className="flex flex-col justify-center min-w-0 flex-1 h-[4.5rem]">
          <div className="text-[9px] md:text-[10px] font-semibold tracking-widest text-emerald-400 uppercase mb-1 font-mono drop-shadow-sm truncate">
            Vantagens do SaaS
          </div>
          <div key={`title-${currentIndex}`} className="text-[13px] md:text-sm font-medium text-white mb-0.5 animate-in slide-in-from-bottom-2 fade-in duration-300 truncate">
            {current.title}
          </div>
          <div key={`desc-${currentIndex}`} className="text-[11px] md:text-[12px] text-gray-400 leading-snug line-clamp-2 pr-2 animate-in slide-in-from-bottom-2 fade-in duration-300 delay-75">
            {current.desc}
          </div>
        </div>
      </div>
      
      {/* Circular buttons like reference */}
      <div className="flex gap-2 shrink-0 relative z-10 ml-2">
         <button onClick={prevSlide} type="button" className="w-[2.15rem] h-[2.15rem] rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all cursor-pointer">
           <ArrowRight className="w-3.5 h-3.5 rotate-180" />
         </button>
         <button onClick={nextSlide} type="button" className="w-[2.15rem] h-[2.15rem] rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-all cursor-pointer shadow-lg hover:shadow-white/20">
           <ArrowRight className="w-3.5 h-3.5" />
         </button>
      </div>
    </div>
  );
}
