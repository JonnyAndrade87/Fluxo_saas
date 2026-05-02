import { auth } from '../../../../auth';
import { cookies } from 'next/headers';
import { getTeamMembers } from '@/actions/users';
import prisma from '@/lib/prisma';
import ReguaClient from './ReguaClient';
import TeamClient from './TeamClient';

export const metadata = { title: 'Configurações — Fluxo' };

type DashboardSessionUser = {
  role?: string | null;
  tenantId?: string | null;
};

export default async function ConfiguracoesPage() {
  const cookieStore = await cookies();
  const session = await auth();
  const sessionUser = session?.user as DashboardSessionUser | undefined;
  const isAdmin = sessionUser?.role === 'admin';

  const [members] = await Promise.all([
    isAdmin ? getTeamMembers().catch(() => []) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-0">
      {isAdmin && <ReguaClient />}
      {isAdmin && <TeamClient members={members} />}
    </div>
  );
}
