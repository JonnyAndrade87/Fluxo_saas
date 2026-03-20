import { BarChart3 } from "lucide-react";

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
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-obsidian flex items-center justify-center text-white shadow-md transform group-hover:scale-105 transition-all">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-xl font-heading font-extrabold tracking-tight text-obsidian uppercase">FLUXO<span className="text-indigo-600">.</span></span>
          </div>
        </div>

        {children}
        
        <p className="mt-8 text-center text-xs text-muted-foreground font-medium">
          Fluxo B2B Financial Platform © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
