'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, CheckCircle, Wallet, Calendar, FileText, UserSquare2, Loader2, Edit3 } from "lucide-react";
import { createInvoice, updateInvoice, getCustomersForSelect } from "@/actions/invoices";

// A Custom Hook to listen to global open events
export function useOpenInvoiceModal() {
  const triggerModal = (invoiceData?: any) => {
    window.dispatchEvent(new CustomEvent('open-new-invoice-modal', { detail: { invoice: invoiceData } }));
  };
  return triggerModal;
}

export default function NewInvoiceModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Data
  const [customers, setCustomers] = useState<{id: string, name: string, documentNumber: string}[]>([]);
  
  // Form State
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [success, setSuccess] = useState(false);

  const formatCurrencyInput = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    const floatValue = parseInt(digits, 10) / 100;
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(floatValue);
  };

  useEffect(() => {
    const handleOpen = async (e: any) => {
      setIsOpen(true);
      setSuccess(false);
      
      const invoice = e.detail?.invoice;
      if (invoice) {
        setInvoiceId(invoice.id);
        setCustomerId(invoice.customerId || e.detail?.customerId || '');
        setAmount(formatCurrencyInput(invoice.amount.toFixed(2).replace('.', '')));
        // Format date to YYYY-MM-DD for input type="date"
        try {
           const d = new Date(invoice.dueDate);
           setDueDate(d.toISOString().split('T')[0]);
        } catch(e) { setDueDate(''); }
        setDescription(invoice.description || '');
      } else {
        setInvoiceId(null);
        setCustomerId(e.detail?.customerId || '');
        setAmount(''); 
        setDueDate(''); 
        setDescription('');
      }
      
      try {
         const data = await getCustomersForSelect();
         setCustomers(data);
      } catch (err) {
         console.error(err);
      }
    };

    window.addEventListener('open-new-invoice-modal', handleOpen);
    return () => window.removeEventListener('open-new-invoice-modal', handleOpen);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !amount || !dueDate) return;

    // Convert BRL formatting "1.500,50" back to float 1500.50
    const parsedAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
    
    startTransition(async () => {
      try {
        if (invoiceId) {
           await updateInvoice(invoiceId, {
              amount: parsedAmount,
              dueDate,
              description
           });
        } else {
           await createInvoice({
             customerId,
             amount: parsedAmount,
             dueDate,
             description
           });
        }
        setSuccess(true);
        // Auto close after 2 seconds
        setTimeout(() => {
          setIsOpen(false);
        }, 2000);
      } catch (error) {
        console.error("Failed to save Invoice", error);
        alert("Erro ao salvar fatura. Verifique se ela já está paga.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-obsidian/40 backdrop-blur-sm animate-in fade-in duration-300">
       <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 relative border border-border/60">
          
          {/* Header */}
          <div className="bg-[#050B14] text-white p-6 pb-8 relative overflow-hidden">
             <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-indigo-500/20 to-transparent"></div>
             <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="absolute top-4 right-4 rounded-full text-white/50 hover:bg-white/10 hover:text-white z-10 transition-colors">
                <X className="w-5 h-5" />
             </Button>
             
             <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 mb-4 shadow-inner relative z-10">
                {invoiceId ? <Edit3 className="w-5 h-5 text-indigo-300" /> : <Wallet className="w-5 h-5 text-indigo-300" />}
             </div>
             <h2 className="text-2xl font-heading font-extrabold tracking-tight relative z-10">{invoiceId ? 'Editar Cobrança' : 'Emitir Nova Cobrança'}</h2>
             <p className="text-indigo-200/80 text-sm mt-1 max-w-[85%] relative z-10">
               {invoiceId ? 'Ajuste os valores ou data de vencimento deste título.' : 'Gere um título manual e injete na esteira financeira de forma imediata.'}
             </p>
          </div>

          {success ? (
            <div className="p-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in-50">
               <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2 shadow-inner">
                  <CheckCircle className="w-8 h-8" />
               </div>
               <h3 className="text-2xl font-bold text-obsidian tracking-tight">{invoiceId ? 'Cobrança Atualizada!' : 'Cobrança Emitida!'}</h3>
               <p className="text-muted-foreground text-sm">A alteração foi registrada no Painel de Recebíveis e atrelada ao Dossiê do Cliente.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              {/* Cliente Select */}
              <div className="space-y-2">
                 <label className="text-sm font-semibold text-obsidian flex items-center gap-2">
                    <UserSquare2 className="w-4 h-4 text-indigo-500" /> Sacado B2B
                 </label>
                 <select 
                    required
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    disabled={!!invoiceId} // Prevent changing customer when editing
                    className="w-full h-11 px-4 rounded-xl border border-border bg-[#FAFAFB] text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm text-obsidian font-medium disabled:opacity-50"
                 >
                    <option value="" disabled>Selecione um cliente da carteira...</option>
                    {customers.map(c => (
                       <option key={c.id} value={c.id}>{c.name} (CNPJ: {c.documentNumber})</option>
                    ))}
                 </select>
              </div>

              {/* Grid: Valor & Vencimento */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-sm font-semibold text-obsidian flex items-center gap-2">
                       <Wallet className="w-4 h-4 text-emerald-500" /> Valor Principal
                    </label>
                    <div className="relative">
                       <span className="absolute left-4 top-3 text-muted-foreground font-semibold">R$</span>
                       <Input 
                          type="text" 
                          required
                          value={amount}
                          onChange={(e) => setAmount(formatCurrencyInput(e.target.value))}
                          placeholder="0,00" 
                          className="pl-10 h-11 rounded-xl bg-[#FAFAFB] text-obsidian font-mono shadow-sm font-bold text-base" 
                       />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-semibold text-obsidian flex items-center gap-2">
                       <Calendar className="w-4 h-4 text-amber-500" /> Vencimento
                    </label>
                    <Input 
                       type="date" 
                       required
                       value={dueDate}
                       onChange={(e) => setDueDate(e.target.value)}
                       className="h-11 rounded-xl bg-[#FAFAFB] text-obsidian font-mono shadow-sm" 
                    />
                 </div>
              </div>

              {/* Descrição Opcional */}
              <div className="space-y-2">
                 <label className="text-sm font-semibold text-obsidian flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" /> Histórico / Referência <span className="text-xs font-normal text-muted-foreground ml-auto">(Opcional)</span>
                 </label>
                 <Input 
                    type="text" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Consultoria Q3, Licenças Mês 05..." 
                    className="h-11 rounded-xl bg-[#FAFAFB] shadow-sm" 
                 />
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 flex items-center gap-3 border-t border-border/50">
                 <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="flex-1 font-semibold text-muted-foreground">Cancelar</Button>
                 <Button type="submit" disabled={isPending || !customerId || !amount || !dueDate} className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/20">
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (invoiceId ? 'Salvar Edição' : 'Emitir Título')}
                 </Button>
              </div>

            </form>
          )}
       </div>
    </div>
  )
}
