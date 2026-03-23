'use client';

import { Badge } from '@/components/ui/badge';

interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string | React.ReactNode;
}

interface ReportTableProps {
  columns: TableColumn[];
  data: Record<string, any>[];
  emptyMessage?: string;
  highlightRow?: (row: Record<string, any>) => boolean;
}

function getRiskBadgeColor(riskLevel: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (riskLevel) {
    case 'Crítico':
      return 'destructive';
    case 'Alto':
      return 'destructive';
    case 'Médio':
      return 'secondary';
    case 'Baixo':
      return 'default';
    default:
      return 'outline';
  }
}

export function ReportTable({
  columns,
  data,
  emptyMessage = 'Nenhum dado encontrado',
  highlightRow,
}: ReportTableProps) {
  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={`px-6 py-3 font-semibold text-gray-700 ${
                  col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                highlightRow?.(row) ? 'bg-yellow-50' : ''
              }`}
            >
              {columns.map(col => {
                const value = row[col.key];
                let formatted = col.format ? col.format(value) : value;

                // Auto-format risk levels as badges
                if (col.key.includes('risk') && typeof value === 'string') {
                  formatted = (
                    <Badge variant={getRiskBadgeColor(value)}>
                      {value}
                    </Badge>
                  );
                }

                return (
                  <td
                    key={`${idx}-${col.key}`}
                    className={`px-6 py-4 text-gray-900 ${
                      col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''
                    }`}
                  >
                    {formatted}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
