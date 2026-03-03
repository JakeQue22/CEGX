'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Recipient {
  email: string;
  name: string;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', subject: '', body: '', scheduledAt: '',
  });
  const [recipients, setRecipients] = useState<Recipient[]>([{ email: '', name: '' }]);
  const [error, setError] = useState('');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const create = useMutation({
    mutationFn: (payload: Record<string, unknown>) => axiosInstance.post('/campaigns', payload),
    onSuccess: (res) => router.push(`/campaigns/${res.data.id}`),
    onError: (err: unknown) => {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create campaign');
    },
  });

  function addRecipient() {
    setRecipients((r) => [...r, { email: '', name: '' }]);
  }

  function removeRecipient(idx: number) {
    setRecipients((r) => r.filter((_, i) => i !== idx));
  }

  function updateRecipient(idx: number, field: keyof Recipient, value: string) {
    setRecipients((r) => r.map((rec, i) => i === idx ? { ...rec, [field]: value } : rec));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name || !form.subject || !form.body) {
      setError('Name, subject and body are required.');
      return;
    }
    const validRecipients = recipients.filter((r) => r.email.trim());
    create.mutate({
      name: form.name,
      subject: form.subject,
      body: form.body,
      scheduledAt: form.scheduledAt || undefined,
      recipients: validRecipients.length > 0 ? validRecipients : undefined,
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Campaign</h1>
        <p className="text-sm text-gray-500 mt-1">Create an email campaign</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Campaign Details</h2>
          <Input label="Campaign Name *" value={form.name} onChange={set('name')} required placeholder="Q2 Supplier Outreach" />
          <Input label="Email Subject *" value={form.subject} onChange={set('subject')} required placeholder="Exclusive offer for our partners" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Body *</label>
            <textarea
              value={form.body}
              onChange={set('body')}
              rows={10}
              required
              placeholder="Dear {name},&#10;&#10;We are pleased to announce…"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
            <p className="text-xs text-gray-400 mt-1">Use {'{{name}}'} as a placeholder for the recipient&apos;s name.</p>
          </div>
          <Input
            label="Schedule Send (optional)"
            type="datetime-local"
            value={form.scheduledAt}
            onChange={set('scheduledAt')}
            hint="Leave blank to save as draft"
          />
        </div>

        {/* Recipients */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Recipients</h2>
            <Button type="button" variant="secondary" size="sm" onClick={addRecipient}>+ Add Recipient</Button>
          </div>
          <div className="space-y-2">
            {recipients.map((rec, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <Input
                  placeholder="Email address"
                  type="email"
                  value={rec.email}
                  onChange={(e) => updateRecipient(idx, 'email', e.target.value)}
                />
                <Input
                  placeholder="Name"
                  value={rec.name}
                  onChange={(e) => updateRecipient(idx, 'name', e.target.value)}
                />
                {recipients.length > 1 && (
                  <button type="button" onClick={() => removeRecipient(idx)}
                    className="mt-0.5 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={create.isPending}>
            {form.scheduledAt ? 'Schedule Campaign' : 'Save Campaign'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
