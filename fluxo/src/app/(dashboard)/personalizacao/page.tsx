import { Suspense } from 'react';
import { Metadata } from 'next';
import { Loader2, Palette } from 'lucide-react';
import { getTenantBranding } from '@/actions/branding';
import { requireTenant } from '@/lib/safe-auth';
import PersonalizacaoClient from './PersonalizacaoClient';

export const metadata: Metadata = {
  title: 'Personalização | Fluxeer',
  description: 'Configure a identidade visual da sua conta no Fluxeer.',
};

export default async function PersonalizacaoPage() {
  const branding = await getTenantBranding();
  const { user } = await requireTenant();

  const initialData = {
    logoUrl: branding?.logoUrl ?? '',
    primaryColor: branding?.primaryColor ?? '',
    accentColor: branding?.accentColor ?? '',
    plan: branding?.plan ?? 'starter',
    role: user.role ?? 'operator',
    initialUserId: user.id,
    initialTenantId: user.tenantId,
  };

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-brand-green" />
            </div>
            <h1 className="text-2xl font-bold text-obsidian tracking-tight">Personalização</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-[52px]">
            Configure o logotipo e as cores da identidade visual da sua conta.
          </p>
        </div>

        <Suspense fallback={
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        }>
          <PersonalizacaoClient initialData={initialData} />
        </Suspense>
      </div>
    </div>
  );
}
