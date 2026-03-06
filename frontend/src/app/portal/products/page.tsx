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

interface BulkPricing {
  id: string;
  minQuantity: number;
  bulkCostPrice: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  category?: { id: string; name: string } | null;
  description?: string;
  imageUrl?: string;
  baseCostPrice?: number;
  retailPrice?: number;
  minOrderQuantity?: number;
  bulkPricings?: BulkPricing[];
}

function getUnitPrice(product: Product, qty: number): number {
  const basePrice = product.retailPrice != null ? Number(product.retailPrice) : Number(product.baseCostPrice ?? 0);
  if (product.bulkPricings && product.bulkPricings.length > 0) {
    const matched = product.bulkPricings
      .filter((bp) => qty >= bp.minQuantity)
      .sort((a, b) => b.minQuantity - a.minQuantity)[0];
    if (matched) return Number(matched.bulkCostPrice);
  }
  return basePrice;
}

export default function CustomerProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Order form state
  const [orderProductId, setOrderProductId] = useState<string | null>(null);
  const [orderProduct, setOrderProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [minQty, setMinQty] = useState(1);
  const [deliveryStreet, setDeliveryStreet] = useState('');
  const [deliveryStreet2, setDeliveryStreet2] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryCounty, setDeliveryCounty] = useState('');
  const [deliveryPostcode, setDeliveryPostcode] = useState('');
  const [notes, setNotes] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState('');
  const [orderError, setOrderError] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      const api = getCustomerAxios();
      const res = await api.get('/customer-portal/products');
      setProducts(res.data?.data || res.data || []);
    } catch {
      setError('Failed to load products.');
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
    fetchProducts();
  }, [router, fetchProducts]);

  function openOrderForm(product: Product) {
    const min = product.minOrderQuantity || 1;
    setOrderProductId(product.id);
    setOrderProduct(product);
    setMinQty(min);
    setQuantity(min);
    setDeliveryStreet('');
    setDeliveryStreet2('');
    setDeliveryCity('');
    setDeliveryCounty('');
    setDeliveryPostcode('');
    setNotes('');
    setOrderSuccess('');
    setOrderError('');
  }

  function closeOrderForm() {
    setOrderProductId(null);
    setOrderProduct(null);
  }

  async function handleOrderSubmit() {
    if (!orderProductId || !orderProduct) return;
    setOrderLoading(true);
    setOrderError('');
    setOrderSuccess('');
    try {
      const api = getCustomerAxios();
      await api.post('/customer-portal/orders', {
        productId: orderProductId,
        productName: orderProduct.name,
        quantity,
        deliveryStreet: deliveryStreet || undefined,
        deliveryStreet2: deliveryStreet2 || undefined,
        deliveryCity: deliveryCity || undefined,
        deliveryCounty: deliveryCounty || undefined,
        deliveryPostcode: deliveryPostcode || undefined,
        notes: notes || undefined,
      });
      setOrderSuccess('Order request submitted successfully!');
      setTimeout(() => closeOrderForm(), 1500);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setOrderError(
        Array.isArray(msg) ? msg.join(', ') : typeof msg === 'string' ? msg : 'Failed to submit order request. Please try again.',
      );
    } finally {
      setOrderLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('customer_token');
    router.push('/portal/login');
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
              className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-0.5"
            >
              Products
            </Link>
            <Link
              href="/portal/orders"
              className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
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
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse Products</h2>

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

        {!loading && !error && products.length === 0 && (
          <div className="text-center py-20 text-gray-500">No products available at the moment.</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const displayPrice = product.retailPrice != null
              ? Number(product.retailPrice)
              : product.baseCostPrice != null
                ? Number(product.baseCostPrice)
                : null;

            return (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {product.imageUrl && (
                  <div className="aspect-video bg-gray-100 overflow-hidden">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 leading-tight">{product.name}</h3>
                    {product.category && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 whitespace-nowrap">
                        {product.category.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-2 font-mono">SKU: {product.sku}</p>
                  {product.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{product.description}</p>
                  )}
                  {displayPrice != null && (
                    <p className="text-lg font-bold text-gray-900 mb-1">
                      £{displayPrice.toFixed(2)}
                    </p>
                  )}
                  {/* Show bulk pricing tiers if available */}
                  {product.bulkPricings && product.bulkPricings.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-1">Bulk pricing:</p>
                      <div className="space-y-0.5">
                        {product.bulkPricings.map((bp) => (
                          <p key={bp.id} className="text-xs text-gray-500">
                            {bp.minQuantity}+ units: <span className="font-semibold text-green-700">£{Number(bp.bulkCostPrice).toFixed(2)}/unit</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  {product.minOrderQuantity && product.minOrderQuantity > 1 && (
                    <p className="text-xs text-gray-500 mb-4">
                      Min. order: {product.minOrderQuantity} units
                    </p>
                  )}

                  {orderProductId === product.id && orderProduct ? (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                      <h4 className="text-sm font-semibold text-gray-900">Request Order</h4>

                      {orderSuccess && (
                        <div className="p-2 rounded bg-green-50 border border-green-200 text-green-700 text-xs">
                          {orderSuccess}
                        </div>
                      )}
                      {orderError && (
                        <div className="p-2 rounded bg-red-50 border border-red-200 text-red-700 text-xs">
                          {orderError}
                        </div>
                      )}

                      {/* Quantity + estimated total */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          min={minQty}
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(minQty, Number(e.target.value)))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      {displayPrice != null && (
                        <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Unit price:</span>
                            <span className="font-medium">£{getUnitPrice(orderProduct, quantity).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm font-bold text-gray-900 mt-1">
                            <span>Estimated total:</span>
                            <span>£{(getUnitPrice(orderProduct, quantity) * quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      )}

                      {/* Delivery Address */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Delivery Address
                        </label>
                        <input
                          type="text"
                          value={deliveryStreet}
                          onChange={(e) => setDeliveryStreet(e.target.value)}
                          placeholder="Street address"
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          value={deliveryStreet2}
                          onChange={(e) => setDeliveryStreet2(e.target.value)}
                          placeholder="Street address line 2 (optional)"
                          className="w-full px-3 py-2 mt-1.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                          <input
                            type="text"
                            value={deliveryCity}
                            onChange={(e) => setDeliveryCity(e.target.value)}
                            placeholder="City"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            value={deliveryCounty}
                            onChange={(e) => setDeliveryCounty(e.target.value)}
                            placeholder="County"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <input
                          type="text"
                          value={deliveryPostcode}
                          onChange={(e) => setDeliveryPostcode(e.target.value)}
                          placeholder="Postcode"
                          className="w-full px-3 py-2 mt-1.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={2}
                          placeholder="Any special requirements…"
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleOrderSubmit}
                          disabled={orderLoading || quantity < minQty}
                          className="flex-1 py-2 px-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                          {orderLoading ? 'Submitting…' : 'Request Order'}
                        </button>
                        <button
                          onClick={closeOrderForm}
                          className="py-2 px-3 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => openOrderForm(product)}
                      className="w-full py-2.5 px-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors text-sm"
                    >
                      Request Order
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
