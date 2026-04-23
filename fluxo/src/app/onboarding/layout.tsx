import { redirect } from 'next/navigation';
import { getSessionSafe } from '@/lib/safe-auth';
import { getOnboardingStatus } from '@/actions/onboarding';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Protect onboarding routes - only authenticated users with incomplete onboarding can access
  const session = await getSessionSafe();

  if (!session?.user) {
    // Not authenticated - redirect to login
    redirect('/login');
  }

  const tenantId = (session.user as any)?.tenantId;

  if (!tenantId) {
    // User authenticated but no tenant - they should be here for onboarding
    // Allow access to complete tenant creation
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col font-sans selection:bg-[#1A3A5F]/10 selection:text-[#1A3A5F]">
        {/* Header com logo oficial */}
        <header className="h-16 flex items-center justify-center bg-white/80 backdrop-blur-md border-b border-[#E4E9F0] sticky top-0 z-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo_fluxeer.png"
            alt="Fluxeer"
            style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
          />
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
    );
  }

  // User has tenantId - check if onboarding is complete
  const onboardingStatus = await getOnboardingStatus();

  if (onboardingStatus.isComplete) {
    // Onboarding complete - redirect to dashboard
    redirect('/');
  }

  // Onboarding not complete - allow access
  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col font-sans selection:bg-[#1A3A5F]/10 selection:text-[#1A3A5F]">
      {/* Header com logo oficial */}
      <header className="h-16 flex items-center justify-center bg-white/80 backdrop-blur-md border-b border-[#E4E9F0] sticky top-0 z-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo_fluxeer.png"
          alt="Fluxeer"
          style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
        />
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
