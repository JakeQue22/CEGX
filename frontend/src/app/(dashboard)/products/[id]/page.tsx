'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { Product } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { GBPAmount } from '@/components/ui/GBPAmount';
import { Badge } from '@/components/ui/Badge';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: () => axiosInstance.get(`/products/${id}`).then((r) => r.data),
  });

  // Profit calculator state
  const [calcQty, setCalcQty] = useState(1);
  const [calcSalePrice, setCalcSalePrice] = useState(0);

  if (isLoading) return <LoadingSpinner />;
  if (!product) return <div className="text-red-600">Product not found.</div>;

  // Determine unit cost based on bulk pricing
  let unitCost = product.baseCost;
  if (product.bulkPricing && product.bulkPricing.length > 0) {
    const matchedTier = product.bulkPricing
      .filter((t) => calcQty >= t.minQuantity && (t.maxQuantity === null || t.maxQuantity === undefined || calcQty <= t.maxQuantity))
      .sort((a, b) => b.minQuantity - a.minQuantity)[0];
    if (matchedTier) unitCost = matchedTier.unitCost;
  }

  const totalCost = unitCost * calcQty;
  const revenue = calcSalePrice;
  const grossProfit = revenue - totalCost;
  const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/products" className="text-gray-400 hover:text-gray-600 text-sm">← Products</Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{product.sku}</span>
            {product.category && <span className="text-sm text-gray-500">{product.category.name}</span>}
            {product.isArchived && <Badge label="ARCHIVED" variant="neutral" />}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Base Cost</p>
          <GBPAmount amount={product.baseCost} className="text-xl font-bold text-gray-900" />
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Details</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div><dt className="text-xs text-gray-500">Supplier</dt><dd className="text-sm font-medium">{product.supplier?.name ?? '—'}</dd></div>
          <div><dt className="text-xs text-gray-500">Base Cost</dt><dd className="text-sm font-medium"><GBPAmount amount={product.baseCost} /></dd></div>
        </dl>
        {product.description && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500 mb-1">Description</p>
            <p className="text-sm text-gray-700">{product.description}</p>
          </div>
        )}
      </div>

      {/* Bulk Pricing */}
      {product.bulkPricing && product.bulkPricing.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Bulk Pricing Tiers</h3>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b">
                <th className="pb-2 text-left">Min Qty</th>
                <th className="pb-2 text-left">Max Qty</th>
                <th className="pb-2 text-left">Unit Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {product.bulkPricing.map((t) => (
                <tr key={t.id}>
                  <td className="py-2">{t.minQuantity.toLocaleString()}</td>
                  <td className="py-2">{t.maxQuantity?.toLocaleString() ?? '∞'}</td>
                  <td className="py-2"><GBPAmount amount={t.unitCost} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Profit Calculator */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Profit Calculator</h3>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Quantity</label>
            <input
              type="number"
              min={1}
              value={calcQty}
              onChange={(e) => setCalcQty(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Sale Price (£)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={calcSalePrice}
              onChange={(e) => setCalcSalePrice(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Unit Cost', value: <GBPAmount amount={unitCost} className="font-bold" /> },
            { label: 'Total Cost', value: <GBPAmount amount={totalCost} className="font-bold" /> },
            { label: 'Gross Profit', value: <GBPAmount amount={grossProfit} className={`font-bold ${grossProfit >= 0 ? 'text-green-700' : 'text-red-700'}`} /> },
            { label: 'Margin', value: <span className={`font-bold text-base ${margin >= 20 ? 'text-green-700' : margin >= 10 ? 'text-yellow-700' : 'text-red-700'}`}>{margin.toFixed(2)}%</span> },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <div className="text-sm">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
