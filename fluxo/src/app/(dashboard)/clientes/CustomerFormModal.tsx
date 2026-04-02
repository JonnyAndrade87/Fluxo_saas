'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Loader2, X, Building2, UserCircle2 } from "lucide-react";
import { upsertCustomer } from '@/actions/customers';

interface Props {
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
}

// Helpers for masking
const maskDocument = (val: string) => {
  let v = val.replace(/\D/g, '');
  if (v.length <= 11) {
    // CPF Mask
    return v.replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    // CNPJ Mask
    return v.replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
  }
};

const maskPhone = (val: string) => {
  let v = val.replace(/\D/g, '');
  if (v.length <= 10) {
    // Landline: (11) 4000-1234
    return v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  } else {
    // Mobile: (11) 94000-1234
    return v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2').substring(0, 15);
  }
};

export default function CustomerFormModal({ initialData, onClose, onSuccess }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    id: initialData?.id || '',
    name: initialData?.name || '',
    documentNumber: initialData?.documentNumber || '',
    status: initialData?.status || 'active',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    tags: initialData?.tags || '',
    notes: initialData?.notes || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
     let value = e.target.value;
     if (e.target.name === 'documentNumber') {
       value = maskDocument(value);
     }
     if (e.target.name === 'phone') {
       value = maskPhone(value);
     }
     setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await upsertCustomer(formData);
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar cliente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-obsidian/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-border/60 overflow-hidden animate-in zoom-in-95 duration-300">
        
        <div className="px-6 py-4 border-b border-border/50 bg-[#FAFAFB] flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                 {formData.id ? <UserCircle2 className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
              </div>
              <div>
                 <h2 className="text-sm font-bold text-obsidian font-heading">{formData.id ? 'Editar Cliente' : 'Novo Cliente (Sacado)'}</h2>
                 <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-0.5">Dossiê Financeiro B2B</p>
              </div>
           </div>
           <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-slate-400 hover:text-rose-500 rounded-full">
              <X className="w-4 h-4" />
           </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
           
           <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2 col-span-2">
                 <label className="text-xs font-bold text-slate-600 uppercase tracking-widest block">Razão Social / Nome</label>
                 <Input required name="name" value={formData.name} onChange={handleChange} placeholder="Ex: Alfa Indústria LTDA" className="shadow-sm" />
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-600 uppercase tracking-widest block">CNPJ ou CPF</label>
                 <Input required name="documentNumber" value={formData.documentNumber} onChange={handleChange} placeholder="00.000.000/0001-00" className="shadow-sm font-mono text-sm" />
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-600 uppercase tracking-widest block">Status Inicial</label>
                 <select required name="status" value={formData.status} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500">
                    <option value="active">🟢 Ativo (Apto a faturar)</option>
                    <option value="inactive">⚪️ Inativo</option>
                    <option value="blocklisted">🔴 Bloqueado (Risco)</option>
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-600 uppercase tracking-widest block">E-mail Principal</label>
                 <Input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="contato@empresa.com" className="shadow-sm" />
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-600 uppercase tracking-widest block">Telefone / WhatsApp</label>
                 <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="(11) 99999-9999" className="shadow-sm" />
              </div>
              <div className="space-y-2 col-span-2">
                 <label className="text-xs font-bold text-slate-600 uppercase tracking-widest block">Endereço Completo</label>
                 <Input name="address" value={formData.address} onChange={handleChange} placeholder="Av Paulista, 1000 - São Paulo, SP" className="shadow-sm" />
              </div>
              <div className="space-y-2 col-span-2">
                 <label className="text-xs font-bold text-slate-600 uppercase tracking-widest block">Segmentação / Tags (Opcional)</label>
                 <Input name="tags" value={formData.tags} onChange={handleChange} placeholder="Revenda, Tecnologia, Key Account" className="shadow-sm text-indigo-600" />
                 <p className="text-[10px] text-muted-foreground">Separe por vírgulas para múltiplos rótulos.</p>
              </div>
              <div className="space-y-2 col-span-2">
                 <label className="text-xs font-bold text-slate-600 uppercase tracking-widest block">Observações Internas (SDR / Closer)</label>
                 <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Restrições contratuais, limite de crédito, etc." className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 resize-none h-20" />
              </div>
           </div>

           <div className="pt-4 flex items-center justify-end gap-3 border-t border-border/50">
              <Button type="button" variant="ghost" onClick={onClose} className="font-semibold text-slate-600">Cancelar</Button>
              <Button type="submit" disabled={isSaving} className="font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 px-8">
                 {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                 {isSaving ? 'Salvando...' : 'Salvar Dossiê'}
              </Button>
           </div>
        </form>

      </div>
    </div>
  );
}
