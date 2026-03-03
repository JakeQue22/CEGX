'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { Deal, DealStageHistory, FollowUp, PipelineStage } from '@/types';
import { DealFinancials } from '@/components/deals/DealFinancials';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: deal, isLoading } = useQuery<Deal>({
    queryKey: ['deal', id],
    queryFn: () => axiosInstance.get(`/deals/${id}`).then((r) => r.data),
  });

  const { data: stages = [] } = useQuery<PipelineStage[]>({
    queryKey: ['pipeline-stages'],
    queryFn: () => axiosInstance.get('/pipeline-stages').then((r) => r.data),
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => axiosInstance.patch(`/deals/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deal', id] }),
  });

  const changeStage = useMutation({
    mutationFn: (stageId: string) => axiosInstance.patch(`/deals/${id}/stage`, { stageId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deal', id] }),
  });

  const completeFollowUp = useMutation({
    mutationFn: (fuId: string) => axiosInstance.patch(`/follow-ups/${fuId}/complete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deal', id] }),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!deal) return <div className="text-red-600">Deal not found.</div>;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/deals" className="text-gray-400 hover:text-gray-600 text-sm">← Deals</Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{deal.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge label={deal.status} />
            <span className="text-sm text-gray-500">{deal.stage?.name}</span>
            <span className="text-xs text-gray-400">{formatDate(deal.createdAt)}</span>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {deal.status === 'OPEN' && (
            <>
              <Button variant="secondary" size="sm" onClick={() => updateStatus.mutate('WON')}>Mark Won</Button>
              <Button variant="danger" size="sm" onClick={() => updateStatus.mutate('LOST')}>Mark Lost</Button>
            </>
          )}
        </div>
      </div>

      {/* Financials */}
      <DealFinancials deal={deal} />

      {/* Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Deal Details</h3>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Supplier', value: deal.supplier?.name ?? '—' },
            { label: 'Product', value: deal.product?.name ?? '—' },
            { label: 'Quantity', value: deal.quantity.toLocaleString() },
            { label: 'Cost/Unit', value: `£${deal.costPrice?.toFixed(2)}` },
            { label: 'Assigned To', value: deal.assignedTo?.name ?? '—' },
            { label: 'Expected Close', value: deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs text-gray-500">{label}</dt>
              <dd className="text-sm font-medium text-gray-900 mt-0.5">{value}</dd>
            </div>
          ))}
        </dl>
        {deal.notes && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500 mb-1">Notes</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{deal.notes}</p>
          </div>
        )}
      </div>

      {/* Change Stage */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Change Stage</h3>
        <div className="flex flex-wrap gap-2">
          {stages.map((s) => (
            <button
              key={s.id}
              onClick={() => changeStage.mutate(s.id)}
              disabled={s.id === deal.stageId}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${
                s.id === deal.stageId
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Stage History */}
      {deal.stageHistory && deal.stageHistory.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Stage History</h3>
          <ol className="relative border-l border-gray-200 space-y-4 ml-3">
            {deal.stageHistory.map((h: DealStageHistory) => (
              <li key={h.id} className="ml-4">
                <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {h.fromStage?.name ?? 'Start'} → {h.toStage?.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(h.changedAt)}{h.changedBy ? ` by ${h.changedBy.name}` : ''}
                  </p>
                  {h.notes && <p className="text-xs text-gray-500 mt-1">{h.notes}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Follow-ups */}
      {deal.followUps && deal.followUps.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Follow-ups</h3>
          <ul className="space-y-2">
            {deal.followUps.map((fu: FollowUp) => (
              <li key={fu.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50">
                <div>
                  <p className={`text-sm font-medium ${fu.isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>{fu.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Due: {formatDate(fu.dueDate)}</p>
                </div>
                {!fu.isCompleted && (
                  <Button variant="ghost" size="sm" onClick={() => completeFollowUp.mutate(fu.id)}>Complete</Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
