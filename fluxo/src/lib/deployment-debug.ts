// This file is for debugging Vercel deployment issues
// It will help us understand what's happening at runtime

export const deploymentDebug = {
  timestamp: new Date().toISOString(),
  env: {
    NODE_ENV: process.env.NODE_ENV,
    AUTH_SECRET_EXISTS: !!process.env.AUTH_SECRET,
    DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
  },
  message: 'Deployment debug info loaded'
};

console.log('[DEPLOYMENT_DEBUG]', deploymentDebug);
