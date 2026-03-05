'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { Supplier, Product, Deal, User } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { GBPAmount } from '@/components/ui/GBPAmount';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface EditForm {
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  country: string;
  rating: string;
  notes: string;
  isActive: boolean;
  salesPersonId: string;
}

function buildForm(supplier: Supplier): EditForm {
  return {
    name: supplier.name ?? '',
    contactName: supplier.contactName ?? '',
    contactEmail: supplier.contactEmail ?? '',
    contactPhone: supplier.contactPhone ?? '',
    country: supplier.country ?? '',
    rating: supplier.rating != null ? String(supplier.rating) : '',
    notes: supplier.notes ?? '',
    isActive: supplier.isActive !== false,
    salesPersonId: supplier.salesPersonId ?? '',
  };
}

const TABS = ['Info', 'Products', 'Deals', 'Profitability'] as const;
type Tab = (typeof TABS)[number];

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState<Tab>('Info');
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);

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

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => axiosInstance.get('/users').then((r) => Array.isArray(r.data) ? r.data : []),
    enabled: editing,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      axiosInstance.patch(`/suppliers/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', id] });
      setEditing(false);
      setForm(null);
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!supplier) return <div className="text-red-600">Supplier not found.</div>;

  const totalRevenue = deals.reduce((sum, d) => sum + (d.revenue ?? d.salePrice), 0);
  const totalProfit = deals.reduce((sum, d) => sum + (d.grossProfit ?? 0), 0);

  const handleEdit = () => {
    setForm(buildForm(supplier));
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setForm(null);
    updateMutation.reset();
  };

  const handleSave = () => {
    if (!form) return;
    const payload: Record<string, unknown> = {
      name: form.name,
      contactName: form.contactName || undefined,
      contactEmail: form.contactEmail || undefined,
      contactPhone: form.contactPhone || undefined,
      country: form.country || undefined,
      notes: form.notes || undefined,
      isActive: form.isActive,
      salesPersonId: form.salesPersonId || undefined,
    };
    if (form.rating !== '') {
      payload.rating = Number(form.rating);
    }
    updateMutation.mutate(payload);
  };

  const set = (field: keyof EditForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => (f ? { ...f, [field]: e.target.value } : f));

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/suppliers" className="text-gray-400 hover:text-gray-600 text-sm">← Suppliers</Link>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {supplier.country}{supplier.rating != null ? ` · ${'★'.repeat(supplier.rating)} ${supplier.rating}/5` : ''}
          </p>
        </div>
        {!editing && tab === 'Info' && (
          <Button variant="secondary" size="sm" onClick={handleEdit}>Edit</Button>
        )}
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
      {tab === 'Info' && !editing && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <dl className="grid grid-cols-2 gap-5">
            {[
              { label: 'Contact Name', value: supplier.contactName ?? '—' },
              { label: 'Sales Person', value: supplier.salesPerson?.name ?? '—' },
              { label: 'Contact Email', value: supplier.contactEmail ?? '—' },
              { label: 'Contact Phone', value: supplier.contactPhone ?? '—' },
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

      {tab === 'Info' && editing && form && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <Input label="Name *" value={form.name} onChange={set('name')} required />
            <Input label="Contact Name" value={form.contactName} onChange={set('contactName')} />
            <Input label="Contact Email" type="email" value={form.contactEmail} onChange={set('contactEmail')} />
            <Input label="Contact Phone" type="tel" value={form.contactPhone} onChange={set('contactPhone')} />
            <Input label="Country" value={form.country} onChange={set('country')} />
            <Input label="Rating (0-5)" type="number" min={0} max={5} step={0.1} value={form.rating} onChange={set('rating')} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sales Person</label>
              <select
                value={form.salesPersonId}
                onChange={set('salesPersonId')}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select sales person</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <Select
              label="Status"
              value={form.isActive ? 'true' : 'false'}
              options={[
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ]}
              onChange={(e) => setForm((f) => (f ? { ...f, isActive: e.target.value === 'true' } : f))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          {updateMutation.isError && (
            <p className="text-sm text-red-600">
              {(updateMutation.error as any)?.response?.data?.message ?? 'Failed to update supplier.'}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} loading={updateMutation.isPending}>Save</Button>
            <Button variant="secondary" onClick={handleCancel} disabled={updateMutation.isPending}>Cancel</Button>
          </div>
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
