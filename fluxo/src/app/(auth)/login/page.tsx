'use client';

import { useActionState } from 'react';
import { authenticate } from '@/actions/auth';
import { signIn } from '../../../../auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined);

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

      <form
        className="animate-glow-in mb-6"
        style={{ animationDelay: '650ms' }}
        action={async () => {
          "use server"
          await signIn("google")
        }}
      >
        <Button 
          variant="outline" 
          type="submit" 
          className="w-full h-12 text-sm font-semibold text-obsidian tracking-wide border-border/60 hover:bg-slate-50 flex items-center justify-center gap-3"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuar com o Google
        </Button>
      </form>

      <div className="text-center text-sm animate-glow-in mt-6" style={{ animationDelay: '700ms' }}>
        <span className="text-muted-foreground">Nova empresa? </span>
        <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
          Criar conta
        </Link>
      </div>
    </div>
  );
}
