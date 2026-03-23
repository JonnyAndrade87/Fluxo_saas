'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Printer } from 'lucide-react';
import { downloadCSV } from '@/lib/export-utils';

type PeriodType = '30d' | '60d' | '90d' | '180d';
type ReportType = 'overdue' | 'pending' | 'delay' | 'risk' | 'executive';

interface ReportFiltersProps {
  reportType: ReportType;
  onPeriodChange?: (period: PeriodType) => void;
  onCustomerChange?: (customerId: string | null) => void;
  customers?: Array<{ id: string; name: string }>;
  showPeriodFilter?: boolean;
  showCustomerFilter?: boolean;
  onExport?: (format: 'csv' | 'pdf') => Promise<void>;
  onPrint?: () => void;
  isLoading?: boolean;
}

export function ReportFilters({
  reportType,
  onPeriodChange,
  onCustomerChange,
  customers = [],
  showPeriodFilter = true,
  showCustomerFilter = true,
  onExport,
  onPrint,
  isLoading = false,
}: ReportFiltersProps) {
  const [period, setPeriod] = useState<PeriodType>('90d');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomer(customerId);
    onCustomerChange?.(customerId === 'all' ? null : customerId);
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      await onExport?.(format);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-4 items-center py-4 px-6 bg-gray-50 rounded-lg border border-gray-200">
      {/* Período */}
      {showPeriodFilter && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Período:</label>
          <select
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value as PeriodType)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white"
          >
            <option value="30d">Últimos 30 dias</option>
            <option value="60d">Últimos 60 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="180d">Últimos 180 dias</option>
          </select>
        </div>
      )}

      {/* Cliente */}
      {showCustomerFilter && customers.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Cliente:</label>
          <select
            value={selectedCustomer}
            onChange={(e) => handleCustomerChange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white w-56"
          >
            <option value="all">Todos os clientes</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Ações */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrint}
          disabled={isLoading}
          className="gap-2"
        >
          <Printer className="w-4 h-4" />
          Imprimir
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('csv')}
          disabled={isLoading || isExporting}
          className="gap-2"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Exportar CSV
        </Button>
      </div>
    </div>
  );
}
