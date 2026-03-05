'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { Role } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

const ROLE_OPTIONS = [
  { value: 'VIEWER', label: 'Viewer' },
  { value: 'SALES_MANAGER', label: 'Sales Manager' },
  { value: 'PROCUREMENT_OFFICER', label: 'Procurement Officer' },
  { value: 'ADMIN', label: 'Admin' },
];

export default function NewUserPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
    department: '',
    role: 'VIEWER' as Role,
    password: '',
    sendWelcomeEmail: false,
    sendSetPasswordEmail: false,
  });
  const [error, setError] = useState('');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const create = useMutation({
    mutationFn: (payload: Record<string, unknown>) => axiosInstance.post('/users', payload),
    onSuccess: (res) => router.push(`/users/${res.data.id}`),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to create user');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name) { setError('Name is required.'); return; }
    if (!form.email) { setError('Email is required.'); return; }

    create.mutate({
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      title: form.title || undefined,
      department: form.department || undefined,
      role: form.role,
      password: form.password || undefined,
      sendWelcomeEmail: form.sendWelcomeEmail || undefined,
      sendSetPasswordEmail: form.sendSetPasswordEmail || undefined,
    });
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New User</h1>
        <p className="text-sm text-gray-500 mt-1">Add a new team member to the CRM</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
        {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}

        <Input label="Name *" value={form.name} onChange={set('name')} required placeholder="John Smith" />
        <Input label="Email *" type="email" value={form.email} onChange={set('email')} required placeholder="john@cegx.co.uk" />
        <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="+44 20 1234 5678" />
        <Input label="Job Title" value={form.title} onChange={set('title')} placeholder="Sales Manager" />
        <Input label="Department" value={form.department} onChange={set('department')} placeholder="Sales" />
        <Select label="Role" value={form.role} options={ROLE_OPTIONS} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))} />
        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={set('password')}
          placeholder="Leave blank to auto-generate"
        />

        <div className="space-y-2 pt-1">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.sendWelcomeEmail}
              onChange={(e) => setForm((f) => ({ ...f, sendWelcomeEmail: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Send welcome email with login details
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.sendSetPasswordEmail}
              onChange={(e) => setForm((f) => ({ ...f, sendSetPasswordEmail: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Send set-password email
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={create.isPending}>Create User</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
