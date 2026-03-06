'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import axiosInstance from '@/lib/axios';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface CustomerOrder {
  id: string;
  customerId: string;
  customer?: { id: string; companyName: string; contactName: string; email: string; phone?: string };
  productId?: string;
  productName: string;
  quantity: number;
  deliveryLocation?: string;
  deliveryStreet?: string;
  deliveryStreet2?: string;
  deliveryCity?: string;
  deliveryCounty?: string;
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

export default function CustomerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);

  const { data: order, isLoading } = useQuery<CustomerOrder>({
    queryKey: ['customer-order', id],
    queryFn: () => axiosInstance.get(`/customer-orders/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => axiosInstance.patch(`/customer-orders/${id}`, { status }),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['customer-order', id] });
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      setStatusMessage(`Order status updated to ${status.replace(/_/g, ' ')}`);
      setTimeout(() => setStatusMessage(null), 4000);
    },
  });

  const deleteOrder = useMutation({
    mutationFn: () => axiosInstance.delete(`/customer-orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      router.push('/customer-orders');
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!order) return <div className="p-8 text-center text-gray-400">Order not found</div>;

  const deliveryLines = [
    order.deliveryStreet,
    order.deliveryStreet2,
    order.deliveryCity,
    order.deliveryCounty,
    order.deliveryPostcode,
    order.deliveryLocation,
  ].filter(Boolean);

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.push('/customer-orders')} className="text-sm text-blue-600 hover:text-blue-700 mb-1">
            ← Back to Orders
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Order from {order.customer?.companyName || order.customer?.contactName || 'Unknown'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Placed {new Date(order.createdAt).toLocaleString('en-GB')} · ID: {order.id.slice(0, 8)}…
          </p>
        </div>
        <Badge label={order.status.replace(/_/g, ' ')} variant={statusVariant(order.status)} />
      </div>

      {/* Status message */}
      {statusMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3">
          <p className="text-sm text-green-800">✅ {statusMessage}</p>
        </div>
      )}

      {/* Order Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Product Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Order Details</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Product</dt>
              <dd className="font-medium text-gray-900">{order.productName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Quantity</dt>
              <dd className="font-medium text-gray-900">{order.quantity}</dd>
            </div>
            {order.courier && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Courier</dt>
                <dd className="font-medium text-gray-900">{order.courier.name}</dd>
              </div>
            )}
            {order.notes && (
              <div>
                <dt className="text-gray-500 mb-1">Notes</dt>
                <dd className="text-gray-700 bg-gray-50 rounded-lg p-2 text-xs">{order.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Customer</h2>
          <dl className="space-y-2 text-sm">
            {order.customer?.companyName && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Company</dt>
                <dd className="font-medium text-gray-900">{order.customer.companyName}</dd>
              </div>
            )}
            {order.customer?.contactName && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Contact</dt>
                <dd className="font-medium text-gray-900">{order.customer.contactName}</dd>
              </div>
            )}
            {order.customer?.email && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Email</dt>
                <dd className="text-gray-900">{order.customer.email}</dd>
              </div>
            )}
            {order.customer?.phone && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Phone</dt>
                <dd className="text-gray-900">{order.customer.phone}</dd>
              </div>
            )}
          </dl>
          {deliveryLines.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-gray-500 text-sm mb-1">Delivery Address</p>
              <p className="text-sm text-gray-700">{deliveryLines.join(', ')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Actions</h2>
        <div className="flex gap-2 flex-wrap">
          {order.status === 'PENDING' && (
            <>
              <button
                onClick={() => updateStatus.mutate('APPROVED')}
                disabled={updateStatus.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                Approve Order
              </button>
              <button
                onClick={() => updateStatus.mutate('CANCELLED')}
                disabled={updateStatus.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                Cancel Order
              </button>
            </>
          )}
          {order.status === 'APPROVED' && (
            <>
              <button
                onClick={() => updateStatus.mutate('PENDING_PAYMENT')}
                disabled={updateStatus.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
              >
                Set Pending Payment
              </button>
              <button
                onClick={() => updateStatus.mutate('CONFIRMED')}
                disabled={updateStatus.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                Confirm Order
              </button>
            </>
          )}
          {order.status === 'PENDING_PAYMENT' && (
            <button
              onClick={() => updateStatus.mutate('CONFIRMED')}
              disabled={updateStatus.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              Confirm Payment Received
            </button>
          )}
          {order.status === 'CONFIRMED' && (
            <button
              onClick={() => updateStatus.mutate('SHIPPED')}
              disabled={updateStatus.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              Mark as Shipped
            </button>
          )}
          {order.status === 'SHIPPED' && (
            <button
              onClick={() => updateStatus.mutate('DELIVERED')}
              disabled={updateStatus.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
            >
              Mark as Delivered
            </button>
          )}
          {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
            <button
              onClick={() => updateStatus.mutate('CANCELLED')}
              disabled={updateStatus.isPending}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
            >
              Cancel
            </button>
          )}

          {/* Generate Invoice */}
          <button
            onClick={() => setShowInvoice(true)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Generate Invoice
          </button>

          {/* Delete */}
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this order? This cannot be undone.')) {
                deleteOrder.mutate();
              }
            }}
            disabled={deleteOrder.isPending}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition disabled:opacity-50 ml-auto"
          >
            Delete Order
          </button>
        </div>
      </div>

      {/* Invoice Preview */}
      {showInvoice && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 print:shadow-none" id="invoice">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">INVOICE</h2>
              <p className="text-sm text-gray-500">INV-{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>Date: {new Date().toLocaleDateString('en-GB')}</p>
              <p>Order Date: {new Date(order.createdAt).toLocaleDateString('en-GB')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div>
              <p className="font-medium text-gray-900 mb-1">Bill To:</p>
              <p>{order.customer?.companyName || order.customer?.contactName}</p>
              <p>{order.customer?.email}</p>
              {deliveryLines.length > 0 && <p className="mt-1">{deliveryLines.join(', ')}</p>}
            </div>
          </div>

          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="py-2 text-left font-medium">Item</th>
                <th className="py-2 text-right font-medium">Qty</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3">{order.productName}</td>
                <td className="py-3 text-right">{order.quantity}</td>
              </tr>
            </tbody>
          </table>

          {order.courier && (
            <p className="text-sm text-gray-500 mb-4">Courier: {order.courier.name}</p>
          )}

          {order.notes && (
            <div className="text-sm text-gray-500 mb-4">
              <p className="font-medium">Notes:</p>
              <p>{order.notes}</p>
            </div>
          )}

          <div className="flex gap-2 mt-4 print:hidden">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              Print Invoice
            </button>
            <button
              onClick={() => setShowInvoice(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
