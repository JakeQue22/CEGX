'use client';

import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { GBPAmount, formatGBP } from '@/components/ui/GBPAmount';
import { Badge } from '@/components/ui/Badge';
import { DashboardAnalytics, FollowUp, Deal, SupplierMarginData, MarketingLead } from '@/types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell,
} from 'recharts';
import Link from 'next/link';

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery<DashboardAnalytics>({
    queryKey: ['dashboard-analytics'],
    queryFn: () => axiosInstance.get('/analytics/dashboard').then((r) => r.data),
  });

  const { data: recentDeals } = useQuery<Deal[]>({
    queryKey: ['recent-deals'],
    queryFn: () =>
      axiosInstance.get('/deals', { params: { limit: 8, sort: 'createdAt', order: 'desc' } })
        .then((r) => Array.isArray(r.data) ? r.data : r.data.data ?? []),
  });

  const { data: suppliersData } = useQuery<SupplierMarginData[]>({
    queryKey: ['margin-by-supplier'],
    queryFn: () => axiosInstance.get('/analytics/margin-by-supplier').then((r) => r.data),
  });

  const { data: recentLeads } = useQuery<MarketingLead[]>({
    queryKey: ['recent-leads'],
    queryFn: () =>
      axiosInstance.get('/marketing/outreach/leads', { params: { limit: 8 } })
        .then((r) => Array.isArray(r.data) ? r.data : r.data.data ?? []),
  });

  if (isLoading) return <LoadingSpinner />;
  if (error)
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-red-600">
        Failed to load dashboard. Please try again.
      </div>
    );

  const {
    monthlyRevenue = 0,
    monthlyProfit = 0,
    openDealsCount = 0,
    vatCollected = 0,
    dealsByStage = [],
    profitOverTime = [],
    upcomingFollowUps = [],
  } = data ?? {};

  const deals = recentDeals ?? [];
  const leads = recentLeads ?? [];
  const topSuppliers = (suppliersData ?? []).slice(0, 5);
  const totalPipelineValue = dealsByStage.reduce((a, s) => a + Number(s.value ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header with quick actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of your procurement pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/deals/new" className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Deal
          </Link>
          <Link href="/suppliers/new" className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
            Add Supplier
          </Link>
          <Link href="/pipeline" className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition" style={{ backgroundColor: 'var(--primary-color)' }}>
            View Pipeline
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card
          title="Monthly Revenue"
          value={formatGBP(monthlyRevenue)}
          subtitle="This month"
          color="#3b82f6"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <Card
          title="Monthly Profit"
          value={formatGBP(monthlyProfit)}
          subtitle="Gross profit"
          color="#10b981"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
        />
        <Card
          title="Open Deals"
          value={openDealsCount}
          subtitle="Active in pipeline"
          color="#f59e0b"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
        <Card
          title="Pipeline Value"
          value={formatGBP(totalPipelineValue)}
          subtitle="Total open deals"
          color="#ec4899"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
        <Card
          title="VAT Collected"
          value={formatGBP(vatCollected)}
          subtitle="This month"
          color="#8b5cf6"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Deals by Stage</h2>
            <Link href="/pipeline" className="text-sm text-blue-600 hover:underline">View pipeline →</Link>
          </div>
          {dealsByStage.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dealsByStage} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number, name: string) => [name === 'value' ? formatGBP(v) : v, name === 'value' ? 'Value' : 'Count']} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Profit Over Time</h2>
            <Link href="/analytics" className="text-sm text-blue-600 hover:underline">Full analytics →</Link>
          </div>
          {profitOverTime.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={profitOverTime} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [formatGBP(v)]} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} name="Revenue" />
                <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={false} name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Three-column: Recent Deals, Follow-ups, Top Suppliers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Deals */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="text-base font-semibold text-gray-900">Recent Deals</h2>
            <Link href="/deals" className="text-sm text-blue-600 hover:underline">View all →</Link>
          </div>
          {deals.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">No deals yet</p>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {deals.slice(0, 8).map((deal: Deal) => (
                <li key={deal.id} className="px-5 py-3 hover:bg-gray-50 transition">
                  <Link href={`/deals/${deal.id}`} className="block">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">{deal.title}</p>
                      <Badge label={deal.status} />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-400">
                        {deal.supplier?.name ?? 'No supplier'} • {formatRelative(deal.createdAt)}
                      </p>
                      <p className="text-xs font-medium text-gray-600"><GBPAmount amount={deal.salePrice} /></p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Follow-ups */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="text-base font-semibold text-gray-900">Upcoming Follow-ups</h2>
            <Link href="/followups" className="text-sm text-blue-600 hover:underline">View all →</Link>
          </div>
          {upcomingFollowUps.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">No upcoming follow-ups</p>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {upcomingFollowUps.slice(0, 8).map((fu: FollowUp) => (
                <li key={fu.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{fu.note ?? 'Follow-up'}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      new Date(fu.dueAt) < new Date()
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {formatDate(fu.dueAt)}
                    </span>
                  </div>
                  {fu.deal && (
                    <Link href={`/deals/${fu.deal.id}`} className="text-xs text-blue-600 hover:underline mt-0.5 block">
                      {fu.deal.title}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top Suppliers */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="text-base font-semibold text-gray-900">Top Suppliers</h2>
            <Link href="/suppliers" className="text-sm text-blue-600 hover:underline">View all →</Link>
          </div>
          {topSuppliers.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">No supplier data yet</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {topSuppliers.map((s, idx) => (
                <li key={s.supplierId} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.supplierName}</p>
                      <p className="text-xs text-gray-400">{s.wonDeals} won deals</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium"><GBPAmount amount={s.totalRevenue} /></p>
                    <p className={`text-xs font-medium ${s.avgProfitMarginPercent >= 20 ? 'text-green-600' : s.avgProfitMarginPercent >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {s.avgProfitMarginPercent}% margin
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent Leads */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-900">Recent Leads</h2>
          <Link href="/marketing/leads" className="text-sm text-blue-600 hover:underline">View all →</Link>
        </div>
        {leads.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">No leads yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Company', 'Contact', 'Industry', 'Source', 'Status', 'Added'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leads.slice(0, 8).map((lead: MarketingLead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-2.5 font-medium text-gray-900">{lead.companyName}</td>
                    <td className="px-4 py-2.5 text-gray-500">{lead.contactName ?? '—'}</td>
                    <td className="px-4 py-2.5 text-gray-500">{lead.industry ?? '—'}</td>
                    <td className="px-4 py-2.5 text-gray-500">{lead.source ?? '—'}</td>
                    <td className="px-4 py-2.5"><Badge label={lead.status} /></td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">{formatRelative(lead.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pipeline Stage Breakdown */}
      {dealsByStage.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Pipeline Stage Breakdown</h2>
            <Link href="/pipeline" className="text-sm text-blue-600 hover:underline">View pipeline →</Link>
          </div>
          <div className="flex items-center gap-8">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dealsByStage} dataKey="value" nameKey="stage" cx="50%" cy="50%" outerRadius={70} label={false}>
                    {dealsByStage.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatGBP(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {dealsByStage.map((stage, idx) => (
                <div key={stage.stage} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{stage.stage}</p>
                    <p className="text-xs text-gray-500">{stage.count} deals • {formatGBP(stage.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
