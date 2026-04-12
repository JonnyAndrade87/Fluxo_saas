'use client';

import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { authenticate } from '@/actions/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import GoogleSignInButton from './GoogleSignInButton';

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  AccountNotRegistered: 'Este e-mail do Google não está cadastrado na plataforma. Crie uma conta primeiro ou entre em contato com o administrador.',
  OAuthCallbackError: 'Ocorreu um erro ao autenticar com o Google. Tente novamente.',
  OAuthSignin: 'Não foi possível iniciar o login com Google. Tente novamente.',
};

export default function LoginPage() {
  const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined);
  const searchParams = useSearchParams();
  const oauthError = searchParams.get('error');
  const oauthErrorMessage = oauthError ? (OAUTH_ERROR_MESSAGES[oauthError] ?? 'Erro ao autenticar com Google.') : null;

  return (
    <div className="premium-card bg-white p-8 rounded-2xl shadow-xl border border-border/60 relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="text-center mb-8 relative z-10 flex flex-col items-center animate-glow-in" style={{ animationDelay: '100ms' }}>
        <h1 className="text-xl font-heading font-extrabold tracking-tight text-obsidian">Bem-vindo de volta</h1>
        <p className="text-sm text-muted-foreground mt-1">Acesse sua plataforma financeira</p>
      </div>

      <form action={dispatch} className="space-y-6 relative z-10">
        <div className="space-y-4">
          <div className="space-y-1.5 animate-glow-in" style={{ animationDelay: '250ms' }}>
            <label className="text-sm font-semibold text-obsidian select-none" htmlFor="email">Email</label>
            <Input
              id="email"
              type="email"
              name="email"
              placeholder="seu@dominio.com"
              required
              className="h-11 font-mono text-sm tracking-tight"
            />
          </div>
          <div className="space-y-1.5 animate-glow-in" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-obsidian select-none" htmlFor="password">Senha</label>
              <Link href="/forgot-password" className="text-xs font-semibold text-indigo-600 hover:underline">Esqueceu a senha?</Link>
            </div>
            <Input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              required
              minLength={6}
              className="h-11 font-mono text-sm tracking-widest px-4"
            />
          </div>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100 animate-in fade-in duration-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {oauthErrorMessage && (
          <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100 animate-in fade-in duration-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{oauthErrorMessage}</p>
          </div>
        )}

        <div className="animate-glow-in" style={{ animationDelay: '550ms' }}>
          <Button 
            variant="beam" 
            type="submit" 
            className="w-full h-12 text-base font-bold tracking-wide" 
            disabled={isPending}
          >
            {isPending ? (
               <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Autenticando</>
            ) : (
               'Entrar no Sistema'
            )}
          </Button>
        </div>
      </form>

      <div className="relative my-6 animate-glow-in" style={{ animationDelay: '600ms' }}>
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-muted-foreground font-semibold tracking-wider">ou</span>
        </div>
      </div>

      <div className="animate-glow-in mb-6" style={{ animationDelay: '650ms' }}>
        <GoogleSignInButton />
      </div>

      <div className="text-center text-sm animate-glow-in mt-6" style={{ animationDelay: '700ms' }}>
        <span className="text-muted-foreground">Nova empresa? </span>
        <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
          Criar conta
        </Link>
      </div>
    </div>
  );
}
