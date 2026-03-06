'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { DropResult } from '@hello-pangea/dnd';
import axiosInstance from '@/lib/axios';
import { PipelineStage, Deal, MarketingLead } from '@/types';
import { KanbanBoard, PipelineItem } from '@/components/pipeline/KanbanBoard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';

export default function PipelinePage() {
  const queryClient = useQueryClient();
  const [showAddLeadForm, setShowAddLeadForm] = useState(false);
  const [newLead, setNewLead] = useState({ companyName: '', contactName: '', contactEmail: '', notes: '' });

  const { data: stages = [], isLoading: loadingStages } = useQuery<PipelineStage[]>({
    queryKey: ['pipeline-stages'],
    queryFn: () => axiosInstance.get('/pipeline').then((r) => r.data),
  });

  const { data: deals = [], isLoading: loadingDeals } = useQuery<Deal[]>({
    queryKey: ['deals-pipeline'],
    queryFn: () =>
      axiosInstance.get('/deals', { params: { status: 'OPEN', limit: 500 } }).then((r) =>
        Array.isArray(r.data) ? r.data : r.data.data ?? [],
      ),
  });

  const { data: leads = [], isLoading: loadingLeads } = useQuery<MarketingLead[]>({
    queryKey: ['leads-pipeline'],
    queryFn: () =>
      axiosInstance.get('/marketing/outreach/leads').then((r) =>
        Array.isArray(r.data) ? r.data : [],
      ),
  });

  const updateDealStage = useMutation({
    mutationFn: ({ dealId, stageId }: { dealId: string; stageId: string }) =>
      axiosInstance.patch(`/deals/${dealId}/stage`, { stageId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deals-pipeline'] }),
  });

  const updateLeadStage = useMutation({
    mutationFn: ({ leadId, stageId }: { leadId: string; stageId: string }) =>
      axiosInstance.patch(`/marketing/outreach/leads/${leadId}/stage`, { stageId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads-pipeline'] }),
  });

  const createLead = useMutation({
    mutationFn: (data: any) => {
      const payload = { ...data };
      if (!payload.companyName) delete payload.companyName;
      if (!payload.contactEmail) delete payload.contactEmail;
      return axiosInstance.post('/marketing/outreach/leads', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads-pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-leads'] });
      setShowAddLeadForm(false);
      setNewLead({ companyName: '', contactName: '', contactEmail: '', notes: '' });
    },
  });

  // Only include leads that have a pipelineStageId
  const pipelineLeads = leads.filter((l) => l.pipelineStageId);

  // Group items by stageId
  const itemsByStage: Record<string, PipelineItem[]> = {};
  stages.forEach((s) => { itemsByStage[s.id] = []; });
  deals.forEach((d) => {
    if (itemsByStage[d.stageId] !== undefined) {
      itemsByStage[d.stageId].push({ type: 'deal', data: d });
    }
  });
  pipelineLeads.forEach((l) => {
    if (l.pipelineStageId && itemsByStage[l.pipelineStageId] !== undefined) {
      itemsByStage[l.pipelineStageId].push({ type: 'lead', data: l });
    }
  });

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStageId = destination.droppableId;
    if (result.source.droppableId === newStageId) return;

    if (draggableId.startsWith('lead-')) {
      const leadId = draggableId.replace('lead-', '');
      updateLeadStage.mutate({ leadId, stageId: newStageId });
    } else {
      updateDealStage.mutate({ dealId: draggableId, stageId: newStageId });
    }
  }

  const totalItems = deals.length + pipelineLeads.length;

  if (loadingStages || loadingDeals || loadingLeads) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalItems} item{totalItems !== 1 ? 's' : ''} ({deals.length} deal{deals.length !== 1 ? 's' : ''}, {pipelineLeads.length} lead{pipelineLeads.length !== 1 ? 's' : ''}) across {stages.length} stages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddLeadForm(!showAddLeadForm)}
            className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition"
            style={{ backgroundColor: '#8B5CF6' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            New Lead
          </button>
          <Link
            href="/deals/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition"
            style={{ backgroundColor: 'var(--primary-color)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Deal
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-1 rounded bg-blue-400" /> Deals
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-1 rounded bg-purple-400" /> Leads
        </span>
      </div>

      {/* Inline New Lead Form */}
      {showAddLeadForm && (
        <div className="bg-white rounded-xl border border-purple-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Quick Add Lead</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input type="text" placeholder="Company Name" value={newLead.companyName} onChange={(e) => setNewLead({ ...newLead, companyName: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
            <input type="text" placeholder="Contact Name" value={newLead.contactName} onChange={(e) => setNewLead({ ...newLead, contactName: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
            <input type="email" placeholder="Email" value={newLead.contactEmail} onChange={(e) => setNewLead({ ...newLead, contactEmail: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
            <input type="text" placeholder="Notes" value={newLead.notes} onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => createLead.mutate(newLead)} disabled={createLead.isPending} className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition disabled:opacity-50" style={{ backgroundColor: '#8B5CF6' }}>
              {createLead.isPending ? 'Saving...' : 'Add to Pipeline'}
            </button>
            <button onClick={() => setShowAddLeadForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
          </div>
        </div>
      )}

      {stages.length === 0 ? (
        <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-6 text-yellow-700 text-sm">
          No pipeline stages configured. Please set up stages in Settings.
        </div>
      ) : (
        <KanbanBoard stages={stages} itemsByStage={itemsByStage} onDragEnd={handleDragEnd} />
      )}
    </div>
  );
}
