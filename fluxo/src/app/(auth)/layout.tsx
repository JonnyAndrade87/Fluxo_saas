import { CheckCircle2, ArrowRight } from "lucide-react";
import Image from "next/image";
import logoLogin from "../../assets/logo_dashboard.png";

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
      <div className="relative z-10 w-full max-w-[1280px] bg-white rounded-[2rem] shadow-2xl border border-border/50 overflow-hidden flex flex-col md:flex-row min-h-[760px]">
        
        {/* Left Side: Brand Panel - Dark Abstract Wavy Aesthetic */}
        <div className="w-full md:w-[55%] lg:w-[60%] bg-[#0B101E] relative flex flex-col justify-between p-8 lg:p-14 border-r border-white/5 overflow-hidden flex-shrink-0">
          
          {/* Abstract wavy background simulating the reference image */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
            {/* Long sweeping gradient simulating a wave */}
            <div className="absolute top-[10%] left-[-30%] w-[150%] h-[100%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-700/20 via-[#0B101E]/10 to-[#0B101E] transform -rotate-12 blur-[80px]" />
            <div className="absolute bottom-[0%] right-[-20%] w-[120%] h-[80%] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0B101E]/0 to-[#0B101E] transform rotate-[15deg] blur-[100px]" />
            <div className="absolute top-[40%] left-[20%] w-[100%] h-[40%] bg-gradient-to-r from-transparent via-slate-500/10 to-transparent transform -rotate-[5deg] blur-[60px]" />
          </div>

          {/* Content Wrapper */}
          <div className="relative z-10 flex flex-col h-full justify-between">
            {/* Top: Logo */}
            <div>
              <Image src={logoLogin} alt="Fluxeer" className="object-contain h-7 w-auto mix-blend-plus-lighter brightness-200 grayscale contrast-200" width={160} height={32} priority />
            </div>

            {/* Center: Large Typography */}
            <div className="my-auto pt-16 pb-8">
              <h1 className="text-[3.5rem] lg:text-[4.5rem] xl:text-[5rem] font-heading font-medium tracking-tighter leading-[1.05] text-white">
                Cobranças<br />
                organizadas.<br />
                <span className="text-white/40">
                  Caixa<br />
                  previsível.
                </span>
              </h1>
            </div>

            {/* Bottom: Frosted Glass Widget */}
            <div className="mt-auto flex justify-end">
              <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-4 flex items-center justify-between gap-6 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.8)] w-full max-w-[360px] relative overflow-hidden transition-all hover:bg-white/[0.06]">
                {/* subtle reflection */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />
                
                <div className="flex items-center gap-4 relative z-10">
                  {/* Widget Icon Box */}
                  <div className="w-12 h-12 rounded-[14px] bg-slate-900/50 border border-white/[0.06] flex items-center justify-center shrink-0 shadow-inner">
                    <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,1)]" />
                    </div>
                  </div>
                  {/* Text */}
                  <div>
                    <div className="text-[10px] font-medium tracking-[0.2em] text-white/40 uppercase mb-1">Status</div>
                    <div className="text-sm font-medium text-white/90">Sistemas operacionais</div>
                  </div>
                </div>
                
                {/* Circular buttons like reference */}
                <div className="flex gap-2 shrink-0 relative z-10">
                   <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 transition-colors cursor-pointer">
                     <ArrowRight className="w-4 h-4 rotate-180" />
                   </div>
                   <div className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center hover:bg-white/90 transition-colors cursor-pointer shadow-lg">
                     <ArrowRight className="w-4 h-4" />
                   </div>
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
