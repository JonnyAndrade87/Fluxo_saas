'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Save,
  Loader2,
  Palette,
  Crown,
  Lock,
  Upload,
  X,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { updateTenantBranding } from '@/actions/branding';
import { checkBrandingPermission } from '@/lib/permissions-shared';

interface PersonalizacaoClientProps {
  initialData: {
    logoUrl: string;
    primaryColor: string;
    accentColor: string;
    plan: string;
    role: string;
    initialUserId?: string;
    initialTenantId?: string;
  };
}

export default function PersonalizacaoClient({ initialData }: PersonalizacaoClientProps) {
  const [data, setData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [apiDiag, setApiDiag] = useState<any>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single source of truth for permissions
  const permission = checkBrandingPermission(
    { role: data.role },
    { plan: data.plan }
  );

  const canCustomize = permission.canCustomize;

  // ── Upload handler ──────────────────────────────────────────────────────
  const handleUpload = useCallback(async (file: File) => {
    if (!canCustomize) return;
    
    setUploadError(null);
    setApiDiag(null);
    setUploadSuccess(false);

    const MAX_KB = 500;
    if (file.size > MAX_KB * 1024) {
      setUploadError(`O arquivo precisa ter até 500KB.`);
      return;
    }

    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setUploadError('Envie uma imagem PNG, JPG ou WebP.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload/logo', { method: 'POST', body: formData });
      
      let json: { ok?: boolean; logoUrl?: string; error?: string; code?: string; diag?: any } = {};
      try {
        json = await res.json();
      } catch (parseErr) {
        if (res.status === 403) {
          setUploadError('Acesso negado. Você não tem permissão para esta ação.');
        } else {
          setUploadError(`Erro ${res.status}: O servidor retornou uma resposta inválida.`);
        }
        return;
      }

      if (json.diag) setApiDiag(json.diag);

      if (!res.ok || json.ok === false) {
        setUploadError(json.error || `Não foi possível processar o upload.`);
        return;
      }

      if (!json.logoUrl) {
        setUploadError('O servidor não retornou o link da imagem.');
        return;
      }

      setData(prev => ({ ...prev, logoUrl: json.logoUrl! }));
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      console.error('[upload] Network error:', err);
      setUploadError('Falha de comunicação com o servidor.');
    } finally {
      setIsUploading(false);
    }
  }, [canCustomize]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && canCustomize) handleUpload(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && canCustomize) handleUpload(file);
  };

  // ── Save handler ────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!canCustomize) return;
    setIsSaving(true);
    try {
      await updateTenantBranding({
        logoUrl: data.logoUrl,
        primaryColor: data.primaryColor,
        accentColor: data.accentColor,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Logotipo ─────────────────────────────────────────────────── */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-border/50 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-obsidian flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-brand-green" />
                Logotipo da Empresa
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                Aparece no topo do dashboard e nos seus comunicados. PNG, JPG ou WebP · Máx. 500KB
              </CardDescription>
            </div>
            {!canCustomize && (
              <Badge className="bg-slate-100 text-slate-600 border-slate-200 gap-1 px-3 py-1">
                <Lock className="w-3.5 h-3.5" />
                Acesso Restrito
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-8 relative">
          {!canCustomize && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-b-xl">
              <div className="bg-white border border-border shadow-xl rounded-2xl p-6 max-w-sm text-center">
                <div className={`w-12 h-12 ${permission.reason === 'PLAN_REQUIRED' ? 'bg-indigo-50' : 'bg-rose-50'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  {permission.reason === 'PLAN_REQUIRED' ? (
                    <Crown className="w-6 h-6 text-indigo-600" />
                  ) : (
                    <Lock className="w-6 h-6 text-rose-600" />
                  )}
                </div>
                <h4 className="text-lg font-bold text-obsidian">
                  {permission.reason === 'PLAN_REQUIRED' ? 'Plano Pro Necessário' : 'Acesso Restrito'}
                </h4>
                <p className="text-sm text-muted-foreground mt-2">
                  {permission.message}
                </p>
                {permission.reason === 'PLAN_REQUIRED' && (
                  <a href="/planos">
                    <Button className="mt-5 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                      Fazer Upgrade
                    </Button>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Upload + Preview — equal height side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

            {/* Drop Zone */}
            <div className="flex flex-col gap-3">
              <div
                role="button"
                tabIndex={0}
                onClick={() => canCustomize && fileInputRef.current?.click()}
                onKeyDown={e => e.key === 'Enter' && canCustomize && fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={[
                  'flex-1 flex flex-col items-center justify-center gap-3 min-h-[180px] rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer select-none',
                  isDragOver
                    ? 'border-brand-green bg-brand-green/5 scale-[1.01]'
                    : 'border-slate-200 hover:border-brand-green/50 hover:bg-slate-50/80 bg-white',
                  !canCustomize ? 'pointer-events-none opacity-50' : '',
                ].join(' ')}
              >
                {isUploading ? (
                  <Loader2 className="w-9 h-9 text-brand-green animate-spin" />
                ) : uploadSuccess ? (
                  <CheckCircle2 className="w-9 h-9 text-emerald-500" />
                ) : (
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isDragOver ? 'bg-brand-green/10' : 'bg-slate-100'}`}>
                    <Upload className={`w-6 h-6 ${isDragOver ? 'text-brand-green' : 'text-slate-400'}`} />
                  </div>
                )}
                <div className="text-center px-6">
                  <p className="text-sm font-semibold text-slate-700">
                    {isUploading ? 'Enviando…' : uploadSuccess ? 'Upload concluído!' : 'Clique ou arraste o arquivo aqui'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">PNG, JPG ou WebP · até 500KB</p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              {uploadError && (
                <div className="flex flex-col gap-2 text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="font-semibold">{uploadError}</span>
                  </div>
                  {/* DIAGNOSTIC INFO FOR DEBUGGING (MASKED) */}
                  {(apiDiag || permission.reason === 'FORBIDDEN' || permission.reason === 'PLAN_REQUIRED') && (
                    <div className="mt-2 pt-2 border-t border-rose-200/50 text-[10px] font-mono opacity-80 grid grid-cols-2 gap-x-4 gap-y-1">
                      <div>User ID: {apiDiag?.userId || initialData.initialUserId?.substring(0, 8) + '...'}</div>
                      <div>Role: {apiDiag?.role || data.role}</div>
                      <div>Tenant: {apiDiag?.tenantId || initialData.initialTenantId?.substring(0, 8) + '...'}</div>
                      <div>Plan: {apiDiag?.plan || data.plan}</div>
                      {apiDiag && <div className="col-span-2 text-indigo-600 font-bold mt-1">API Status: {apiDiag.canUploadLogo ? 'GRANTED' : 'DENIED'}</div>}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Pré-visualização</p>
              <div className="flex-1 min-h-[180px] rounded-2xl bg-[#070c18] border border-white/[0.06] flex items-center justify-center relative group overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03]"
                  style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)', backgroundSize: '28px 28px' }}
                />
                {data.logoUrl ? (
                  <div className="relative z-10 group/logo">
                    <img
                      src={data.logoUrl}
                      alt="Logo preview"
                      className="max-h-[110px] max-w-[200px] object-contain drop-shadow-lg"
                    />
                    <button
                      onClick={() => setData(prev => ({ ...prev, logoUrl: '' }))}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity shadow-md z-20"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="z-10 flex flex-col items-center gap-2">
                    <ImageIcon className="w-8 h-8 text-white/10" />
                    <p className="text-[11px] text-white/20 font-mono">Nenhum logo carregado</p>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Fundo escuro — como aparece no dashboard e comunicados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Cores ────────────────────────────────────────────────────── */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-border/50 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-obsidian flex items-center gap-2">
                <Palette className="w-5 h-5 text-indigo-500" />
                Cores da Identidade Visual
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                Cor primária e accent são aplicadas em botões, badges e destaques da sua conta.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 relative">
          {!canCustomize && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-b-xl">
              <div className="bg-white border border-border shadow-xl rounded-2xl p-6 max-w-sm text-center">
                <div className={`w-12 h-12 ${permission.reason === 'PLAN_REQUIRED' ? 'bg-indigo-50' : 'bg-rose-50'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  {permission.reason === 'PLAN_REQUIRED' ? (
                    <Crown className="w-6 h-6 text-indigo-600" />
                  ) : (
                    <Lock className="w-6 h-6 text-rose-600" />
                  )}
                </div>
                <h4 className="text-lg font-bold text-obsidian">
                  {permission.reason === 'PLAN_REQUIRED' ? 'Cores Personalizadas' : 'Acesso Restrito'}
                </h4>
                <p className="text-sm text-muted-foreground mt-2">{permission.message}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { label: 'Cor Primária (Hex)', key: 'primaryColor' as const, placeholder: '#243b5c' },
              { label: 'Cor de Destaque / Accent (Hex)', key: 'accentColor' as const, placeholder: '#00D2C8' },
            ].map(field => (
              <div key={field.key} className="space-y-2">
                <label className="text-[11px] font-semibold text-muted-foreground block">
                  {field.label}
                </label>
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder={field.placeholder}
                    value={data[field.key]}
                    onChange={e => setData(prev => ({ ...prev, [field.key]: e.target.value }))}
                    disabled={!canCustomize}
                    className="font-mono"
                  />
                  <div
                    className="w-10 h-10 rounded-lg border border-border shrink-0 transition-colors"
                    style={{ backgroundColor: data[field.key] || field.placeholder }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Save ─────────────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving || !canCustomize}
          className="bg-brand-green hover:bg-brand-green/90 text-white px-8 h-12 rounded-xl font-bold gap-2 shadow-lg transition-all"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Salvar Personalização
        </Button>
      </div>
    </div>
  );
}
