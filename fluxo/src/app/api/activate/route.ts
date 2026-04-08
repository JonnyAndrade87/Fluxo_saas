import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signIn } from '../../../../auth';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/register?error=invalid_token', request.url));
  }

  try {
    const record = await prisma.emailVerificationToken.findUnique({ where: { token } });

    if (!record) {
      return NextResponse.redirect(new URL('/register?error=used_token', request.url));
    }

    if (new Date() > record.expires) {
      await prisma.emailVerificationToken.delete({ where: { token } });
      return NextResponse.redirect(new URL('/register?error=expired_token', request.url));
    }

    // Ativar conta
    await prisma.user.update({
      where: { email: record.email },
      data: { emailVerified: true, isActive: true },
    });

    // Invalidar token
    await prisma.emailVerificationToken.delete({ where: { token } });

    // Redirect to a special page where the user can login and go directly to onboarding
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', '/onboarding');
    loginUrl.searchParams.set('activated', '1');
    return NextResponse.redirect(loginUrl);
  } catch (err) {
    console.error('Activation error:', err);
    return NextResponse.redirect(new URL('/register?error=server_error', request.url));
  }
}
