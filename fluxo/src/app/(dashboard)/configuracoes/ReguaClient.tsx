'use client';

import { useState, useEffect } from 'react';
import { saveBillingFlow, getBillingFlow } from '@/actions/automation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, Mail, Zap, CheckCircle, Save, Loader2, FileText, Activity, 
  UploadCloud, Search, Filter, Eye, MoreHorizontal, History, PlayCircle, Plus, Copy, Check, X
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

  // Flow State
  const [flowData, setFlowData] = useState<any>(null);
  const [activeTemplateStage, setActiveTemplateStage] = useState('pre');
  const [activeTemplateField, setActiveTemplateField] = useState<'whatsapp' | 'email'>('whatsapp');

  // Logs Modal Data
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    getBillingFlow().then(data => {
      if (data && data.stages) {
         setFlowData(data);
      }
    }).catch(() => console.error("Could not load billing flows."));
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const updateStage = (id: string, field: string, value: any) => {
     setFlowData((prev: any) => ({
        ...prev,
        stages: prev.stages.map((s: any) => s.id === id ? { ...s, [field]: value } : s)
     }));
  };

  const updateStageChannel = (id: string, channel: 'email' | 'whatsapp', value: boolean) => {
     setFlowData((prev: any) => ({
        ...prev,
        stages: prev.stages.map((s: any) => s.id === id ? { 
           ...s, 
           channels: { ...s.channels, [channel]: value } 
        } : s)
     }));
  }

  const updateTemplate = (id: string, channel: 'email' | 'whatsapp', text: string) => {
     setFlowData((prev: any) => ({
        ...prev,
        stages: prev.stages.map((s: any) => s.id === id ? { 
           ...s, 
           templates: { ...s.templates, [channel]: text } 
        } : s)
     }));
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
    if (!flowData) return;
    setIsSaving(true);
    setSaved(false);
    
    try {
       await saveBillingFlow(flowData);
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
    const currentText = flowData.stages.find((s:any) => s.id === activeTemplateStage).templates[activeTemplateField];
    updateTemplate(activeTemplateStage, activeTemplateField, currentText + ' ' + variable);
    showToast(`Variável ${variable} inserida com sucesso!`);
  };

  // Stage Color map
  const STAGE_COLORS: any = {
     'pre': 'bg-emerald-400',
     'dia': 'bg-indigo-500',
     'pos1': 'bg-amber-400',
     'pos2': 'bg-orange-500',
     'pos3': 'bg-rose-600'
  };

  if (!flowData) return <div className="p-8 flex items-center justify-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-10">
      
      {/* GLOBAL HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-1">
             <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100/50 text-[11px] font-bold text-emerald-700 uppercase tracking-widest shadow-sm shadow-emerald-500/5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Automação Ativa
             </div>
             <span className="text-[11px] font-medium text-muted-foreground">Última atualização: Hoje</span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-obsidian pb-1">Régua de Cobrança 2.0</h1>
          <p className="text-muted-foreground text-[15px] max-w-xl leading-relaxed">
            Configure as 5 camadas dinâmicas de comunicação financeira.
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
            {isSaving ? 'Aplicando...' : saved ? 'Publicado com Sucesso!' : 'Salvar & Publicar'}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 min-h-[600px]">
        {/* SIDEBAR NAVIGATION */}
        <div className="lg:col-span-3 space-y-2">
          <nav className="flex flex-col gap-1.5 sticky top-6">
            <button onClick={() => setActiveTab('regua')} className={`w-full text-left font-semibold px-4 py-3 rounded-lg text-[14px] flex items-center gap-3 transition-colors ${activeTab === 'regua' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-obsidian'}`}>
              <Activity className="w-4 h-4" /> Sequência da régua
            </button>
            <button onClick={() => setActiveTab('templates')} className={`w-full text-left font-semibold px-4 py-3 rounded-lg text-[14px] flex items-center gap-3 transition-colors ${activeTab === 'templates' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-obsidian'}`}>
              <FileText className="w-4 h-4" /> Templates (Stages)
            </button>
            <button onClick={() => setActiveTab('webhooks')} className={`w-full text-left font-semibold px-4 py-3 rounded-lg text-[14px] flex items-center gap-3 transition-colors ${activeTab === 'webhooks' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-obsidian'}`}>
              <Zap className="w-4 h-4" /> Integrações (Webhooks)
            </button>
            <button onClick={() => setActiveTab('logs')} className={`w-full text-left font-semibold px-4 py-3 rounded-lg text-[14px] flex items-center gap-3 transition-colors ${activeTab === 'logs' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-obsidian'}`}>
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
                  <h3 className="text-xl font-heading font-extrabold text-obsidian">As 5 Etapas do Funil</h3>
                  <p className="text-sm text-muted-foreground">Controle do ciclo de vida da cobrança, ativando e definindo o timing de cada momento.</p>
               </div>

               {flowData.stages.map((stage: any, index: number) => (
                  <div key={stage.id}>
                     <Card className={`relative overflow-hidden bg-white shadow-sm border-border/80 transition-all duration-300 ${!stage.active && 'opacity-60 saturate-50'}`}>
                        {stage.active && <div className={`absolute top-0 left-0 w-1 h-full ${STAGE_COLORS[stage.id]}`} />}
                        <CardContent className="p-6">
                           <div className="flex flex-col lg:flex-row gap-8">
                              {/* Information Block */}
                              <div className="lg:w-[35%] space-y-4">
                                 <div>
                                    <div className="flex items-center gap-2 mb-1">
                                       <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-none font-semibold text-[10px] tracking-wider uppercase px-2">{stage.active ? 'Ativado' : 'Inativo por Padrão'}</Badge>
                                    </div>
                                    <h4 className="font-heading font-bold text-base text-obsidian mt-2">{stage.name}</h4>
                                    <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">{stage.description}</p>
                                 </div>
                                 <CustomToggle checked={stage.active} onChange={(val) => updateStage(stage.id, 'active', val)} />
                              </div>
                              {/* Settings Block */}
                              <div className={`lg:w-[65%] grid lg:grid-cols-2 gap-6 ${!stage.active && 'pointer-events-none'}`}>
                                 <div className="space-y-2">
                                    <label className="text-[12px] font-bold text-obsidian uppercase tracking-wider">Timing do Disparo</label>
                                    <div className="flex gap-3">
                                       <div className="flex-1">
                                          <Input value={stage.days} onChange={(e) => updateStage(stage.id, 'days', parseInt(e.target.value) || 0)} type="number" className="h-10 bg-slate-50/50 shadow-sm" />
                                          <span className="text-[11px] text-muted-foreground mt-1 block">Dias (ex: -3 = Pré)</span>
                                       </div>
                                       <div className="flex-1">
                                          <Input value={stage.time} onChange={(e) => updateStage(stage.id, 'time', e.target.value)} type="time" className="h-10 bg-slate-50/50 shadow-sm" />
                                          <span className="text-[11px] text-muted-foreground mt-1 block">Horário exato</span>
                                       </div>
                                    </div>
                                 </div>
                                 <div className="space-y-3">
                                    <label className="text-[12px] font-bold text-obsidian uppercase tracking-wider">Canais Ativos</label>
                                    <div className="space-y-2">
                                       <label className="flex items-center gap-3 text-sm font-medium text-obsidian cursor-pointer hover:bg-slate-50 p-1.5 -ml-1.5 rounded-md transition-colors">
                                          <input type="checkbox" checked={stage.channels.email} onChange={(e) => updateStageChannel(stage.id, 'email', e.target.checked)} className="accent-indigo-600 w-4 h-4 rounded border-slate-300" />
                                          <Mail className="w-4 h-4 text-slate-400" /> E-mail Jurídico
                                       </label>
                                       <label className="flex items-center gap-3 text-sm font-medium text-obsidian cursor-pointer hover:bg-slate-50 p-1.5 -ml-1.5 rounded-md transition-colors">
                                          <input type="checkbox" checked={stage.channels.whatsapp} onChange={(e) => updateStageChannel(stage.id, 'whatsapp', e.target.checked)} className="accent-indigo-600 w-4 h-4 rounded border-slate-300" />
                                          <MessageSquare className="w-4 h-4 text-emerald-500" /> WhatsApp
                                       </label>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </CardContent>
                     </Card>
                     {/* Separator / Arrow logic except for last element */}
                     {index !== flowData.stages.length - 1 && (
                        <div className="w-px h-6 bg-border mx-auto" />
                     )}
                  </div>
               ))}
            </div>
          )}


          {/* TAB 2: TEMPLATES DE MENSAGEM */}
          {activeTab === 'templates' && (
            <div className="space-y-5 flex flex-col min-h-full animate-in fade-in duration-300">
               <div className="flex flex-col space-y-1 mb-4">
                  <h3 className="text-xl font-heading font-extrabold text-obsidian">Templates (Copywriting)</h3>
                  <p className="text-sm text-muted-foreground">Personalize as mensagens para as 5 fases da régua.</p>
               </div>

               {/* Stage Selection Tabs */}
               <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
                 {flowData.stages.map((stage: any) => (
                    <button 
                      key={`btn-${stage.id}`}
                      onClick={() => setActiveTemplateStage(stage.id)}
                      className={`px-4 py-2 shrink-0 rounded-full text-xs font-bold border transition-all ${
                        activeTemplateStage === stage.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {stage.name}
                    </button>
                 ))}
               </div>

               {/* Active Chips Bar */}
               <div className="p-4 rounded-xl border border-border bg-white shadow-sm space-y-2">
                  <p className="text-[12px] font-bold text-obsidian uppercase tracking-wider">Variáveis Dinâmicas Globais</p>
                  <div className="flex flex-wrap gap-2">
                     {['{nome}', '{empresa}', '{fatura}', '{valor}', '{vencimento}', '{dias_atraso}', '{pix_copia_cola}'].map(tag => (
                        <button key={`var-${tag}`} onClick={() => handleInsertVariable(tag)} className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 font-mono text-[11px] font-semibold border border-transparent hover:border-indigo-100 transition-all cursor-copy">
                           {tag}
                        </button>
                     ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">Clique para copiar a variável para o foco ativo ({activeTemplateField}).</p>
               </div>

               {/* Template Editors for Active Stage */}
               {flowData.stages.map((stage: any) => stage.id === activeTemplateStage && (
                  <div key={`edit-${stage.id}`} className="grid lg:grid-cols-2 gap-6 pt-2 animate-in slide-in-from-right-2 duration-300">
                     {/* Template Card 1 - WhatsApp */}
                     <Card className="bg-white shadow-sm border-border/80 flex flex-col h-full opacity-100">
                        <CardHeader className="p-5 border-b border-border/50 bg-[#FAFAFB]">
                           <div className="flex items-center justify-between">
                              <CardTitle className="text-[14px] flex items-center gap-2 font-bold text-obsidian">
                                 Draft de WhatsApp <span className="text-muted-foreground text-xs font-normal">• D{stage.days > 0 ? '+'+stage.days : stage.days}</span>
                              </CardTitle>
                              <MessageSquare className={`w-4 h-4 ${stage.channels.whatsapp ? 'text-emerald-500' : 'text-slate-300'}`} />
                           </div>
                           <CardDescription className="text-xs pt-1">{!stage.channels.whatsapp ? 'O canal não está ativado.' : ''}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 relative bg-slate-50/30">
                           <div className="p-5">
                              <div className="relative">
                                 <textarea
                                    className={`w-full h-[250px] bg-[#E7FFDB] text-[#202C33] p-3.5 rounded-xl rounded-tl-none text-[13px] leading-relaxed shadow-sm border resize-none font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400/50 ${activeTemplateField === 'whatsapp' ? 'border-emerald-400' : 'border-emerald-100/50'} ${!stage.channels.whatsapp && 'opacity-50'}`}
                                    value={stage.templates.whatsapp}
                                    onChange={(e) => updateTemplate(stage.id, 'whatsapp', e.target.value)}
                                    onFocus={() => setActiveTemplateField('whatsapp')}
                                 />
                              </div>
                           </div>
                        </CardContent>
                     </Card>

                     {/* Template Card 2 - Email */}
                     <Card className="bg-white shadow-sm border-border/80 flex flex-col h-full">
                        <CardHeader className="p-5 border-b border-border/50 bg-[#FAFAFB]">
                           <div className="flex items-center justify-between">
                              <CardTitle className="text-[14px] flex items-center gap-2 font-bold text-obsidian">
                                 Draft de E-mail <span className="text-muted-foreground text-xs font-normal">• D{stage.days > 0 ? '+'+stage.days : stage.days}</span>
                              </CardTitle>
                              <Mail className={`w-4 h-4 ${stage.channels.email ? 'text-slate-400' : 'text-slate-200'}`} />
                           </div>
                           <CardDescription className="text-xs pt-1">{!stage.channels.email ? 'O canal não está ativado.' : ''}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 flex-1 space-y-3">
                           <Input defaultValue={`Aviso Importante: Referente à Fatura {fatura}`} readOnly className="bg-slate-50 border-border/80 font-medium text-xs h-9 text-slate-500" />
                           <textarea 
                              className={`w-full h-[202px] p-4 text-[13px] leading-relaxed rounded-xl border bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-medium ${activeTemplateField === 'email' ? 'border-indigo-500' : 'border-border/80'} ${!stage.channels.email && 'opacity-50'}`} 
                              value={stage.templates.email}
                              onChange={(e) => updateTemplate(stage.id, 'email', e.target.value)}
                              onFocus={() => setActiveTemplateField('email')}
                           />
                        </CardContent>
                     </Card>
                  </div>
               ))}
            </div>
          )}


          {/* TAB 3: WEBHOOKS E INTEGRAÇÕES (Kept Original) */}
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
               </div>
            </div>
          )}


          {/* TAB 4: HISTÓRICO DE DISPAROS (Kept Original) */}
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
                             <span className="flex items-center gap-1.5 text-emerald-600"><MessageSquare className="w-3.5 h-3.5"/> WhatsApp Pós-ven.</span>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                             <Button variant="ghost" size="icon" className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { setSelectedLog({ status: 'Sucesso', date: 'Hoje, 09:00', client: 'Borda Tech Ltda', invoice: 'INV-9921', channel: 'WhatsApp Pós-ven.', payload: '{"event": "message.sent", "to": "551199999999", "status": "delivered", "template": "remind_due"}' }); setIsLogModalOpen(true); }}><Eye className="w-4 h-4 m-0" /></Button>
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
                 <div className="bg-[#1E1E1E] rounded-lg p-4 font-mono text-[11px] text-[#D4D4D4] whitespace-pre-wrap leading-relaxed overflow-x-auto shadow-inner border border-obsidian/20">
                    {JSON.stringify(JSON.parse(selectedLog.payload), null, 2)}
                 </div>
              </div>
              <div className="p-4 border-t border-border/60 bg-[#FAFAFB] flex justify-end">
                 <Button variant="outline" className="text-xs font-semibold" onClick={() => setIsLogModalOpen(false)}>Fechar Log</Button>
              </div>
           </div>
        </div>
      )}

      {/* CUSTOM TOAST NOTIFICATION */}
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
