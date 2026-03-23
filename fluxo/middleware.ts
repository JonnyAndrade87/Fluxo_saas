import { NextRequest, NextResponse } from 'next/server';

// Minimal middleware - does nothing, just passes through
// Auth is handled client-side and in individual pages/API routes
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
