'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { Supplier, Product, PipelineStage } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { GBPAmount } from '@/components/ui/GBPAmount';
import { useSettingsStore } from '@/store/settingsStore';

export default function NewDealPage() {
  const router = useRouter();
  const { settings } = useSettingsStore();

  const [title, setTitle] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [salePrice, setSalePrice] = useState(0);
  const [adSpend, setAdSpend] = useState(0);
  const [stageId, setStageId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['suppliers-list'],
    queryFn: () => axiosInstance.get('/suppliers', { params: { limit: 200 } }).then((r) =>
      Array.isArray(r.data) ? r.data : r.data.data ?? []),
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products-list', supplierId],
    queryFn: () =>
      axiosInstance.get('/products', { params: { supplierId: supplierId || undefined, limit: 200 } }).then((r) =>
        Array.isArray(r.data) ? r.data : r.data.data ?? []),
    enabled: true,
  });

  const { data: stages = [] } = useQuery<PipelineStage[]>({
    queryKey: ['pipeline-stages'],
    queryFn: () => axiosInstance.get('/pipeline').then((r) => r.data),
  });

  // Auto-fill stageId with first stage
  useEffect(() => {
    if (stages.length > 0 && !stageId) setStageId(stages[0].id);
  }, [stages, stageId]);

  // Get selected product for cost preview
  const selectedProduct = products.find((p) => p.id === productId);
  const baseCost = selectedProduct?.baseCostPrice ?? 0;
  const totalCost = baseCost * quantity;
  const vatPercent = settings?.defaultVatPercent ?? 20;
  const adPercent = settings?.defaultAdPercent ?? 10;
  const vatAmount = salePrice * (vatPercent / 100);
  const adAmount = adSpend || salePrice * (adPercent / 100);
  const grossProfit = salePrice - totalCost - adAmount;
  const marginPercent = salePrice > 0 ? (grossProfit / salePrice) * 100 : 0;

  const createDeal = useMutation({
    mutationFn: (payload: Record<string, unknown>) => axiosInstance.post('/deals', payload),
    onSuccess: (res) => router.push(`/deals/${res.data.id}`),
    onError: (err: unknown) => {
      const msg =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Failed to create deal');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!title || !stageId) {
      setError('Title and stage are required.');
      return;
    }
    createDeal.mutate({
      title,
      supplierId: supplierId || undefined,
      productId: productId || undefined,
      quantity,
      salePrice,
      stageId,
      notes: notes || undefined,
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Deal</h1>
        <p className="text-sm text-gray-500 mt-1">Create a new procurement deal</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Deal Information</h2>
          <Input label="Deal Title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. 500x Widget Order Q2" />
          <Select
            label="Pipeline Stage"
            value={stageId}
            onChange={(e) => setStageId(e.target.value)}
            options={stages.map((s) => ({ value: s.id, label: s.name }))}
            placeholder="Select stage"
            required
          />
          <Select
            label="Supplier (optional)"
            value={supplierId}
            onChange={(e) => { setSupplierId(e.target.value); setProductId(''); }}
            options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
            placeholder="Select supplier"
          />
          <Select
            label="Product (optional)"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            options={products.map((p) => ({ value: p.id, label: `${p.sku} – ${p.name}` }))}
            placeholder="Select product"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
            <Input
              label="Sale Price (£)"
              type="number"
              min={0}
              step={0.01}
              value={salePrice}
              onChange={(e) => setSalePrice(Number(e.target.value))}
            />
          </div>
          <Input
            label="Ad Spend (£)"
            type="number"
            min={0}
            step={0.01}
            value={adSpend}
            onChange={(e) => setAdSpend(Number(e.target.value))}
            hint={`Leave 0 to auto-calculate (${adPercent}% of sale price)`}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any additional notes…"
            />
          </div>
        </div>

        {/* Live profit preview */}
        {salePrice > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Profit Preview</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Sale Price', value: salePrice },
                { label: 'Total Cost', value: totalCost },
                { label: 'Ad Spend', value: adAmount },
                { label: `VAT (${vatPercent}%)`, value: vatAmount },
                { label: 'Gross Profit', value: grossProfit },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-500">{label}</p>
                  <GBPAmount amount={value} className={`text-base font-bold ${label === 'Gross Profit' ? (grossProfit >= 0 ? 'text-green-700' : 'text-red-700') : 'text-gray-900'}`} />
                </div>
              ))}
              <div>
                <p className="text-xs text-gray-500">Margin</p>
                <p className={`text-base font-bold ${marginPercent >= 20 ? 'text-green-700' : marginPercent >= 10 ? 'text-yellow-700' : 'text-red-700'}`}>
                  {marginPercent.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" loading={createDeal.isPending}>
            Create Deal
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
