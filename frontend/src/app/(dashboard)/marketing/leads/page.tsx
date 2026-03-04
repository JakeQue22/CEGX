'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import axiosInstance from '@/lib/axios';
import { MarketingLead } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function MarketingLeadsPage() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLead, setNewLead] = useState({
    companyName: '', contactName: '', contactEmail: '', contactPhone: '', website: '', industry: '', source: '', notes: '',
  });

  const { data, isLoading } = useQuery<MarketingLead[]>({
    queryKey: ['marketing-leads'],
    queryFn: () => axiosInstance.get('/marketing/outreach/leads').then((r) =>
      Array.isArray(r.data) ? r.data : []),
  });

  const createLead = useMutation({
    mutationFn: (data: any) => axiosInstance.post('/marketing/outreach/leads', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-leads'] });
      setShowAddForm(false);
      setNewLead({ companyName: '', contactName: '', contactEmail: '', contactPhone: '', website: '', industry: '', source: '', notes: '' });
    },
  });

  const leads = data ?? [];

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

      {/* Add Lead Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Add New Lead</h2>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Company Name *" required value={newLead.companyName} onChange={(e) => setNewLead({ ...newLead, companyName: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <input type="text" placeholder="Contact Name" value={newLead.contactName} onChange={(e) => setNewLead({ ...newLead, contactName: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <input type="email" placeholder="Email" value={newLead.contactEmail} onChange={(e) => setNewLead({ ...newLead, contactEmail: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <input type="text" placeholder="Phone" value={newLead.contactPhone} onChange={(e) => setNewLead({ ...newLead, contactPhone: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <input type="text" placeholder="Website" value={newLead.website} onChange={(e) => setNewLead({ ...newLead, website: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <input type="text" placeholder="Industry" value={newLead.industry} onChange={(e) => setNewLead({ ...newLead, industry: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <textarea placeholder="Notes" value={newLead.notes} onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          <div className="flex gap-2">
            <button onClick={() => createLead.mutate(newLead)} disabled={!newLead.companyName || createLead.isPending} className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition disabled:opacity-50">
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
            <div key={lead.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{lead.companyName}</p>
                  <Badge label={lead.status} />
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {lead.contactName || 'No contact'} • {lead.contactEmail || 'No email'} {lead.industry ? `• ${lead.industry}` : ''}
                </p>
                {lead.campaign && <p className="text-xs text-blue-500 mt-0.5">Campaign: {lead.campaign.name}</p>}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>{lead._count?.outreachEmails ?? 0} emails</span>
                <span>•</span>
                <span>{new Date(lead.createdAt).toLocaleDateString('en-GB')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
