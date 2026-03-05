'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { ProductCategory } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function NewCustomerPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: '', contactName: '', email: '', password: '', phone: '', notes: '',
  });
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const { data: categories = [] } = useQuery<ProductCategory[]>({
    queryKey: ['categories'],
    queryFn: () =>
      axiosInstance.get('/categories', { params: { limit: 200 } }).then((r) =>
        Array.isArray(r.data) ? r.data : r.data.data ?? []),
  });

  const toggleCategory = (id: string) => {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id],
    );
  };

  const create = useMutation({
    mutationFn: (payload: Record<string, unknown>) => axiosInstance.post('/customers', payload),
    onSuccess: (res) => router.push(`/customers/${res.data.id}`),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to create customer');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.companyName) { setError('Company Name is required.'); return; }
    if (!form.email) { setError('Email is required.'); return; }
    if (!form.password) { setError('Password is required.'); return; }
    create.mutate({
      companyName: form.companyName,
      contactName: form.contactName || undefined,
      email: form.email,
      password: form.password,
      phone: form.phone || undefined,
      notes: form.notes || undefined,
      categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
    });
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Customer</h1>
        <p className="text-sm text-gray-500 mt-1">Add a new customer to your directory</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
        {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
        <Input label="Company Name *" value={form.companyName} onChange={set('companyName')} required placeholder="Acme Ltd" />
        <Input label="Contact Name" value={form.contactName} onChange={set('contactName')} placeholder="John Smith" />
        <Input label="Email *" type="email" value={form.email} onChange={set('email')} required placeholder="contact@acme.com" />
        <Input label="Password *" type="password" value={form.password} onChange={set('password')} required placeholder="••••••••" />
        <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="+44 20 1234 5678" />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
          <textarea value={form.notes} onChange={set('notes')} rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {categories.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Categories</label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={categoryIds.includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {cat.name}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={create.isPending}>Create Customer</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
