'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { MarketingCampaign } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Table, Column } from '@/components/ui/Table';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function MarketingCampaignsPage() {
  const router = useRouter();

  const { data, isLoading } = useQuery<MarketingCampaign[]>({
    queryKey: ['marketing-campaigns'],
    queryFn: () =>
      axiosInstance.get('/marketing/campaigns').then((r) =>
        Array.isArray(r.data) ? r.data : r.data.data ?? []),
  });

  const campaigns = data ?? [];

  const columns: Column<MarketingCampaign>[] = [
    { key: 'name', header: 'Campaign', sortable: true, render: (c) => <span className="font-medium text-gray-900">{c.name}</span> },
    { key: 'type', header: 'Type', render: (c) => <Badge label={c.type} /> },
    { key: 'status', header: 'Status', render: (c) => <Badge label={c.status} /> },
    { key: 'leads', header: 'Leads', render: (c) => c._count?.leads ?? 0 },
    { key: 'connections', header: 'Connections', render: (c) => c._count?.connections ?? 0 },
    { key: 'emails', header: 'Emails', render: (c) => c._count?.outreachEmails ?? 0 },
    { key: 'createdAt', header: 'Created', sortable: true, render: (c) => new Date(c.createdAt).toLocaleDateString('en-GB') },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Marketing Campaigns</h1>
        <Link
          href="/marketing/campaigns/new"
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
          onRowClick={(c) => router.push(`/marketing/campaigns/${c.id}`)}
          emptyMessage="No marketing campaigns yet."
        />
      )}
    </div>
  );
}
