'use client'
import { useState, useRef, DragEvent, ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import Papa from "papaparse"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CloudUpload, Download, FileSpreadsheet, AlertCircle } from "lucide-react"

export default function OnboardingImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Formato inválido. Por favor, envie um arquivo .CSV válido.');
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          // Salva no estado do navegador para a próxima tela
          sessionStorage.setItem('fluxo_csv_raw', JSON.stringify(results.data));
          sessionStorage.setItem('fluxo_csv_headers', JSON.stringify(results.meta.fields || []));
          router.push('/onboarding/mapeamento');
        } catch (err) {
          setError('Arquivo muito pesado ou com estrutura incorreta.');
          setIsProcessing(false);
        }
      },
      error: () => {
        setError('Houve um erro na leitura do CSV pelo navegador.');
        setIsProcessing(false);
      }
    });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsHovering(true);
  };
  
  const handleDragLeave = () => {
    setIsHovering(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsHovering(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };
  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 w-full flex flex-col">
      
      {/* Stepper Header */}
      <div className="mb-10 w-full">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-border/60 -z-10" />
          <div className="w-full absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-600 -z-10" style={{ width: '0%' }} />
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-[#FDFDFE]">
              1
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-700">Importar</span>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white border border-border/80 text-muted-foreground flex items-center justify-center font-bold text-sm ring-4 ring-[#FDFDFE]">
              2
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Validar</span>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white border border-border/80 text-muted-foreground flex items-center justify-center font-bold text-sm ring-4 ring-[#FDFDFE]">
              3
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Automação</span>
          </div>
        </div>
      </div>

      <div className="text-center mb-8 space-y-3">
        <h1 className="text-2xl font-heading font-extrabold tracking-tight text-obsidian">
          Alimente seu maquinário de cobrança
        </h1>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Deixe o Fluxo trabalhar por você. Suba a sua lista de clientes ou os títulos a receber pendentes que faremos a mágica.
        </p>
      </div>

      {/* Drag & Drop Zone */}
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
        onClick={() => fileInputRef.current?.click()}
        className={`w-full bg-white border-2 border-dashed transition-all rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer group shadow-sm mb-6 ${
          isHovering ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' : 'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/30'
        }`}
      >
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-transform duration-300 ${isHovering ? 'bg-indigo-600 text-white scale-110' : 'bg-indigo-50 text-indigo-500 group-hover:scale-110'}`}>
          {fileName ? <FileSpreadsheet className="w-8 h-8" /> : <CloudUpload className="w-8 h-8" />}
        </div>
        
        {fileName ? (
           <h3 className="font-semibold text-indigo-900 text-lg mb-2">Processando {fileName}...</h3>
        ) : (
           <h3 className="font-semibold text-obsidian text-lg mb-2">Arraste e solte seu arquivo CSV</h3>
        )}
        
        <p className="text-sm text-muted-foreground mb-6">Suportamos formados .CSV de até 5MB.</p>
        
        <Button variant="outline" className="bg-white pointer-events-none" disabled={isProcessing}>
          {isProcessing ? 'Lendo dados...' : 'Procurar Arquivo Local'}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 p-4 rounded-xl border border-rose-100 animate-in fade-in duration-300 mb-6">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between w-full">
        <a href="#" className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
          <Download className="w-4 h-4" /> Baixar planilha modelo do Fluxo
        </a>
      </div>

    </div>
  )
}
