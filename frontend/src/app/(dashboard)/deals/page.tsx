'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { Deal, PipelineStage, Supplier } from '@/types';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { GBPAmount } from '@/components/ui/GBPAmount';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function DealsPage() {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [stageId, setStageId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [search, setSearch] = useState('');

  const { data: stages = [] } = useQuery<PipelineStage[]>({
    queryKey: ['pipeline-stages'],
    queryFn: () => axiosInstance.get('/pipeline').then((r) => r.data),
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['suppliers-list'],
    queryFn: () => axiosInstance.get('/suppliers', { params: { limit: 200 } }).then((r) =>
      Array.isArray(r.data) ? r.data : r.data.data ?? [],
    ),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['deals', { status, stageId, supplierId }],
    queryFn: () =>
      axiosInstance
        .get('/deals', { params: { status: status || undefined, stageId: stageId || undefined, supplierId: supplierId || undefined, limit: 100 } })
        .then((r) => (Array.isArray(r.data) ? r.data : r.data.data ?? [])),
  });

  const deals: Deal[] = (data ?? []).filter(
    (d: Deal) => !search || d.title.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<Deal>[] = [
    { key: 'title', header: 'Title', sortable: true, render: (d) => <span className="font-medium text-gray-900">{d.title}</span> },
    { key: 'status', header: 'Status', render: (d) => <Badge label={d.status} /> },
    { key: 'stage', header: 'Stage', render: (d) => <span className="text-sm text-gray-600">{d.stage?.name ?? '—'}</span> },
    { key: 'supplier', header: 'Supplier', render: (d) => d.supplier?.name ?? '—' },
    { key: 'salePrice', header: 'Sale Price', sortable: true, render: (d) => <GBPAmount amount={d.salePrice} /> },
    { key: 'shippingCost', header: 'Shipping', render: (d) => d.shippingCost ? <GBPAmount amount={d.shippingCost} /> : <span className="text-gray-400">—</span> },
    { key: 'profitMarginPercent', header: 'Margin', sortable: true, render: (d) => (
      <span className={d.profitMarginPercent >= 20 ? 'text-green-600 font-medium' : d.profitMarginPercent >= 10 ? 'text-yellow-600 font-medium' : 'text-red-600 font-medium'}>
        {d.profitMarginPercent?.toFixed(1)}%
      </span>
    )},
    { key: 'createdAt', header: 'Created', sortable: true, render: (d) => new Date(d.createdAt).toLocaleDateString('en-GB') },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
        <Link
          href="/deals/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition"
          style={{ backgroundColor: 'var(--primary-color)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Deal
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search deals…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="WON">Won</option>
          <option value="LOST">Lost</option>
        </select>
        <select value={stageId} onChange={(e) => setStageId(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Stages</option>
          {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Suppliers</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <Table
          columns={columns}
          data={deals}
          rowKey={(d) => d.id}
          onRowClick={(d) => router.push(`/deals/${d.id}`)}
        />
      )}
    </div>
  );
}
