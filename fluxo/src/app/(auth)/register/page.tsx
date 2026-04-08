'use client';

import { useActionState, useState } from 'react';
import { register } from '@/actions/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import Link from 'next/link';

function PasswordStrengthHint({ password }: { password: string }) {
  const checks = [
    { label: 'Ao menos 6 caracteres', ok: password.length >= 6 },
    { label: 'Letra (a–z ou A–Z)', ok: /[A-Za-z]/.test(password) },
    { label: 'Número (0–9)', ok: /[0-9]/.test(password) },
    { label: 'Caractere especial (@, !, # …)', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  if (!password) return null;
  return (
    <ul className="mt-2 space-y-1">
      {checks.map(c => (
        <li key={c.label} className={`flex items-center gap-1.5 text-xs ${c.ok ? 'text-emerald-600' : 'text-[#94A3B8]'}`}>
          <span className={`w-3 h-3 rounded-full border flex-shrink-0 ${c.ok ? 'bg-emerald-500 border-emerald-500' : 'border-[#CBD5E1]'}`} />
          {c.label}
        </li>
      ))}
    </ul>
  );
}

export default function RegisterPage() {
  const [state, dispatch, isPending] = useActionState(register, undefined);
  const [cnpj, setCnpj] = useState('');
  const [password, setPassword] = useState('');

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 14) value = value.slice(0, 14);
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      value = value.replace(/^(\d{2})(\d)/, '$1.$2');
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
      value = value.replace(/(\d{4})(\d)/, '$1-$2');
    }
    setCnpj(value);
  };

  if (state?.success) {
    return (
      <div className="premium-card bg-white p-10 rounded-2xl shadow-xl border border-border/60 text-center animate-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-[#1A3A5F] rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
          <Mail className="w-8 h-8 text-[#00D2C8]" />
        </div>
        <h2 className="text-2xl font-extrabold text-[#1A3A5F] tracking-tight">Verifique seu e-mail!</h2>
        <p className="text-sm text-[#64748B] mt-3 leading-relaxed max-w-xs mx-auto">
          Enviamos um link de ativação para o seu e-mail.
          Clique no botão do e-mail para ativar sua conta e acessar o Fluxeer.
        </p>
        <p className="text-xs text-[#94A3B8] mt-4">
          Não recebeu? Verifique a caixa de spam.
        </p>
      </div>
    );
  }

  return (
    <div className="premium-card bg-white p-8 rounded-2xl shadow-xl border border-border/60 relative overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-700">
      <div className="text-center mb-8 relative z-10">
        <h1 className="text-2xl font-heading font-extrabold tracking-tight text-obsidian">Criar Conta</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure seu acesso corporativo Fluxeer</p>
      </div>

      <form action={dispatch} className="space-y-5 relative z-10">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-obsidian" htmlFor="name">Seu Nome</label>
            <Input id="name" type="text" name="name" placeholder="Jane Doe" required className="h-11 text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-obsidian" htmlFor="companyName">Empresa</label>
            <Input id="companyName" type="text" name="companyName" placeholder="Acme Ltda." required className="h-11 text-sm" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-obsidian" htmlFor="cnpj">CNPJ da Empresa</label>
          <Input id="cnpj" type="text" name="cnpj" placeholder="00.000.000/0001-00" required value={cnpj} onChange={handleCnpjChange} className="h-11 font-mono text-sm tracking-wider" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-obsidian" htmlFor="email">E-mail Corporativo</label>
          <Input id="email" type="email" name="email" placeholder="admin@empresa.com" required className="h-11 font-mono text-sm" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-obsidian" htmlFor="password">Senha</label>
          <Input
            id="password"
            type="password"
            name="password"
            placeholder="Mín. 6 caracteres com letras, números e especiais"
            required
            className="h-11 font-mono text-sm"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <PasswordStrengthHint password={password} />
        </div>

        {state?.error && (
          <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100 animate-in fade-in duration-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{state.error}</p>
          </div>
        )}

        <Button
          variant="default"
          type="submit"
          className="w-full h-12 text-base font-bold tracking-wide"
          disabled={isPending}
        >
          {isPending ? 'Criando conta…' : 'Criar Conta Corporativa'}
        </Button>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Já tem conta? </span>
          <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
            Fazer login
          </Link>
        </div>
      </form>
    </div>
  );
}
