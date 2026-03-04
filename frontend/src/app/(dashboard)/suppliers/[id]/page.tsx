'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { Supplier, Product, Deal } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { GBPAmount } from '@/components/ui/GBPAmount';
import { Badge } from '@/components/ui/Badge';

const TABS = ['Info', 'Products', 'Deals', 'Profitability'] as const;
type Tab = (typeof TABS)[number];

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState<Tab>('Info');

  const { data: supplier, isLoading } = useQuery<Supplier>({
    queryKey: ['supplier', id],
    queryFn: () => axiosInstance.get(`/suppliers/${id}`).then((r) => r.data),
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['supplier-products', id],
    queryFn: () => axiosInstance.get('/products', { params: { supplierId: id, limit: 100 } }).then((r) =>
      Array.isArray(r.data) ? r.data : r.data.data ?? []),
    enabled: tab === 'Products',
  });

  const { data: deals = [] } = useQuery<Deal[]>({
    queryKey: ['supplier-deals', id],
    queryFn: () => axiosInstance.get('/deals', { params: { supplierId: id, limit: 100 } }).then((r) =>
      Array.isArray(r.data) ? r.data : r.data.data ?? []),
    enabled: tab === 'Deals' || tab === 'Profitability',
  });

  if (isLoading) return <LoadingSpinner />;
  if (!supplier) return <div className="text-red-600">Supplier not found.</div>;

  const totalRevenue = deals.reduce((sum, d) => sum + (d.revenue ?? d.salePrice), 0);
  const totalProfit = deals.reduce((sum, d) => sum + (d.grossProfit ?? 0), 0);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/suppliers" className="text-gray-400 hover:text-gray-600 text-sm">← Suppliers</Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {supplier.country}{supplier.rating != null ? ` · ${'★'.repeat(supplier.rating)} ${supplier.rating}/5` : ''}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'Info' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <dl className="grid grid-cols-2 gap-5">
            {[
              { label: 'Email', value: supplier.contactEmail ?? '—' },
              { label: 'Phone', value: supplier.contactPhone ?? '—' },
              { label: 'Country', value: supplier.country ?? '—' },
              { label: 'Rating', value: supplier.rating != null ? `${supplier.rating}/5 ★` : '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs text-gray-500">{label}</dt>
                <dd className="text-sm font-medium text-gray-900 mt-0.5">{value}</dd>
              </div>
            ))}
          </dl>
          {supplier.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{supplier.notes}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'Products' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {products.length === 0 ? (
            <p className="p-6 text-gray-400 text-sm">No products for this supplier.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['SKU', 'Name', 'Category', 'Base Cost'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.sku}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <Link href={`/products/${p.id}`} className="hover:text-blue-600">{p.name}</Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.category?.name ?? '—'}</td>
                    <td className="px-4 py-3"><GBPAmount amount={p.baseCostPrice} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'Deals' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {deals.length === 0 ? (
            <p className="p-6 text-gray-400 text-sm">No deals for this supplier.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Title', 'Status', 'Stage', 'Revenue', 'Profit'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deals.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <Link href={`/deals/${d.id}`} className="hover:text-blue-600">{d.title}</Link>
                    </td>
                    <td className="px-4 py-3"><Badge label={d.status} /></td>
                    <td className="px-4 py-3 text-gray-500">{d.stage?.name ?? '—'}</td>
                    <td className="px-4 py-3"><GBPAmount amount={d.revenue ?? d.salePrice} /></td>
                    <td className="px-4 py-3"><GBPAmount amount={d.grossProfit ?? 0} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'Profitability' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Deals', value: deals.length.toString() },
            { label: 'Total Revenue', value: <GBPAmount amount={totalRevenue} className="text-xl font-bold" /> },
            { label: 'Total Profit', value: <GBPAmount amount={totalProfit} className="text-xl font-bold text-green-700" /> },
            { label: 'Won Deals', value: deals.filter((d) => d.status === 'WON').length.toString() },
            { label: 'Open Deals', value: deals.filter((d) => d.status === 'OPEN').length.toString() },
            { label: 'Avg Margin', value: `${deals.length > 0 ? (deals.reduce((s, d) => s + (d.profitMarginPercent ?? 0), 0) / deals.length).toFixed(1) : 0}%` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-xs text-gray-500">{label}</p>
              <div className="mt-1 text-xl font-bold text-gray-900">{value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
