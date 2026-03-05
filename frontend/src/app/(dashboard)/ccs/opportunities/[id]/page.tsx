'use client';

import { use, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { CcsOpportunity, CcsFramework, User } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { GBPAmount } from '@/components/ui/GBPAmount';

const statusVariant: Record<string, 'success' | 'warning' | 'info' | 'neutral'> = {
  OPEN: 'success', CLOSED: 'neutral', AWARDED: 'info', CANCELLED: 'neutral',
};
const bidStatusVariant: Record<string, 'success' | 'warning' | 'info' | 'neutral'> = {
  NOT_BIDDING: 'neutral', PREPARING: 'warning', SUBMITTED: 'info', WON: 'success', LOST: 'neutral',
};
const bidStatusLabels: Record<string, string> = {
  NOT_BIDDING: 'Not Bidding', PREPARING: 'Preparing Bid', SUBMITTED: 'Bid Submitted', WON: 'Bid Won', LOST: 'Bid Lost',
};

export default function CcsOpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string> | null>(null);

  const { data: opp, isLoading } = useQuery<CcsOpportunity>({
    queryKey: ['ccs-opportunity', id],
    queryFn: () => axiosInstance.get(`/ccs/opportunities/${id}`).then((r) => r.data),
  });

  const { data: frameworks = [] } = useQuery<CcsFramework[]>({
    queryKey: ['ccs-frameworks-list'],
    queryFn: () => axiosInstance.get('/ccs/frameworks').then((r) => r.data),
    enabled: editing,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => axiosInstance.get('/users').then((r) => Array.isArray(r.data) ? r.data : r.data.data ?? []),
    enabled: editing,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      axiosInstance.patch(`/ccs/opportunities/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ccs-opportunity', id] });
      queryClient.invalidateQueries({ queryKey: ['ccs-opportunities'] });
      setEditing(false);
      setForm(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => axiosInstance.delete(`/ccs/opportunities/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ccs-opportunities'] });
      router.push('/ccs/opportunities');
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!opp) return <div className="text-red-600">Opportunity not found.</div>;

  const handleEdit = () => {
    setForm({
      title: opp.title ?? '',
      description: opp.description ?? '',
      buyerName: opp.buyerName ?? '',
      frameworkId: opp.frameworkId ?? '',
      status: opp.status ?? 'OPEN',
      closingDate: opp.closingDate ? opp.closingDate.split('T')[0] : '',
      value: opp.value ? String(Number(opp.value)) : '',
      region: opp.region ?? '',
      category: opp.category ?? '',
      noticeUrl: opp.noticeUrl ?? '',
      notes: opp.notes ?? '',
      bidStatus: opp.bidStatus ?? 'NOT_BIDDING',
      bidDeadline: opp.bidDeadline ? opp.bidDeadline.split('T')[0] : '',
      bidValue: opp.bidValue ? String(Number(opp.bidValue)) : '',
      assignedUserId: opp.assignedUserId ?? '',
    });
    setEditing(true);
  };

  const handleSave = () => {
    if (!form) return;
    updateMutation.mutate({
      title: form.title,
      description: form.description || undefined,
      buyerName: form.buyerName || undefined,
      frameworkId: form.frameworkId || undefined,
      status: form.status,
      closingDate: form.closingDate || undefined,
      value: form.value ? Number(form.value) : undefined,
      region: form.region || undefined,
      category: form.category || undefined,
      noticeUrl: form.noticeUrl || undefined,
      notes: form.notes || undefined,
      bidStatus: form.bidStatus,
      bidDeadline: form.bidDeadline || undefined,
      bidValue: form.bidValue ? Number(form.bidValue) : undefined,
      assignedUserId: form.assignedUserId || undefined,
    });
  };

  const handleDelete = () => {
    if (window.confirm(`Delete opportunity "${opp.title}"?`)) {
      deleteMutation.mutate();
    }
  };

  const updateField = (key: string, value: string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const isOverdue = opp.closingDate && new Date(opp.closingDate) < new Date();

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/ccs/opportunities" className="text-gray-400 hover:text-gray-600 text-sm">← Opportunities</Link>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">{opp.title}</h1>
          <Badge label={opp.status} variant={statusVariant[opp.status] ?? 'neutral'} />
          <Badge label={bidStatusLabels[opp.bidStatus] ?? opp.bidStatus} variant={bidStatusVariant[opp.bidStatus] ?? 'neutral'} />
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
              { label: 'Buyer', value: opp.buyerName ?? '—' },
              { label: 'Framework', value: opp.framework ? `${opp.framework.reference} — ${opp.framework.title}` : '—' },
              { label: 'Category', value: opp.category ?? '—' },
              { label: 'Region', value: opp.region ?? '—' },
              { label: 'Value', value: opp.value ? `£${Number(opp.value).toLocaleString()}` : '—' },
              { label: 'Closing Date', value: opp.closingDate ? new Date(opp.closingDate).toLocaleDateString('en-GB') : '—' },
              { label: 'Bid Status', value: bidStatusLabels[opp.bidStatus] ?? opp.bidStatus },
              { label: 'Bid Deadline', value: opp.bidDeadline ? new Date(opp.bidDeadline).toLocaleDateString('en-GB') : '—' },
              { label: 'Bid Value', value: opp.bidValue ? `£${Number(opp.bidValue).toLocaleString()}` : '—' },
              { label: 'Assigned To', value: opp.assignedUser?.name ?? '—' },
              { label: 'Created', value: new Date(opp.createdAt).toLocaleDateString('en-GB') },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs text-gray-500">{label}</dt>
                <dd className="text-sm font-medium text-gray-900 mt-0.5">{value}</dd>
              </div>
            ))}
          </dl>
          {opp.noticeUrl && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 mb-1">Notice URL</p>
              <a href={opp.noticeUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{opp.noticeUrl}</a>
            </div>
          )}
          {opp.description && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{opp.description}</p>
            </div>
          )}
          {opp.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{opp.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Edit form */}
      {editing && form && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <Input label="Title" value={form.title} onChange={(e) => updateField('title', e.target.value)} className="col-span-2" />
            <Input label="Buyer Name" value={form.buyerName} onChange={(e) => updateField('buyerName', e.target.value)} />
            <Select label="Framework" value={form.frameworkId} options={[{ value: '', label: 'None' }, ...frameworks.map((fw) => ({ value: fw.id, label: `${fw.reference} — ${fw.title}` }))]} onChange={(e) => updateField('frameworkId', e.target.value)} />
            <Input label="Value (£)" type="number" value={form.value} onChange={(e) => updateField('value', e.target.value)} />
            <Input label="Region" value={form.region} onChange={(e) => updateField('region', e.target.value)} />
            <Input label="Category" value={form.category} onChange={(e) => updateField('category', e.target.value)} />
            <Select label="Status" value={form.status} options={[{ value: 'OPEN', label: 'Open' }, { value: 'CLOSED', label: 'Closed' }, { value: 'AWARDED', label: 'Awarded' }, { value: 'CANCELLED', label: 'Cancelled' }]} onChange={(e) => updateField('status', e.target.value)} />
            <Input label="Closing Date" type="date" value={form.closingDate} onChange={(e) => updateField('closingDate', e.target.value)} />
            <Select label="Bid Status" value={form.bidStatus} options={[{ value: 'NOT_BIDDING', label: 'Not Bidding' }, { value: 'PREPARING', label: 'Preparing Bid' }, { value: 'SUBMITTED', label: 'Bid Submitted' }, { value: 'WON', label: 'Bid Won' }, { value: 'LOST', label: 'Bid Lost' }]} onChange={(e) => updateField('bidStatus', e.target.value)} />
            <Input label="Bid Deadline" type="date" value={form.bidDeadline} onChange={(e) => updateField('bidDeadline', e.target.value)} />
            <Input label="Bid Value (£)" type="number" value={form.bidValue} onChange={(e) => updateField('bidValue', e.target.value)} />
            <Select label="Assigned To" value={form.assignedUserId} options={[{ value: '', label: 'Unassigned' }, ...users.map((u) => ({ value: u.id, label: u.name }))]} onChange={(e) => updateField('assignedUserId', e.target.value)} />
            <Input label="Notice URL" value={form.noticeUrl} onChange={(e) => updateField('noticeUrl', e.target.value)} className="col-span-2" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => updateField('notes', e.target.value)} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>
          {updateMutation.isError && <p className="text-sm text-red-600">{(updateMutation.error as any)?.response?.data?.message ?? 'Failed to update.'}</p>}
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} loading={updateMutation.isPending}>Save</Button>
            <Button variant="secondary" onClick={() => { setEditing(false); setForm(null); }} disabled={updateMutation.isPending}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
