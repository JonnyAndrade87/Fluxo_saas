export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col font-sans selection:bg-[#1A3A5F]/10 selection:text-[#1A3A5F]">

      {/* Minimal Topbar — sem logo para evitar duplicidade com o card */}
      <header className="h-14 flex items-center justify-center bg-white/80 backdrop-blur-md border-b border-[#E4E9F0] sticky top-0 z-50">
        <span className="text-[#1A3A5F] font-extrabold text-lg tracking-tight">
          Fluxeer<span className="text-[#00D2C8]">.</span>
        </span>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6">
        {children}
      </main>

      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#00D2C8]/6 blur-3xl" />
        <div className="absolute bottom-0 -left-32 w-[600px] h-[600px] rounded-full bg-[#1A3A5F]/5 blur-3xl" />
      </div>
    </div>
  )
}

