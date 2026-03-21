'use client';

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

type ChartsProps = {
  barData: {
    month: string;
    faturado: number;
    recebido: number;
  }[];
  pieData: {
    name: string;
    value: number;
    color: string;
  }[];
};

export default function ReportsCharts({ barData, pieData }: ChartsProps) {
  
  const formatYAxis = (tickItem: any) => {
    const val = Number(tickItem) || 0;
    if (val === 0) return '0';
    if (val >= 1000) return `R$ ${(val / 1000).toFixed(0)}k`;
    return `R$ ${val}`;
  };

  const formatTooltip = (value: any) => {
    const val = Number(value) || 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="grid gap-6 md:grid-cols-12">
      
      {/* Bar Chart - Cashflow */}
      <Card className="col-span-12 lg:col-span-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-obsidian text-lg">Fluxo de Faturamento</CardTitle>
          <CardDescription>Comparativo entre Faturado (Emitido) vs Recebido (Liquidadas)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barGap={8}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: '#64748b', fontSize: 12 }}
                   tickFormatter={formatYAxis}
                   dx={-10}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={formatTooltip}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="faturado" name="Faturado" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} animationDuration={1500} />
                <Bar dataKey="recebido" name="Recebido (Pago)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart - Status Distribution */}
      <Card className="col-span-12 lg:col-span-4 shadow-sm">
        <CardHeader>
          <CardTitle className="text-obsidian text-lg">Distribuição da Carteira</CardTitle>
          <CardDescription>Fatia de capital preso vs líquido</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip 
                     formatter={formatTooltip}
                     contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={1500}
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
             </ResponsiveContainer>
          </div>

          <div className="w-full mt-6 space-y-3">
             {pieData.map((item, i) => (
               <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                     <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                     <span className="font-medium text-obsidian">{item.name}</span>
                  </div>
                  <span className="font-mono text-muted-foreground">{formatTooltip(item.value)}</span>
               </div>
             ))}
          </div>

        </CardContent>
      </Card>

    </div>
  );
}
