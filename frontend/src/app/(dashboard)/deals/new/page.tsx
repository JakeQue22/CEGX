'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { Supplier, Product, PipelineStage, Courier, Customer } from '@/types';
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
  const [customerId, setCustomerId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [salePrice, setSalePrice] = useState(0);
  const [adSpend, setAdSpend] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [courierId, setCourierId] = useState('');
  const [stageId, setStageId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [generateInvoice, setGenerateInvoice] = useState(false);
  const [sendInvoiceEmail, setSendInvoiceEmail] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ companyName: '', contactName: '', email: '', phone: '' });

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

  const { data: couriers = [] } = useQuery<Courier[]>({
    queryKey: ['couriers-list'],
    queryFn: () => axiosInstance.get('/couriers').then((r) => Array.isArray(r.data) ? r.data : r.data.data ?? []),
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers-list'],
    queryFn: () => axiosInstance.get('/customers').then((r) => Array.isArray(r.data) ? r.data : r.data.data ?? []),
  });

  const createCustomer = useMutation({
    mutationFn: (data: Record<string, unknown>) => axiosInstance.post('/customers', data),
    onSuccess: (res) => {
      setCustomerId(res.data.id);
      setShowNewCustomer(false);
      setNewCustomer({ companyName: '', contactName: '', email: '', phone: '' });
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
    },
  });

  const queryClient = useQueryClient();

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
  const grossProfit = salePrice - totalCost - adAmount - shippingCost;
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
      customerId: customerId || undefined,
      courierId: courierId || undefined,
      quantity,
      salePrice,
      shippingCost,
      stageId,
      notes: notes || undefined,
    });
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Deal</h1>
        <p className="text-sm text-gray-500 mt-1">Create a new procurement deal</p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-6">
        {/* Left column: Deal form */}
        <div className="flex-1 space-y-5">
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

          {/* Customer */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Customer (optional)</label>
              <button type="button" onClick={() => setShowNewCustomer(!showNewCustomer)} className="text-xs text-blue-600 hover:underline">
                {showNewCustomer ? 'Cancel' : '+ Add New'}
              </button>
            </div>
            {!showNewCustomer ? (
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.companyName}{c.contactName ? ` (${c.contactName})` : ''}</option>
                ))}
              </select>
            ) : (
              <div className="border border-blue-200 rounded-lg p-3 bg-blue-50 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Company Name *" value={newCustomer.companyName} onChange={(e) => setNewCustomer({ ...newCustomer, companyName: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="text" placeholder="Contact Name" value={newCustomer.contactName} onChange={(e) => setNewCustomer({ ...newCustomer, contactName: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="email" placeholder="Email *" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="tel" placeholder="Phone" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <button
                  type="button"
                  disabled={!newCustomer.companyName || !newCustomer.email || createCustomer.isPending}
                  onClick={() => createCustomer.mutate({
                    companyName: newCustomer.companyName,
                    contactName: newCustomer.contactName || undefined,
                    email: newCustomer.email,
                    phone: newCustomer.phone || undefined,
                    password: 'TempPass123!',
                  })}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {createCustomer.isPending ? 'Creating...' : 'Create Customer'}
                </button>
              </div>
            )}
          </div>

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
          <Select
            label="Courier (optional)"
            value={courierId}
            onChange={(e) => setCourierId(e.target.value)}
            options={couriers.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Select courier"
          />
          <div className="grid grid-cols-3 gap-4">
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
            <Input
              label="Shipping Cost (£)"
              type="number"
              min={0}
              step={0.01}
              value={shippingCost}
              onChange={(e) => setShippingCost(Number(e.target.value))}
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

          {/* Invoice Options */}
          <div className="pt-2 space-y-3 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 pt-2">Invoice Options</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={generateInvoice}
                onChange={(e) => {
                  setGenerateInvoice(e.target.checked);
                  if (!e.target.checked) setSendInvoiceEmail(false);
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Generate invoice for this deal</span>
            </label>
            <label className={`flex items-center gap-2 ${generateInvoice ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
              <input
                type="checkbox"
                checked={sendInvoiceEmail}
                disabled={!generateInvoice}
                onChange={(e) => setSendInvoiceEmail(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="text-sm text-gray-700">Send invoice via email to customer</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={createDeal.isPending}>
            Create Deal
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
        </div>

        {/* Right column: Profit Calculator */}
        <div className="w-80 flex-shrink-0">
          <div className="sticky top-6 space-y-4">
            <div className="bg-gradient-to-b from-blue-50 to-green-50 rounded-xl border border-blue-100 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Profit Calculator</h2>
              {selectedProduct && (
                <div className="mb-3 pb-3 border-b border-blue-200">
                  <p className="text-xs text-gray-500">Product</p>
                  <p className="text-sm font-medium text-gray-900">{selectedProduct.name}</p>
                  <p className="text-xs text-gray-500 mt-1">Base Cost: £{Number(selectedProduct.baseCostPrice).toFixed(2)}</p>
                </div>
              )}
              <div className="space-y-3">
                {[
                  { label: 'Revenue', value: salePrice * quantity },
                  { label: `Unit Cost × ${quantity}`, value: totalCost },
                  { label: 'Ad Spend', value: adAmount },
                  { label: 'Shipping', value: shippingCost },
                  { label: `VAT (${vatPercent}%)`, value: vatAmount },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{label}</span>
                    <GBPAmount amount={value} className="text-sm font-medium text-gray-900" />
                  </div>
                ))}
                <div className="border-t border-blue-200 pt-3 flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-900">Gross Profit</span>
                  <GBPAmount amount={grossProfit} className={`text-lg font-bold ${grossProfit >= 0 ? 'text-green-700' : 'text-red-700'}`} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-900">Margin</span>
                  <span className={`text-lg font-bold ${marginPercent >= 20 ? 'text-green-700' : marginPercent >= 10 ? 'text-yellow-700' : 'text-red-700'}`}>
                    {marginPercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
