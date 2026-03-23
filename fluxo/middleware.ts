import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  // Disable middleware - let pages handle auth
  // Middleware was causing Unauthorized errors during render
  matcher: [],
};
