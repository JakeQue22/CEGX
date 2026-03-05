'use client';

import { use, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { MarketingLead, PipelineStage, LeadStatus, Product, ProductCategory } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'RESPONDED', label: 'Responded' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'CONVERTED', label: 'Converted' },
];

const statusVariant: Record<string, 'success' | 'warning' | 'info' | 'neutral'> = {
  NEW: 'info',
  CONTACTED: 'warning',
  RESPONDED: 'success',
  QUALIFIED: 'success',
  CONVERTED: 'neutral',
};

interface EditForm {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  industry: string;
  source: string;
  notes: string;
  status: string;
  pipelineStageId: string;
  productId: string;
  categoryId: string;
  productIds: string[];
  categoryIds: string[];
}

function buildFormFromLead(lead: MarketingLead): EditForm {
  return {
    companyName: lead.companyName ?? '',
    contactName: lead.contactName ?? '',
    contactEmail: lead.contactEmail ?? '',
    contactPhone: lead.contactPhone ?? '',
    website: lead.website ?? '',
    industry: lead.industry ?? '',
    source: lead.source ?? '',
    notes: lead.notes ?? '',
    status: lead.status,
    pipelineStageId: lead.pipelineStageId ?? '',
    productId: lead.productId ?? '',
    categoryId: lead.categoryId ?? '',
    productIds: (lead.productIds as string[]) ?? [],
    categoryIds: (lead.categoryIds as string[]) ?? [],
  };
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);

  const { data: lead, isLoading } = useQuery<MarketingLead>({
    queryKey: ['lead', id],
    queryFn: () => axiosInstance.get(`/marketing/outreach/leads/${id}`).then((r) => r.data),
  });

  const { data: stages = [] } = useQuery<PipelineStage[]>({
    queryKey: ['pipeline-stages'],
    queryFn: () => axiosInstance.get('/pipeline').then((r) => r.data),
    enabled: editing,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products-list'],
    queryFn: () => axiosInstance.get('/products').then((r) =>
      Array.isArray(r.data) ? r.data : r.data?.data ?? []),
  });

  const { data: categories = [] } = useQuery<ProductCategory[]>({
    queryKey: ['categories-list'],
    queryFn: () => axiosInstance.get('/categories').then((r) =>
      Array.isArray(r.data) ? r.data : []),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      axiosInstance.put(`/marketing/outreach/leads/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['marketing-leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-pipeline'] });
      setEditing(false);
      setForm(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => axiosInstance.delete(`/marketing/outreach/leads/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-leads'] });
      router.push('/marketing/leads');
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!lead) return <div className="text-red-600">Lead not found.</div>;

  const handleEdit = () => {
    setForm(buildFormFromLead(lead));
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
      contactName: form.contactName || undefined,
      contactEmail: form.contactEmail || undefined,
      contactPhone: form.contactPhone || undefined,
      website: form.website || undefined,
      industry: form.industry || undefined,
      source: form.source || undefined,
      notes: form.notes || undefined,
      status: form.status,
      pipelineStageId: form.pipelineStageId || undefined,
      productId: form.productId || undefined,
      categoryId: form.categoryId || undefined,
      productIds: form.productIds.length > 0 ? form.productIds : undefined,
      categoryIds: form.categoryIds.length > 0 ? form.categoryIds : undefined,
    };
    updateMutation.mutate(payload);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete lead "${lead.companyName}"? This cannot be undone.`)) {
      deleteMutation.mutate();
    }
  };

  const updateField = <K extends keyof EditForm>(key: K, value: EditForm[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/marketing/leads" className="text-gray-400 hover:text-gray-600 text-sm">← Leads</Link>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{lead.companyName}</h1>
          <Badge label={lead.status} variant={statusVariant[lead.status] ?? 'neutral'} />
        </div>
        {!editing && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleEdit}>Edit</Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDelete}
              loading={deleteMutation.isPending}
              className="!text-red-600 !border-red-200 hover:!bg-red-50"
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Read-only view */}
      {!editing && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <dl className="grid grid-cols-2 gap-5">
            {[
              { label: 'Company', value: lead.companyName },
              { label: 'Contact', value: lead.contactName ?? '—' },
              { label: 'Email', value: lead.contactEmail ?? '—' },
              { label: 'Phone', value: lead.contactPhone ?? '—' },
              { label: 'Website', value: lead.website ?? '—' },
              { label: 'Industry', value: lead.industry ?? '—' },
              { label: 'Source', value: lead.source ?? '—' },
              { label: 'Status', value: lead.status },
              { label: 'Pipeline Stage', value: lead.pipelineStage?.name ?? 'Not in pipeline' },
              { label: 'Product', value: lead.product?.name ?? '—' },
              { label: 'Category', value: lead.category?.name ?? '—' },
              { label: 'Campaign', value: lead.campaign?.name ?? '—' },
              { label: 'Emails Sent', value: String(lead._count?.outreachEmails ?? 0) },
              { label: 'Created', value: new Date(lead.createdAt).toLocaleDateString('en-GB') },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs text-gray-500">{label}</dt>
                <dd className="text-sm font-medium text-gray-900 mt-0.5">{value}</dd>
              </div>
            ))}
          </dl>

          {/* Show multi-select products */}
          {lead.productIds && (lead.productIds as string[]).length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 mb-1">Products</p>
              <div className="flex flex-wrap gap-1.5">
                {(lead.productIds as string[]).map((pid) => {
                  const p = products.find((pr) => pr.id === pid);
                  return <span key={pid} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{p?.name ?? pid}</span>;
                })}
              </div>
            </div>
          )}

          {/* Show multi-select categories */}
          {lead.categoryIds && (lead.categoryIds as string[]).length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 mb-1">Categories</p>
              <div className="flex flex-wrap gap-1.5">
                {(lead.categoryIds as string[]).map((cid) => {
                  const c = categories.find((cat) => cat.id === cid);
                  return <span key={cid} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">{c?.name ?? cid}</span>;
                })}
              </div>
            </div>
          )}

          {lead.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Edit form */}
      {editing && form && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <Input label="Company Name" value={form.companyName} onChange={(e) => updateField('companyName', e.target.value)} />
            <Input label="Contact Name" value={form.contactName} onChange={(e) => updateField('contactName', e.target.value)} />
            <Input label="Email" type="email" value={form.contactEmail} onChange={(e) => updateField('contactEmail', e.target.value)} />
            <Input label="Phone" value={form.contactPhone} onChange={(e) => updateField('contactPhone', e.target.value)} />
            <Input label="Website" value={form.website} onChange={(e) => updateField('website', e.target.value)} />
            <Input label="Industry" value={form.industry} onChange={(e) => updateField('industry', e.target.value)} />
            <Input label="Source" value={form.source} onChange={(e) => updateField('source', e.target.value)} />
            <Select
              label="Status"
              value={form.status}
              options={STATUS_OPTIONS}
              onChange={(e) => updateField('status', e.target.value)}
            />
            <Select
              label="Pipeline Stage"
              value={form.pipelineStageId}
              options={[
                { value: '', label: 'Not in pipeline' },
                ...stages.map((s) => ({ value: s.id, label: s.name })),
              ]}
              onChange={(e) => updateField('pipelineStageId', e.target.value)}
            />
          </div>

          {/* Products - Checkboxes */}
          {products.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Products</label>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                {products.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                    <input
                      type="checkbox"
                      checked={form.productIds.includes(p.id)}
                      onChange={(e) => {
                        setForm((prev) => prev ? {
                          ...prev,
                          productIds: e.target.checked
                            ? [...prev.productIds, p.id]
                            : prev.productIds.filter((id) => id !== p.id),
                        } : prev);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{p.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Categories - Checkboxes */}
          {categories.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Categories</label>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                {categories.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                    <input
                      type="checkbox"
                      checked={form.categoryIds.includes(c.id)}
                      onChange={(e) => {
                        setForm((prev) => prev ? {
                          ...prev,
                          categoryIds: e.target.checked
                            ? [...prev.categoryIds, c.id]
                            : prev.categoryIds.filter((id) => id !== c.id),
                        } : prev);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{c.name}</span>
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
                ?? 'Failed to update lead.'}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} loading={updateMutation.isPending}>Save</Button>
            <Button variant="secondary" onClick={handleCancel} disabled={updateMutation.isPending}>Cancel</Button>
          </div>
        </div>
      )}

      {deleteMutation.isError && (
        <p className="text-sm text-red-600">
          {(deleteMutation.error as any)?.response?.data?.message ?? 'Failed to delete lead.'}
        </p>
      )}
    </div>
  );
}
