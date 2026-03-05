'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { Customer, ProductCategory } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';

interface CustomerOrder {
  id: string;
  productName?: string;
  quantity?: number;
  deliveryLocation?: string;
  status?: string;
  createdAt?: string;
}

const TABS = ['Info', 'Orders'] as const;
type Tab = (typeof TABS)[number];

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState<Tab>('Info');

  const { data: customer, isLoading } = useQuery<Customer>({
    queryKey: ['customer', id],
    queryFn: () => axiosInstance.get(`/customers/${id}`).then((r) => r.data),
  });

  const { data: categories = [] } = useQuery<ProductCategory[]>({
    queryKey: ['categories'],
    queryFn: () =>
      axiosInstance.get('/categories', { params: { limit: 200 } }).then((r) =>
        Array.isArray(r.data) ? r.data : r.data.data ?? []),
    enabled: tab === 'Info',
  });

  const { data: orders = [] } = useQuery<CustomerOrder[]>({
    queryKey: ['customer-orders', id],
    queryFn: () =>
      axiosInstance.get('/customer-orders', { params: { customerId: id, limit: 100 } }).then((r) =>
        Array.isArray(r.data) ? r.data : r.data.data ?? []),
    enabled: tab === 'Orders',
  });

  if (isLoading) return <LoadingSpinner />;
  if (!customer) return <div className="text-red-600">Customer not found.</div>;

  const customerCategories = categories.filter((cat) => customer.categoryIds?.includes(cat.id));

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/customers" className="text-gray-400 hover:text-gray-600 text-sm">← Customers</Link>
      </div>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{customer.companyName}</h1>
        <Badge label={customer.isActive ? 'Active' : 'Inactive'} variant={customer.isActive ? 'success' : 'neutral'} />
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
              { label: 'Company Name', value: customer.companyName },
              { label: 'Contact Name', value: customer.contactName ?? '—' },
              { label: 'Email', value: customer.email },
              { label: 'Phone', value: customer.phone ?? '—' },
              { label: 'Status', value: customer.isActive ? 'Active' : 'Inactive' },
              { label: 'Created', value: new Date(customer.createdAt).toLocaleDateString() },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs text-gray-500">{label}</dt>
                <dd className="text-sm font-medium text-gray-900 mt-0.5">{value}</dd>
              </div>
            ))}
          </dl>
          {customerCategories.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 mb-1">Categories</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {customerCategories.map((cat) => (
                  <Badge key={cat.id} label={cat.name} variant="info" />
                ))}
              </div>
            </div>
          )}
          {customer.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'Orders' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {orders.length === 0 ? (
            <p className="p-6 text-gray-400 text-sm">No orders for this customer.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Product', 'Quantity', 'Delivery Location', 'Status', 'Date'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{o.productName ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{o.quantity ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{o.deliveryLocation ?? '—'}</td>
                    <td className="px-4 py-3">{o.status ? <Badge label={o.status} /> : '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
