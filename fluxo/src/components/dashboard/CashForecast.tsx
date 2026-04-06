import { getProbabilityAdjustedForecast } from "@/actions/forecast";
import { Info, Target, WalletCards } from "lucide-react";

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function calculateRatio(expected: number, nominal: number) {
  if (nominal === 0) return 0;
  return Math.round((expected / nominal) * 100);
}

export async function CashForecast() {
  const forecast = await getProbabilityAdjustedForecast();

  const ratio7 = calculateRatio(forecast.next7DaysExpected, forecast.next7DaysNominal);
  const ratio30 = calculateRatio(forecast.next30DaysExpected, forecast.next30DaysNominal);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-100 text-indigo-600 p-1.5 rounded-md">
            <Target className="w-4 h-4" />
          </div>
          <h3 className="font-heading font-bold text-obsidian">Previsão Ajustada de Caixa</h3>
        </div>
        <div className="group relative cursor-pointer">
          <Info className="w-4 h-4 text-slate-400 hover:text-indigo-500 transition-colors" />
          <div className="absolute right-0 top-6 w-64 bg-obsidian text-white text-[11px] p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-mono leading-relaxed">
            <p className="font-bold text-indigo-300 mb-1 border-b border-white/20 pb-1">Motor de Risco Ajustado</p>
            O valor <strong>Esperado</strong> degrada a previsão de faturamento Nominal ponderando a qualidade do pagador:<br/><br/>
            🟢 Baixo: 95%<br/>
            🟡 Médio: 70%<br/>
            🟠 Alto: 30%<br/>
            🔴 Crítico: 10%
          </div>
        </div>
      </div>

      <div className="p-5 flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Next 7 Days */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">A Receber • Próx. 7 Dias</p>
          
          <div>
            <div className="flex items-end gap-2 mb-0.5">
              <span className="text-2xl font-black text-slate-800 tracking-tight">
                {fmt.format(forecast.next7DaysExpected)}
              </span>
              <span className="text-xs text-slate-400 mb-1 font-medium pb-0.5">Esperado</span>
            </div>
            
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 mt-1">
              <span>Emitido: {fmt.format(forecast.next7DaysNominal)}</span>
              <span className="text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">{ratio7}% prob.</span>
            </div>
          </div>
          
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
            <div 
              className="bg-indigo-500 h-full rounded-r-full transition-all duration-1000 ease-out" 
              style={{ width: `${ratio7}%` }} 
            />
          </div>
        </div>

        {/* Next 30 Days */}
        <div className="flex flex-col gap-3 md:pl-6 md:border-l border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">A Receber • Próx. 30 Dias</p>
          
          <div>
            <div className="flex items-end gap-2 mb-0.5">
              <span className="text-2xl font-black text-slate-800 tracking-tight">
                {fmt.format(forecast.next30DaysExpected)}
              </span>
              <span className="text-xs text-slate-400 mb-1 font-medium pb-0.5">Esperado</span>
            </div>
            
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 mt-1">
              <span>Emitido: {fmt.format(forecast.next30DaysNominal)}</span>
              <span className="text-teal-600 font-bold bg-teal-50 px-1.5 py-0.5 rounded">{ratio30}% prob.</span>
            </div>
          </div>
          
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
            <div 
              className="bg-teal-500 h-full rounded-r-full transition-all duration-1000 ease-out" 
              style={{ width: `${ratio30}%` }} 
            />
          </div>
        </div>
      </div>

    </div>
  );
}
