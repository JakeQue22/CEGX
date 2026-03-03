'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { FollowUp } from '@/types';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function groupFollowUps(followUps: FollowUp[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);

  const overdue: FollowUp[] = [];
  const today: FollowUp[] = [];
  const upcoming: FollowUp[] = [];

  followUps.forEach((fu) => {
    const due = new Date(fu.dueDate);
    if (due < todayStart) overdue.push(fu);
    else if (due < todayEnd) today.push(fu);
    else upcoming.push(fu);
  });

  return { overdue, today, upcoming };
}

function FollowUpGroup({ title, items, onComplete, color }: {
  title: string;
  items: FollowUp[];
  onComplete: (id: string) => void;
  color: string;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${color}`}>{title} ({items.length})</h2>
      <ul className="space-y-2">
        {items.map((fu) => (
          <li key={fu.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-start justify-between gap-4 shadow-sm">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{fu.title}</p>
              {fu.description && <p className="text-xs text-gray-500 mt-0.5">{fu.description}</p>}
              <div className="flex items-center gap-3 mt-1.5">
                <span className={`text-xs font-medium ${color}`}>{formatDate(fu.dueDate)}</span>
                {fu.deal && (
                  <Link href={`/deals/${fu.deal.id}`} className="text-xs text-blue-600 hover:underline">
                    {fu.deal.title}
                  </Link>
                )}
                {fu.assignedTo && <span className="text-xs text-gray-400">→ {fu.assignedTo.name}</span>}
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => onComplete(fu.id)}>
              Complete
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function FollowUpsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['followups'],
    queryFn: () =>
      axiosInstance.get('/follow-ups', { params: { isCompleted: false, limit: 200 } }).then((r) =>
        Array.isArray(r.data) ? r.data : r.data.data ?? []),
  });

  const complete = useMutation({
    mutationFn: (id: string) => axiosInstance.patch(`/follow-ups/${id}/complete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['followups'] }),
  });

  const followUps: FollowUp[] = data ?? [];
  const { overdue, today, upcoming } = groupFollowUps(followUps);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Follow-ups</h1>
        <p className="text-sm text-gray-500 mt-1">
          {followUps.length} pending follow-up{followUps.length !== 1 ? 's' : ''}
        </p>
      </div>

      {followUps.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <p className="text-green-700 font-medium">You&apos;re all caught up! 🎉</p>
          <p className="text-sm text-green-600 mt-1">No pending follow-ups.</p>
        </div>
      )}

      <FollowUpGroup
        title="Overdue"
        items={overdue}
        onComplete={(id) => complete.mutate(id)}
        color="text-red-600"
      />
      <FollowUpGroup
        title="Today"
        items={today}
        onComplete={(id) => complete.mutate(id)}
        color="text-orange-600"
      />
      <FollowUpGroup
        title="Upcoming"
        items={upcoming}
        onComplete={(id) => complete.mutate(id)}
        color="text-blue-600"
      />
    </div>
  );
}
