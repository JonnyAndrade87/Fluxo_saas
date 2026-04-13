'use client';

import { Suspense } from 'react';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { authenticate } from '@/actions/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import GoogleSignInButton from './GoogleSignInButton';

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  AccountNotRegistered: 'Este e-mail do Google não está cadastrado na plataforma. Crie uma conta primeiro ou entre em contato com o administrador.',
  OAuthCallbackError: 'Ocorreu um erro ao autenticar com o Google. Tente novamente.',
  OAuthSignin: 'Não foi possível iniciar o login com Google. Tente novamente.',
  EmailNotVerified: 'Sua conta ainda não foi verificada. Acesse seu e-mail e clique no link de ativação.',
  AccountInactive: 'Sua conta está desativada. Entre em contato com o suporte.',
};

// Isolated to its own component so useSearchParams() is inside a Suspense boundary,
// which is required by Next.js for static-compatible builds.
function OAuthErrorBanner() {
  const searchParams = useSearchParams();
  const oauthError = searchParams.get('error');
  const oauthErrorMessage = oauthError
    ? (OAUTH_ERROR_MESSAGES[oauthError] ?? 'Erro ao autenticar com Google.')
    : null;

  if (!oauthErrorMessage) return null;

  return (
    <div className="flex items-start gap-3 text-sm font-medium text-rose-700 bg-rose-50/80 p-4 rounded-xl border border-rose-200/60 animate-in fade-in slide-in-from-top-2 duration-300">
      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
      <p className="leading-snug">{oauthErrorMessage}</p>
    </div>
  );
}

export default function LoginPage() {
  const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined);

  return (
    <div className="w-full max-w-[440px] mx-auto py-8">
      {/* Removed outer card, background and borders since layout.tsx handles it now */}
      
      <div className="mb-10 text-left animate-glow-in" style={{ animationDelay: '100ms' }}>
        <h2 className="text-3xl font-heading font-extrabold tracking-tight text-obsidian mb-2">Entrar na sua conta</h2>
        <p className="text-[15px] leading-relaxed text-muted-foreground font-medium">
          Acesse sua operação no Fluxeer e acompanhe clientes, cobranças e resultados em tempo real.
        </p>
      </div>

      <form action={dispatch} className="space-y-6">
        <div className="space-y-5">
          <div className="space-y-2 animate-glow-in" style={{ animationDelay: '250ms' }}>
            <label className="text-sm tracking-wide font-bold text-obsidian select-none" htmlFor="email">Email</label>
            <Input
              id="email"
              type="email"
              name="email"
              placeholder="seu@dominio.com"
              required
              className="h-12 font-mono text-[15px] tracking-tight bg-slate-50/50 border-input/60 focus-visible:bg-white transition-colors"
            />
          </div>
          <div className="space-y-2 animate-glow-in" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center justify-between">
              <label className="text-sm tracking-wide font-bold text-obsidian select-none" htmlFor="password">Senha</label>
              <Link href="/forgot-password" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">Esqueceu a senha?</Link>
            </div>
            <Input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              required
              minLength={6}
              className="h-12 font-mono text-[15px] tracking-widest px-4 bg-slate-50/50 border-input/60 focus-visible:bg-white transition-colors"
            />
          </div>
        </div>

        {errorMessage && (
          <div className="flex items-start gap-3 text-sm font-medium text-rose-700 bg-rose-50/80 p-4 rounded-xl border border-rose-200/60 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
            <p className="leading-snug">{errorMessage}</p>
          </div>
        )}

        {/* Suspense is required here because useSearchParams() suspends during SSR/static-gen */}
        <Suspense fallback={null}>
          <OAuthErrorBanner />
        </Suspense>

        <div className="pt-2 animate-glow-in" style={{ animationDelay: '550ms' }}>
          <Button 
            variant="beam" 
            type="submit" 
            className="w-full h-12 text-[15px] font-extrabold tracking-wide rounded-xl shadow-md hover:shadow-lg transition-all" 
            disabled={isPending}
          >
            {isPending ? (
               <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Autenticando</>
            ) : (
               'Entrar'
            )}
          </Button>
        </div>
      </form>

      <div className="relative my-8 animate-glow-in" style={{ animationDelay: '600ms' }}>
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/80" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-muted-foreground font-bold tracking-widest">ou</span>
        </div>
      </div>

      <div className="animate-glow-in" style={{ animationDelay: '650ms' }}>
        <GoogleSignInButton />
      </div>

      <div className="text-center text-[14px] mt-10 animate-glow-in" style={{ animationDelay: '700ms' }}>
        <span className="text-muted-foreground font-medium">Nova empresa? </span>
        <Link href="/register" className="font-bold text-obsidian hover:text-indigo-600 transition-colors">
          Criar conta
        </Link>
      </div>
    </div>
  );
}
