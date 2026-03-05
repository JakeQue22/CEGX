'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { Supplier, ProductCategory } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface BulkTier {
  minQuantity: number;
  maxQuantity: string;
  unitCost: number;
  discountType: string;
  discountValue: number;
}

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', sku: '', description: '', imageUrl: '', baseCost: '0',
    minOrderQty: '1', supplierId: '', categoryId: '',
  });
  const [tiers, setTiers] = useState<BulkTier[]>([]);
  const [error, setError] = useState('');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['suppliers-list'],
    queryFn: () => axiosInstance.get('/suppliers', { params: { limit: 200 } }).then((r) =>
      Array.isArray(r.data) ? r.data : r.data.data ?? []),
  });

  const { data: categories = [] } = useQuery<ProductCategory[]>({
    queryKey: ['categories'],
    queryFn: () => axiosInstance.get('/categories').then((r) => Array.isArray(r.data) ? r.data : r.data.data ?? []),
  });

  const create = useMutation({
    mutationFn: (payload: Record<string, unknown>) => axiosInstance.post('/products', payload),
    onSuccess: (res) => router.push(`/products/${res.data.id}`),
    onError: (err: unknown) => {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create product');
    },
  });

  function addTier() {
    setTiers((t) => [...t, { minQuantity: 1, maxQuantity: '', unitCost: 0, discountType: 'FIXED_PRICE', discountValue: 0 }]);
  }

  function removeTier(idx: number) {
    setTiers((t) => t.filter((_, i) => i !== idx));
  }

  function updateTier(idx: number, field: keyof BulkTier, value: string | number) {
    setTiers((t) => t.map((tier, i) => i === idx ? { ...tier, [field]: value } : tier));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name || !form.sku) { setError('Name and SKU are required.'); return; }
    create.mutate({
      name: form.name,
      sku: form.sku,
      description: form.description || undefined,
      imageUrl: form.imageUrl || undefined,
      baseCostPrice: Number(form.baseCost),
      minOrderQuantity: Number(form.minOrderQty),
      supplierId: form.supplierId || undefined,
      categoryId: form.categoryId || undefined,
      bulkPricings: tiers.length > 0 ? tiers.map((t) => ({
        minQuantity: t.minQuantity,
        bulkCostPrice: t.unitCost,
        discountType: t.discountType,
        discountValue: t.discountValue,
      })) : undefined,
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Product</h1>
        <p className="text-sm text-gray-500 mt-1">Add a new product to your catalogue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Product Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Product Name *" value={form.name} onChange={set('name')} required placeholder="Widget Pro" />
            <Input label="SKU *" value={form.sku} onChange={set('sku')} required placeholder="WGT-001" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <Input label="Image URL" type="url" value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://example.com/product-image.jpg" />
          <Input label="Base Cost (£)" type="number" min={0} step={0.01} value={form.baseCost} onChange={set('baseCost')} />
          <Input label="Min Order Quantity" type="number" min={1} step={1} value={form.minOrderQty} onChange={set('minOrderQty')} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Supplier</label>
              <select value={form.supplierId} onChange={set('supplierId')}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select supplier</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select value={form.categoryId} onChange={set('categoryId')}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Pricing Tiers */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Bulk Pricing Tiers</h2>
            <Button type="button" variant="secondary" size="sm" onClick={addTier}>+ Add Tier</Button>
          </div>
          {tiers.length === 0 ? (
            <p className="text-sm text-gray-400">No bulk pricing tiers. Click &quot;Add Tier&quot; to add volume discounts.</p>
          ) : (
            <div className="space-y-3">
              {tiers.map((tier, idx) => (
                <div key={idx} className="flex gap-3 items-end flex-wrap">
                  <Input label="Min Qty" type="number" min={1} value={tier.minQuantity}
                    onChange={(e) => updateTier(idx, 'minQuantity', Number(e.target.value))} />
                  <Input label="Max Qty" type="number" min={1} value={tier.maxQuantity}
                    onChange={(e) => updateTier(idx, 'maxQuantity', e.target.value)} placeholder="∞" />
                  <Input label="Unit Cost (£)" type="number" min={0} step={0.01} value={tier.unitCost}
                    onChange={(e) => updateTier(idx, 'unitCost', Number(e.target.value))} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Discount Type</label>
                    <select value={tier.discountType} onChange={(e) => updateTier(idx, 'discountType', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="FIXED_PRICE">FIXED_PRICE</option>
                      <option value="PERCENTAGE_OFF">PERCENTAGE_OFF</option>
                      <option value="FIXED_AMOUNT_OFF">FIXED_AMOUNT_OFF</option>
                    </select>
                  </div>
                  {tier.discountType === 'PERCENTAGE_OFF' && (
                    <Input label="Discount %" type="number" min={0} step={0.01} value={tier.discountValue}
                      onChange={(e) => updateTier(idx, 'discountValue', Number(e.target.value))} />
                  )}
                  {tier.discountType === 'FIXED_AMOUNT_OFF' && (
                    <Input label="Amount Off (£)" type="number" min={0} step={0.01} value={tier.discountValue}
                      onChange={(e) => updateTier(idx, 'discountValue', Number(e.target.value))} />
                  )}
                  <Button type="button" variant="danger" size="sm" onClick={() => removeTier(idx)}>✕</Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={create.isPending}>Create Product</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
