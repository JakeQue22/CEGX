'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosInstance from '@/lib/axios';
import { CcsFramework } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const statusVariant: Record<string, 'success' | 'warning' | 'info' | 'neutral'> = {
  LIVE: 'success',
  EXPIRED: 'neutral',
  UPCOMING: 'info',
};

export default function CcsFrameworksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') ?? '');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFramework, setNewFramework] = useState({
    reference: '', title: '', description: '', category: '', status: 'LIVE',
    startDate: '', endDate: '', websiteUrl: '',
  });

  const { data: frameworks = [], isLoading } = useQuery<CcsFramework[]>({
    queryKey: ['ccs-frameworks', search, statusFilter, categoryFilter],
    queryFn: () =>
      axiosInstance.get('/ccs/frameworks', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
        },
      }).then((r) => r.data),
  });

  const { data: categories = [] } = useQuery<{ category: string; count: number }[]>({
    queryKey: ['ccs-categories'],
    queryFn: () => axiosInstance.get('/ccs/categories').then((r) => r.data),
  });

  const createFramework = useMutation({
    mutationFn: (data: Record<string, unknown>) => axiosInstance.post('/ccs/frameworks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ccs-frameworks'] });
      queryClient.invalidateQueries({ queryKey: ['ccs-stats'] });
      setShowAddForm(false);
      setNewFramework({ reference: '', title: '', description: '', category: '', status: 'LIVE', startDate: '', endDate: '', websiteUrl: '' });
    },
  });

  const handleCreate = () => {
    if (!newFramework.reference || !newFramework.title || !newFramework.category) return;
    createFramework.mutate({
      reference: newFramework.reference,
      title: newFramework.title,
      description: newFramework.description || undefined,
      category: newFramework.category,
      status: newFramework.status,
      startDate: newFramework.startDate || undefined,
      endDate: newFramework.endDate || undefined,
      websiteUrl: newFramework.websiteUrl || undefined,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CCS Frameworks</h1>
          <p className="text-gray-500 text-sm mt-1">
            Crown Commercial Services framework agreements ({frameworks.length} framework{frameworks.length !== 1 ? 's' : ''})
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
          Add Framework
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search frameworks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="LIVE">Live</option>
          <option value="EXPIRED">Expired</option>
          <option value="UPCOMING">Upcoming</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.category} value={c.category}>{c.category} ({c.count})</option>
          ))}
        </select>
      </div>

      {/* Add Framework Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Add CCS Framework</h2>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Reference (e.g. RM6187) *" value={newFramework.reference} onChange={(e) => setNewFramework({ ...newFramework, reference: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <input type="text" placeholder="Title *" value={newFramework.title} onChange={(e) => setNewFramework({ ...newFramework, title: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <input type="text" placeholder="Category (e.g. Technology) *" value={newFramework.category} onChange={(e) => setNewFramework({ ...newFramework, category: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <select value={newFramework.status} onChange={(e) => setNewFramework({ ...newFramework, status: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              <option value="LIVE">Live</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="EXPIRED">Expired</option>
            </select>
            <input type="date" placeholder="Start Date" value={newFramework.startDate} onChange={(e) => setNewFramework({ ...newFramework, startDate: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <input type="date" placeholder="End Date" value={newFramework.endDate} onChange={(e) => setNewFramework({ ...newFramework, endDate: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <input type="url" placeholder="Website URL" value={newFramework.websiteUrl} onChange={(e) => setNewFramework({ ...newFramework, websiteUrl: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm col-span-2" />
          </div>
          <textarea placeholder="Description" value={newFramework.description} onChange={(e) => setNewFramework({ ...newFramework, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={!newFramework.reference || !newFramework.title || !newFramework.category || createFramework.isPending} className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition disabled:opacity-50">
              {createFramework.isPending ? 'Saving…' : 'Save Framework'}
            </button>
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
          </div>
        </div>
      )}

      {/* Frameworks List */}
      {isLoading ? (
        <LoadingSpinner />
      ) : frameworks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          No frameworks found. Add CCS frameworks to start tracking government procurement opportunities.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {frameworks.map((fw) => (
            <div
              key={fw.id}
              onClick={() => router.push(`/ccs/frameworks/${fw.id}`)}
              className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{fw.reference}</span>
                  <p className="font-medium text-gray-900 truncate">{fw.title}</p>
                  <Badge label={fw.status} variant={statusVariant[fw.status] ?? 'neutral'} />
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {fw.category}
                  {fw.startDate && ` • Starts ${new Date(fw.startDate).toLocaleDateString('en-GB')}`}
                  {fw.endDate && ` • Ends ${new Date(fw.endDate).toLocaleDateString('en-GB')}`}
                  {fw.regulation && ` • ${fw.regulation}`}
                </p>
                {fw.description && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate max-w-2xl">{fw.description}</p>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>{fw._count?.lots ?? 0} lots</span>
                <span>{fw._count?.opportunities ?? 0} opps</span>
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
