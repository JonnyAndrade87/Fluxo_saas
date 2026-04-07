export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col font-sans selection:bg-[#1A3A5F]/10 selection:text-[#1A3A5F]">

      {/* Distraction-Free Topbar */}
      <header className="h-16 flex items-center justify-center bg-white/70 backdrop-blur-md border-b border-[#E4E9F0] sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1A3A5F] to-[#00D2C8] flex items-center justify-center shadow-md">
            <span className="text-white font-black text-base leading-none">F</span>
          </div>
          <span className="text-lg font-extrabold tracking-tight text-[#0F1C2E]">Fluxeer</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6">
        {children}
      </main>

      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#00D2C8]/8 blur-3xl" />
        <div className="absolute bottom-0 -left-32 w-[600px] h-[600px] rounded-full bg-[#1A3A5F]/6 blur-3xl" />
      </div>
    </div>
  )
}

