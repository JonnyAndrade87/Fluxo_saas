import { redirect } from "next/navigation";
import { auth } from "../../../auth";
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
      <header className="bg-[#1A3A5F] border-b border-white/10 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center">
              <Image 
                src="/logo_dashboard.png" 
                alt="Fluxeer Logo" 
                width={120} 
                height={32} 
                className="h-8 w-auto object-contain"
              />
            </div>
            <div className="pl-4 border-l border-white/20">
              <p className="text-xs font-mono text-rose-300 font-bold uppercase tracking-widest leading-none">
                Super Admin
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
             <span className="text-white/60 font-mono text-[11px] hidden sm:inline-block">
               {session.user.email}
             </span>
             <Link href="/" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors ml-2">
               Voltar ao Dashboard
             </Link>
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
