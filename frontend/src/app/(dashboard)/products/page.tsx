'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { Product, ProductCategory } from '@/types';
import { Table, Column } from '@/components/ui/Table';
import { GBPAmount } from '@/components/ui/GBPAmount';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function ProductsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const { data: categories = [] } = useQuery<ProductCategory[]>({
    queryKey: ['categories'],
    queryFn: () => axiosInstance.get('/categories').then((r) => Array.isArray(r.data) ? r.data : r.data.data ?? []),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['products', { categoryId, showArchived }],
    queryFn: () =>
      axiosInstance.get('/products', {
        params: {
          categoryId: categoryId || undefined,
          isArchived: showArchived ? undefined : false,
          limit: 200,
        },
      }).then((r) => (Array.isArray(r.data) ? r.data : r.data.data ?? [])),
  });

  const products: Product[] = (data ?? []).filter(
    (p: Product) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<Product>[] = [
    { key: 'sku', header: 'SKU', sortable: true, render: (p) => <span className="font-mono text-xs text-gray-500">{p.sku}</span> },
    { key: 'name', header: 'Name', sortable: true, render: (p) => <span className="font-medium text-gray-900">{p.name}</span> },
    { key: 'category', header: 'Category', render: (p) => p.category?.name ?? '—' },
    { key: 'supplier', header: 'Supplier', render: (p) => p.supplier?.name ?? '—' },
    { key: 'baseCostPrice', header: 'Base Cost', sortable: true, render: (p) => <GBPAmount amount={p.baseCostPrice} /> },
    { key: 'isArchived', header: 'Status', render: (p) => p.isArchived ? <Badge label="ARCHIVED" variant="neutral" /> : <Badge label="ACTIVE" variant="success" /> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link
          href="/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition"
          style={{ backgroundColor: 'var(--primary-color)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Product
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search by name or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded"
          />
          Show Archived
        </label>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <Table
          columns={columns}
          data={products}
          rowKey={(p) => p.id}
          onRowClick={(p) => router.push(`/products/${p.id}`)}
          emptyMessage="No products found."
        />
      )}
    </div>
  );
}
