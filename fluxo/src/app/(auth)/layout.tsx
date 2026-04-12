import { CheckCircle2 } from "lucide-react";
import Image from "next/image";
import logoLogin from "../../assets/logo_fluxeer_login.png";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background md:p-6 lg:p-8">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 inset-x-0 flex justify-center overflow-hidden pointer-events-none opacity-40">
        <div className="w-[108rem] flex-none flex justify-end">
          <picture>
            <div className="w-[90rem] max-w-none flex-none bg-gradient-to-r from-indigo-500/20 to-transparent dark:from-indigo-500/10 h-72 blur-3xl opacity-50"></div>
          </picture>
        </div>
      </div>

      {/* Main Split Authentication Card */}
      <div className="relative z-10 w-full max-w-[1200px] bg-white rounded-3xl shadow-2xl border border-border/50 overflow-hidden flex flex-col md:flex-row min-h-[700px]">
        
        {/* Left Side: Brand Panel */}
        <div className="w-full md:w-[50%] lg:w-[53%] bg-gradient-to-br from-[#1e1348] via-[#2a1a63] to-[#120836] p-8 lg:p-12 relative flex flex-col justify-between overflow-hidden text-white flex-shrink-0">
          
          {/* Animated decorative orbs */}
          <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-blue-500/30 rounded-full blur-[100px] mix-blend-screen pointer-events-none animate-pulse-glow" />
          <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-purple-500/30 rounded-full blur-[80px] mix-blend-screen pointer-events-none animate-pulse-glow" style={{ animationDelay: '2s' }} />

          {/* Logo and Badge */}
          <div className="relative z-10">
            <div className="mb-10 brightness-[2] drop-shadow-md">
              <Image src={logoLogin} alt="Fluxeer" className="object-contain h-8 w-auto mix-blend-plus-lighter opacity-90 grayscale contrast-200" width={180} height={40} priority />
            </div>
            
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6 shadow-inner">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
              <span className="text-xs font-semibold tracking-wide text-blue-100 uppercase">Fluxeer • Inteligência em Cobrança</span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-heading font-extrabold tracking-tight leading-[1.1] mb-6 text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70">
              Cobranças organizadas.<br />
              Caixa previsível.
            </h1>
            
            <p className="text-base lg:text-lg text-blue-100/80 leading-relaxed max-w-md font-medium">
              Centralize clientes, acompanhe faturas, automatize cobranças e tenha clareza total da sua operação financeira em um só lugar.
            </p>
          </div>

          {/* Benefits Section */}
          <div className="relative z-10 mt-12 bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm self-start w-full max-w-md">
            <ul className="space-y-4">
              {[
                "Histórico completo por cliente",
                "Cobrança automatizada",
                "Visão clara da inadimplência",
                "Relatórios para decisão rápida"
              ].map((benefit, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                  <span className="text-sm font-semibold tracking-wide text-blue-50/90">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* subtle footer info in left panel */}
          <div className="mt-8 text-xs text-blue-200/40 relative z-10 font-mono">
            Plataforma B2B • Controle de Recebíveis
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="w-full md:w-[50%] lg:w-[47%] bg-white p-8 lg:p-14 flex items-center justify-center flex-shrink-0 relative">
           {children}
        </div>
      </div>
      
      {/* Bottom Global Footer removed completely in favor of internal card styling */}
    </div>
  );
}
