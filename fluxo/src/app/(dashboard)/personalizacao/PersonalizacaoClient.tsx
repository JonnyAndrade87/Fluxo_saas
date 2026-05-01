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

interface PersonalizacaoClientProps {
  initialData: {
    logoUrl: string;
    primaryColor: string;
    accentColor: string;
    plan: string;
  };
}

export default function PersonalizacaoClient({ initialData }: PersonalizacaoClientProps) {
  const [data, setData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPro = data.plan === 'pro' || data.plan === 'scale';

  // ── Upload handler ──────────────────────────────────────────────────────
  const handleUpload = useCallback(async (file: File) => {
    setUploadError(null);
    setUploadSuccess(false);

    const MAX_KB = 500;
    if (file.size > MAX_KB * 1024) {
      setUploadError(`Arquivo muito grande. Máximo: ${MAX_KB}KB. Seu arquivo: ${Math.round(file.size / 1024)}KB.`);
      return;
    }

    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setUploadError('Formato inválido. Use PNG, JPG, SVG ou WebP.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload/logo', { method: 'POST', body: formData });
      const json = await res.json();

      if (!res.ok) {
        setUploadError(json.error || 'Erro ao fazer upload.');
        return;
      }

      setData(prev => ({ ...prev, logoUrl: json.url }));
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch {
      setUploadError('Falha na conexão. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  // ── Save handler ────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!isPro) return;
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
                Aparece no topo do dashboard e nos seus comunicados. PNG, JPG, SVG ou WebP · Máx. 500KB
              </CardDescription>
            </div>
            {!isPro && (
              <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 gap-1 px-3 py-1">
                <Crown className="w-3.5 h-3.5" />
                Plano Pro
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-8 relative">
          {!isPro && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-b-xl">
              <div className="bg-white border border-border shadow-xl rounded-2xl p-6 max-w-sm text-center">
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-6 h-6 text-indigo-600" />
                </div>
                <h4 className="text-lg font-bold text-obsidian">Funcionalidade Bloqueada</h4>
                <p className="text-sm text-muted-foreground mt-2">
                  Upload de logotipo está disponível no Plano Pro.
                </p>
                <a href="/planos">
                  <Button className="mt-5 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                    Fazer Upgrade
                  </Button>
                </a>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Drop Zone */}
            <div className="space-y-3">
              <div
                role="button"
                tabIndex={0}
                onClick={() => isPro && fileInputRef.current?.click()}
                onKeyDown={e => e.key === 'Enter' && isPro && fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`
                  relative flex flex-col items-center justify-center gap-3 min-h-[160px] rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer select-none
                  ${isDragOver
                    ? 'border-brand-green bg-brand-green/5 scale-[1.02]'
                    : 'border-border hover:border-brand-green/60 hover:bg-slate-50/50 bg-slate-50'}
                  ${!isPro ? 'pointer-events-none opacity-50' : ''}
                `}
              >
                {isUploading ? (
                  <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
                ) : uploadSuccess ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                ) : (
                  <Upload className={`w-8 h-8 transition-colors ${isDragOver ? 'text-brand-green' : 'text-muted-foreground'}`} />
                )}
                <div className="text-center px-4">
                  <p className="text-sm font-semibold text-slate-700">
                    {isUploading ? 'Enviando…' : uploadSuccess ? 'Upload concluído!' : 'Clique ou arraste o arquivo aqui'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    PNG, JPG, SVG, WebP · até 500KB
                  </p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              {uploadError && (
                <div className="flex items-start gap-2 text-rose-600 bg-rose-50 rounded-xl px-4 py-3 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Pré-visualização</p>
              <div className="h-[160px] rounded-2xl border border-dashed border-border bg-slate-950 flex items-center justify-center">
                {data.logoUrl ? (
                  <div className="relative group">
                    <img
                      src={data.logoUrl}
                      alt="Logo preview"
                      className="max-h-[120px] max-w-[220px] object-contain drop-shadow-lg"
                    />
                    <button
                      onClick={() => setData(prev => ({ ...prev, logoUrl: '' }))}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-white/30 font-mono">Nenhum logo carregado</p>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Pré-visualização sobre fundo escuro (como aparece no dashboard).
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
            {!isPro && (
              <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 gap-1 px-3 py-1">
                <Crown className="w-3.5 h-3.5" />
                Plano Pro
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-8 relative">
          {!isPro && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-b-xl">
              <div className="bg-white border border-border shadow-xl rounded-2xl p-6 max-w-sm text-center">
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-6 h-6 text-indigo-600" />
                </div>
                <h4 className="text-lg font-bold text-obsidian">Cores Personalizadas</h4>
                <p className="text-sm text-muted-foreground mt-2">Disponível no Plano Pro.</p>
                <a href="/planos">
                  <Button className="mt-5 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                    Fazer Upgrade
                  </Button>
                </a>
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
                    disabled={!isPro}
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
          disabled={isSaving || !isPro}
          className="bg-brand-green hover:bg-brand-green/90 text-white px-8 h-12 rounded-xl font-bold gap-2 shadow-lg transition-all"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Salvar Personalização
        </Button>
      </div>
    </div>
  );
}
