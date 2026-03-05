'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { CcsStats } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function CcsOverviewPage() {
  const queryClient = useQueryClient();
  const [syncResult, setSyncResult] = useState<{ created: number; updated: number; errors: string[]; opportunitiesCreated?: number; opportunitiesUpdated?: number } | null>(null);

  const { data: stats, isLoading } = useQuery<CcsStats>({
    queryKey: ['ccs-stats'],
    queryFn: () => axiosInstance.get('/ccs/stats').then((r) => r.data),
  });

  const { data: categories = [] } = useQuery<{ category: string; count: number }[]>({
    queryKey: ['ccs-categories'],
    queryFn: () => axiosInstance.get('/ccs/categories').then((r) => r.data),
  });

  const syncMutation = useMutation({
    mutationFn: () => axiosInstance.post('/ccs/scrape/sync', {}, { timeout: 300000 }).then((r) => r.data),
    onSuccess: (data) => {
      // Response shape: { frameworks: {created, updated, errors}, opportunities: {created, updated, errors} }
      const fw = data?.frameworks ?? { created: 0, updated: 0, errors: [] };
      const opp = data?.opportunities ?? { created: 0, updated: 0, errors: [] };
      const allErrors = [...(fw.errors ?? []), ...(opp.errors ?? [])];
      setSyncResult({
        created: fw.created ?? 0,
        updated: fw.updated ?? 0,
        errors: allErrors,
        opportunitiesCreated: opp.created ?? 0,
        opportunitiesUpdated: opp.updated ?? 0,
      });
      queryClient.invalidateQueries({ queryKey: ['ccs-stats'] });
      queryClient.invalidateQueries({ queryKey: ['ccs-categories'] });
      queryClient.invalidateQueries({ queryKey: ['ccs-frameworks'] });
      setTimeout(() => setSyncResult(null), 15000);
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.message || err?.message || '';
      const msg = detail
        ? `Sync request failed: ${detail}`
        : 'Failed to sync — the CCS website may be temporarily unavailable. Please try again later.';
      setSyncResult({ created: 0, updated: 0, errors: [msg] });
      setTimeout(() => setSyncResult(null), 10000);
    },
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Crown Commercial Services</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse UK government procurement frameworks, agreements, and opportunities
          </p>
        </div>
        <Button
          type="button"
          loading={syncMutation.isPending}
          onClick={() => syncMutation.mutate()}
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {syncMutation.isPending ? 'Syncing from CCS...' : 'Sync from CCS Website'}
        </Button>
      </div>

      {/* Sync Result */}
      {syncResult && (() => {
        const isFullFailure = syncResult.errors.length > 0 && syncResult.created === 0 && syncResult.updated === 0
          && (syncResult.opportunitiesCreated ?? 0) === 0 && (syncResult.opportunitiesUpdated ?? 0) === 0;
        return (
        <div className={`rounded-xl border p-4 ${isFullFailure ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-start gap-3">
            <span className="text-lg">{isFullFailure ? '❌' : '✅'}</span>
            <div>
              <p className="text-sm font-medium text-gray-900">
                CCS Sync Complete: {syncResult.created} new frameworks, {syncResult.updated} updated
              </p>
              {((syncResult.opportunitiesCreated ?? 0) > 0 || (syncResult.opportunitiesUpdated ?? 0) > 0) && (
                <p className="text-sm text-gray-700">
                  Opportunities: {syncResult.opportunitiesCreated ?? 0} new, {syncResult.opportunitiesUpdated ?? 0} updated
                </p>
              )}
              {syncResult.errors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {syncResult.errors.slice(0, 5).map((err, i) => (
                    <p key={i} className="text-xs text-red-600">{err}</p>
                  ))}
                  {syncResult.errors.length > 5 && (
                    <p className="text-xs text-red-500">...and {syncResult.errors.length - 5} more errors</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Live Frameworks', value: stats?.frameworks.live ?? 0, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Total Frameworks', value: stats?.frameworks.total ?? 0, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Open Opportunities', value: stats?.opportunities.open ?? 0, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Active Bids', value: stats?.opportunities.bidding ?? 0, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-5 border`}>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/ccs/frameworks" className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">Frameworks</h3>
              <p className="text-sm text-gray-500">Browse CCS framework agreements and lots</p>
            </div>
          </div>
        </Link>

        <Link href="/ccs/opportunities" className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-orange-300 hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition">Opportunities</h3>
              <p className="text-sm text-gray-500">Track procurement opportunities and bids</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Framework Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.category}
                href={`/ccs/frameworks?category=${encodeURIComponent(cat.category)}`}
                className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 transition"
              >
                <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                <span className="text-xs font-semibold text-gray-400 bg-white px-2 py-0.5 rounded-full">{cat.count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
