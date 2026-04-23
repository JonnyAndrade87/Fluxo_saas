'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2, Palette, Globe, Crown, Lock } from "lucide-react";
import { updateTenantBranding, getTenantBranding } from '@/actions/branding';

export default function BrandingClient() {
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState({
    logoUrl: '',
    primaryColor: '',
    accentColor: '',
    plan: 'starter'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTenantBranding().then(res => {
      if (res) {
        setData({
          logoUrl: res.logoUrl || '',
          primaryColor: res.primaryColor || '',
          accentColor: res.accentColor || '',
          plan: res.plan || 'starter'
        });
      }
      setLoading(false);
    });
  }, []);

  const isPro = data.plan === 'pro' || data.plan === 'scale';

  const handleSave = async () => {
    if (!isPro) return;
    setIsSaving(true);
    try {
      await updateTenantBranding(data);
      alert('Branding atualizado com sucesso!');
    } catch (e) {
      alert('Erro ao salvar branding.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden mb-8">
      <CardHeader className="bg-slate-50/50 border-b border-border/50 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-obsidian flex items-center gap-2">
              <Palette className="w-5 h-5 text-indigo-500" />
              Personalização & Branding
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              Configure a identidade visual da sua conta (Exclusivo Pro)
            </CardDescription>
          </div>
          {!isPro && (
            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 gap-1 px-3 py-1">
              <Crown className="w-3.5 h-3.5" />
              Disponível no Plano Pro
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8 relative">
        {!isPro && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <div className="bg-white border border-border shadow-xl rounded-2xl p-6 max-w-sm text-center animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-indigo-600" />
              </div>
              <h4 className="text-lg font-bold text-obsidian">Funcionalidade Bloqueada</h4>
              <p className="text-sm text-muted-foreground mt-2">
                A personalização Whitelabel (Logo e Cores) está disponível apenas para assinantes do plano **Pro**.
              </p>
              <a href="/planos">
                <Button className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                  Fazer Upgrade Agora
                </Button>
              </a>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Logo Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 opacity-80">
              <Globe className="w-4 h-4" />
              <label className="text-xs font-bold uppercase tracking-widest">Logotipo da Empresa</label>
            </div>
            <div className="flex flex-col gap-3">
              <Input 
                placeholder="URL pública do seu logo (ex: https://site.com/logo.png)" 
                value={data.logoUrl}
                onChange={e => setData({...data, logoUrl: e.target.value})}
                disabled={!isPro}
              />
              <p className="text-[11px] text-muted-foreground italic">
                O logo aparecerá no topo do dashboard e em seus comunicados.
              </p>
              {data.logoUrl && (
                <div className="mt-2 p-4 border border-dashed border-border rounded-lg bg-slate-50 flex items-center justify-center h-24">
                  <img src={data.logoUrl} alt="Preview Logo" className="max-h-full object-contain" />
                </div>
              )}
            </div>
          </div>

          {/* Colors Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 opacity-80">
              <Palette className="w-4 h-4" />
              <label className="text-xs font-bold uppercase tracking-widest">Cores da Identidade</label>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Cor Primária (Hex)</label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="#243b5c" 
                      value={data.primaryColor}
                      onChange={e => setData({...data, primaryColor: e.target.value})}
                      disabled={!isPro}
                      className="font-mono"
                    />
                    <div 
                      className="w-10 h-10 rounded-lg border border-border shrink-0" 
                      style={{ backgroundColor: data.primaryColor || '#243b5c' }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Cor de Destaque / Accent (Hex)</label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="#00D2C8" 
                      value={data.accentColor}
                      onChange={e => setData({...data, accentColor: e.target.value})}
                      disabled={!isPro}
                      className="font-mono"
                    />
                    <div 
                      className="w-10 h-10 rounded-lg border border-border shrink-0" 
                      style={{ backgroundColor: data.accentColor || '#00D2C8' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-border flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !isPro}
            className="bg-fluxeer-blue text-white hover:bg-fluxeer-blue-hover px-8 h-12 rounded-xl transition-all font-bold gap-2 shadow-lg"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Salvar Alterações de Marca
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
