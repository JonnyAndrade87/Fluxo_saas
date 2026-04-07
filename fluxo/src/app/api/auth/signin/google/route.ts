import { redirect } from 'next/navigation';
import { signIn } from '../../../../../../auth';

export async function GET() {
  await signIn('google', { redirectTo: '/' });
  redirect('/');
}
