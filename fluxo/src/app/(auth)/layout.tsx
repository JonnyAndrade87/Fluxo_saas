import { BarChart3 } from "lucide-react";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Dynamic Background Elements from the Design System */}
      <div className="absolute top-0 inset-x-0 flex justify-center overflow-hidden pointer-events-none opacity-40">
        <div className="w-[108rem] flex-none flex justify-end">
          <picture>
            <div className="w-[90rem] max-w-none flex-none bg-gradient-to-r from-indigo-500/20 to-transparent dark:from-indigo-500/10 h-72 blur-3xl opacity-50"></div>
          </picture>
        </div>
      </div>
      
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="flex justify-center mb-8">
          <img src="/logo_fluxeer_login.png" alt="Fluxeer" className="object-contain h-[50px] w-auto max-w-[180px]" />
        </div>

        {children}
        
        <p className="mt-8 text-center text-xs text-muted-foreground font-medium">
          Fluxeer B2B Financial Platform - Versão Beta © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
