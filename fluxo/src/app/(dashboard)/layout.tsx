import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"
import NewInvoiceModal from "@/components/finance/NewInvoiceModal"
import { cookies } from 'next/headers'
import prisma from "@/lib/prisma"
import { getBillingE2EFixture } from '@/lib/e2e-billing'
import { requireTenant } from '@/lib/safe-auth'

// Force dynamic rendering - cannot cache dashboard with user-specific data
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Protect dashboard routes - require authenticated user with tenant
  const { user, tenantId } = await requireTenant();
  const cookieStore = await cookies();
  const e2eFixture = getBillingE2EFixture(cookieStore);

  // Extract tenant branding
  let tenantData = {
    name: "Sua Empresa",
    plan: "starter",
    logoUrl: null as string | null,
    primaryColor: null as string | null,
    accentColor: null as string | null,
  };

  if (e2eFixture) {
    tenantData.name = e2eFixture.tenantName;
  } else {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { 
          name: true, 
          plan: true,
          logoUrl: true,
          primaryColor: true,
          accentColor: true
        }
      });
      if (tenant) {
        tenantData = {
          name: tenant.name,
          plan: tenant.plan,
          logoUrl: tenant.logoUrl,
          primaryColor: tenant.primaryColor,
          accentColor: tenant.accentColor,
        };
      }
    } catch (e) {
      console.error("Error fetching tenant branding:", e);
    }
  }

  const isPro = tenantData.plan === 'pro' || tenantData.plan === 'scale';

  return (
    <div className="flex h-screen w-full bg-background overflow-x-clip">
      {/* Dynamic Branding Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --brand: ${isPro && tenantData.primaryColor ? tenantData.primaryColor : 'hsl(243 75% 59%)'};
          --success: ${isPro && tenantData.accentColor ? tenantData.accentColor : 'hsl(160 84% 39%)'};
        }
      `}} />

      <Sidebar user={user} />
      <div className="flex flex-col flex-1 min-w-0 overflow-x-clip">
        <Topbar 
          tenantName={tenantData.name} 
          user={user} 
          logoUrl={isPro ? tenantData.logoUrl : null}
        />
        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 sm:p-6 relative min-w-0">
          <div className="max-w-7xl mx-auto w-full min-w-0">
            {children}
          </div>
        </main>
      </div>
      
      {/* Global Injected Modals */}
      <NewInvoiceModal />
    </div>
  )
}
