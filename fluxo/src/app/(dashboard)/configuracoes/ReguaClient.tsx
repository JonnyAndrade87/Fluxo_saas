'use client';

import { useState, useEffect } from 'react';
import { saveBillingFlow, getBillingFlow } from '@/actions/automation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, BellRing, MessageSquare, Mail, Clock, Zap, CheckCircle, Save, Loader2, FileText, Activity, 
  UploadCloud, Search, Filter, Eye, MoreHorizontal, History, RefreshCw, Send, PlayCircle, Plus, Copy, Check, AlertTriangle, X
} from "lucide-react";

// Reusable Custom Toggle with exact design semantics
const CustomToggle = ({ checked, onChange, label }: { checked: boolean, onChange: (val: boolean) => void, label?: string }) => (
  <label className="flex items-center cursor-pointer group w-fit">
    <div className="relative">
      <input 
         type="checkbox" 
         className="sr-only" 
         checked={checked} 
         onChange={(e) => onChange(e.target.checked)} 
      />
      <div className={`block w-10 h-6 rounded-full transition-colors duration-300 ${checked ? 'bg-indigo-600' : 'bg-slate-200 border border-slate-300'}`}></div>
      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${checked ? 'translate-x-4' : 'translate-x-0'}`}></div>
    </div>
    {label && (
      <div className={`ml-3 text-[13px] font-medium select-none transition-colors ${checked ? 'text-obsidian' : 'text-muted-foreground'}`}>
        {checked ? 'Ativado' : 'Inativo'}
      </div>
    )}
  </label>
);

export default function ReguaClient() {
  const [activeTab, setActiveTab] = useState('regua');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // Log Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const [preAtivado, setPreAtivado] = useState(true);
  const [diaAtivado, setDiaAtivado] = useState(true);
  const [posAtivado, setPosAtivado] = useState(true);

  // Timing States
  const [preDias, setPreDias] = useState("3");
  const [preHora, setPreHora] = useState("09:00");
  const [diaHora, setDiaHora] = useState("08:30");
  const [posDias, setPosDias] = useState("5");
  const [posHora, setPosHora] = useState("14:00");

  useEffect(() => {
    getBillingFlow().then(data => {
      if (data) {
        if (data.preAtivado !== undefined) setPreAtivado(data.preAtivado);
        if (data.diaAtivado !== undefined) setDiaAtivado(data.diaAtivado);
        if (data.posAtivado !== undefined) setPosAtivado(data.posAtivado);
        if (data.preDias) setPreDias(data.preDias);
        if (data.preHora) setPreHora(data.preHora);
        if (data.diaHora) setDiaHora(data.diaHora);
        if (data.posDias) setPosDias(data.posDias);
        if (data.posHora) setPosHora(data.posHora);
        if (data.wpText) setWpText(data.wpText);
        if (data.emailText) setEmailText(data.emailText);
      }
    }).catch(() => console.error("Could not load billing flows."));
  }, []);

  // Custom Toast State for UX Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const defaultWp = `Olá, {nome}. Tudo bem?\nPassando para lembrar que a fatura {fatura}, no valor de {valor}, vence em {vencimento}.\nPara facilitar, segue a chave PIX para pagamento:\n\n{pix_copia_cola}\n\nSe o pagamento já foi realizado, desconsidere esta mensagem.`;
  const defaultEmail = `Prezado(a),\n\nIdentificamos que a fatura {fatura}, no valor de {valor}, permanece em aberto há {dias_atraso} dias após o vencimento.\n\nSolicitamos a regularização o quanto antes para evitar o encaminhamento do caso para cobrança externa.\n\nCaso o pagamento já tenha sido efetuado, pedimos a gentileza de desconsiderar esta mensagem.`;

  const [wpText, setWpText] = useState(defaultWp);
  const [emailText, setEmailText] = useState(defaultEmail);
  const [activeField, setActiveField] = useState<'wp' | 'email'>('wp');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveDraft = () => {
    setIsDraftSaving(true);
    setDraftSaved(false);
    setTimeout(() => {
       setIsDraftSaving(false);
       setDraftSaved(true);
       showToast('Rascunho atualizado e guardado com sucesso.');
       setTimeout(() => setDraftSaved(false), 3000);
    }, 800);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);
    
    const payload = {
       preAtivado, diaAtivado, posAtivado,
       preDias, preHora, diaHora, posDias, posHora,
       wpText, emailText
    };

    try {
       await saveBillingFlow(payload);
       setSaved(true);
       showToast('As regras de automação foram aplicadas globalmente!');
       setTimeout(() => setSaved(false), 3000);
    } catch(err) {
       showToast('Erro ao salvar no banco de dados.');
    } finally {
       setIsSaving(false);
    }
  };

  const handleInsertVariable = (variable: string) => {
    if (activeField === 'wp') {
      setWpText(prev => prev + ' ' + variable);
    } else {
      setEmailText(prev => prev + ' ' + variable);
    }
    showToast(`Variável ${variable} inserida com sucesso!`);
  };

  const handleRestore = (field: 'wp' | 'email') => {
    if (field === 'wp') setWpText(defaultWp);
    if (field === 'email') setEmailText(defaultEmail);
    showToast('Template restaurado para o padrão.');
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-10">
      
      {/* GLOBAL HEADER: Refactored for Context and Control */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-1">
             <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100/50 text-[11px] font-bold text-emerald-700 uppercase tracking-widest shadow-sm shadow-emerald-500/5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Automação Ativa
             </div>
             <span className="text-[11px] font-medium text-muted-foreground">Última atualização: Hoje às 10:42</span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-obsidian pb-1">Automação de cobrança</h1>
          <p className="text-muted-foreground text-[15px] max-w-xl leading-relaxed">
            Configure quando e como seus clientes serão notificados antes e depois do vencimento da fatura.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleSaveDraft} 
            disabled={isDraftSaving} 
            className={`h-10 px-5 rounded-full font-semibold border-slate-200 transition-all duration-300 ${draftSaved ? 'bg-slate-100 text-obsidian border-slate-300 scale-105 animate-in zoom-in-95' : 'text-slate-600 hover:bg-slate-50 active:scale-95'}`}
          >
            {isDraftSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : draftSaved ? <Save className="w-4 h-4 mr-2" /> : null}
            {isDraftSaving ? 'Salvando...' : draftSaved ? 'Salvo no Rascunho' : 'Salvar rascunho'}
          </Button>
          <Button 
            variant={saved ? "default" : "beam"}
            onClick={handleSave} 
            disabled={isSaving} 
            className={`h-10 px-6 rounded-full font-semibold shadow-sm shadow-indigo-500/20 transition-all duration-300 ${saved ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30 scale-105 animate-in zoom-in-95' : 'active:scale-95'}`}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : saved ? <CheckCircle className="w-4 h-4 text-white mr-2" /> : <UploadCloud className="w-4 h-4 mr-2" />}
            {isSaving ? 'Publicando...' : saved ? 'Publicado com Sucesso!' : 'Publicar automação'}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 min-h-[600px]">
        
        {/* SIDEBAR NAVIGATION: Refactored Microcopy and UX */}
        <div className="lg:col-span-3 space-y-2">
          <nav className="flex flex-col gap-1.5 sticky top-6">
            <button 
              onClick={() => setActiveTab('regua')}
              className={`w-full text-left font-semibold px-4 py-3 rounded-lg text-[14px] flex items-center gap-3 transition-colors ${activeTab === 'regua' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-obsidian'}`}
            >
              <Activity className="w-4 h-4" /> Sequência da régua
            </button>
            <button 
              onClick={() => setActiveTab('templates')}
              className={`w-full text-left font-semibold px-4 py-3 rounded-lg text-[14px] flex items-center gap-3 transition-colors ${activeTab === 'templates' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-obsidian'}`}
            >
              <FileText className="w-4 h-4" /> Templates de mensagem
            </button>
            <button 
              onClick={() => setActiveTab('webhooks')}
              className={`w-full text-left font-semibold px-4 py-3 rounded-lg text-[14px] flex items-center gap-3 transition-colors ${activeTab === 'webhooks' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-obsidian'}`}
            >
              <Zap className="w-4 h-4" /> Webhooks e integrações
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`w-full text-left font-semibold px-4 py-3 rounded-lg text-[14px] flex items-center gap-3 transition-colors ${activeTab === 'logs' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-obsidian'}`}
            >
              <History className="w-4 h-4" /> Histórico de disparos
            </button>
          </nav>
        </div>


        {/* MAIN CONTENT AREA */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* TAB 1: SEQUÊNCIA DA RÉGUA */}
          {activeTab === 'regua' && (
            <div className="space-y-5 animate-in fade-in duration-300">
               <div className="flex flex-col space-y-1 mb-4">
                  <h3 className="text-xl font-heading font-extrabold text-obsidian">Sequência da régua</h3>
                  <p className="text-sm text-muted-foreground">O fluxo cronológico de comunicação disparada automaticamente pelo motor.</p>
               </div>

               {/* Stage 1: Pré-Vencimento (Softer styling) */}
               <Card className={`relative overflow-hidden bg-white shadow-sm border-border/80 transition-all duration-300 ${!preAtivado && 'opacity-60 saturate-50'}`}>
                  {preAtivado && <div className="absolute top-0 left-0 w-1 h-full bg-slate-300" />}
                  <CardContent className="p-6">
                     <div className="flex flex-col lg:flex-row gap-8">
                        {/* Information Block */}
                        <div className="lg:w-[35%] space-y-4">
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                 <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-none font-semibold text-[10px] tracking-wider uppercase px-2">Pré-Vencimento</Badge>
                              </div>
                              <h4 className="font-heading font-bold text-base text-obsidian mt-2">Lembrete antes do vencimento</h4>
                              <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
                                Evita esquecimentos lembrando o sacado sobre prazos antes da data limite.
                              </p>
                           </div>
                           <CustomToggle checked={preAtivado} onChange={setPreAtivado} label="Ativado" />
                        </div>
                        {/* Settings Block */}
                        <div className={`lg:w-[65%] grid lg:grid-cols-2 gap-6 ${!preAtivado && 'pointer-events-none'}`}>
                           <div className="space-y-2">
                              <label className="text-[12px] font-bold text-obsidian uppercase tracking-wider">Timing do Disparo</label>
                              <div className="flex gap-3">
                                 <div className="flex-1">
                                    <Input value={preDias} onChange={(e) => setPreDias(e.target.value)} type="number" min="1" className="h-10 bg-slate-50/50 shadow-sm" />
                                    <span className="text-[11px] text-muted-foreground mt-1 block">Dias antes</span>
                                 </div>
                                 <div className="flex-1">
                                    <Input value={preHora} onChange={(e) => setPreHora(e.target.value)} type="time" className="h-10 bg-slate-50/50 shadow-sm" />
                                    <span className="text-[11px] text-muted-foreground mt-1 block">Horário</span>
                                 </div>
                              </div>
                           </div>
                           <div className="space-y-3">
                              <label className="text-[12px] font-bold text-obsidian uppercase tracking-wider">Canais de Envio</label>
                              <div className="space-y-2">
                                 <label className="flex items-center gap-3 text-sm font-medium text-obsidian cursor-pointer hover:bg-slate-50 p-1.5 -ml-1.5 rounded-md transition-colors">
                                    <input type="checkbox" defaultChecked className="accent-indigo-600 w-4 h-4 rounded border-slate-300" />
                                    <Mail className="w-4 h-4 text-slate-400" /> E-mail
                                 </label>
                                 <label className="flex items-center gap-3 text-sm font-medium text-obsidian cursor-pointer hover:bg-slate-50 p-1.5 -ml-1.5 rounded-md transition-colors">
                                    <input type="checkbox" className="accent-indigo-600 w-4 h-4 rounded border-slate-300" />
                                    <MessageSquare className="w-4 h-4 text-emerald-500" /> WhatsApp
                                 </label>
                              </div>
                           </div>
                        </div>
                     </div>
                  </CardContent>
               </Card>

               {/* Separator / Arrow logic */}
               <div className="w-px h-6 bg-border mx-auto" />

               {/* Stage 2: Dia D (Subtle Indigo) */}
               <Card className={`relative overflow-hidden bg-white shadow-sm border-border/80 transition-all duration-300 ${!diaAtivado && 'opacity-60 saturate-50'}`}>
                  {diaAtivado && <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />}
                  <CardContent className="p-6">
                     <div className="flex flex-col lg:flex-row gap-8">
                        <div className="lg:w-[35%] space-y-4">
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                 <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-semibold text-[10px] tracking-wider uppercase px-2">Data Exata</Badge>
                              </div>
                              <h4 className="font-heading font-bold text-base text-obsidian mt-2">Aviso no dia do vencimento</h4>
                              <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
                                Notifica no próprio dia (D-0) aumentando drásticamente a conversão sem juros.
                              </p>
                           </div>
                           <CustomToggle checked={diaAtivado} onChange={setDiaAtivado} label="Ativado" />
                        </div>
                        <div className={`lg:w-[65%] grid lg:grid-cols-2 gap-6 ${!diaAtivado && 'pointer-events-none'}`}>
                           <div className="space-y-2">
                              <label className="text-[12px] font-bold text-obsidian uppercase tracking-wider">Timing do Disparo</label>
                                  <div>
                                     <Input value={diaHora} onChange={(e) => setDiaHora(e.target.value)} type="time" className="h-10 bg-slate-50/50 shadow-sm max-w-[140px]" />
                                     <span className="text-[11px] text-muted-foreground mt-1 block">Horário exato</span>
                                  </div>
                           </div>
                           <div className="space-y-3">
                              <label className="text-[12px] font-bold text-obsidian uppercase tracking-wider">Canais de Envio</label>
                              <div className="space-y-2">
                                 <label className="flex items-center gap-3 text-sm font-medium text-obsidian cursor-pointer hover:bg-slate-50 p-1.5 -ml-1.5 rounded-md transition-colors">
                                    <input type="checkbox" defaultChecked className="accent-indigo-600 w-4 h-4 rounded border-slate-300" />
                                    <Mail className="w-4 h-4 text-slate-400" /> E-mail
                                 </label>
                                 <label className="flex items-center gap-3 text-sm font-medium text-obsidian cursor-pointer hover:bg-slate-50 p-1.5 -ml-1.5 rounded-md transition-colors">
                                    <input type="checkbox" defaultChecked className="accent-indigo-600 w-4 h-4 rounded border-slate-300" />
                                    <MessageSquare className="w-4 h-4 text-emerald-500" /> WhatsApp
                                 </label>
                              </div>
                           </div>
                        </div>
                     </div>
                  </CardContent>
               </Card>

               <div className="w-px h-6 bg-border mx-auto" />

               {/* Stage 3: Atraso (Softer indication, no screaming red unless failure) */}
               <Card className={`relative overflow-hidden bg-white shadow-sm border-border/80 transition-all duration-300 ${!posAtivado && 'opacity-60 saturate-50'}`}>
                  {posAtivado && <div className="absolute top-0 left-0 w-1 h-full bg-slate-700" />}
                  <CardContent className="p-6">
                     <div className="flex flex-col lg:flex-row gap-8">
                        <div className="lg:w-[35%] space-y-4">
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                 <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-none font-semibold text-[10px] tracking-wider uppercase px-2">Pós-Vencimento</Badge>
                              </div>
                              <h4 className="font-heading font-bold text-base text-obsidian mt-2">Cobrança em atraso suportado</h4>
                              <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
                                Cadência de lembretes cobrando faturas pendentes, escalando a intensidade dia a dia.
                              </p>
                           </div>
                           <CustomToggle checked={posAtivado} onChange={setPosAtivado} label="Ativado" />
                        </div>
                        <div className={`lg:w-[65%] grid lg:grid-cols-2 gap-6 ${!posAtivado && 'pointer-events-none'}`}>
                           <div className="space-y-2">
                              <label className="text-[12px] font-bold text-obsidian uppercase tracking-wider">Ciclo de Cadência</label>
                              <div className="flex gap-3">
                                 <div className="flex-1">
                                    <Input value={posDias} onChange={(e) => setPosDias(e.target.value)} type="text" className="h-10 bg-slate-50/50 shadow-sm" />
                                    <span className="text-[11px] text-muted-foreground mt-1 block">Dias vencidos (Ex: 1,3,7)</span>
                                 </div>
                                 <div className="flex-[0.6]">
                                    <Input value={posHora} onChange={(e) => setPosHora(e.target.value)} type="time" className="h-10 bg-slate-50/50 shadow-sm" />
                                    <span className="text-[11px] text-muted-foreground mt-1 block">Horário</span>
                                 </div>
                              </div>
                           </div>
                           <div className="space-y-3">
                              <label className="text-[12px] font-bold text-obsidian uppercase tracking-wider">Canais de Envio</label>
                              <div className="space-y-2">
                                 <label className="flex items-center gap-3 text-sm font-medium text-obsidian cursor-pointer hover:bg-slate-50 p-1.5 -ml-1.5 rounded-md transition-colors">
                                    <input type="checkbox" defaultChecked className="accent-indigo-600 w-4 h-4 rounded border-slate-300" />
                                    <Mail className="w-4 h-4 text-slate-400" /> E-mail Jurídico
                                 </label>
                                 <label className="flex items-center gap-3 text-sm font-medium text-obsidian cursor-pointer hover:bg-slate-50 p-1.5 -ml-1.5 rounded-md transition-colors">
                                    <input type="checkbox" defaultChecked className="accent-indigo-600 w-4 h-4 rounded border-slate-300" />
                                    <MessageSquare className="w-4 h-4 text-emerald-500" /> WhatsApp Prioritário
                                 </label>
                              </div>
                           </div>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            </div>
          )}


          {/* TAB 2: TEMPLATES DE MENSAGEM */}
          {activeTab === 'templates' && (
            <div className="space-y-5 animate-in fade-in duration-300">
               <div className="flex flex-col space-y-1 mb-4">
                  <h3 className="text-xl font-heading font-extrabold text-obsidian">Templates de mensagem</h3>
                  <p className="text-sm text-muted-foreground">Edite as mensagens enviadas automaticamente em cada etapa da cobrança.</p>
               </div>

               {/* Active Chips Bar */}
               <div className="p-4 rounded-xl border border-border bg-white shadow-sm space-y-2">
                  <p className="text-[12px] font-bold text-obsidian uppercase tracking-wider">Variáveis Dinâmicas</p>
                  <div className="flex flex-wrap gap-2">
                     {['{nome}', '{empresa}', '{fatura}', '{valor}', '{vencimento}', '{dias_atraso}', '{pix_copia_cola}'].map(tag => (
                        <button key={tag} onClick={() => handleInsertVariable(tag)} className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 font-mono text-[11px] font-semibold border border-transparent hover:border-indigo-100 transition-all cursor-copy">
                           {tag}
                        </button>
                     ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">Clique para copiar uma variável para o seu template.</p>
               </div>

               <div className="grid lg:grid-cols-2 gap-6 pt-2">
                  {/* Template Card 1 */}
                  <Card className="bg-white shadow-sm border-border/80 flex flex-col h-full">
                     <CardHeader className="p-5 border-b border-border/50 bg-[#FAFAFB]">
                        <div className="flex items-center justify-between">
                           <CardTitle className="text-[14px] flex items-center gap-2 font-bold text-obsidian">
                              Lembrete antes do vencimento <span className="text-muted-foreground text-xs font-normal">• WhatsApp</span>
                           </CardTitle>
                           <MessageSquare className="w-4 h-4 text-emerald-500" />
                        </div>
                        <CardDescription className="text-xs pt-1">Disparado 3 dias antes da data estipulada.</CardDescription>
                     </CardHeader>
                     <CardContent className="p-0 flex-1 relative bg-slate-50/30">
                        {/* Fake WhatsApp Message Preview Vibe */}
                        <div className="p-5">
                           <div className="relative">
                              <textarea
                                 className="w-full h-[220px] bg-[#E7FFDB] text-[#202C33] p-3.5 rounded-xl rounded-tl-none text-[13px] leading-relaxed shadow-sm border border-emerald-100/50 resize-none font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                                 value={wpText}
                                 onChange={(e) => setWpText(e.target.value)}
                                 onFocus={() => setActiveField('wp')}
                              />
                              <Button variant="ghost" size="icon" className="absolute top-2 right-2 w-7 h-7 bg-white/50 hover:bg-white text-slate-800 rounded-md">
                                 <Plus className="w-3.5 h-3.5" />
                              </Button>
                           </div>
                        </div>
                     </CardContent>
                     <CardFooter className="p-4 border-t border-border/50 bg-white gap-3">
                        <Button variant="outline" className="w-full text-xs font-semibold" onClick={() => handleRestore('wp')}>Restaurar padrão</Button>
                        <Button variant="secondary" className="w-full text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100" onClick={() => showToast('Mensagem de teste do WhatsApp disparada com sucesso.')}>Testar mensagem</Button>
                     </CardFooter>
                  </Card>

                  {/* Template Card 2 */}
                  <Card className="bg-white shadow-sm border-border/80 flex flex-col h-full">
                     <CardHeader className="p-5 border-b border-border/50 bg-[#FAFAFB]">
                        <div className="flex items-center justify-between">
                           <CardTitle className="text-[14px] flex items-center gap-2 font-bold text-obsidian">
                              Cobrança em atraso suportado <span className="text-muted-foreground text-xs font-normal">• E-mail</span>
                           </CardTitle>
                           <Mail className="w-4 h-4 text-slate-400" />
                        </div>
                        <CardDescription className="text-xs pt-1">Disparado na cadência D+1, D+3, etc.</CardDescription>
                     </CardHeader>
                     <CardContent className="p-5 flex-1 space-y-3">
                        <Input defaultValue="Identificamos pendência na fatura {fatura}" className="bg-white border-border/80 font-medium text-xs h-9" />
                        <textarea 
                           className="w-full h-[180px] p-4 text-[13px] leading-relaxed rounded-xl border border-border/80 bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-medium" 
                           value={emailText}
                           onChange={(e) => setEmailText(e.target.value)}
                           onFocus={() => setActiveField('email')}
                        />
                     </CardContent>
                     <CardFooter className="p-4 border-t border-border/50 bg-white gap-3">
                        <Button variant="outline" className="w-full text-xs font-semibold" onClick={() => handleRestore('email')}>Restaurar padrão</Button>
                        <Button variant="secondary" className="w-full text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100" onClick={() => showToast('Prévia de E-mail disparada para admin@fluxo.com.')}>Testar E-mail</Button>
                     </CardFooter>
                  </Card>

               </div>
            </div>
          )}


          {/* TAB 3: WEBHOOKS E INTEGRAÇÕES */}
          {activeTab === 'webhooks' && (
            <div className="space-y-5 animate-in fade-in duration-300">
               <div className="flex flex-col space-y-1 mb-4">
                  <h3 className="text-xl font-heading font-extrabold text-obsidian">Webhooks e integrações</h3>
                  <p className="text-sm text-muted-foreground">Envie eventos da régua para sistemas externos como ERP, automações e plataformas (Make, n8n).</p>
               </div>

               <div className="flex items-center justify-between pt-2">
                  <h4 className="text-[12px] font-bold text-obsidian uppercase tracking-wider">Endpoints Ativos</h4>
                  <Button variant="outline" className="h-8 text-xs font-semibold gap-2 border-border shadow-sm" onClick={() => showToast('Abrindo modal de novo evento webhook...')}><Plus className="w-3.5 h-3.5"/> Adicionar Evento</Button>
               </div>

               <div className="space-y-4">
                  <Card className="bg-white shadow-sm border-border/80">
                     <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                           <div className="space-y-1.5">
                              <div className="flex items-center gap-3">
                                 <h5 className="font-bold text-obsidian text-[14px]">invoice.paid</h5>
                                 <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none">Ativo</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">Dispara um POST payload quando um Pix ou boleto for compensado.</p>
                           </div>
                           <Button variant="ghost" size="icon" className="text-muted-foreground"><MoreHorizontal className="w-4 h-4"/></Button>
                        </div>
                        <div className="mt-5 space-y-3">
                           <div>
                              <label className="text-[11px] font-bold text-obsidian uppercase tracking-wider mb-1 block">URL do Endpoint de destino</label>
                              <div className="flex gap-2">
                                 <Input defaultValue="https://hook.make.com/xyz123abc9981242" className="bg-[#FAFAFB] text-xs font-mono read-only" />
                                 <Button variant="outline" size="icon" className="w-10 h-10 shrink-0" onClick={() => showToast('URL do webhook copiada para área de transferência!')}><Copy className="w-4 h-4 text-slate-500"/></Button>
                              </div>
                           </div>
                           <div className="flex items-center justify-between pt-2">
                              <p className="text-[11px] text-muted-foreground">Último disparo: <span className="font-medium">Hoje às 09:15</span> (Status 200 OK)</p>
                              <Button variant="link" className="text-indigo-600 text-xs h-auto p-0 font-semibold gap-1.5" onClick={() => showToast('Disparando POST Payload de teste aguarde...')}><PlayCircle className="w-3.5 h-3.5" /> Testar Webhook</Button>
                           </div>
                        </div>
                     </CardContent>
                  </Card>

                  <Card className="bg-white shadow-sm border-border/80">
                     <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                           <div className="space-y-1.5">
                              <div className="flex items-center gap-3">
                                 <h5 className="font-bold text-obsidian text-[14px]">invoice.overdue_critical</h5>
                                 <Badge variant="outline" className="text-slate-500 border-slate-200">Inativo</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">Acionado no evento de atraso severo para bloquear licença no seu ERP de forma automática.</p>
                           </div>
                           <Button variant="ghost" size="icon" className="text-muted-foreground"><MoreHorizontal className="w-4 h-4"/></Button>
                        </div>
                        <div className="mt-5 space-y-3 opacity-50">
                           <div>
                              <label className="text-[11px] font-bold text-obsidian uppercase tracking-wider mb-1 block">Secret Header (Bearer)</label>
                              <div className="flex gap-2">
                                 <Input type="password" defaultValue="token12345" className="bg-[#FAFAFB] text-xs font-mono" />
                              </div>
                           </div>
                        </div>
                     </CardContent>
                  </Card>
               </div>
            </div>
          )}


          {/* TAB 4: HISTÓRICO DE DISPAROS */}
          {activeTab === 'logs' && (
            <div className="space-y-5 animate-in fade-in duration-300">
               <div className="flex flex-col space-y-1 mb-4">
                  <h3 className="text-xl font-heading font-extrabold text-obsidian">Histórico de disparos</h3>
                  <p className="text-sm text-muted-foreground">Acompanhe os envios mais recentes da régua, com status, canal, horário e detalhes.</p>
               </div>

               {/* Filters / Search Bar */}
               <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                     <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                     <Input placeholder="Buscar por cliente, fatura ou e-mail..." className="pl-9 h-10 bg-white border-border/80 shadow-sm text-sm" />
                  </div>
                  <Button variant="outline" className="h-10 border-border/80 shadow-sm text-sm shrink-0 font-semibold text-slate-600 gap-2" onClick={() => showToast('Aba lateral de filtros detalhados abriria aqui.')}>
                     <Filter className="w-4 h-4" /> Filtros avançados
                  </Button>
               </div>

               <Card className="bg-white shadow-sm border border-border/80 overflow-hidden">
                  <table className="w-full text-[13px] text-left">
                     <thead className="bg-[#FAFAFB] text-muted-foreground text-[11px] font-bold uppercase tracking-wider border-b border-border/60">
                        <tr>
                          <th className="py-4 px-5">Status</th>
                          <th className="py-4 px-5">Data/Hora</th>
                          <th className="py-4 px-5">Destinatário</th>
                          <th className="py-4 px-5">Ação/Canal</th>
                          <th className="py-4 px-5 text-right"></th>
                        </tr>
                     </thead>
                     <tbody className="font-medium text-obsidian">
                        <tr className="border-b border-border/30 hover:bg-slate-50 transition-colors group">
                          <td className="py-3.5 px-5">
                             <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-[11px] font-bold"><Check className="w-3 h-3"/> Sucesso</div>
                          </td>
                          <td className="py-3.5 px-5 text-muted-foreground">Hoje, 09:00</td>
                          <td className="py-3.5 px-5">
                             <p>Borda Tech Ltda</p>
                             <p className="text-[11px] text-muted-foreground font-normal">Fatura #INV-9921</p>
                          </td>
                          <td className="py-3.5 px-5">
                             <span className="flex items-center gap-1.5 text-emerald-600"><MessageSquare className="w-3.5 h-3.5"/> WhatsApp Pós-ven.</span>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                             <Button variant="ghost" size="icon" className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { setSelectedLog({ status: 'Sucesso', date: 'Hoje, 09:00', client: 'Borda Tech Ltda', invoice: 'INV-9921', channel: 'WhatsApp Pós-ven.', payload: '{"event": "message.sent", "to": "551199999999", "status": "delivered", "template": "remind_due"}' }); setIsLogModalOpen(true); }}><Eye className="w-4 h-4 m-0" /></Button>
                          </td>
                        </tr>
                        
                        <tr className="border-b border-border/30 hover:bg-slate-50 transition-colors group">
                          <td className="py-3.5 px-5">
                             <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 text-slate-700 text-[11px] font-bold"><UploadCloud className="w-3 h-3"/> Enfileirado</div>
                          </td>
                          <td className="py-3.5 px-5 text-muted-foreground">Hoje, 09:05</td>
                          <td className="py-3.5 px-5">
                             <p>Alfa Indústria</p>
                             <p className="text-[11px] text-muted-foreground font-normal">Fatura #INV-1022</p>
                          </td>
                          <td className="py-3.5 px-5">
                             <span className="flex items-center gap-1.5 text-slate-600"><Mail className="w-3.5 h-3.5"/> Lembrete Email</span>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                             <Button variant="ghost" size="icon" className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { setSelectedLog({ status: 'Enfileirado', date: 'Hoje, 09:05', client: 'Alfa Indústria', invoice: 'INV-1022', channel: 'Lembrete Email', payload: '{"event": "email.queued", "to": "contato@alfa.com", "status": "pending", "provider": "aws_ses"}' }); setIsLogModalOpen(true); }}><Eye className="w-4 h-4 m-0" /></Button>
                          </td>
                        </tr>

                        <tr className="border-b border-border/30 hover:bg-slate-50 transition-colors group">
                          <td className="py-3.5 px-5">
                             <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-rose-50 text-rose-700 text-[11px] font-bold"><AlertTriangle className="w-3 h-3"/> Falha</div>
                          </td>
                          <td className="py-3.5 px-5 text-muted-foreground">Ontem, 16:30</td>
                          <td className="py-3.5 px-5">
                             <p>Norte Frios</p>
                             <p className="text-[11px] text-muted-foreground font-normal">Fatura #INV-4399</p>
                          </td>
                          <td className="py-3.5 px-5">
                             <span className="flex items-center gap-1.5 text-rose-600"><Mail className="w-3.5 h-3.5"/> Email Bounced</span>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                             <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" title="Tentar Novamente" className="w-8 h-8 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => showToast('Comando de Re-tentativa forçada foi disparado!')}><RefreshCw className="w-3.5 h-3.5 m-0" /></Button>
                                <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => { setSelectedLog({ status: 'Falha', date: 'Ontem, 16:30', client: 'Norte Frios', invoice: 'INV-4399', channel: 'Email Bounced', payload: '{"event": "email.failed", "error": "soft_bounce", "reason": "mailbox_full", "provider_message": "552 5.2.2 Quota exceeded (mailbox for user is full)"}' }); setIsLogModalOpen(true); }}><Eye className="w-4 h-4 m-0" /></Button>
                             </div>
                          </td>
                        </tr>
                     </tbody>
                  </table>
               </Card>
            </div>
          )}

        </div>
      </div>

      {/* LOG MODAL OVERLAY */}
      {isLogModalOpen && selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-obsidian/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
              <div className="flex items-center justify-between p-5 border-b border-border/60 bg-[#FAFAFB]">
                 <div>
                    <h3 className="font-heading font-extrabold text-obsidian text-lg">Detalhes da Transação</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">ID Interno de rastreio de disparo</p>
                 </div>
                 <Button variant="ghost" size="icon" className="rounded-full w-8 h-8 hover:bg-slate-200 text-slate-500" onClick={() => setIsLogModalOpen(false)}>
                    <X className="w-4 h-4" />
                 </Button>
              </div>
              <div className="p-6 space-y-5">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cliente / Fatura</span>
                       <span className="block text-sm font-semibold text-obsidian">{selectedLog.client}</span>
                       <span className="block text-xs text-muted-foreground">{selectedLog.invoice}</span>
                    </div>
                    <div>
                       <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Timing da Execução</span>
                       <span className="block text-sm font-semibold text-obsidian">{selectedLog.date}</span>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payload Registrado (Raw JSON)</span>
                    <div className="bg-[#1E1E1E] rounded-lg p-4 font-mono text-[11px] text-[#D4D4D4] whitespace-pre-wrap leading-relaxed overflow-x-auto shadow-inner border border-obsidian/20">
                       {JSON.stringify(JSON.parse(selectedLog.payload), null, 2)}
                    </div>
                 </div>
              </div>
              <div className="p-4 border-t border-border/60 bg-[#FAFAFB] flex justify-end">
                 <Button variant="outline" className="text-xs font-semibold" onClick={() => setIsLogModalOpen(false)}>Fechar Log</Button>
              </div>
           </div>
        </div>
      )}

      {/* CUSTOM TOAST NOTIFICATION FOR UX FEEDBACK */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-slate-900 text-white px-5 py-3 rounded-lg shadow-xl shadow-slate-900/20 font-medium text-[13px] flex items-center gap-3 border border-slate-700">
             <CheckCircle className="w-4 h-4 text-emerald-400" />
             {toastMessage}
          </div>
        </div>
      )}

    </div>
  )
}
