'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axios';
import { CcsOpportunity, CcsFramework, User } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { GBPAmount } from '@/components/ui/GBPAmount';

const statusVariant: Record<string, 'success' | 'warning' | 'info' | 'neutral'> = {
  OPEN: 'success',
  CLOSED: 'neutral',
  AWARDED: 'info',
  CANCELLED: 'neutral',
};

const bidStatusVariant: Record<string, 'success' | 'warning' | 'info' | 'neutral'> = {
  NOT_BIDDING: 'neutral',
  PREPARING: 'warning',
  SUBMITTED: 'info',
  WON: 'success',
  LOST: 'neutral',
};

const bidStatusLabels: Record<string, string> = {
  NOT_BIDDING: 'Not Bidding',
  PREPARING: 'Preparing Bid',
  SUBMITTED: 'Bid Submitted',
  WON: 'Bid Won',
  LOST: 'Bid Lost',
};

export default function CcsOpportunitiesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [bidStatusFilter, setBidStatusFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOpp, setNewOpp] = useState({
    title: '', description: '', buyerName: '', frameworkId: '', status: 'OPEN',
    closingDate: '', value: '', region: '', category: '', noticeUrl: '', notes: '',
    bidStatus: 'NOT_BIDDING', bidDeadline: '',
  });

  const { data: opportunities = [], isLoading } = useQuery<CcsOpportunity[]>({
    queryKey: ['ccs-opportunities', search, statusFilter, bidStatusFilter],
    queryFn: () =>
      axiosInstance.get('/ccs/opportunities', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          bidStatus: bidStatusFilter || undefined,
        },
      }).then((r) => r.data),
  });

  const { data: frameworks = [] } = useQuery<CcsFramework[]>({
    queryKey: ['ccs-frameworks-list'],
    queryFn: () => axiosInstance.get('/ccs/frameworks').then((r) => r.data),
    enabled: showAddForm,
  });

  const createOpp = useMutation({
    mutationFn: (data: Record<string, unknown>) => axiosInstance.post('/ccs/opportunities', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ccs-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['ccs-stats'] });
      setShowAddForm(false);
      setNewOpp({ title: '', description: '', buyerName: '', frameworkId: '', status: 'OPEN', closingDate: '', value: '', region: '', category: '', noticeUrl: '', notes: '', bidStatus: 'NOT_BIDDING', bidDeadline: '' });
    },
  });

  const handleCreate = () => {
    if (!newOpp.title) return;
    createOpp.mutate({
      title: newOpp.title,
      description: newOpp.description || undefined,
      buyerName: newOpp.buyerName || undefined,
      frameworkId: newOpp.frameworkId || undefined,
      status: newOpp.status,
      closingDate: newOpp.closingDate || undefined,
      value: newOpp.value ? Number(newOpp.value) : undefined,
      region: newOpp.region || undefined,
      category: newOpp.category || undefined,
      noticeUrl: newOpp.noticeUrl || undefined,
      notes: newOpp.notes || undefined,
      bidStatus: newOpp.bidStatus,
      bidDeadline: newOpp.bidDeadline || undefined,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CCS Opportunities</h1>
          <p className="text-gray-500 text-sm mt-1">
            Track procurement opportunities and manage bid submissions ({opportunities.length} opportunit{opportunities.length !== 1 ? 'ies' : 'y'})
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition"
          style={{ backgroundColor: 'var(--primary-color)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Opportunity
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search opportunities…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
          <option value="AWARDED">Awarded</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select value={bidStatusFilter} onChange={(e) => setBidStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Bid Statuses</option>
          <option value="NOT_BIDDING">Not Bidding</option>
          <option value="PREPARING">Preparing</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="WON">Won</option>
          <option value="LOST">Lost</option>
        </select>
      </div>

      {/* Add Opportunity Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Add CCS Opportunity</h2>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Title *" value={newOpp.title} onChange={(e) => setNewOpp({ ...newOpp, title: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm col-span-2" />
            <input type="text" placeholder="Buyer Name" value={newOpp.buyerName} onChange={(e) => setNewOpp({ ...newOpp, buyerName: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <select value={newOpp.frameworkId} onChange={(e) => setNewOpp({ ...newOpp, frameworkId: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              <option value="">No Framework</option>
              {frameworks.map((fw) => (
                <option key={fw.id} value={fw.id}>{fw.reference} — {fw.title}</option>
              ))}
            </select>
            <input type="number" placeholder="Value (£)" value={newOpp.value} onChange={(e) => setNewOpp({ ...newOpp, value: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <input type="text" placeholder="Region" value={newOpp.region} onChange={(e) => setNewOpp({ ...newOpp, region: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <input type="text" placeholder="Category" value={newOpp.category} onChange={(e) => setNewOpp({ ...newOpp, category: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <input type="date" placeholder="Closing Date" value={newOpp.closingDate} onChange={(e) => setNewOpp({ ...newOpp, closingDate: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <select value={newOpp.bidStatus} onChange={(e) => setNewOpp({ ...newOpp, bidStatus: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              <option value="NOT_BIDDING">Not Bidding</option>
              <option value="PREPARING">Preparing Bid</option>
              <option value="SUBMITTED">Bid Submitted</option>
            </select>
            <input type="date" placeholder="Bid Deadline" value={newOpp.bidDeadline} onChange={(e) => setNewOpp({ ...newOpp, bidDeadline: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <input type="url" placeholder="Notice URL" value={newOpp.noticeUrl} onChange={(e) => setNewOpp({ ...newOpp, noticeUrl: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm col-span-2" />
          </div>
          <textarea placeholder="Description / Notes" value={newOpp.description} onChange={(e) => setNewOpp({ ...newOpp, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={!newOpp.title || createOpp.isPending} className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition disabled:opacity-50">
              {createOpp.isPending ? 'Saving…' : 'Save Opportunity'}
            </button>
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
          </div>
        </div>
      )}

      {/* Opportunities List */}
      {isLoading ? (
        <LoadingSpinner />
      ) : opportunities.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          No opportunities found. Add procurement opportunities to track and manage bids.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              onClick={() => router.push(`/ccs/opportunities/${opp.id}`)}
              className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-gray-900 truncate">{opp.title}</p>
                  <Badge label={opp.status} variant={statusVariant[opp.status] ?? 'neutral'} />
                  <Badge label={bidStatusLabels[opp.bidStatus] ?? opp.bidStatus} variant={bidStatusVariant[opp.bidStatus] ?? 'neutral'} />
                </div>
                <p className="text-sm text-gray-500">
                  {opp.buyerName ?? 'Unknown buyer'}
                  {opp.framework && <span> • <span className="text-blue-500">{opp.framework.reference}</span></span>}
                  {opp.region && ` • ${opp.region}`}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400 flex-shrink-0">
                {opp.value && <GBPAmount amount={Number(opp.value)} className="font-semibold text-gray-700" />}
                {opp.closingDate && (
                  <span className={new Date(opp.closingDate) < new Date() ? 'text-red-500' : ''}>
                    Closes {new Date(opp.closingDate).toLocaleDateString('en-GB')}
                  </span>
                )}
                <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
