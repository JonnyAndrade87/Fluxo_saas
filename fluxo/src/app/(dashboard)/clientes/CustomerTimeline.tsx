'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquareText, Plus, Loader2, Send } from "lucide-react";
import { addCustomerNote } from '@/actions/customers';

interface Props {
  customerId: string;
  notes: any[];
  communications: any[];
  onNoteAdded: () => void;
}

export default function CustomerTimeline({ customerId, notes, communications, onNoteAdded }: Props) {
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setIsSaving(true);
    try {
      await addCustomerNote(customerId, newNote);
      setNewNote('');
      setIsAddingMode(false);
      onNoteAdded(); // Trigger re-fetch in parent drawer
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar nota.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('pt-BR', { 
       day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
    }).format(new Date(date));
  };

  // Merge notes and communications into a single timeline sorted by date desc
  const combinedTimeline = [
    ...(notes || []).map(n => ({ ...n, _type: 'note', _date: new Date(n.createdAt) })),
    ...(communications || []).map(c => ({ ...c, _type: 'comm', _date: new Date(c.sentAt) }))
  ].sort((a, b) => b._date.getTime() - a._date.getTime());

  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-4 mt-6">
       <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-4">
         <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
           <MessageSquareText className="w-4 h-4 text-indigo-500" /> Timeline & Notas
         </h4>
         {!isAddingMode && (
           <Button variant="outline" size="sm" onClick={() => setIsAddingMode(true)} className="h-7 text-[11px] gap-1">
             <Plus className="w-3 h-3" /> Adicionar Nota
           </Button>
         )}
       </div>

       {isAddingMode && (
         <div className="mb-6 bg-slate-50 p-3 rounded-lg border border-border/50">
           <textarea 
             autoFocus
             value={newNote}
             onChange={e => setNewNote(e.target.value)}
             placeholder="Escreva uma observação (ex: Cliente prometeu pagar sexta-feira...)"
             className="w-full text-sm resize-none bg-transparent outline-none min-h-[60px]"
           />
           <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-border/40">
             <Button variant="ghost" size="sm" onClick={() => setIsAddingMode(false)} className="h-7 text-xs text-slate-500">Cancelar</Button>
             <Button size="sm" onClick={handleAddNote} disabled={isSaving || !newNote.trim()} className="h-7 text-xs bg-fluxeer-blue hover:bg-fluxeer-blue-hover">
               {isSaving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
               Salvar
             </Button>
           </div>
         </div>
       )}

       <div className="space-y-4">
         {combinedTimeline.length > 0 ? (
           combinedTimeline.map((item, idx) => (
             <div key={`${item._type}-${item.id}`} className="relative pl-6">
                {/* Timeline Line */}
                {idx !== combinedTimeline.length - 1 && (
                  <div className="absolute left-[9px] top-5 bottom-[-20px] w-px bg-border/60" />
                )}
                
                {/* Timeline Dot */}
                <div className={`absolute left-0 top-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
                   item._type === 'note' ? 'bg-indigo-100/50' : 'bg-emerald-100/50'
                }`}>
                   <div className={`w-2 h-2 rounded-full ${item._type === 'note' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                </div>

                {/* Content */}
                <div className="bg-slate-50/50 rounded-lg p-3 border border-border/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {item._type === 'note' ? `Nota de ${item.user?.fullName || 'Sistema'}` : `Automático (${item.channel})`}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{formatDate(item._date)}</span>
                  </div>
                  {item._type === 'note' ? (
                     <p className="text-[13px] text-obsidian whitespace-pre-wrap">{item.content}</p>
                  ) : (
                     <div className="text-[13px] text-obsidian">
                        Motivo: <span className="font-semibold">{item.messageType}</span> 
                        {item.invoiceId && <span className="ml-2 text-indigo-600">→ Referente à Fatura</span>}
                     </div>
                  )}
                </div>
             </div>
           ))
         ) : (
           <p className="text-center text-xs text-muted-foreground py-6 italic">Nenhuma atividade registrada ainda.</p>
         )}
       </div>
    </div>
  );
}
