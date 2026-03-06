'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axios';
import { MarketingLead, Product, ProductCategory } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const statusVariant: Record<string, 'success' | 'warning' | 'info' | 'neutral'> = {
  NEW: 'info',
  CONTACTED: 'warning',
  RESPONDED: 'success',
  QUALIFIED: 'success',
  CONVERTED: 'neutral',
};

export default function MarketingLeadsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState('');
  const [newLead, setNewLead] = useState({
    companyName: '', contactName: '', contactEmail: '', contactPhone: '', website: '', industry: '', source: '', notes: '', productIds: [] as string[], categoryIds: [] as string[],
  });

  const { data, isLoading } = useQuery<MarketingLead[]>({
    queryKey: ['marketing-leads'],
    queryFn: () => axiosInstance.get('/marketing/outreach/leads').then((r) =>
      Array.isArray(r.data) ? r.data : []),
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

  const createLead = useMutation({
    mutationFn: (data: any) => {
      const payload = { ...data };
      if (!payload.productIds?.length) delete payload.productIds;
      if (!payload.categoryIds?.length) delete payload.categoryIds;
      if (!payload.companyName) delete payload.companyName;
      if (!payload.contactEmail) delete payload.contactEmail;
      return axiosInstance.post('/marketing/outreach/leads', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-pipeline'] });
      setShowAddForm(false);
      setNewLead({ companyName: '', contactName: '', contactEmail: '', contactPhone: '', website: '', industry: '', source: '', notes: '', productIds: [], categoryIds: [] });
    },
  });

  const allLeads = data ?? [];
  const leads = allLeads.filter((l) =>
    !search ||
    (l.companyName ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (l.contactName ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (l.contactEmail ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (l.industry ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing Leads</h1>
          <p className="text-gray-500 text-sm mt-1">Procurement companies and contacts for outreach</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition"
          style={{ backgroundColor: 'var(--primary-color)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Lead
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search leads…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Add Lead Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Add New Lead</h2>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Company Name" value={newLead.companyName} onChange={(e) => setNewLead({ ...newLead, companyName: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <input type="text" placeholder="Contact Name" value={newLead.contactName} onChange={(e) => setNewLead({ ...newLead, contactName: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <input type="email" placeholder="Email" value={newLead.contactEmail} onChange={(e) => setNewLead({ ...newLead, contactEmail: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <input type="text" placeholder="Phone" value={newLead.contactPhone} onChange={(e) => setNewLead({ ...newLead, contactPhone: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <input type="text" placeholder="Website" value={newLead.website} onChange={(e) => setNewLead({ ...newLead, website: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <input type="text" placeholder="Industry" value={newLead.industry} onChange={(e) => setNewLead({ ...newLead, industry: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>

          {/* Products - Checkboxes */}
          {products.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Products</label>
              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                {products.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                    <input
                      type="checkbox"
                      checked={newLead.productIds.includes(p.id)}
                      onChange={(e) => {
                        setNewLead((prev) => ({
                          ...prev,
                          productIds: e.target.checked
                            ? [...prev.productIds, p.id]
                            : prev.productIds.filter((id) => id !== p.id),
                        }));
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                {categories.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                    <input
                      type="checkbox"
                      checked={newLead.categoryIds.includes(c.id)}
                      onChange={(e) => {
                        setNewLead((prev) => ({
                          ...prev,
                          categoryIds: e.target.checked
                            ? [...prev.categoryIds, c.id]
                            : prev.categoryIds.filter((id) => id !== c.id),
                        }));
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{c.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <textarea placeholder="Notes" value={newLead.notes} onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          <div className="flex gap-2">
            <button onClick={() => createLead.mutate(newLead)} disabled={createLead.isPending} className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition disabled:opacity-50">
              {createLead.isPending ? 'Saving...' : 'Save Lead'}
            </button>
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
          </div>
        </div>
      )}

      {/* Leads List */}
      {isLoading ? (
        <LoadingSpinner />
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          No leads yet. Add them manually or use campaign scraping to find procurement companies.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {leads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => router.push(`/marketing/leads/${lead.id}`)}
              className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{lead.companyName || lead.contactName || 'Unnamed Lead'}</p>
                  <Badge label={lead.status} variant={statusVariant[lead.status] ?? 'neutral'} />
                  {lead.pipelineStage && (
                    <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                      {lead.pipelineStage.name}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {lead.contactName || 'No contact'} • {lead.contactEmail || 'No email'} {lead.industry ? `• ${lead.industry}` : ''}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {lead.campaign && <span className="text-xs text-blue-500">Campaign: {lead.campaign.name}</span>}
                  {lead.product && <span className="text-xs text-green-600">Product: {lead.product.name}</span>}
                  {lead.productIds && lead.productIds.length > 0 && (
                    <span className="text-xs text-green-600">
                      {lead.productIds.length} product{lead.productIds.length !== 1 ? 's' : ''} selected
                    </span>
                  )}
                  {lead.category && <span className="text-xs text-orange-600">Category: {lead.category.name}</span>}
                  {lead.categoryIds && lead.categoryIds.length > 0 && (
                    <span className="text-xs text-orange-600">
                      {lead.categoryIds.length} categor{lead.categoryIds.length !== 1 ? 'ies' : 'y'} selected
                    </span>
                  )}
                  {lead.source && <span className="text-xs text-purple-600">Source: {lead.source}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>{lead._count?.outreachEmails ?? 0} emails</span>
                <span>•</span>
                <span>{new Date(lead.createdAt).toLocaleDateString('en-GB')}</span>
                <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
