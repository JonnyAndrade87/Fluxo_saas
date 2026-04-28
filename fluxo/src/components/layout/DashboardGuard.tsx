import { redirect } from 'next/navigation';
import { getSessionSafe } from '@/lib/safe-auth';
import { maskEmail } from '@/lib/utils';

export async function DashboardGuard() {
  const session = await getSessionSafe();
  
  if (!session?.user) {
    console.log('No user in session, redirecting to login');
    redirect('/login');
  }
  
  console.log('Dashboard access granted for user:', maskEmail(session.user.email));
  return session;
}
