import { auth } from '../../../auth';
import { getTeamMembers } from '@/actions/users';
import TeamClient from './TeamClient';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Equipe — Fluxo' };

type DashboardSessionUser = {
  role?: string | null;
  tenantId?: string | null;
};

export default async function TeamPage() {
  const session = await auth();
  const sessionUser = session?.user as DashboardSessionUser | undefined;
  const isAdmin = sessionUser?.role === 'admin';

  if (!isAdmin) {
    redirect('/dashboard');
  }

  const members = await getTeamMembers().catch(() => []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <TeamClient members={members} />
    </div>
  );
}
