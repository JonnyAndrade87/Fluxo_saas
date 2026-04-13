import { CheckCircle2, ArrowRight, TrendingUp } from "lucide-react";
import Image from "next/image";
import logoLogin from "../../assets/logo_dashboard.png";
import textureBg from "../../assets/texture.webp";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center relative bg-background md:p-6 lg:p-8">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 inset-x-0 flex justify-center overflow-hidden pointer-events-none opacity-40">
        <div className="w-[108rem] flex-none flex justify-end">
          <picture>
            <div className="w-[90rem] max-w-none flex-none bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-800/10 h-72 blur-3xl opacity-30"></div>
          </picture>
        </div>
      </div>

      {/* Main Split Authentication Card */}
      <div className="relative z-10 w-full max-w-[1280px] bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-border/50 overflow-hidden flex flex-col md:flex-row min-h-[760px]">
        
        {/* Left Side: Brand Panel - Textured SaaS Aesthetic */}
        <div className="w-full md:w-[55%] lg:w-[60%] bg-[#0f1115] relative flex flex-col justify-between p-8 lg:p-14 border-r border-white/5 overflow-hidden flex-shrink-0">
          
          {/* Actual Texture Background from Design System */}
          <div className="absolute inset-0 z-0">
            <Image src={textureBg} alt="Abstract Texture" className="opacity-60 mix-blend-overlay object-cover w-full h-full" priority placeholder="blur" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-transparent to-[#0f1115]/80 pointer-events-none" />
          </div>

          {/* Content Wrapper */}
          <div className="relative z-10 flex flex-col h-full justify-between">
            {/* Top: Logo */}
            <div>
              <Image src={logoLogin} alt="Fluxeer" className="object-contain h-7 w-auto" width={160} height={32} priority />
            </div>

            {/* Center: Typography */}
            <div className="my-auto pt-16 pb-8">
              <h1 className="text-[2.75rem] lg:text-[3.5rem] xl:text-[4rem] font-heading font-medium tracking-tighter leading-[1.05] text-white">
                Cobranças<br />
                organizadas.<br />
                <span className="text-gray-400">
                  Caixa<br />
                  previsível.
                </span>
              </h1>
              
              <p className="mt-8 text-base lg:text-[17px] text-gray-400 max-w-md leading-relaxed font-sans font-medium">
                Transformamos a complexidade de recebíveis em inteligência unificada. Automação, visibilidade e conciliação para focar no crescimento da sua operação.
              </p>
            </div>

            {/* Bottom: Frosted Glass SaaS Advantages Widget */}
            <div className="mt-auto flex justify-end">
              <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl p-3 md:p-4 pr-5 flex items-center justify-between gap-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] w-full max-w-[420px] relative overflow-hidden transition-all hover:bg-white/[0.06]">
                {/* subtle reflection */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none opacity-50" />
                
                <div className="flex items-center gap-4 relative z-10">
                  {/* Widget Card Icon Area */}
                  <div className="w-[3.25rem] h-[3.75rem] rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center shrink-0 shadow-inner overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent" />
                    <TrendingUp className="w-5 h-5 text-emerald-400 relative z-10" />
                  </div>
                  {/* Text */}
                  <div className="flex flex-col justify-center">
                    <div className="text-[9px] md:text-[10px] font-semibold tracking-widest text-emerald-400 uppercase mb-1 uppercase font-mono drop-shadow-sm">Vantagens do SaaS</div>
                    <div className="text-[13px] md:text-sm font-medium text-white mb-0.5">Recebíveis em Tempo Real</div>
                    <div className="text-[11px] md:text-[12px] text-gray-400 leading-snug line-clamp-2 pr-2">Monitore o caixa cruzando pagamentos com zero conciliação manual.</div>
                  </div>
                </div>
                
                {/* Circular buttons like reference */}
                <div className="flex gap-2 shrink-0 relative z-10 ml-2">
                   <button type="button" className="w-[2.15rem] h-[2.15rem] rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all cursor-pointer">
                     <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                   </button>
                   <button type="button" className="w-[2.15rem] h-[2.15rem] rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-all cursor-pointer shadow-lg hover:shadow-white/20">
                     <ArrowRight className="w-3.5 h-3.5" />
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="w-full md:w-[45%] lg:w-[40%] bg-white p-8 lg:p-14 flex items-center justify-center flex-shrink-0 relative">
           {children}
        </div>
      </div>
    </div>
  );
}
