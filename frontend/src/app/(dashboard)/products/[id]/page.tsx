'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { Product, Supplier, ProductCategory } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { GBPAmount } from '@/components/ui/GBPAmount';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface EditForm {
  name: string;
  sku: string;
  description: string;
  baseCostPrice: string;
  minOrderQuantity: string;
  supplierId: string;
  categoryId: string;
}

function buildEditForm(product: Product): EditForm {
  return {
    name: product.name,
    sku: product.sku,
    description: product.description ?? '',
    baseCostPrice: String(product.baseCostPrice),
    minOrderQuantity: String(product.minOrderQuantity ?? 1),
    supplierId: product.supplierId ?? '',
    categoryId: product.categoryId ?? '',
  };
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: () => axiosInstance.get(`/products/${id}`).then((r) => r.data),
  });

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<EditForm>({
    name: '', sku: '', description: '', baseCostPrice: '0',
    minOrderQuantity: '1', supplierId: '', categoryId: '',
  });
  const [editError, setEditError] = useState('');

  const set = (field: keyof EditForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // Load suppliers & categories only while editing
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['suppliers-list'],
    queryFn: () =>
      axiosInstance.get('/suppliers', { params: { limit: 200 } }).then((r) =>
        Array.isArray(r.data) ? r.data : r.data.data ?? []),
    enabled: isEditing,
  });

  const { data: categories = [] } = useQuery<ProductCategory[]>({
    queryKey: ['categories'],
    queryFn: () =>
      axiosInstance.get('/categories').then((r) =>
        Array.isArray(r.data) ? r.data : r.data.data ?? []),
    enabled: isEditing,
  });

  const updateProduct = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      axiosInstance.patch(`/products/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      setIsEditing(false);
      setEditError('');
    },
    onError: (err: unknown) => {
      setEditError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update product',
      );
    },
  });

  function enterEditMode() {
    if (product) setForm(buildEditForm(product));
    setEditError('');
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setEditError('');
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setEditError('');
    if (!form.name || !form.sku) {
      setEditError('Name and SKU are required.');
      return;
    }
    // Only send whitelisted DTO fields
    updateProduct.mutate({
      name: form.name,
      sku: form.sku,
      description: form.description || undefined,
      baseCostPrice: Number(form.baseCostPrice),
      minOrderQuantity: Number(form.minOrderQuantity),
      supplierId: form.supplierId || undefined,
      categoryId: form.categoryId || undefined,
    });
  }

  // Profit calculator state
  const [calcQty, setCalcQty] = useState(1);
  const [calcSalePrice, setCalcSalePrice] = useState(0);

  if (isLoading) return <LoadingSpinner />;
  if (!product) return <div className="text-red-600">Product not found.</div>;

  // Determine unit cost based on bulk pricing
  let unitCost = product.baseCostPrice;
  if (product.bulkPricings && product.bulkPricings.length > 0) {
    const matchedTier = product.bulkPricings
      .filter((t) => calcQty >= t.minQuantity)
      .sort((a, b) => b.minQuantity - a.minQuantity)[0];
    if (matchedTier) unitCost = matchedTier.bulkCostPrice;
  }

  const totalCost = unitCost * calcQty;
  const revenue = calcSalePrice;
  const grossProfit = revenue - totalCost;
  const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/products" className="text-gray-400 hover:text-gray-600 text-sm">← Products</Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            {!isEditing && (
              <Button variant="secondary" size="sm" onClick={enterEditMode}>Edit</Button>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{product.sku}</span>
            {product.category && <span className="text-sm text-gray-500">{product.category.name}</span>}
            {product.isArchived && <Badge label="ARCHIVED" variant="neutral" />}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Base Cost</p>
          <GBPAmount amount={product.baseCostPrice} className="text-xl font-bold text-gray-900" />
        </div>
      </div>

      {/* Details — view or edit */}
      {isEditing ? (
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Edit Details</h3>

          {editError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{editError}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input label="Product Name *" value={form.name} onChange={set('name')} required />
            <Input label="SKU *" value={form.sku} onChange={set('sku')} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Base Cost (£)" type="number" min={0} step={0.01} value={form.baseCostPrice} onChange={set('baseCostPrice')} />
            <Input label="Min Order Quantity" type="number" min={1} step={1} value={form.minOrderQuantity} onChange={set('minOrderQuantity')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Supplier</label>
              <select
                value={form.supplierId}
                onChange={set('supplierId')}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select supplier</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select
                value={form.categoryId}
                onChange={set('categoryId')}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={updateProduct.isPending}>Save</Button>
            <Button type="button" variant="secondary" onClick={cancelEdit} disabled={updateProduct.isPending}>Cancel</Button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Details</h3>
          <dl className="grid grid-cols-2 gap-4">
            <div><dt className="text-xs text-gray-500">Supplier</dt><dd className="text-sm font-medium">{product.supplier?.name ?? '—'}</dd></div>
            <div><dt className="text-xs text-gray-500">Base Cost</dt><dd className="text-sm font-medium"><GBPAmount amount={product.baseCostPrice} /></dd></div>
          </dl>
          {product.description && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-700">{product.description}</p>
            </div>
          )}
        </div>
      )}

      {/* Bulk Pricing */}
      {product.bulkPricings && product.bulkPricings.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Bulk Pricing Tiers</h3>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b">
                <th className="pb-2 text-left">Min Qty</th>
                <th className="pb-2 text-left">Unit Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {product.bulkPricings.map((t) => (
                <tr key={t.id}>
                  <td className="py-2">{t.minQuantity.toLocaleString()}</td>
                  <td className="py-2"><GBPAmount amount={t.bulkCostPrice} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Profit Calculator */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Profit Calculator</h3>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Quantity</label>
            <input
              type="number"
              min={1}
              value={calcQty}
              onChange={(e) => setCalcQty(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Sale Price (£)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={calcSalePrice}
              onChange={(e) => setCalcSalePrice(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Unit Cost', value: <GBPAmount amount={unitCost} className="font-bold" /> },
            { label: 'Total Cost', value: <GBPAmount amount={totalCost} className="font-bold" /> },
            { label: 'Gross Profit', value: <GBPAmount amount={grossProfit} className={`font-bold ${grossProfit >= 0 ? 'text-green-700' : 'text-red-700'}`} /> },
            { label: 'Margin', value: <span className={`font-bold text-base ${margin >= 20 ? 'text-green-700' : margin >= 10 ? 'text-yellow-700' : 'text-red-700'}`}>{margin.toFixed(2)}%</span> },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <div className="text-sm">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
