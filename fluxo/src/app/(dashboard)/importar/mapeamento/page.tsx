'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowRight, ShieldCheck, Loader2, AlertCircle,
  CheckCircle, ChevronRight, AlertTriangle
} from "lucide-react"
import { importReceivables, ParsedReceivable } from "@/actions/import"

// ─── Stepper (shared pattern) ─────────────────────────────────────────────────

function Stepper({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'Upload do arquivo' },
    { n: 2, label: 'Mapear colunas' },
    { n: 3, label: 'Confirmar importação' },
  ];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((step, idx) => (
        <div key={step.n} className="flex items-center">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
            step.n === current
              ? 'bg-indigo-600 text-white'
              : step.n < current
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-400'
          }`}>
            {step.n < current
              ? <CheckCircle className="w-3.5 h-3.5" />
              : <span className="w-4 h-4 flex items-center justify-center">{step.n}</span>
            }
            <span className="hidden sm:inline">{step.label}</span>
          </div>
          {idx < steps.length - 1 && (
            <ChevronRight className={`w-4 h-4 mx-1 ${step.n < current ? 'text-emerald-400' : 'text-slate-300'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Required fields ─────────────────────────────────────────────────────────

const REQUIRED_FIELDS = ['customerName', 'amount', 'dueDate'] as const;
const REQUIRED_LABELS: Record<string, string> = {
  customerName: 'Nome da empresa',
  amount: 'Valor (R$)',
  dueDate: 'Data de vencimento',
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function GenericMappingPage() {
  const router = useRouter();
  const [headers, setHeaders]       = useState<string[]>([]);
  const [rawData, setRawData]       = useState<any[]>([]);
  const [mapping, setMapping]       = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    const storedRaw     = sessionStorage.getItem('fluxo_csv_raw');
    const storedHeaders = sessionStorage.getItem('fluxo_csv_headers');
    if (storedRaw && storedHeaders) {
      try {
        setRawData(JSON.parse(storedRaw));
        setHeaders(JSON.parse(storedHeaders));
      } catch { /* ignore */ }
    }
  }, []);

  const handleMappingChange = (csvHeader: string, fluxoField: string) => {
    setMapping(prev => ({ ...prev, [csvHeader]: fluxoField }));
  };

  // Check which required fields are still unmapped
  const mappedValues = Object.values(mapping).filter(v => v && v !== 'ignore');
  const missingRequired = REQUIRED_FIELDS.filter(f => !mappedValues.includes(f));

  const processAndSubmit = async () => {
    if (missingRequired.length > 0) {
      setError(`Mapeie as colunas obrigatórias antes de continuar: ${missingRequired.map(f => REQUIRED_LABELS[f]).join(', ')}.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const mappedPayload: ParsedReceivable[] = rawData.map(row => {
      const obj: any = {};
      for (const csvHeader of headers) {
        const targetField = mapping[csvHeader];
        if (targetField && targetField !== 'ignore') {
          let value = row[csvHeader];
          if (targetField === 'amount') {
            if (typeof value === 'string')
              value = value.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
            obj[targetField] = parseFloat(value) || 0;
          } else if (targetField === 'dueDate') {
            if (typeof value === 'string' && value.includes('/')) {
              const parts = value.split('/');
              if (parts.length === 3)
                obj[targetField] = `${parts[2]}-${parts[1]}-${parts[0]}T12:00:00.000Z`;
            } else {
              obj[targetField] = new Date(value).toISOString();
            }
          } else {
            obj[targetField] = value;
          }
        }
      }
      return obj;
    });

    try {
      const res = await importReceivables(mappedPayload);
      if (res.success) {
        sessionStorage.removeItem('fluxo_csv_raw');
        sessionStorage.removeItem('fluxo_csv_headers');
        router.push('/cobrancas?success=import');
      } else {
        setError(res.error || 'Ocorreu um erro no servidor.');
        setIsSubmitting(false);
      }
    } catch {
      setError('Falha de comunicação com o servidor. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 w-full pt-8 pb-16 px-4">

      {/* Header */}
      <div className="mb-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-3">
          <Link
            href="/importar"
            className="text-sm font-semibold text-slate-400 hover:text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-indigo-200"
          >
            ← Voltar
          </Link>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mapear Colunas da Planilha</h1>
        <p className="text-slate-500 text-sm mt-1.5">
          Encontramos <span className="font-bold text-slate-700">{rawData.length}</span> registros.
          Diga ao Fluxeer o que significa cada coluna antes de importar.
        </p>
      </div>

      {/* Stepper */}
      <div className="max-w-5xl mx-auto">
        <Stepper current={2} />
      </div>

      {/* Trust badge */}
      <div className="max-w-5xl mx-auto mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
          <ShieldCheck className="w-3.5 h-3.5" />
          Nenhum dado é enviado até você confirmar na etapa seguinte
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 text-sm text-rose-700 bg-rose-50 p-4 rounded-xl border border-rose-200 mb-5 max-w-5xl mx-auto animate-in fade-in">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Mapping table */}
      <div className="rounded-2xl border border-slate-200 mx-auto w-full max-w-5xl bg-white shadow-sm mb-6 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
          <p className="text-sm font-semibold text-slate-700">
            Amostra ({Math.min(rawData.length, 3)} de {rawData.length} registros)
          </p>
          <p className="text-xs text-slate-400">
            Selecione o campo correspondente para cada coluna do CSV
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left align-top min-w-max">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {headers.map((header, idx) => {
                  const mapped = mapping[header];
                  const isMapped = mapped && mapped !== 'ignore';
                  return (
                    <th key={idx} className="px-5 py-4 font-normal">
                      {/* Column name */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${isMapped ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className="text-xs font-bold text-indigo-600 truncate max-w-[140px]">{header}</span>
                      </div>
                      {/* Mapping select */}
                      <select
                        onChange={e => handleMappingChange(header, e.target.value)}
                        className="w-full max-w-[180px] h-9 text-sm bg-white border border-slate-200 rounded-xl px-2.5 hover:border-indigo-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 font-medium transition-colors cursor-pointer text-slate-700 outline-none shadow-sm"
                      >
                        <option value="ignore">Ignorar esta coluna</option>
                        <option value="customerName">Nome da empresa ✱</option>
                        <option value="document">CNPJ / CPF</option>
                        <option value="email">E-mail</option>
                        <option value="phone">WhatsApp / Telefone</option>
                        <option value="invoiceNumber">Nº da Fatura (ID)</option>
                        <option value="amount">Valor (R$) ✱</option>
                        <option value="dueDate">Data de Vencimento ✱</option>
                        <option value="description">Descrição</option>
                      </select>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {rawData.slice(0, 3).map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-slate-50/50">
                  {headers.map((header, colIdx) => (
                    <td key={colIdx} className="px-5 py-3.5 font-mono text-xs text-slate-700 truncate max-w-[200px]">
                      {row[header] || <span className="text-slate-300">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Required fields warning */}
      {missingRequired.length > 0 && (
        <div className="flex items-start gap-2.5 text-sm text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-200 mb-5 max-w-5xl mx-auto">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold mb-0.5">Colunas obrigatórias sem mapeamento</p>
            <p className="text-amber-600 text-xs">
              Mapeie antes de confirmar: <span className="font-bold">{missingRequired.map(f => REQUIRED_LABELS[f]).join(', ')}</span>
            </p>
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-end w-full max-w-5xl mx-auto gap-3">
        <Link href="/importar" className="text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors">
          Cancelar
        </Link>
        <Button
          className="h-11 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md"
          onClick={processAndSubmit}
          disabled={isSubmitting || missingRequired.length > 0}
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importando os dados...</>
          ) : (
            <>Confirmar e Importar <ArrowRight className="w-4 h-4 ml-2" /></>
          )}
        </Button>
      </div>

    </div>
  );
}
