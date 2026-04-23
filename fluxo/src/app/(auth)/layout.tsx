import { CheckCircle2, ArrowRight } from "lucide-react";
import Image from "next/image";
import logoLogin from "../../assets/logo_dashboard.png";
import { AdvantagesSlider } from "./AdvantagesSlider";
import { ParticlesBackground } from "../../components/ui/ParticlesBackground";

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
        <div className="w-full md:w-[55%] lg:w-[60%] bg-slate-950 relative flex flex-col justify-between p-8 lg:p-14 border-r border-white/5 overflow-hidden flex-shrink-0">
          
          {/* Actual Background from Design System v6 */}
          <div className="absolute inset-0 z-0">
            {/* Dark Grid Lines bg */}
            <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
              <div className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/5 to-transparent" style={{ left: "12.5%" }} />
              <div className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/5 to-transparent" style={{ left: "25%" }} />
              <div className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/5 to-transparent" style={{ left: "37.5%" }} />
              <div className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" style={{ left: "50%" }} />
              <div className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/5 to-transparent" style={{ left: "62.5%" }} />
              <div className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/5 to-transparent" style={{ left: "75%" }} />
              <div className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/5 to-transparent" style={{ left: "87.5%" }} />
            </div>

            {/* Background Image/Gradients for Premium Dark Look */}
            <div className="absolute inset-0 z-[1] pointer-events-none">
              {/* Deep emerald radial glow */}
              <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(16,185,129,0.15) 0%, transparent 100%)" }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1620065403217-063dbab3c409?q=80&w=2564&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-luminosity" alt="Dark abstract" />
              {/* Gradient Fade to bottom edge */}
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent" />
            </div>

            {/* Injecting the Particles JS Effect */}
            <ParticlesBackground />
          </div>

          {/* Content Wrapper */}
          <div className="relative z-10 flex flex-col h-full justify-between">
            {/* Top: Logo */}
            <div>
              <Image src={logoLogin} alt="Fluxeer" className="object-contain h-[38px] w-auto" width={216} height={43} priority />
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
              
              <p className="mt-8 text-base lg:text-[17px] text-white/90 max-w-md leading-relaxed font-sans font-medium">
                Transformamos a complexidade de recebíveis em inteligência unificada. Automação, visibilidade e conciliação para focar no crescimento da sua operação.
              </p>
            </div>

            {/* Bottom: Frosted Glass SaaS Advantages Widget */}
            <div className="mt-auto flex justify-end">
              <AdvantagesSlider />
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
