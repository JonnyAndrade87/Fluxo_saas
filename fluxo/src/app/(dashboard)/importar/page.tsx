'use client'

import { useState, useRef, DragEvent, ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import Papa from "papaparse"
import { Button } from "@/components/ui/button"
import {
  CloudUpload, Download, FileSpreadsheet, AlertCircle,
  CheckCircle, ChevronRight, Info, ChevronDown
} from "lucide-react"

// ─── Stepper ─────────────────────────────────────────────────────────────────

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

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function GenericImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovering, setIsHovering]     = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [fileName, setFileName]         = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHelp, setShowHelp]         = useState(false);

  const processFile = (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Formato inválido. Envie um arquivo .CSV válido.');
      return;
    }
    setFileName(file.name);
    setIsProcessing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          // B08: block empty or header-only CSVs
          const rows    = results.data as any[];
          const fields  = results.meta.fields ?? [];

          if (rows.length === 0) {
            setError(
              'Nenhum dado válido encontrado no arquivo. ' +
              'Verifique se há linhas preenchidas abaixo do cabeçalho e se o separador é vírgula (,).'
            );
            setIsProcessing(false);
            return;
          }

          if (fields.length === 0) {
            setError(
              'O arquivo não possui cabeçalho de colunas reconhecível. ' +
              'A primeira linha deve conter os nomes das colunas.'
            );
            setIsProcessing(false);
            return;
          }

          sessionStorage.setItem('fluxo_csv_raw', JSON.stringify(rows));
          sessionStorage.setItem('fluxo_csv_headers', JSON.stringify(fields));
          router.push('/importar/mapeamento');
        } catch {
          setError('Arquivo muito pesado ou com estrutura incorreta.');
          setIsProcessing(false);
        }
      },
      error: () => {
        setError('Erro ao ler o CSV. Verifique se o arquivo não está corrompido.');
        setIsProcessing(false);
      }
    });
  };

  const handleDragOver  = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsHovering(true); };
  const handleDragLeave = () => setIsHovering(false);
  const handleDrop      = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsHovering(false);
    if (e.dataTransfer.files?.length > 0) processFile(e.dataTransfer.files[0]);
  };
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) processFile(files[0]);
  };

  return (
    <div className="animate-in fade-in duration-500 w-full max-w-3xl mx-auto pt-8 pb-16 px-4">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Importar Planilha</h1>
        <p className="text-slate-500 text-sm mt-1.5 max-w-xl">
          Suba um arquivo .CSV com seus títulos a receber. Vamos mapear as colunas juntos antes de confirmar.
        </p>
      </div>

      {/* Stepper */}
      <Stepper current={1} />

      {/* Drop zone */}
      <input
        type="file"
        accept=".csv"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileSelect}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`w-full border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all mb-5 ${
          isHovering
            ? 'border-indigo-500 bg-indigo-50/60 scale-[1.01]'
            : isProcessing
            ? 'border-slate-200 bg-slate-50 cursor-default'
            : 'border-indigo-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/30'
        }`}
      >
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all ${
          isHovering
            ? 'bg-indigo-600 text-white scale-110'
            : isProcessing
            ? 'bg-slate-100 text-slate-400'
            : 'bg-indigo-50 text-indigo-500'
        }`}>
          {isProcessing
            ? <FileSpreadsheet className="w-7 h-7 animate-pulse" />
            : <CloudUpload className="w-7 h-7" />
          }
        </div>

        {isProcessing ? (
          <>
            <p className="font-semibold text-slate-700 text-base mb-1">Lendo {fileName}...</p>
            <p className="text-sm text-slate-400">Aguarde enquanto processamos o arquivo.</p>
          </>
        ) : (
          <>
            <p className="font-semibold text-slate-800 text-base mb-1">Arraste seu arquivo aqui</p>
            <p className="text-sm text-slate-400 mb-5">Suporte a .CSV de até 50 MB</p>
            <Button
              variant="outline"
              size="sm"
              className="pointer-events-none rounded-xl border-slate-200 text-slate-600 font-semibold"
            >
              Procurar arquivo local
            </Button>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 text-sm text-rose-700 bg-rose-50 p-4 rounded-xl border border-rose-200 mb-5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Help accordion + download link */}
      <div className="space-y-3">
        <button
          onClick={() => setShowHelp(h => !h)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          O que precisa estar no CSV?
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showHelp ? 'rotate-180' : ''}`} />
        </button>

        {showHelp && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm animate-in fade-in">
            <p className="font-semibold text-slate-700 mb-2">Colunas mínimas obrigatórias:</p>
            <ul className="space-y-1.5 text-slate-600">
              {[
                { field: 'Nome da empresa', desc: 'Razão social ou nome do cliente (sacado)' },
                { field: 'CNPJ / CPF', desc: 'Documento de identificação do cliente' },
                { field: 'Valor (R$)', desc: 'Valor do título em reais' },
                { field: 'Data de vencimento', desc: 'Formato DD/MM/AAAA ou AAAA-MM-DD' },
              ].map(c => (
                <li key={c.field} className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <span><span className="font-semibold text-slate-800">{c.field}</span> — {c.desc}</span>
                </li>
              ))}
            </ul>
            <p className="text-slate-400 text-xs mt-3">
              Demais colunas são opcionais e serão mapeadas na próxima etapa.
            </p>
          </div>
        )}

        <a
          href="/templates/modelo-importacao.csv"
          download
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Baixar modelo de CSV vazio
        </a>
      </div>
    </div>
  );
}
