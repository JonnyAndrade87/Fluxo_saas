import { redirect } from "next/navigation";
import { auth, signOut } from "../../../auth";
import { LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Strict check
  if (!session?.user?.isSuperAdmin) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Navbar specifically for Super Admin */}
      <header className="bg-obsidian border-b border-white/10 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/5 p-1.5 rounded-lg flex items-center justify-center border border-white/10">
              <Image 
                src="/logo_fluxeer_icone.png" 
                alt="Fluxo Logo" 
                width={32} 
                height={32} 
                className="w-6 h-6 object-contain"
              />
            </div>
            <div>
              <h1 className="font-heading font-black text-lg tracking-tight">Fluxo</h1>
              <p className="text-[10px] font-mono text-rose-300 uppercase tracking-widest leading-none">
                Super Admin
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm font-medium">
             <span className="text-slate-400 font-mono text-xs hidden sm:inline-block">
               {session.user.email}
             </span>
             <Link href="/" className="text-slate-300 hover:text-white transition-colors">
               Ir para Tenant Normal
             </Link>
             {/* Using a form for server action signOut since we are in a server component layout */}
             <form action={async () => {
               "use server";
               await signOut();
             }}>
               <button type="submit" className="flex items-center gap-2 text-rose-400 hover:text-rose-300 transition-colors ml-4 border-l border-white/10 pl-4">
                 <LogOut className="w-4 h-4" /> Sair
               </button>
             </form>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
