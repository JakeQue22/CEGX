'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { MarketingCampaign, MarketingStats } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function MarketingPage() {
  const router = useRouter();

  const { data: stats, isLoading: statsLoading } = useQuery<MarketingStats>({
    queryKey: ['marketing-stats'],
    queryFn: () => axiosInstance.get('/marketing/campaigns/stats').then((r) => r.data),
  });

  const { data: campaignsData, isLoading: campaignsLoading } = useQuery<MarketingCampaign[]>({
    queryKey: ['marketing-campaigns'],
    queryFn: () =>
      axiosInstance.get('/marketing/campaigns').then((r) =>
        Array.isArray(r.data) ? r.data : r.data.data ?? []),
  });

  const campaigns = campaignsData ?? [];
  const isLoading = statsLoading || campaignsLoading;

  const statCards = [
    { label: 'Total Campaigns', value: stats?.total ?? 0, color: 'bg-blue-500' },
    { label: 'Active', value: stats?.active ?? 0, color: 'bg-green-500' },
    { label: 'Total Leads', value: stats?.totalLeads ?? 0, color: 'bg-purple-500' },
    { label: 'Emails Sent', value: stats?.emailsSent ?? 0, color: 'bg-orange-500' },
  ];

  const quickActions = [
    { href: '/marketing/campaigns/new', label: 'New Campaign', icon: '➕' },
    { href: '/marketing/inbox', label: 'LinkedIn Inbox', icon: '💬' },
    { href: '/marketing/leads', label: 'Leads', icon: '🎯' },
    { href: '/marketing/linkedin', label: 'LinkedIn Accounts', icon: '🔗' },
    { href: '/ai', label: 'AI Assistant', icon: '🤖' },
  ];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing Hub</h1>
          <p className="text-gray-500 text-sm mt-1">Manage campaigns, LinkedIn outreach, and lead generation</p>
        </div>
        <Link
          href="/marketing/campaigns/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition"
          style={{ backgroundColor: 'var(--primary-color)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Campaign
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${card.color} bg-opacity-10`} />
              <div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-sm text-gray-500">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition text-center"
          >
            <span className="text-2xl">{action.icon}</span>
            <span className="text-sm font-medium text-gray-700">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Recent Campaigns */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Campaigns</h2>
          <Link href="/marketing/campaigns" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {campaigns.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No campaigns yet. Create your first marketing campaign to get started.</div>
          ) : (
            campaigns.slice(0, 10).map((campaign) => (
              <div
                key={campaign.id}
                onClick={() => router.push(`/marketing/campaigns/${campaign.id}`)}
                className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{campaign.name}</p>
                  <p className="text-sm text-gray-500">
                    {campaign.type} • Created {new Date(campaign.createdAt).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge label={campaign.status} />
                  <div className="text-sm text-gray-500">
                    {campaign._count?.leads ?? 0} leads • {campaign._count?.outreachEmails ?? 0} emails
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
