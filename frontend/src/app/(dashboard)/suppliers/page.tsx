'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { Supplier } from '@/types';
import { Table, Column } from '@/components/ui/Table';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function SuppliersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [minRating, setMinRating] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', { country, minRating }],
    queryFn: () =>
      axiosInstance.get('/suppliers', {
        params: { country: country || undefined, minRating: minRating || undefined, limit: 200 },
      }).then((r) => (Array.isArray(r.data) ? r.data : r.data.data ?? [])),
  });

  const suppliers: Supplier[] = (data ?? []).filter(
    (s: Supplier) => !search || s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const countries: string[] = [...new Set<string>(suppliers.map((s) => s.country).filter(Boolean) as string[])].sort();

  const columns: Column<Supplier>[] = [
    { key: 'name', header: 'Name', sortable: true, render: (s) => <span className="font-medium text-gray-900">{s.name}</span> },
    { key: 'contactEmail', header: 'Contact', render: (s) => s.contactEmail ?? '—' },
    { key: 'contactPhone', header: 'Phone', render: (s) => s.contactPhone ?? '—' },
    { key: 'country', header: 'Country', sortable: true, render: (s) => s.country ?? '—' },
    { key: 'rating', header: 'Rating', sortable: true, render: (s) => s.rating != null ? (
      <span className="flex items-center gap-1">
        <span className="text-yellow-500">★</span> {s.rating}/5
      </span>
    ) : '—' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
        <Link
          href="/suppliers/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition"
          style={{ backgroundColor: 'var(--primary-color)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Supplier
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search suppliers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select value={country} onChange={(e) => setCountry(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Countries</option>
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={minRating} onChange={(e) => setMinRating(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Any Rating</option>
          <option value="4">4+ ★</option>
          <option value="3">3+ ★</option>
          <option value="2">2+ ★</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <Table
          columns={columns}
          data={suppliers}
          rowKey={(s) => s.id}
          onRowClick={(s) => router.push(`/suppliers/${s.id}`)}
          emptyMessage="No suppliers found."
        />
      )}
    </div>
  );
}
