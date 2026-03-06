'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface CustomerOrder {
  id: string;
  customerId: string;
  customer?: { id: string; companyName: string; contactName: string; email: string };
  productId?: string;
  productName: string;
  quantity: number;
  deliveryLocation?: string;
  deliveryCity?: string;
  deliveryPostcode?: string;
  courierId?: string;
  courier?: { id: string; name: string };
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS = ['PENDING', 'APPROVED', 'PENDING_PAYMENT', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;

function statusVariant(status: string): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  switch (status) {
    case 'APPROVED': return 'success';
    case 'CONFIRMED': return 'success';
    case 'SHIPPED': return 'info';
    case 'DELIVERED': return 'success';
    case 'PENDING': return 'warning';
    case 'PENDING_PAYMENT': return 'warning';
    case 'CANCELLED': return 'danger';
    default: return 'neutral';
  }
}

export default function CustomerOrdersPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const { data: orders = [], isLoading } = useQuery<CustomerOrder[]>({
    queryKey: ['customer-orders', statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      return axiosInstance.get(`/customer-orders?${params}`).then((r) =>
        Array.isArray(r.data) ? r.data : []);
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      axiosInstance.patch(`/customer-orders/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customer-orders'] }),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and process customer orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${!statusFilter ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          All ({orders.length})
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s === statusFilter ? '' : s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${statusFilter === s ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {orders.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-400">No orders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Product</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Qty</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {order.customer?.companyName || order.customer?.contactName || '—'}
                        </p>
                        <p className="text-xs text-gray-500">{order.customer?.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{order.productName}</td>
                    <td className="px-4 py-3 text-gray-700">{order.quantity}</td>
                    <td className="px-4 py-3">
                      <Badge label={order.status.replace(/_/g, ' ')} variant={statusVariant(order.status)} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(order.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        <Link
                          href={`/customer-orders/${order.id}`}
                          className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition"
                        >
                          View
                        </Link>
                        {order.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => updateStatus.mutate({ id: order.id, status: 'APPROVED' })}
                              disabled={updateStatus.isPending}
                              className="px-2 py-1 text-xs font-medium text-green-600 bg-green-50 rounded hover:bg-green-100 transition disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => updateStatus.mutate({ id: order.id, status: 'CANCELLED' })}
                              disabled={updateStatus.isPending}
                              className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {order.status === 'APPROVED' && (
                          <button
                            onClick={() => updateStatus.mutate({ id: order.id, status: 'PENDING_PAYMENT' })}
                            disabled={updateStatus.isPending}
                            className="px-2 py-1 text-xs font-medium text-amber-600 bg-amber-50 rounded hover:bg-amber-100 transition disabled:opacity-50"
                          >
                            Pending Payment
                          </button>
                        )}
                        {(order.status === 'PENDING_PAYMENT' || order.status === 'APPROVED') && (
                          <button
                            onClick={() => updateStatus.mutate({ id: order.id, status: 'CONFIRMED' })}
                            disabled={updateStatus.isPending}
                            className="px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100 transition disabled:opacity-50"
                          >
                            Confirm
                          </button>
                        )}
                        {order.status === 'CONFIRMED' && (
                          <button
                            onClick={() => updateStatus.mutate({ id: order.id, status: 'SHIPPED' })}
                            disabled={updateStatus.isPending}
                            className="px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100 transition disabled:opacity-50"
                          >
                            Ship
                          </button>
                        )}
                        {order.status === 'SHIPPED' && (
                          <button
                            onClick={() => updateStatus.mutate({ id: order.id, status: 'DELIVERED' })}
                            disabled={updateStatus.isPending}
                            className="px-2 py-1 text-xs font-medium text-emerald-600 bg-emerald-50 rounded hover:bg-emerald-100 transition disabled:opacity-50"
                          >
                            Delivered
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
