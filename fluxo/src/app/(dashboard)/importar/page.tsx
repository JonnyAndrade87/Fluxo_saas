'use client'

import { useState, useRef, DragEvent, ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import Papa from "papaparse"
import { Button } from "@/components/ui/button"
import { CloudUpload, Download, FileSpreadsheet, AlertCircle } from "lucide-react"

export default function GenericImportPage() {
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
          router.push('/importar/mapeamento');
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
    <div className="animate-in fade-in zoom-in-95 duration-500 w-full flex flex-col pt-8 pb-10">
      
      <div className="mb-8 space-y-3 w-full">
        <h1 className="text-3xl font-heading font-extrabold tracking-tight text-obsidian">
          Importador de Lotes
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Suba arquivos .CSV com milhares de títulos a receber. O <strong>Motor do Fluxo</strong> irá mapear as colunas e injetar inteligentemente tudo na sua operação.
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
        className={`w-full max-w-3xl mx-auto mt-8 bg-white border-2 border-dashed transition-all rounded-3xl p-16 flex flex-col items-center justify-center text-center cursor-pointer group shadow-sm mb-6 ${
          isHovering ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' : 'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/30'
        }`}
      >
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-transform duration-300 ${isHovering ? 'bg-fluxeer-blue text-white scale-110' : 'bg-indigo-50 text-indigo-500 group-hover:scale-110'}`}>
          {fileName ? <FileSpreadsheet className="w-8 h-8" /> : <CloudUpload className="w-8 h-8" />}
        </div>
        
        {fileName ? (
           <h3 className="font-semibold text-indigo-900 text-lg mb-2">Processando {fileName}...</h3>
        ) : (
           <h3 className="font-semibold text-obsidian text-lg mb-2">Arraste e solte seu arquivo CSV</h3>
        )}
        
        <p className="text-sm text-muted-foreground mb-6">Suportamos tabelas .CSV robustas de até 50MB.</p>
        
        <Button variant="outline" className="bg-white pointer-events-none" disabled={isProcessing}>
          {isProcessing ? 'Lendo dados pesados...' : 'Procurar Arquivo Local'}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 p-4 rounded-xl mx-auto border border-rose-100 max-w-3xl w-full animate-in fade-in duration-300 mb-6">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex items-center justify-center w-full max-w-3xl mx-auto">
        <a href="#" className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
          <Download className="w-4 h-4" /> Baixar Modelo Vazio Padrão
        </a>
      </div>

    </div>
  )
}
