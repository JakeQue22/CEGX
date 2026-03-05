'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

function getCustomerAxios() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('customer_token') : null;
  return axios.create({
    baseURL: API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

interface Order {
  _id: string;
  productName?: string;
  product?: { name?: string };
  quantity: number;
  deliveryLocation?: string;
  status: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-gray-50 text-gray-500 border-gray-200',
};

export default function CustomerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      const api = getCustomerAxios();
      const res = await api.get('/customer-portal/my-orders');
      setOrders(res.data?.data || res.data || []);
    } catch {
      setError('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('customer_token');
    if (!token) {
      router.push('/portal/login');
      return;
    }
    fetchOrders();
  }, [router, fetchOrders]);

  function handleLogout() {
    localStorage.removeItem('customer_token');
    router.push('/portal/login');
  }

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-gray-900">Customer Portal</h1>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/portal/products"
              className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Products
            </Link>
            <Link
              href="/portal/orders"
              className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-0.5"
            >
              My Orders
            </Link>
            <button
              onClick={handleLogout}
              className="ml-4 text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h2>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">You haven&apos;t placed any orders yet.</p>
            <Link
              href="/portal/products"
              className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              Browse Products
            </Link>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Product</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Quantity</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Delivery Location</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {order.productName || order.product?.name || '—'}
                      </td>
                      <td className="py-3 px-4 text-gray-700">{order.quantity}</td>
                      <td className="py-3 px-4 text-gray-700">{order.deliveryLocation || '—'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${
                            statusColors[order.status?.toLowerCase()] ||
                            'bg-gray-50 text-gray-500 border-gray-200'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
