'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { MarketingCampaign, MarketingStats, ProcurementIntelligence } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { GBPAmount, formatGBP } from '@/components/ui/GBPAmount';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';

const LEAD_STATUS_ORDER = ['NEW', 'CONTACTED', 'RESPONDED', 'QUALIFIED', 'CONVERTED'];
const LEAD_COLORS: Record<string, string> = {
  NEW: '#3B82F6', CONTACTED: '#F59E0B', RESPONDED: '#8B5CF6',
  QUALIFIED: '#10B981', CONVERTED: '#059669',
};
const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];
const OUTREACH_COLORS: Record<string, string> = {
  DRAFT: '#9CA3AF', QUEUED: '#9CA3AF', SENT: '#8B5CF6',
  DELIVERED: '#8B5CF6', OPENED: '#3B82F6', REPLIED: '#10B981', BOUNCED: '#EF4444',
};

function StatCard({ label, value, sub, icon, color }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: { label: string; href: string } }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {action && (
        <Link href={action.href} className="text-sm text-blue-600 hover:underline font-medium">
          {action.label} →
        </Link>
      )}
    </div>
  );
}

export default function MarketingPage() {
  const router = useRouter();

  const { data: stats } = useQuery<MarketingStats>({
    queryKey: ['marketing-stats'],
    queryFn: () => axiosInstance.get('/marketing/campaigns/stats').then((r) => r.data),
  });

  const { data: campaignsData } = useQuery<MarketingCampaign[]>({
    queryKey: ['marketing-campaigns'],
    queryFn: () =>
      axiosInstance.get('/marketing/campaigns').then((r) =>
        Array.isArray(r.data) ? r.data : r.data.data ?? []),
  });

  const { data: intel, isLoading } = useQuery<ProcurementIntelligence>({
    queryKey: ['procurement-intelligence'],
    queryFn: () => axiosInstance.get('/analytics/procurement-intelligence').then((r) => r.data),
  });

  const campaigns = campaignsData ?? [];

  if (isLoading) return <LoadingSpinner />;

  const overview = intel?.overview ?? { totalSuppliers: 0, activeSuppliers: 0, totalProducts: 0, totalCategories: 0, totalLeads: 0, pipelineValue: 0, winRate: 0, avgDealSize: 0 };
  const leadFunnel = intel?.leadFunnel ?? [];
  const topSuppliers = intel?.topSuppliers ?? [];
  const categoryDemand = intel?.categoryDemand ?? [];
  const campaignPerf = intel?.campaignPerformance ?? [];
  const recentLeads = intel?.recentLeads ?? [];
  const outreach = intel?.outreachPerformance ?? {};

  // Sort lead funnel by status order
  const sortedFunnel = LEAD_STATUS_ORDER.map((status) => {
    const item = leadFunnel.find((f) => f.status === status);
    return { status, count: item?.count ?? 0 };
  });

  const quickActions = [
    { href: '/marketing/campaigns/new', label: 'New Campaign', icon: '➕', desc: 'Create outreach campaign' },
    { href: '/marketing/leads', label: 'Leads Manager', icon: '🎯', desc: 'Manage all leads' },
    { href: '/marketing/inbox', label: 'LinkedIn Inbox', icon: '💬', desc: 'Messages & outreach' },
    { href: '/marketing/linkedin', label: 'LinkedIn Accounts', icon: '🔗', desc: 'Manage connections' },
    { href: '/suppliers/new', label: 'Add Supplier', icon: '🏭', desc: 'Source new supplier' },
    { href: '/ai', label: 'AI Assistant', icon: '🤖', desc: 'AI-powered sourcing' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing & Procurement Intelligence</h1>
          <p className="text-gray-500 text-sm mt-1">Source suppliers, track leads, manage campaigns, and analyse procurement performance</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/marketing/leads"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            View All Leads
          </Link>
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
      </div>

      {/* Overview KPIs — 8 cards across 2 rows */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Active Suppliers" value={overview.activeSuppliers} sub={`${overview.totalSuppliers} total`} color="bg-blue-50 text-blue-600"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>} />
        <StatCard label="Products" value={overview.totalProducts} sub={`${overview.totalCategories} categories`} color="bg-green-50 text-green-600"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>} />
        <StatCard label="Total Leads" value={overview.totalLeads} sub={`${stats?.active ?? 0} active campaigns`} color="bg-purple-50 text-purple-600"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
        <StatCard label="Pipeline Value" value={formatGBP(overview.pipelineValue)} sub={`${overview.winRate}% win rate`} color="bg-orange-50 text-orange-600"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Campaigns" value={stats?.total ?? 0} sub={`${stats?.active ?? 0} active`} color="bg-indigo-50 text-indigo-600"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>} />
        <StatCard label="Emails Sent" value={stats?.emailsSent ?? 0} sub={outreach.OPENED ? `${outreach.OPENED} opened` : 'No outreach yet'} color="bg-teal-50 text-teal-600"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
        <StatCard label="Avg Deal Size" value={formatGBP(overview.avgDealSize)} sub="Won deals (90d)" color="bg-emerald-50 text-emerald-600"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} />
        <StatCard label="Win Rate" value={`${overview.winRate}%`} sub="Last 90 days" color="bg-rose-50 text-rose-600"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col items-center gap-1 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition text-center"
          >
            <span className="text-2xl">{action.icon}</span>
            <span className="text-sm font-medium text-gray-700">{action.label}</span>
            <span className="text-xs text-gray-400">{action.desc}</span>
          </Link>
        ))}
      </div>

      {/* Lead Conversion Funnel + Category Demand */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Funnel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <SectionHeader title="Lead Conversion Funnel" action={{ label: 'All Leads', href: '/marketing/leads' }} />
          {sortedFunnel.every((f) => f.count === 0) ? (
            <p className="text-sm text-gray-400 text-center py-10">No leads yet. Start a campaign to generate leads.</p>
          ) : (
            <div className="space-y-3">
              {sortedFunnel.map((item) => {
                const max = Math.max(...sortedFunnel.map((f) => f.count), 1);
                const pct = Math.round((item.count / max) * 100);
                return (
                  <div key={item.status} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-500 w-24">{item.status}</span>
                    <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                      <div
                        className="h-full rounded-lg transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: LEAD_COLORS[item.status] ?? '#6B7280' }}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-700">
                        {item.count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Category Demand */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <SectionHeader title="Category Demand Analysis" action={{ label: 'Categories', href: '/categories' }} />
          {categoryDemand.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No category data available yet.</p>
          ) : (
            <div className="flex items-center gap-6">
              <div className="w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryDemand.slice(0, 8)} dataKey="wonRevenue" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={false}>
                      {categoryDemand.slice(0, 8).map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatGBP(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {categoryDemand.slice(0, 6).map((cat, idx) => (
                  <div key={cat.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      <span className="text-gray-700">{cat.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500">{cat.productCount} products</span>
                      <span className="ml-2 font-medium text-gray-900">{formatGBP(cat.wonRevenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Suppliers Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <SectionHeader title="Top Suppliers by Revenue" action={{ label: 'All Suppliers', href: '/suppliers' }} />
        </div>
        <div className="overflow-x-auto">
          {topSuppliers.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No supplier data yet. Create deals to see supplier performance.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Supplier</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Products</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Won / Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Open Deals</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Profit</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Avg Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topSuppliers.slice(0, 10).map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/suppliers/${s.id}`)}>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-3 text-gray-500">{s.productCount}</td>
                    <td className="px-4 py-3 text-gray-500">{s.wonDeals} / {s.totalDeals}</td>
                    <td className="px-4 py-3">
                      {s.openDeals > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{s.openDeals} active</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium"><GBPAmount amount={s.totalRevenue} /></td>
                    <td className="px-4 py-3"><GBPAmount amount={s.totalProfit} /></td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${s.avgMargin >= 20 ? 'text-green-600' : s.avgMargin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {s.avgMargin}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Campaign Performance + Outreach Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <SectionHeader title="Campaign Performance" action={{ label: 'All Campaigns', href: '/marketing/campaigns' }} />
          {campaignPerf.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No campaigns yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={campaignPerf.slice(0, 8)} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="leadsGenerated" name="Leads" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="emailsSent" name="Emails" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="connections" name="Connections" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Outreach Email Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <SectionHeader title="Outreach Email Pipeline" />
          {outreach.total === 0 || !outreach.total ? (
            <p className="text-sm text-gray-400 text-center py-10">No outreach emails sent yet.</p>
          ) : (
            <div className="space-y-3">
              {(['DRAFT', 'QUEUED', 'SENT', 'DELIVERED', 'OPENED', 'REPLIED', 'BOUNCED'] as const).map((status) => {
                const count = outreach[status] ?? 0;
                const pct = outreach.total > 0 ? Math.round((count / outreach.total) * 100) : 0;
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-500 w-20">{status}</span>
                    <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden relative">
                      <div className="h-full rounded transition-all" style={{ width: `${pct}%`, backgroundColor: OUTREACH_COLORS[status] }} />
                    </div>
                    <span className="text-xs font-bold text-gray-600 w-12 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Leads Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <SectionHeader title="Recent Leads" action={{ label: 'Manage Leads', href: '/marketing/leads' }} />
        </div>
        <div className="overflow-x-auto">
          {recentLeads.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No leads generated yet. Start a campaign or add leads manually.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Industry</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Campaign</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{lead.companyName}</td>
                    <td className="px-4 py-3 text-gray-500">{lead.contactName ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{lead.industry ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{lead.source ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{lead.campaignName ?? '—'}</td>
                    <td className="px-4 py-3"><Badge label={lead.status} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(lead.createdAt).toLocaleDateString('en-GB')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <SectionHeader title="Recent Campaigns" action={{ label: 'View All', href: '/marketing/campaigns' }} />
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
