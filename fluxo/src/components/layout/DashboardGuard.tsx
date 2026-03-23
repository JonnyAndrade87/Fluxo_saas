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
      redirect('/login');
    }
    
    return session;
  } catch (error) {
    // Silent fail - already redirected by getSessionSafe
    return null;
  }
}
