'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function NewCourierPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', contactName: '', email: '', phone: '', website: '', trackingUrl: '', notes: '',
  });
  const [error, setError] = useState('');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const create = useMutation({
    mutationFn: (payload: Record<string, unknown>) => axiosInstance.post('/couriers', payload),
    onSuccess: (res) => router.push(`/couriers/${res.data.id}`),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to create courier');
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
      website: form.website || undefined,
      trackingUrl: form.trackingUrl || undefined,
      notes: form.notes || undefined,
    });
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Courier</h1>
        <p className="text-sm text-gray-500 mt-1">Add a new courier to your directory</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
        {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
        <Input label="Name *" value={form.name} onChange={set('name')} required placeholder="DHL Express" />
        <Input label="Contact Name" value={form.contactName} onChange={set('contactName')} placeholder="John Smith" />
        <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="contact@dhl.com" />
        <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="+44 20 1234 5678" />
        <Input label="Website" value={form.website} onChange={set('website')} placeholder="https://www.dhl.com" />
        <Input label="Tracking URL" value={form.trackingUrl} onChange={set('trackingUrl')} placeholder="https://www.dhl.com/track?id=" />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
          <textarea value={form.notes} onChange={set('notes')} rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={create.isPending}>Create Courier</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
