'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DropResult } from '@hello-pangea/dnd';
import axiosInstance from '@/lib/axios';
import { PipelineStage, Deal, MarketingLead } from '@/types';
import { KanbanBoard, PipelineItem } from '@/components/pipeline/KanbanBoard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';

export default function PipelinePage() {
  const queryClient = useQueryClient();

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
