'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardChart({ data }: { data: any[] }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatMonth = (tick: any) => {
    if (typeof tick !== 'string') return tick;
    const parts = tick.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
    return tick;
  };

  return (
    <div className="h-[320px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorRecebido" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorAReceber" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatMonth} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#737373', fontSize: 11 }} 
            dy={10} 
            minTickGap={20}
          />
          <YAxis hide={true} domain={['dataMin', 'dataMax + 1000']} />
          <Tooltip 
            formatter={(value: any, name: any) => [
              formatCurrency(Number(value) || 0), 
              name === 'recebido' ? 'Recebido' : 'A Receber'
            ]}
            labelFormatter={formatMonth}
            contentStyle={{ 
              borderRadius: '12px', 
              border: '1px solid #E5E5E5', 
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', 
              fontSize: '13px',
              backgroundColor: '#FFFFFF',
              color: '#111111'
            }}
          />
          <Area type="monotone" dataKey="a_receber" stroke="#4F46E5" fillOpacity={1} fill="url(#colorAReceber)" strokeWidth={2} />
          <Area type="monotone" dataKey="recebido" stroke="#10b981" fillOpacity={1} fill="url(#colorRecebido)" strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
