'use client';

import Link from 'next/link';
import { Deal } from '@/types';
import { GBPAmount } from '@/components/ui/GBPAmount';
import { Badge } from '@/components/ui/Badge';

interface DealCardProps {
  deal: Deal;
}

export function DealCard({ deal }: DealCardProps) {
  const marginColor =
    deal.marginPercent >= 20 ? 'text-green-600' : deal.marginPercent >= 10 ? 'text-yellow-600' : 'text-red-600';

  return (
    <Link href={`/deals/${deal.id}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {deal.title}
          </h4>
          <Badge label={deal.status} />
        </div>

        {deal.supplier && (
          <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
            </svg>
            {deal.supplier.name}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Sale Price</p>
            <GBPAmount amount={deal.salePrice} className="text-sm font-semibold text-gray-900" />
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Margin</p>
            <p className={`text-sm font-semibold ${marginColor}`}>
              {deal.marginPercent?.toFixed(1)}%
            </p>
          </div>
        </div>

        {deal.quantity > 1 && (
          <p className="text-xs text-gray-400 mt-2">Qty: {deal.quantity.toLocaleString()}</p>
        )}
      </div>
    </Link>
  );
}
