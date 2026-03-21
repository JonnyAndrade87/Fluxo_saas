'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  BellRing, 
  MessageSquare, 
  Mail, 
  Clock, 
  Zap,
  AlertTriangle,
  Save,
  Loader2,
  CheckCircle,
  FileText
} from "lucide-react";

export default function ReguaClient() {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // States for each Rule
  const [preAtivado, setPreAtivado] = useState(true);
  const [diaAtivado, setDiaAtivado] = useState(true);
  const [posAtivado, setPosAtivado] = useState(true);

  const handleSave = () => {
    setIsSaving(true);
    setSaved(false);
    setTimeout(() => {
       setIsSaving(false);
       setSaved(true);
       setTimeout(() => setSaved(false), 3000);
    }, 1200);
  };

  // Custom Toggle Component (Reusable)
  const CustomToggle = ({ checked, onChange, label, className = "bg-indigo-500" }: { checked: boolean, onChange: (val: boolean) => void, label: string, className?: string }) => (
    <label className="flex items-center cursor-pointer group w-fit">
      <div className="relative">
        <input 
           type="checkbox" 
           className="sr-only" 
           checked={checked} 
           onChange={(e) => onChange(e.target.checked)} 
        />
        <div className={`block w-10 h-6 rounded-full transition-colors duration-300 ${checked ? className : 'bg-slate-200 border border-slate-300'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${checked ? 'translate-x-4' : 'translate-x-0'}`}></div>
      </div>
      <div className={`ml-3 text-xs font-semibold select-none transition-colors ${checked ? 'text-obsidian' : 'text-muted-foreground'}`}>
        {checked ? 'Ativado' : 'Desativado'}
      </div>
    </label>
  );

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50/50 border border-border text-xs font-semibold text-indigo-700 mb-2 shadow-sm">
            <BellRing className="w-3.5 h-3.5" /> Motor Ativo
          </div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-obsidian">Régua de Cobrança & Automação</h1>
          <p className="text-muted-foreground text-sm max-w-lg">
            Defina a cadência de mensagens automáticas baseada no ciclo de vida das faturas (Pré, Dia-D, e Atraso).
          </p>
        </div>
        <Button variant="beam" onClick={handleSave} disabled={isSaving} className="gap-2 shadow-sm rounded-full px-8 transition-all">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Salvando Motor...' : saved ? 'Salvo!' : 'Tornar Vigente'}
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 min-h-[600px]">
        {/* Settings Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          <nav className="flex flex-col gap-1 sticky top-6">
            <a href="#" className="bg-indigo-50 border border-indigo-100/50 text-indigo-700 font-semibold px-4 py-3 rounded-xl text-sm flex items-center gap-3 transition-colors">
              <BellRing className="w-4 h-4" /> Régua Principal
            </a>
            <a href="#" className="text-muted-foreground hover:bg-muted/50 hover:text-obsidian font-medium px-4 py-3 rounded-xl text-sm flex items-center gap-3 transition-colors">
              <FileText className="w-4 h-4" /> Templates de Mensagem
            </a>
            <a href="#" className="text-muted-foreground hover:bg-muted/50 hover:text-obsidian font-medium px-4 py-3 rounded-xl text-sm flex items-center gap-3 transition-colors">
              <Zap className="w-4 h-4" /> Gatilhos Externos (Webhooks)
            </a>
            <a href="#" className="text-muted-foreground hover:bg-muted/50 hover:text-obsidian font-medium px-4 py-3 rounded-xl text-sm flex items-center gap-3 transition-colors">
              <Settings className="w-4 h-4" /> Logs de Disparo
            </a>
          </nav>
        </div>

        {/* Rules Content */}
        <div className="lg:col-span-9 space-y-6">
          <Card className="premium-card relative overflow-hidden bg-white shadow-xl shadow-obsidian/5 border-border/60">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
            <CardHeader className="pb-4 bg-[#FAFAFB] border-b border-border/50">
              <CardTitle className="text-lg text-obsidian font-heading font-extrabold flex items-center gap-2">
                 Motor de Comunicação Omnichannel
              </CardTitle>
              <CardDescription className="text-xs">
                Configure os canais (Email, WhatsApp) e a cadência exata para evitar inadimplência e recuperar crédito sem esforço manual.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              
              {/* Event 1: Before Due Date */}
              <div className={`p-5 rounded-2xl border transition-all duration-300 relative group ${preAtivado ? 'border-indigo-100 bg-[#FAFAFB] hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5' : 'border-border/50 bg-slate-50 opacity-60 grayscale-[50%]'}`}>
                <div className={`absolute -left-3 top-6 w-6 h-6 rounded-full border flex items-center justify-center shadow-sm transition-colors ${preAtivado ? 'bg-white border-indigo-200 text-indigo-500' : 'bg-slate-100 border-border text-slate-400'}`}>
                  <Clock className="w-3 h-3" />
                </div>
                <div className="flex flex-col sm:flex-row gap-6 ml-4">
                  <div className="w-full sm:w-[40%] space-y-3">
                    <h4 className="font-bold text-obsidian text-sm">Aviso de Pré-Vencimento</h4>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">Antecipe o recebimento lembrando seu cliente antes da data limite, enviando a Fatura original.</p>
                    <div className="pt-2">
                      <CustomToggle checked={preAtivado} onChange={setPreAtivado} label="Pré" className="bg-indigo-500" />
                    </div>
                  </div>
                  
                  <div className={`w-full sm:w-[60%] space-y-4 transition-all ${!preAtivado && 'pointer-events-none'}`}>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-obsidian uppercase tracking-wider">Quantos dias antes?</label>
                        <Input defaultValue="3" className="h-10 font-mono bg-white focus-visible:ring-indigo-500 border-border shadow-sm text-sm" type="number" min="1" max="15" />
                        <span className="text-[10px] text-muted-foreground block text-right mt-1">Dia D- Menos</span>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-obsidian uppercase tracking-wider">Horário do envio</label>
                        <Input defaultValue="09:00" className="h-10 font-mono bg-white focus-visible:ring-indigo-500 border-border shadow-sm text-sm" type="time" />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                       <label className="text-[11px] font-bold text-obsidian uppercase tracking-wider block mb-2">Canais de Atuação</label>
                       <div className="flex items-center gap-3">
                         <label className="cursor-pointer text-xs font-semibold flex items-center gap-2 bg-white border border-border px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                            <input type="checkbox" defaultChecked className="accent-indigo-600 w-3.5 h-3.5" />
                            <Mail className="w-3.5 h-3.5 text-indigo-600" /> E-mail
                         </label>
                         <label className="cursor-pointer text-xs font-semibold flex items-center gap-2 bg-white border border-border px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                            <input type="checkbox" className="accent-emerald-600 w-3.5 h-3.5" />
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp (+0,10c)
                         </label>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event 2: On Due Date */}
              <div className={`p-5 rounded-2xl border transition-all duration-300 relative group ${diaAtivado ? 'border-amber-100 bg-amber-50/20 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/5' : 'border-border/50 bg-slate-50 opacity-60 grayscale-[50%]'}`}>
                <div className={`absolute -left-3 top-6 w-6 h-6 rounded-full border flex items-center justify-center shadow-sm transition-colors ${diaAtivado ? 'bg-amber-100 border-amber-200 text-amber-600' : 'bg-slate-100 border-border text-slate-400'}`}>
                  <Zap className="w-3 h-3" />
                </div>
                <div className="flex flex-col sm:flex-row gap-6 ml-4">
                  <div className="w-full sm:w-[40%] space-y-3">
                    <h4 className={`font-bold text-sm ${diaAtivado ? 'text-amber-900' : 'text-obsidian'}`}>Hoje é o Vencimento! (D-0)</h4>
                    <p className={`text-[11px] leading-relaxed ${diaAtivado ? 'text-amber-800/80' : 'text-muted-foreground'}`}>Aviso incisivo disparado apenas na data cravada do título com PIX Copy/Paste.</p>
                    <div className="pt-2">
                      <CustomToggle checked={diaAtivado} onChange={setDiaAtivado} label="Dia" className="bg-amber-500" />
                    </div>
                  </div>
                  
                  <div className={`w-full sm:w-[60%] space-y-4 transition-all ${!diaAtivado && 'pointer-events-none'}`}>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5 col-span-2">
                        <label className={`text-[11px] font-bold uppercase tracking-wider ${diaAtivado ? 'text-amber-900' : 'text-obsidian'}`}>Horário Cirúrgico</label>
                        <Input defaultValue="08:30" className={`h-10 font-mono bg-white border shadow-sm text-sm ${diaAtivado ? 'border-amber-200 focus-visible:ring-amber-500' : 'border-border'}`} type="time" />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                       <label className={`text-[11px] font-bold uppercase tracking-wider block mb-2 ${diaAtivado ? 'text-amber-900' : 'text-obsidian'}`}>Canais de Atuação</label>
                       <div className="flex flex-wrap items-center gap-3">
                         <label className={`cursor-pointer text-xs font-semibold flex items-center gap-2 bg-white border px-3 py-1.5 rounded-lg transition-colors shadow-sm hover:shadow-md ${diaAtivado ? 'border-amber-200' : 'border-border'}`}>
                            <input type="checkbox" defaultChecked className="accent-emerald-600 w-3.5 h-3.5" />
                            <Mail className="w-3.5 h-3.5 text-indigo-600" /> E-mail (Garantido)
                         </label>
                         <label className={`cursor-pointer text-xs font-bold flex items-center gap-2 bg-white border px-3 py-1.5 rounded-lg transition-colors shadow-sm hover:shadow-md ${diaAtivado ? 'border-amber-200 text-emerald-700' : 'border-border'}`}>
                            <input type="checkbox" defaultChecked className="accent-emerald-600 w-3.5 h-3.5" />
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp Prioritário
                         </label>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event 3: After Due Date (Atraso) */}
              <div className={`p-5 rounded-2xl border transition-all duration-300 relative group ${posAtivado ? 'border-rose-100 bg-rose-50/20 hover:border-rose-300 hover:shadow-lg hover:shadow-rose-500/5' : 'border-border/50 bg-slate-50 opacity-60 grayscale-[50%]'}`}>
                <div className={`absolute -left-3 top-6 w-6 h-6 rounded-full border flex items-center justify-center shadow-sm transition-colors ${posAtivado ? 'bg-rose-100 border-rose-200 text-rose-600' : 'bg-slate-100 border-border text-slate-400'}`}>
                  <AlertTriangle className="w-3 h-3" />
                </div>
                <div className="flex flex-col sm:flex-row gap-6 ml-4">
                  <div className="w-full sm:w-[40%] space-y-3">
                    <h4 className={`font-bold text-sm ${posAtivado ? 'text-rose-900' : 'text-obsidian'}`}>Recuperação de Atraso</h4>
                    <p className={`text-[11px] leading-relaxed ${posAtivado ? 'text-rose-800/80' : 'text-muted-foreground'}`}>Mensagens severas focadas em cobrar dívidas e encaminhar para negativação C-Level.</p>
                    <div className="pt-2">
                       <CustomToggle checked={posAtivado} onChange={setPosAtivado} label="Pós" className="bg-rose-500" />
                    </div>
                  </div>
                  
                  <div className={`w-full sm:w-[60%] space-y-4 transition-all ${!posAtivado && 'pointer-events-none'}`}>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className={`text-[11px] font-bold uppercase tracking-wider ${posAtivado ? 'text-rose-900' : 'text-obsidian'}`}>Cadência (Dias Vencidos)</label>
                        <Input defaultValue="1, 3, 7, 15" className={`h-10 font-mono bg-white border shadow-sm text-sm ${posAtivado ? 'border-rose-200 focus-visible:ring-rose-500 text-rose-900' : 'border-border'}`} type="text" />
                        <span className={`text-[10px] block text-right mt-1 ${posAtivado ? 'text-rose-700/60' : 'text-muted-foreground'}`}>Ex: 1,3,7...</span>
                      </div>
                      <div className="space-y-1.5">
                        <label className={`text-[11px] font-bold uppercase tracking-wider ${posAtivado ? 'text-rose-900' : 'text-obsidian'}`}>Horário Útil</label>
                        <Input defaultValue="10:00" className={`h-10 font-mono bg-white border shadow-sm text-sm ${posAtivado ? 'border-rose-200 focus-visible:ring-rose-500 text-rose-900' : 'border-border'}`} type="time" />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                       <label className={`text-[11px] font-bold uppercase tracking-wider block mb-2 ${posAtivado ? 'text-rose-900' : 'text-obsidian'}`}>Força Tarefa Omnichannel</label>
                       <div className="flex flex-wrap items-center gap-3">
                         <label className={`cursor-pointer text-xs font-bold flex items-center gap-2 bg-white border px-3 py-1.5 rounded-lg transition-colors shadow-sm hover:shadow-md ${posAtivado ? 'border-rose-400 text-rose-800' : 'border-border'}`}>
                            <input type="checkbox" defaultChecked className="accent-rose-600 w-3.5 h-3.5" />
                            <Mail className="w-3.5 h-3.5 text-rose-600" /> E-mail Jurídico
                         </label>
                         <label className={`cursor-pointer text-xs font-bold flex items-center gap-2 bg-white border px-3 py-1.5 rounded-lg transition-colors shadow-sm hover:shadow-md bg-rose-600 text-white border-transparent`}>
                            <input type="checkbox" defaultChecked className="accent-white w-3.5 h-3.5" />
                            <MessageSquare className="w-3.5 h-3.5 text-white" /> Disparo SMS & WhatsApp
                         </label>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
