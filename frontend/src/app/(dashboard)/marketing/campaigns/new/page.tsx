'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axios';
import { Product } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function NewMarketingCampaignPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'LINKEDIN',
    aiPrompt: '',
    // Targeting
    targetKeywords: '',
    targetIndustry: '',
    targetLocation: '',
    targetJobTitle: '',
    targetCompanySize: '',
    targetRevenue: '',
    targetDecisionMaker: '',
    // Schedule
    startDate: '',
    endDate: '',
    // Budget & Goals
    budget: '',
    goalLeads: '',
    goalConversions: '',
    goalDescription: '',
    // Email specifics
    emailSubject: '',
    emailSenderName: '',
    emailReplyTo: '',
    // Follow-up
    followUpDays: '',
    maxTouchpoints: '',
  });
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products-list'],
    queryFn: () => axiosInstance.get('/products', { params: { limit: 200 } }).then((r) =>
      Array.isArray(r.data) ? r.data : r.data.data ?? []),
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const createCampaign = useMutation({
    mutationFn: (data: Record<string, unknown>) => axiosInstance.post('/marketing/campaigns', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      router.push('/marketing/campaigns');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCampaign.mutate({
      name: form.name,
      description: form.description || undefined,
      type: form.type,
      aiPrompt: form.aiPrompt || undefined,
      productIds: selectedProductIds.length > 0 ? selectedProductIds : undefined,
      targetCriteria: {
        keywords: form.targetKeywords || undefined,
        industry: form.targetIndustry || undefined,
        location: form.targetLocation || undefined,
        jobTitle: form.targetJobTitle || undefined,
        companySize: form.targetCompanySize || undefined,
        revenue: form.targetRevenue || undefined,
        decisionMaker: form.targetDecisionMaker || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        goalLeads: form.goalLeads ? Number(form.goalLeads) : undefined,
        goalConversions: form.goalConversions ? Number(form.goalConversions) : undefined,
        goalDescription: form.goalDescription || undefined,
        emailSubject: form.emailSubject || undefined,
        emailSenderName: form.emailSenderName || undefined,
        emailReplyTo: form.emailReplyTo || undefined,
        followUpDays: form.followUpDays ? Number(form.followUpDays) : undefined,
        maxTouchpoints: form.maxTouchpoints ? Number(form.maxTouchpoints) : undefined,
      },
    });
  };

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Marketing Campaign</h1>
        <p className="text-gray-500 text-sm mt-1">Set up a new marketing campaign for LinkedIn outreach or email marketing</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Campaign Details</h2>
          <Input label="Campaign Name *" value={form.name} onChange={set('name')} required placeholder="e.g., Q1 Procurement Outreach" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What is this campaign about?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Type</label>
            <select
              value={form.type}
              onChange={set('type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="LINKEDIN">LinkedIn Outreach</option>
              <option value="EMAIL">Email Outreach</option>
              <option value="COMBINED">Combined (LinkedIn + Email)</option>
            </select>
          </div>
        </div>

        {/* Schedule & Budget */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Schedule &amp; Budget</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={form.startDate} onChange={set('startDate')} />
            <Input label="End Date" type="date" value={form.endDate} onChange={set('endDate')} />
          </div>
          <Input label="Budget (£)" type="number" min={0} step={0.01} value={form.budget} onChange={set('budget')} placeholder="e.g., 5000" />
        </div>

        {/* Goals & KPIs */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Goals &amp; KPIs</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Target Leads" type="number" min={0} value={form.goalLeads} onChange={set('goalLeads')} placeholder="e.g., 100" />
            <Input label="Target Conversions" type="number" min={0} value={form.goalConversions} onChange={set('goalConversions')} placeholder="e.g., 10" />
          </div>
          <Input label="Goal Description" value={form.goalDescription} onChange={set('goalDescription')} placeholder="e.g., Generate 100 qualified leads in manufacturing sector" />
        </div>

        {/* Targeting */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Target Criteria</h2>
          <p className="text-sm text-gray-500">Define who you want to reach with this campaign</p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Keywords" value={form.targetKeywords} onChange={set('targetKeywords')} placeholder="e.g., procurement, supply chain" />
            <Input label="Industry" value={form.targetIndustry} onChange={set('targetIndustry')} placeholder="e.g., Manufacturing" />
            <Input label="Location" value={form.targetLocation} onChange={set('targetLocation')} placeholder="e.g., United Kingdom" />
            <Input label="Job Title" value={form.targetJobTitle} onChange={set('targetJobTitle')} placeholder="e.g., Procurement Manager" />
            <Input label="Company Size" value={form.targetCompanySize} onChange={set('targetCompanySize')} placeholder="e.g., 50-500 employees" />
            <Input label="Revenue Range" value={form.targetRevenue} onChange={set('targetRevenue')} placeholder="e.g., £1M-£50M" />
          </div>
          <Input label="Decision Maker Type" value={form.targetDecisionMaker} onChange={set('targetDecisionMaker')} placeholder="e.g., C-Level, VP, Director" />
        </div>

        {/* Email Settings */}
        {(form.type === 'EMAIL' || form.type === 'COMBINED') && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Email Settings</h2>
            <Input label="Email Subject Line" value={form.emailSubject} onChange={set('emailSubject')} placeholder="e.g., Exclusive offer for {{companyName}}" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Sender Name" value={form.emailSenderName} onChange={set('emailSenderName')} placeholder="e.g., John from CEGX" />
              <Input label="Reply-To Email" type="email" value={form.emailReplyTo} onChange={set('emailReplyTo')} placeholder="e.g., sales@company.com" />
            </div>
          </div>
        )}

        {/* Follow-up Strategy */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Follow-up Strategy</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Days Between Follow-ups" type="number" min={1} value={form.followUpDays} onChange={set('followUpDays')} placeholder="e.g., 3" />
            <Input label="Max Touchpoints" type="number" min={1} value={form.maxTouchpoints} onChange={set('maxTouchpoints')} placeholder="e.g., 5" />
          </div>
        </div>

        {/* Products */}
        {products.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Associated Products</h2>
            <p className="text-sm text-gray-500">Select products to feature in this campaign</p>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {products.filter((p) => !p.isArchived).map((product) => (
                <label key={product.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.includes(product.id)}
                    onChange={() => toggleProduct(product.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-mono text-xs text-gray-500">{product.sku}</span>
                  <span>{product.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* AI Prompt */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">AI Configuration</h2>
          <p className="text-sm text-gray-500">Set a custom prompt for Grok AI to use when generating messages for this campaign</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">AI Prompt (optional)</label>
            <textarea
              value={form.aiPrompt}
              onChange={set('aiPrompt')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., You are a business development specialist reaching out to procurement professionals. Be professional, concise, and highlight our competitive pricing..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" loading={createCampaign.isPending} disabled={!form.name}>
            Create Campaign
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>

        {createCampaign.isError && (
          <p className="text-red-500 text-sm">Failed to create campaign. Please try again.</p>
        )}
      </form>
    </div>
  );
}
