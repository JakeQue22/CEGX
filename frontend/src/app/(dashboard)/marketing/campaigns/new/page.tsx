'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axios';

export default function NewMarketingCampaignPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'LINKEDIN',
    aiPrompt: '',
    targetKeywords: '',
    targetIndustry: '',
    targetLocation: '',
    targetJobTitle: '',
    targetCompanySize: '',
  });

  const createCampaign = useMutation({
    mutationFn: (data: any) => axiosInstance.post('/marketing/campaigns', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      router.push('/marketing/campaigns');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCampaign.mutate({
      name: form.name,
      description: form.description,
      type: form.type,
      aiPrompt: form.aiPrompt || undefined,
      targetCriteria: {
        keywords: form.targetKeywords || undefined,
        industry: form.targetIndustry || undefined,
        location: form.targetLocation || undefined,
        jobTitle: form.targetJobTitle || undefined,
        companySize: form.targetCompanySize || undefined,
      },
    });
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Q1 Procurement Outreach"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What is this campaign about?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="LINKEDIN">LinkedIn Outreach</option>
              <option value="EMAIL">Email Outreach</option>
              <option value="COMBINED">Combined (LinkedIn + Email)</option>
            </select>
          </div>
        </div>

        {/* Targeting */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Target Criteria</h2>
          <p className="text-sm text-gray-500">Define who you want to reach with this campaign</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
              <input
                type="text"
                value={form.targetKeywords}
                onChange={(e) => setForm({ ...form, targetKeywords: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., procurement, supply chain"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <input
                type="text"
                value={form.targetIndustry}
                onChange={(e) => setForm({ ...form, targetIndustry: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Manufacturing"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={form.targetLocation}
                onChange={(e) => setForm({ ...form, targetLocation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., United Kingdom"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
              <input
                type="text"
                value={form.targetJobTitle}
                onChange={(e) => setForm({ ...form, targetJobTitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Procurement Manager"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
            <input
              type="text"
              value={form.targetCompanySize}
              onChange={(e) => setForm({ ...form, targetCompanySize: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 50-500 employees"
            />
          </div>
        </div>

        {/* AI Prompt */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">AI Configuration</h2>
          <p className="text-sm text-gray-500">Set a custom prompt for Grok AI to use when generating messages for this campaign</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">AI Prompt (optional)</label>
            <textarea
              value={form.aiPrompt}
              onChange={(e) => setForm({ ...form, aiPrompt: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., You are a business development specialist reaching out to procurement professionals. Be professional, concise, and highlight our competitive pricing..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={createCampaign.isPending || !form.name}
            className="px-6 py-2.5 text-sm font-medium text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
            style={{ backgroundColor: 'var(--primary-color)' }}
          >
            {createCampaign.isPending ? 'Creating...' : 'Create Campaign'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Cancel
          </button>
        </div>

        {createCampaign.isError && (
          <p className="text-red-500 text-sm">Failed to create campaign. Please try again.</p>
        )}
      </form>
    </div>
  );
}
