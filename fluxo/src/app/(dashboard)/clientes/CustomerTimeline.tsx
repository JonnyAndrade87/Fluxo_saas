'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquareText, Plus, Loader2, Send, History } from "lucide-react";
import { addCustomerNote } from '@/actions/customers';
import BillingTimeline from '@/components/timeline/BillingTimeline';
import type { TimelineEvent } from '@/types/timeline.types';

interface Props {
  customerId: string;
  timelineEvents: TimelineEvent[];
  onNoteAdded: () => void;
}

export default function CustomerTimeline({ customerId, timelineEvents, onNoteAdded }: Props) {
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
      onNoteAdded();
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar nota.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-4 mt-6">
      <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-4">
        <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-500" /> Timeline de Cobrança
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

      <BillingTimeline events={timelineEvents} emptyMessage="Nenhuma atividade de cobrança registrada ainda." />
    </div>
  );
}
