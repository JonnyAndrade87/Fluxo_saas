'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users, UserPlus, Mail, Shield, Trash2, Crown,
  Eye, UserCheck, Loader2, X, ChevronDown, AlertCircle, CheckCircle
} from 'lucide-react';
import { inviteUser, updateUserRole, removeTeamMember } from '@/actions/users';

type Member = {
  id: string;
  userId: string;
  role: string;
  joinedAt: Date;
  email: string;
  fullName: string;
  isCurrentUser: boolean;
};

const ROLE_LABELS: Record<string, string> = { admin: 'Admin', operator: 'Operador', viewer: 'Visualizador' };
const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  operator: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  viewer: 'bg-slate-100 text-slate-600 border-slate-200',
};
const ROLE_ICONS: Record<string, any> = { admin: Crown, operator: UserCheck, viewer: Eye };

export default function TeamClient({ members: initialMembers }: { members: Member[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [showInvite, setShowInvite] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const fmt = (d: Date) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d));

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleInvite = async (formData: FormData) => {
    startTransition(async () => {
      const result = await inviteUser(formData);
      if (result.error) {
        showFeedback('error', result.error);
      } else {
        showFeedback('success', 'Usuário convidado com sucesso!');
        setShowInvite(false);
        // Reload page data (simple approach)
        window.location.reload();
      }
    });
  };

  const handleRoleChange = (tenantUserId: string, newRole: string) => {
    setActiveDropdown(null);
    startTransition(async () => {
      const result = await updateUserRole(tenantUserId, newRole);
      if (result?.error) {
        showFeedback('error', result.error);
      } else {
        setMembers(prev => prev.map(m => m.id === tenantUserId ? { ...m, role: newRole } : m));
        showFeedback('success', 'Papel atualizado.');
      }
    });
  };

  const handleRemove = (tenantUserId: string, name: string) => {
    if (!confirm(`Remover ${name} da equipe?`)) return;
    setActiveDropdown(null);
    startTransition(async () => {
      const result = await removeTeamMember(tenantUserId);
      if (result?.error) {
        showFeedback('error', result.error);
      } else {
        setMembers(prev => prev.filter(m => m.id !== tenantUserId));
        showFeedback('success', `${name} removido da equipe.`);
      }
    });
  };

  return (
    <div className="mt-8 space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-obsidian flex items-center gap-3">
            <Users className="w-7 h-7 text-indigo-500" />
            Equipe
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg">
            Gerencie os membros da sua empresa e seus níveis de acesso ao Fluxo.
          </p>
        </div>
        <Button
          variant="beam"
          className="gap-2 shadow-sm rounded-full px-6"
          onClick={() => setShowInvite(true)}
          disabled={isPending}
        >
          <UserPlus className="w-4 h-4" /> Convidar Usuário
        </Button>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`flex items-center gap-3 p-3 rounded-xl border text-sm animate-in fade-in duration-300 ${
          feedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          {feedback.type === 'success'
            ? <CheckCircle className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />
          }
          {feedback.msg}
        </div>
      )}

      {/* Invite Card */}
      {showInvite && (
        <Card className="premium-card border-indigo-200 bg-indigo-50/30 animate-in slide-in-from-top-4 duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-obsidian flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-500" />
                Convidar Novo Membro
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-rose-50 hover:text-rose-600"
                onClick={() => setShowInvite(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <CardDescription>O usuário receberá acesso imediato ao ambiente da empresa.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleInvite} className="flex flex-col sm:flex-row gap-3">
              <Input
                name="fullName"
                placeholder="Nome completo"
                required
                className="h-10 sm:max-w-[200px]"
              />
              <Input
                name="email"
                type="email"
                placeholder="email@empresa.com"
                required
                className="h-10 flex-1"
              />
              <select
                name="role"
                className="h-10 px-3 rounded-lg border border-border bg-white text-sm text-obsidian focus:ring-1 focus:ring-indigo-500 outline-none sm:max-w-[160px]"
              >
                <option value="operator">Operador</option>
                <option value="viewer">Visualizador</option>
                <option value="admin">Admin</option>
              </select>
              <Button type="submit" variant="beam" className="gap-2 h-10 shrink-0" disabled={isPending}>
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Convidar
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Team Members Table */}
      <Card className="premium-card">
        <CardHeader className="border-b border-border/50 bg-[#FAFAFB] pb-4">
          <CardTitle className="text-base flex items-center gap-2 text-obsidian">
            <Shield className="w-4 h-4 text-indigo-500" />
            Membros da Equipe
          </CardTitle>
          <CardDescription className="text-xs">
            {members.length} {members.length === 1 ? 'membro' : 'membros'} com acesso ao ambiente
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className={`rounded-b-xl overflow-hidden transition-opacity duration-200 ${isPending ? 'opacity-60' : ''}`}>
            {members.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-sm">
                <Users className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p>Nenhum membro encontrado.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-[#FAFAFB] text-muted-foreground text-xs uppercase tracking-wider font-semibold border-b border-border/60">
                  <tr>
                    <th className="px-6 py-4">Membro</th>
                    <th className="px-6 py-4">Papel</th>
                    <th className="px-6 py-4">Desde</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {members.map(m => {
                    const Icon = ROLE_ICONS[m.role] || UserCheck;
                    return (
                      <tr key={m.id} className="hover:bg-indigo-50/20 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                              {m.fullName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="font-semibold text-obsidian flex items-center gap-2">
                                {m.fullName}
                                {m.isCurrentUser && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100">
                                    Você
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">{m.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${ROLE_COLORS[m.role] ?? ROLE_COLORS.viewer}`}>
                            <Icon className="w-3 h-3" />
                            {ROLE_LABELS[m.role] ?? m.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground font-mono">
                          {fmt(m.joinedAt)}
                        </td>
                        <td className="px-6 py-4 text-right relative">
                          {!m.isCurrentUser && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50"
                                onClick={() => setActiveDropdown(activeDropdown === m.id ? null : m.id)}
                              >
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                              {activeDropdown === m.id && (
                                <div className="absolute right-8 top-10 w-48 bg-white border border-border shadow-xl rounded-xl z-50 flex flex-col py-1 animate-in fade-in zoom-in-95 text-left">
                                  <p className="px-4 pt-2 pb-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Alterar papel para</p>
                                  {['admin', 'operator', 'viewer'].filter(r => r !== m.role).map(r => {
                                    const RIcon = ROLE_ICONS[r];
                                    return (
                                      <button key={r} onClick={() => handleRoleChange(m.id, r)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                                        <RIcon className="w-4 h-4" /> {ROLE_LABELS[r]}
                                      </button>
                                    );
                                  })}
                                  <div className="border-t border-border/50 mt-1 pt-1">
                                    <button onClick={() => handleRemove(m.id, m.fullName)}
                                      className="flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-rose-50 hover:text-rose-700 transition-colors text-rose-600 w-full">
                                      <Trash2 className="w-4 h-4" /> Remover da equipe
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Access Level Reference */}
      <Card className="premium-card bg-[#FAFAFB]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-obsidian flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-500" /> Níveis de Acesso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            {[
              { role: 'admin', title: 'Admin', icon: Crown, desc: 'Acesso total. Gerencia equipe, configurações, régua e todas as faturas.' },
              { role: 'operator', title: 'Operador', icon: UserCheck, desc: 'Pode criar e editar clientes, faturas, notas. Não gerencia usuários.' },
              { role: 'viewer', title: 'Visualizador', icon: Eye, desc: 'Acesso somente-leitura. Consulta relatórios e histórico.' },
            ].map(({ role, title, icon: Icon, desc }) => (
              <div key={role} className={`p-4 rounded-xl border ${ROLE_COLORS[role]} gap-3`}>
                <div className="flex items-center gap-2 font-semibold mb-1.5">
                  <Icon className="w-4 h-4" /> {title}
                </div>
                <p className="text-xs opacity-80 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
