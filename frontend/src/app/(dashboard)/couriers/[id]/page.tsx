'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { Courier } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';

export default function CourierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: courier, isLoading } = useQuery<Courier>({
    queryKey: ['courier', id],
    queryFn: () => axiosInstance.get(`/couriers/${id}`).then((r) => r.data),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!courier) return <div className="text-red-600">Courier not found.</div>;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/couriers" className="text-gray-400 hover:text-gray-600 text-sm">← Couriers</Link>
      </div>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{courier.name}</h1>
        <Badge label={courier.isActive ? 'Active' : 'Inactive'} variant={courier.isActive ? 'success' : 'neutral'} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <dl className="grid grid-cols-2 gap-5">
          {[
            { label: 'Contact Name', value: courier.contactName ?? '—' },
            { label: 'Email', value: courier.email ?? '—' },
            { label: 'Phone', value: courier.phone ?? '—' },
            { label: 'Website', value: courier.website ?? '—' },
            { label: 'Tracking URL', value: courier.trackingUrl ?? '—' },
            { label: 'Created', value: new Date(courier.createdAt).toLocaleDateString() },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs text-gray-500">{label}</dt>
              <dd className="text-sm font-medium text-gray-900 mt-0.5">{value}</dd>
            </div>
          ))}
        </dl>
        {courier.notes && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500 mb-1">Notes</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{courier.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
