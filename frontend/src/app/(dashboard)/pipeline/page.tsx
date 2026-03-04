'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DropResult } from '@hello-pangea/dnd';
import axiosInstance from '@/lib/axios';
import { PipelineStage, Deal } from '@/types';
import { KanbanBoard } from '@/components/pipeline/KanbanBoard';
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

  const updateStage = useMutation({
    mutationFn: ({ dealId, stageId }: { dealId: string; stageId: string }) =>
      axiosInstance.patch(`/deals/${dealId}/stage`, { stageId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deals-pipeline'] }),
  });

  // Group deals by stageId
  const dealsByStage: Record<string, Deal[]> = {};
  stages.forEach((s) => { dealsByStage[s.id] = []; });
  deals.forEach((d) => {
    if (dealsByStage[d.stageId] !== undefined) {
      dealsByStage[d.stageId].push(d);
    }
  });

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const { draggableId: dealId, destination } = result;
    const newStageId = destination.droppableId;
    if (result.source.droppableId === newStageId) return;
    updateStage.mutate({ dealId, stageId: newStageId });
  }

  if (loadingStages || loadingDeals) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">
            {deals.length} open deal{deals.length !== 1 ? 's' : ''} across {stages.length} stages
          </p>
        </div>
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

      {stages.length === 0 ? (
        <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-6 text-yellow-700 text-sm">
          No pipeline stages configured. Please set up stages in Settings.
        </div>
      ) : (
        <KanbanBoard stages={stages} dealsByStage={dealsByStage} onDragEnd={handleDragEnd} />
      )}
    </div>
  );
}
