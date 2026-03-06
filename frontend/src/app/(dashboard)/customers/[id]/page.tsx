'use client';

import { use, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { Customer, ProductCategory } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface CustomerOrder {
  id: string;
  productName?: string;
  quantity?: number;
  deliveryLocation?: string;
  status?: string;
  createdAt?: string;
}

interface EditForm {
  companyName: string;
  contactName: string;
  email: string;
  password: string;
  phone: string;
  notes: string;
  isActive: boolean;
  categoryIds: string[];
}

const TABS = ['Info', 'Orders'] as const;
type Tab = (typeof TABS)[number];

function buildFormFromCustomer(customer: Customer): EditForm {
  return {
    companyName: customer.companyName ?? '',
    contactName: customer.contactName ?? '',
    email: customer.email ?? '',
    password: '',
    phone: customer.phone ?? '',
    notes: customer.notes ?? '',
    isActive: customer.isActive,
    categoryIds: customer.categoryIds ?? [],
  };
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState<Tab>('Info');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);

  const queryClient = useQueryClient();

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

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      axiosInstance.patch(`/customers/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      setEditing(false);
      setForm(null);
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!customer) return <div className="text-red-600">Customer not found.</div>;

  const customerCategories = categories.filter((cat) => customer.categoryIds?.includes(cat.id));

  const handleEdit = () => {
    setForm(buildFormFromCustomer(customer));
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
      companyName: form.companyName,
      contactName: form.contactName,
      email: form.email,
      phone: form.phone,
      notes: form.notes,
      isActive: form.isActive,
      categoryIds: form.categoryIds,
    };
    const trimmedPassword = form.password.trim();
    if (trimmedPassword) {
      payload.password = trimmedPassword;
    }
    updateMutation.mutate(payload);
  };

  const updateField = <K extends keyof EditForm>(key: K, value: EditForm[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const toggleCategory = (catId: string) => {
    if (!form) return;
    const next = form.categoryIds.includes(catId)
      ? form.categoryIds.filter((c) => c !== catId)
      : [...form.categoryIds, catId];
    updateField('categoryIds', next);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/customers" className="text-gray-400 hover:text-gray-600 text-sm">← Customers</Link>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{customer.companyName}</h1>
          <Badge label={customer.isActive ? 'Active' : 'Inactive'} variant={customer.isActive ? 'success' : 'neutral'} />
        </div>
        {!editing && (
          <Button variant="secondary" size="sm" onClick={handleEdit}>
            Edit
          </Button>
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

      {tab === 'Info' && editing && form && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <Input
              label="Company Name"
              value={form.companyName}
              onChange={(e) => updateField('companyName', e.target.value)}
            />
            <Input
              label="Contact Name"
              value={form.contactName}
              onChange={(e) => updateField('contactName', e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              placeholder="Leave blank to keep current"
              onChange={(e) => updateField('password', e.target.value)}
            />
            <Select
              label="Status"
              value={form.isActive ? 'true' : 'false'}
              options={[
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ]}
              onChange={(e) => updateField('isActive', e.target.value === 'true')}
            />
          </div>

          {categories.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Categories</p>
              <div className="flex flex-wrap gap-3">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.categoryIds.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          {updateMutation.isError && (
            <p className="text-sm text-red-600">
              {(updateMutation.error as any)?.response?.data?.message
              ?? (updateMutation.error as Error)?.message
              ?? 'Failed to update customer.'}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} loading={updateMutation.isPending}>
              Save
            </Button>
            <Button variant="secondary" onClick={handleCancel} disabled={updateMutation.isPending}>
              Cancel
            </Button>
          </div>
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
