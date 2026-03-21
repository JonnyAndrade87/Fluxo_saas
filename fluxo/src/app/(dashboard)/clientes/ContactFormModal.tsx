'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Loader2, X, User } from "lucide-react";
import { upsertFinancialContact } from '@/actions/customers';

interface Props {
  customerId: string;
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ContactFormModal({ customerId, initialData, onClose, onSuccess }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    id: initialData?.id || '',
    customerId,
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    isPrimary: initialData?.isPrimary || false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
     setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await upsertFinancialContact(formData);
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar contato.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-obsidian/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-border/60 overflow-hidden animate-in zoom-in-95 duration-300">
        
        <div className="px-5 py-4 border-b border-border/50 bg-[#FAFAFB] flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                 <User className="w-3.5 h-3.5" />
              </div>
              <div>
                 <h2 className="text-sm font-bold text-obsidian">{formData.id ? 'Editar Contato' : 'Novo Contato'}</h2>
                 <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Vínculo com Empresa</p>
              </div>
           </div>
           <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-slate-400 hover:text-rose-500 rounded-full">
              <X className="w-4 h-4" />
           </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
           
           <div className="space-y-4">
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-600 uppercase tracking-widest block">Nome do Contato</label>
                 <Input required name="name" value={formData.name} onChange={handleChange} placeholder="Ex: Maria Financeiro" className="shadow-sm" />
              </div>
              
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-600 uppercase tracking-widest block">E-mail</label>
                 <Input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="maria@empresa.com" className="shadow-sm" />
              </div>
              
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-600 uppercase tracking-widest block">WhatsApp / Telefone</label>
                 <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="(11) 99999-9999" className="shadow-sm" />
              </div>

              <div className="flex items-center gap-2 pt-2">
                 <input 
                    type="checkbox" 
                    id="isPrimary" 
                    name="isPrimary" 
                    checked={formData.isPrimary} 
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                 />
                 <label htmlFor="isPrimary" className="text-xs font-bold text-obsidian cursor-pointer select-none">
                    Definir como contato principal
                 </label>
              </div>
           </div>

           <div className="pt-4 flex items-center justify-end gap-2 border-t border-border/50">
              <Button type="button" variant="ghost" size="sm" onClick={onClose} className="font-semibold text-slate-600">Cancelar</Button>
              <Button type="submit" size="sm" disabled={isSaving} className="font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20 px-6">
                 {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
                 {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
           </div>
        </form>

      </div>
    </div>
  );
}
