'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const UNIT_TYPES = [
  { value: 'TRUCK_LOAD', label: 'Truck Load' },
  { value: 'PALLET', label: 'Pallet' },
  { value: 'CASE', label: 'Case' },
  { value: 'BOX', label: 'Box' },
  { value: 'ITEM', label: 'Per Item' },
  { value: 'CONTAINER', label: 'Container' },
  { value: 'OTHER', label: 'Other' },
];

interface PricingTier {
  unitType: string;
  label: string;
  minQuantity: number;
  maxQuantity: string;
  price: number;
}

export default function NewCourierPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', contactName: '', email: '', phone: '', website: '', trackingUrl: '', notes: '',
  });
  const [pricings, setPricings] = useState<PricingTier[]>([]);
  const [error, setError] = useState('');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const create = useMutation({
    mutationFn: (payload: Record<string, unknown>) => axiosInstance.post('/couriers', payload),
    onSuccess: async (res) => {
      const courierId = res.data.id;
      // Create pricing tiers if any
      for (const p of pricings) {
        try {
          await axiosInstance.post(`/couriers/${courierId}/pricings`, {
            unitType: p.unitType,
            label: p.label,
            minQuantity: p.minQuantity,
            maxQuantity: p.maxQuantity ? Number(p.maxQuantity) : undefined,
            price: p.price,
          });
        } catch (_) { /* ignore pricing creation errors */ }
      }
      router.push(`/couriers/${courierId}`);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to create courier');
    },
  });

  function addPricing() {
    setPricings((t) => [...t, { unitType: 'PALLET', label: '', minQuantity: 1, maxQuantity: '', price: 0 }]);
  }

  function removePricing(idx: number) {
    setPricings((t) => t.filter((_, i) => i !== idx));
  }

  function updatePricing(idx: number, field: keyof PricingTier, value: string | number) {
    setPricings((t) => t.map((tier, i) => i === idx ? { ...tier, [field]: value } : tier));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name) { setError('Name is required.'); return; }
    create.mutate({
      name: form.name,
      contactName: form.contactName || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      website: form.website || undefined,
      trackingUrl: form.trackingUrl || undefined,
      notes: form.notes || undefined,
    });
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Courier</h1>
        <p className="text-sm text-gray-500 mt-1">Add a new courier to your directory</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <Input label="Name *" value={form.name} onChange={set('name')} required placeholder="DHL Express" />
          <Input label="Contact Name" value={form.contactName} onChange={set('contactName')} placeholder="John Smith" />
          <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="contact@dhl.com" />
          <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="+44 20 1234 5678" />
          <Input label="Website" value={form.website} onChange={set('website')} placeholder="https://www.dhl.com" />
          <Input label="Tracking URL" value={form.trackingUrl} onChange={set('trackingUrl')} placeholder="https://www.dhl.com/track?id=" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Pricing Options</h2>
            <Button type="button" variant="secondary" size="sm" onClick={addPricing}>+ Add Pricing</Button>
          </div>
          {pricings.length === 0 ? (
            <p className="text-sm text-gray-400">No pricing options. Add pricing for truck loads, pallets, cases, boxes, per item etc.</p>
          ) : (
            <div className="space-y-3">
              {pricings.map((tier, idx) => (
                <div key={idx} className="flex gap-3 items-end flex-wrap">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit Type</label>
                    <select value={tier.unitType} onChange={(e) => updatePricing(idx, 'unitType', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {UNIT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <Input label="Label" value={tier.label} onChange={(e) => updatePricing(idx, 'label', e.target.value)} placeholder="e.g. Full Truck Load" />
                  <Input label="Min Qty" type="number" min={1} value={tier.minQuantity} onChange={(e) => updatePricing(idx, 'minQuantity', Number(e.target.value))} />
                  <Input label="Price (£)" type="number" min={0} step={0.01} value={tier.price} onChange={(e) => updatePricing(idx, 'price', Number(e.target.value))} />
                  <Button type="button" variant="danger" size="sm" onClick={() => removePricing(idx)}>✕</Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={create.isPending}>Create Courier</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
