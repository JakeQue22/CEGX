'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function NewSupplierPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', contactName: '', email: '', phone: '', country: '', rating: '', notes: '',
  });
  const [error, setError] = useState('');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const create = useMutation({
    mutationFn: (payload: Record<string, unknown>) => axiosInstance.post('/suppliers', payload),
    onSuccess: (res) => router.push(`/suppliers/${res.data.id}`),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to create supplier');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name) { setError('Name is required.'); return; }
    create.mutate({
      name: form.name,
      contactName: form.contactName || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      country: form.country || undefined,
      rating: form.rating ? Number(form.rating) : undefined,
      notes: form.notes || undefined,
    });
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Supplier</h1>
        <p className="text-sm text-gray-500 mt-1">Add a new supplier to your directory</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
        {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
        <Input label="Company Name *" value={form.name} onChange={set('name')} required placeholder="Acme Ltd" />
        <Input label="Contact Name" value={form.contactName} onChange={set('contactName')} placeholder="Jane Smith" />
        <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="contact@acme.com" />
        <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="+44 20 1234 5678" />
        <Input label="Country" value={form.country} onChange={set('country')} placeholder="United Kingdom" />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Rating (1-5)</label>
          <select value={form.rating} onChange={set('rating')}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">No rating</option>
            {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} ★</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
          <textarea value={form.notes} onChange={set('notes')} rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={create.isPending}>Create Supplier</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
