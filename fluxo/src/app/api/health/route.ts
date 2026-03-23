import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    return NextResponse.json({
      status: 'success',
      env: {
        NODE_ENV: process.env.NODE_ENV,
        AUTH_SECRET_EXISTS: !!process.env.AUTH_SECRET,
        DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      },
      session: session ? {
        userEmail: session.user?.email,
        userId: session.user?.id,
        hasTenant: !!(session.user as any)?.tenantId,
      } : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: String(error),
      env: {
        NODE_ENV: process.env.NODE_ENV,
        AUTH_SECRET_EXISTS: !!process.env.AUTH_SECRET,
        DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      },
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
