'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { Courier } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface EditForm {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  trackingUrl: string;
  notes: string;
  isActive: boolean;
}

function buildForm(courier: Courier): EditForm {
  return {
    name: courier.name ?? '',
    contactName: courier.contactName ?? '',
    email: courier.email ?? '',
    phone: courier.phone ?? '',
    website: courier.website ?? '',
    trackingUrl: courier.trackingUrl ?? '',
    notes: courier.notes ?? '',
    isActive: courier.isActive,
  };
}

export default function CourierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);

  const { data: courier, isLoading } = useQuery<Courier>({
    queryKey: ['courier', id],
    queryFn: () => axiosInstance.get(`/couriers/${id}`).then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      axiosInstance.patch(`/couriers/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courier', id] });
      setEditing(false);
      setForm(null);
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!courier) return <div className="text-red-600">Courier not found.</div>;

  const handleEdit = () => {
    setForm(buildForm(courier));
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setForm(null);
    updateMutation.reset();
  };

  const handleSave = () => {
    if (!form) return;
    updateMutation.mutate({
      name: form.name,
      contactName: form.contactName || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      website: form.website || undefined,
      trackingUrl: form.trackingUrl || undefined,
      notes: form.notes || undefined,
      isActive: form.isActive,
    });
  };

  const set = (field: keyof EditForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => (f ? { ...f, [field]: e.target.value } : f));

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/couriers" className="text-gray-400 hover:text-gray-600 text-sm">← Couriers</Link>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{courier.name}</h1>
          <Badge label={courier.isActive ? 'Active' : 'Inactive'} variant={courier.isActive ? 'success' : 'neutral'} />
        </div>
        {!editing && (
          <Button variant="secondary" size="sm" onClick={handleEdit}>Edit</Button>
        )}
      </div>

      {!editing ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <dl className="grid grid-cols-2 gap-5">
            {[
              { label: 'Contact Name', value: courier.contactName ?? '—' },
              { label: 'Email', value: courier.email ?? '—' },
              { label: 'Phone', value: courier.phone ?? '—' },
              { label: 'Website', value: courier.website ?? '—' },
              { label: 'Tracking URL', value: courier.trackingUrl ?? '—' },
              { label: 'Created', value: new Date(courier.createdAt).toLocaleDateString() },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs text-gray-500">{label}</dt>
                <dd className="text-sm font-medium text-gray-900 mt-0.5">{value}</dd>
              </div>
            ))}
          </dl>
          {courier.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{courier.notes}</p>
            </div>
          )}
        </div>
      ) : form && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <Input label="Name *" value={form.name} onChange={set('name')} required />
            <Input label="Contact Name" value={form.contactName} onChange={set('contactName')} />
            <Input label="Email" type="email" value={form.email} onChange={set('email')} />
            <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} />
            <Input label="Website" value={form.website} onChange={set('website')} />
            <Input label="Tracking URL" value={form.trackingUrl} onChange={set('trackingUrl')} />
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
              {(updateMutation.error as any)?.response?.data?.message ?? 'Failed to update courier.'}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} loading={updateMutation.isPending}>Save</Button>
            <Button variant="secondary" onClick={handleCancel} disabled={updateMutation.isPending}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
