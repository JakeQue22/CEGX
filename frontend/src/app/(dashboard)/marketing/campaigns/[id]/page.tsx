'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axios';
import { MarketingCampaign } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function MarketingCampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: campaign, isLoading } = useQuery<MarketingCampaign & { connections: any[]; leads: any[]; outreachEmails: any[] }>({
    queryKey: ['marketing-campaign', id],
    queryFn: () => axiosInstance.get(`/marketing/campaigns/${id}`).then((r) => r.data),
  });

  const startCampaign = useMutation({
    mutationFn: () => axiosInstance.post(`/marketing/campaigns/${id}/start`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketing-campaign', id] }),
  });

  const pauseCampaign = useMutation({
    mutationFn: () => axiosInstance.post(`/marketing/campaigns/${id}/pause`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketing-campaign', id] }),
  });

  const scrapeLeads = useMutation({
    mutationFn: () => axiosInstance.post('/marketing/outreach/scrape', { campaignId: id }),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!campaign) return <div className="text-gray-500">Campaign not found</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <Badge label={campaign.status} />
            <Badge label={campaign.type} />
          </div>
          {campaign.description && <p className="text-gray-500 text-sm mt-1">{campaign.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {campaign.status === 'DRAFT' && (
            <button
              onClick={() => startCampaign.mutate()}
              disabled={startCampaign.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
            >
              {startCampaign.isPending ? 'Starting...' : 'Start Campaign'}
            </button>
          )}
          {campaign.status === 'ACTIVE' && (
            <button
              onClick={() => pauseCampaign.mutate()}
              disabled={pauseCampaign.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 transition disabled:opacity-50"
            >
              {pauseCampaign.isPending ? 'Pausing...' : 'Pause Campaign'}
            </button>
          )}
          <button
            onClick={() => scrapeLeads.mutate()}
            disabled={scrapeLeads.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-500 rounded-lg hover:bg-purple-600 transition disabled:opacity-50"
          >
            {scrapeLeads.isPending ? 'Scraping...' : 'Scrape Leads'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'LinkedIn Connections', value: campaign.connections?.length ?? 0 },
          { label: 'Leads Found', value: campaign.leads?.length ?? 0 },
          { label: 'Emails Sent', value: campaign.outreachEmails?.filter((e: any) => e.status === 'SENT').length ?? 0 },
          { label: 'Replies', value: campaign.outreachEmails?.filter((e: any) => e.repliedAt).length ?? 0 },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Target Criteria */}
      {campaign.targetCriteria && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Target Criteria</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(campaign.targetCriteria).map(([key, value]) =>
              value ? (
                <div key={key}>
                  <p className="text-xs text-gray-400 uppercase">{key}</p>
                  <p className="text-sm text-gray-900">{value as string}</p>
                </div>
              ) : null,
            )}
          </div>
        </div>
      )}

      {/* AI Prompt */}
      {campaign.aiPrompt && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-2">AI Prompt</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{campaign.aiPrompt}</p>
        </div>
      )}

      {/* Leads */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Leads ({campaign.leads?.length ?? 0})</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {(!campaign.leads || campaign.leads.length === 0) ? (
            <div className="p-6 text-center text-gray-400 text-sm">No leads yet. Use the &quot;Scrape Leads&quot; button to find procurement companies.</div>
          ) : (
            campaign.leads.map((lead: any) => (
              <div key={lead.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{lead.companyName}</p>
                  <p className="text-sm text-gray-500">{lead.contactName || 'No contact'} • {lead.contactEmail || 'No email'}</p>
                </div>
                <Badge label={lead.status} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Outreach Emails */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Outreach Emails ({campaign.outreachEmails?.length ?? 0})</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {(!campaign.outreachEmails || campaign.outreachEmails.length === 0) ? (
            <div className="p-6 text-center text-gray-400 text-sm">No outreach emails sent yet.</div>
          ) : (
            campaign.outreachEmails.map((email: any) => (
              <div key={email.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{email.subject}</p>
                  <p className="text-sm text-gray-500">{email.toName || email.toEmail} • {email.sentAt ? new Date(email.sentAt).toLocaleDateString('en-GB') : 'Not sent'}</p>
                </div>
                <Badge label={email.status} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
