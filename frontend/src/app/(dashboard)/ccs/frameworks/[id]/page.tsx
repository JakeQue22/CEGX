'use client';

import { use, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { CcsFramework } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const statusVariant: Record<string, 'success' | 'warning' | 'info' | 'neutral'> = {
  LIVE: 'success',
  EXPIRED: 'neutral',
  UPCOMING: 'info',
};

export default function CcsFrameworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string> | null>(null);

  const { data: framework, isLoading } = useQuery<CcsFramework>({
    queryKey: ['ccs-framework', id],
    queryFn: () => axiosInstance.get(`/ccs/frameworks/${id}`).then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      axiosInstance.patch(`/ccs/frameworks/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ccs-framework', id] });
      queryClient.invalidateQueries({ queryKey: ['ccs-frameworks'] });
      setEditing(false);
      setForm(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => axiosInstance.delete(`/ccs/frameworks/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ccs-frameworks'] });
      router.push('/ccs/frameworks');
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!framework) return <div className="text-red-600">Framework not found.</div>;

  const handleEdit = () => {
    setForm({
      reference: framework.reference ?? '',
      title: framework.title ?? '',
      description: framework.description ?? '',
      category: framework.category ?? '',
      status: framework.status ?? 'LIVE',
      startDate: framework.startDate ? framework.startDate.split('T')[0] : '',
      endDate: framework.endDate ? framework.endDate.split('T')[0] : '',
      websiteUrl: framework.websiteUrl ?? '',
    });
    setEditing(true);
  };

  const handleSave = () => {
    if (!form) return;
    updateMutation.mutate({
      reference: form.reference,
      title: form.title,
      description: form.description || undefined,
      category: form.category,
      status: form.status,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      websiteUrl: form.websiteUrl || undefined,
    });
  };

  const handleDelete = () => {
    if (window.confirm(`Delete framework "${framework.reference}"? This will also delete all lots.`)) {
      deleteMutation.mutate();
    }
  };

  const updateField = (key: string, value: string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/ccs/frameworks" className="text-gray-400 hover:text-gray-600 text-sm">← Frameworks</Link>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded">{framework.reference}</span>
          <h1 className="text-2xl font-bold text-gray-900">{framework.title}</h1>
          <Badge label={framework.status} variant={statusVariant[framework.status] ?? 'neutral'} />
        </div>
        {!editing && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleEdit}>Edit</Button>
            <Button variant="secondary" size="sm" onClick={handleDelete} loading={deleteMutation.isPending} className="!text-red-600 !border-red-200 hover:!bg-red-50">Delete</Button>
          </div>
        )}
      </div>

      {/* Read-only */}
      {!editing && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <dl className="grid grid-cols-2 gap-5">
            {[
              { label: 'Reference', value: framework.reference },
              { label: 'Category', value: framework.category },
              { label: 'Status', value: framework.status },
              { label: 'Start Date', value: framework.startDate ? new Date(framework.startDate).toLocaleDateString('en-GB') : '—' },
              { label: 'End Date', value: framework.endDate ? new Date(framework.endDate).toLocaleDateString('en-GB') : '—' },
              { label: 'Max Value', value: framework.maxValue ? `£${Number(framework.maxValue).toLocaleString()}` : '—' },
              { label: 'Regulation', value: framework.regulation ?? '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs text-gray-500">{label}</dt>
                <dd className="text-sm font-medium text-gray-900 mt-0.5">{value}</dd>
              </div>
            ))}
          </dl>
          {framework.websiteUrl && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 mb-1">Website</p>
              <a href={framework.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{framework.websiteUrl}</a>
            </div>
          )}
          {framework.description && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{framework.description}</p>
            </div>
          )}
          {framework.benefits && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 mb-1">Benefits</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{framework.benefits}</p>
            </div>
          )}
          {framework.productsServices && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 mb-1">Products &amp; Services</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{framework.productsServices}</p>
            </div>
          )}
        </div>
      )}

      {/* Edit form */}
      {editing && form && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <Input label="Reference" value={form.reference} onChange={(e) => updateField('reference', e.target.value)} />
            <Input label="Title" value={form.title} onChange={(e) => updateField('title', e.target.value)} />
            <Input label="Category" value={form.category} onChange={(e) => updateField('category', e.target.value)} />
            <Select label="Status" value={form.status} options={[{ value: 'LIVE', label: 'Live' }, { value: 'UPCOMING', label: 'Upcoming' }, { value: 'EXPIRED', label: 'Expired' }]} onChange={(e) => updateField('status', e.target.value)} />
            <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => updateField('startDate', e.target.value)} />
            <Input label="End Date" type="date" value={form.endDate} onChange={(e) => updateField('endDate', e.target.value)} />
            <Input label="Website URL" value={form.websiteUrl} onChange={(e) => updateField('websiteUrl', e.target.value)} className="col-span-2" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>
          {updateMutation.isError && <p className="text-sm text-red-600">{(updateMutation.error as any)?.response?.data?.message ?? 'Failed to update.'}</p>}
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} loading={updateMutation.isPending}>Save</Button>
            <Button variant="secondary" onClick={() => { setEditing(false); setForm(null); }} disabled={updateMutation.isPending}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Lots */}
      {framework.lots && framework.lots.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Lots ({framework.lots.length})</h2>
          <div className="space-y-2">
            {framework.lots.map((lot) => (
              <div key={lot.id} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-mono font-bold text-gray-600 bg-white px-2 py-0.5 rounded border">Lot {lot.lotNumber}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{lot.title}</p>
                  {lot.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{lot.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
