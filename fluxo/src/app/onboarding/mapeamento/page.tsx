'use client'
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, ArrowRight, ShieldCheck, Loader2 } from "lucide-react"
import { importReceivables, ParsedReceivable } from "@/actions/import"

export default function OnboardingMappingPage() {
  const router = useRouter();
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Hydrate state from previous step
    const storedRaw = sessionStorage.getItem('fluxo_csv_raw');
    const storedHeaders = sessionStorage.getItem('fluxo_csv_headers');
    
    if (storedRaw && storedHeaders) {
      setRawData(JSON.parse(storedRaw));
      setHeaders(JSON.parse(storedHeaders));
    }
  }, []);

  const handleMappingChange = (csvHeader: string, fluxoField: string) => {
    setMapping(prev => ({ ...prev, [csvHeader]: fluxoField }));
  };

  const processAndSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    // Build the mapped array
    const mappedPayload: ParsedReceivable[] = rawData.map(row => {
      const obj: any = {};
      
      for (const csvHeader of headers) {
        const targetField = mapping[csvHeader];
        if (targetField && targetField !== 'ignore') {
          // Type casting and formatting
          let value = row[csvHeader];
          
          if (targetField === 'amount') {
             // Convert R$ 1.200,50 to 1200.50
             if(typeof value === 'string') {
               value = value.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
             }
             obj[targetField] = parseFloat(value) || 0;
          } else if (targetField === 'dueDate') {
             // Basic conversion assuming DD/MM/YYYY or YYYY-MM-DD
             if(typeof value === 'string' && value.includes('/')) {
                const parts = value.split('/');
                if(parts.length === 3) {
                   obj[targetField] = `${parts[2]}-${parts[1]}-${parts[0]}T12:00:00.000Z`;
                }
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
        router.push('/onboarding/automacao');
      } else {
        setError(res.error || "Ocorreu um erro no servidor.");
        setIsSubmitting(false);
      }
    } catch (e) {
      setError("Falha crônica de comunicação com o banco de dados.");
      setIsSubmitting(false);
    }
  };
  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 w-full flex flex-col">
      
      {/* Stepper Header */}
      <div className="mb-10 w-full">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-border/60 -z-10" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-600 -z-10 transition-all duration-1000" style={{ width: '50%' }} />
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-[#FDFDFE]">
              ✓
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-700">Importar</span>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white border border-transparent flex items-center justify-center font-bold text-sm ring-4 ring-[#FDFDFE]">
              2
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-700">Validar</span>
          </div>
          
          <div className="flex flex-col items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-white border border-border/80 text-muted-foreground flex items-center justify-center font-bold text-sm ring-4 ring-[#FDFDFE]">
              3
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Automação</span>
          </div>
        </div>
      </div>

      <div className="text-center mb-10 space-y-3">
        <h1 className="text-2xl font-heading font-extrabold tracking-tight text-obsidian">
          Cruzar Referências
        </h1>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Lemos sua planilha! Confirme como deseja importar cada coluna antes de processarmos.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl text-sm mb-6 flex items-center gap-2">
           <strong>Erro de Ingestão:</strong> {error}
        </div>
      )}

      {/* Mapping Card */}
      <div className="rounded-2xl border border-indigo-100 bg-white shadow-xl shadow-indigo-50/50 mb-10 overflow-hidden overflow-x-auto custom-scrollbar">
        <div className="flex items-center justify-between p-4 border-b border-border/60 bg-muted/20 min-w-max">
          <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
            <Eye className="w-4 h-4" /> Amostra de {Math.min(rawData.length, 3)} linhas e opções de Mapeamento
          </div>
          <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">
            <ShieldCheck className="w-3 h-3 mr-1" /> Preview (Client-Side)
          </Badge>
        </div>

        <table className="w-full text-sm text-left align-top min-w-max">
          <thead className="bg-[#FAFAFB]">
            <tr>
              {headers.map((header, idx) => (
                <th key={idx} className="px-6 py-4 font-semibold text-obsidian border-b border-border/50">
                  <div className="mb-2 text-xs font-bold text-indigo-600 truncate max-w-[150px]">{header}</div>
                  <select 
                    onChange={(e) => handleMappingChange(header, e.target.value)}
                    className="w-full max-w-[180px] h-9 text-sm outline-none bg-white border border-border/80 rounded-lg px-2 hover:border-indigo-400 focus:border-indigo-500 font-medium transition-colors cursor-pointer text-obsidian shadow-sm"
                  >
                    <option value="ignore">Ignorar Coluna</option>
                    <option value="customerName">Nome da Empresa</option>
                    <option value="document">CNPJ / CPF</option>
                    <option value="email">E-mail</option>
                    <option value="phone">WhatsApp / Telefone</option>
                    <option value="invoiceNumber">Nº da Fatura (ID)</option>
                    <option value="amount">Valor (R$)</option>
                    <option value="dueDate">Data de Vencimento</option>
                    <option value="description">Descrição</option>
                  </select>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-muted-foreground bg-white">
            {rawData.slice(0, 3).map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-indigo-50/20">
                {headers.map((header, colIdx) => (
                  <td key={colIdx} className="px-6 py-4 font-medium text-obsidian truncate max-w-[200px]">
                    {row[header] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between w-full">
        <Link href="/onboarding/importar" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-obsidian font-medium transition-colors">
          Refazer Upload
        </Link>
        <Button variant="beam" className="h-11 px-8" onClick={processAndSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
             <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Injetando...</>
          ) : (
             <>Confirmar & Injetar <ArrowRight className="w-4 h-4 ml-2" /></>
          )}
        </Button>
      </div>

    </div>
  )
}
