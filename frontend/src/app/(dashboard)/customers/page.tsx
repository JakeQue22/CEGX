'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { Customer } from '@/types';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function CustomersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () =>
      axiosInstance.get('/customers', {
        params: { limit: 200 },
      }).then((r) => (Array.isArray(r.data) ? r.data : r.data.data ?? [])),
  });

  const customers: Customer[] = (data ?? []).filter(
    (c: Customer) =>
      !search ||
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.contactName?.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<Customer>[] = [
    { key: 'companyName', header: 'Company Name', sortable: true, render: (c) => <span className="font-medium text-gray-900">{c.companyName}</span> },
    { key: 'contactName', header: 'Contact Name', render: (c) => c.contactName ?? '—' },
    { key: 'email', header: 'Email', render: (c) => c.email },
    { key: 'phone', header: 'Phone', render: (c) => c.phone ?? '—' },
    { key: 'isActive', header: 'Status', render: (c) => (
      <Badge label={c.isActive ? 'Active' : 'Inactive'} variant={c.isActive ? 'success' : 'neutral'} />
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <Link
          href="/customers/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition"
          style={{ backgroundColor: 'var(--primary-color)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Customer
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search customers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <Table
          columns={columns}
          data={customers}
          rowKey={(c) => c.id}
          onRowClick={(c) => router.push(`/customers/${c.id}`)}
          emptyMessage="No customers found."
        />
      )}
    </div>
  );
}
