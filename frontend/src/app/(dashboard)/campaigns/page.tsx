'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { EmailCampaign } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Table, Column } from '@/components/ui/Table';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function CampaignsPage() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => axiosInstance.get('/campaigns').then((r) =>
      Array.isArray(r.data) ? r.data : r.data.data ?? []),
  });

  const campaigns: EmailCampaign[] = data ?? [];

  const columns: Column<EmailCampaign>[] = [
    { key: 'name', header: 'Campaign', sortable: true, render: (c) => <span className="font-medium text-gray-900">{c.name}</span> },
    { key: 'status', header: 'Status', render: (c) => <Badge label={c.status} /> },
    { key: 'totalRecipients', header: 'Recipients', sortable: true, render: (c) => c.totalRecipients.toLocaleString() },
    { key: 'sentCount', header: 'Sent', sortable: true, render: (c) => c.sentCount.toLocaleString() },
    { key: 'openedCount', header: 'Opened', sortable: true, render: (c) => (
      <span className="text-green-600 font-medium">{c.openedCount.toLocaleString()} ({c.totalRecipients > 0 ? ((c.openedCount / c.totalRecipients) * 100).toFixed(1) : 0}%)</span>
    )},
    { key: 'scheduledAt', header: 'Scheduled', render: (c) => c.scheduledAt ? new Date(c.scheduledAt).toLocaleDateString('en-GB') : '—' },
    { key: 'createdAt', header: 'Created', sortable: true, render: (c) => new Date(c.createdAt).toLocaleDateString('en-GB') },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Email Campaigns</h1>
        <Link
          href="/campaigns/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition"
          style={{ backgroundColor: 'var(--primary-color)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Campaign
        </Link>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <Table
          columns={columns}
          data={campaigns}
          rowKey={(c) => c.id}
          onRowClick={(c) => router.push(`/campaigns/${c.id}`)}
          emptyMessage="No campaigns yet."
        />
      )}
    </div>
  );
}
