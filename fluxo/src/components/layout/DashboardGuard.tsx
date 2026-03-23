/**
 * Dashboard Auth Guard
 * Protege todas as rotas do dashboard
 * Se auth falhar, redireciona para login
 */

import { redirect } from 'next/navigation';
import { getSessionSafe } from '@/lib/safe-auth';

export async function DashboardGuard() {
  try {
    const session = await getSessionSafe();
    
    if (!session?.user) {
      console.log('No user in session, redirecting to login');
      redirect('/login');
    }
    
    console.log('Dashboard access granted for user:', session.user.email);
    return session;
  } catch (error) {
    // Catch any other auth errors
    console.error('[DashboardGuard] Error:', error);
    redirect('/login');
  }
}
