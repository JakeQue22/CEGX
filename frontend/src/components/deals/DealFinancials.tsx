'use client';

import { GBPAmount } from '@/components/ui/GBPAmount';
import { Deal } from '@/types';

interface DealFinancialsProps {
  deal: Deal;
}

export function DealFinancials({ deal }: DealFinancialsProps) {
  const cards = [
    { label: 'Revenue', value: deal.revenue ?? deal.salePrice, color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { label: 'Cost', value: deal.cost ?? deal.costPrice * deal.quantity, color: 'bg-gray-50 border-gray-200 text-gray-700' },
    { label: 'Ad Spend', value: deal.adSpend, color: 'bg-orange-50 border-orange-200 text-orange-700' },
    { label: 'VAT', value: deal.vatAmount ?? 0, color: 'bg-purple-50 border-purple-200 text-purple-700' },
    { label: 'Gross Profit', value: deal.grossProfit, color: 'bg-green-50 border-green-200 text-green-700' },
    { label: 'Net Profit', value: deal.netProfit ?? deal.grossProfit, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Financials</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cards.map(({ label, value, color }) => (
          <div key={label} className={`rounded-lg border p-3 ${color}`}>
            <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
            <GBPAmount amount={value} className="text-base font-bold" />
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm text-gray-600">Margin:</span>
        <span
          className={`text-sm font-bold ${
            deal.marginPercent >= 20 ? 'text-green-600' : deal.marginPercent >= 10 ? 'text-yellow-600' : 'text-red-600'
          }`}
        >
          {deal.marginPercent?.toFixed(2)}%
        </span>
        <span className="text-gray-400 text-xs ml-auto">
          VAT Rate: {deal.vatPercent}% | Ad: {deal.adPercent}%
        </span>
      </div>
    </div>
  );
}
