'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { EmailCampaign, CampaignRecipient, EmailList } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const { data: campaign, isLoading } = useQuery<EmailCampaign>({
    queryKey: ['campaign', id],
    queryFn: () => axiosInstance.get(`/campaigns/${id}`).then((r) => r.data),
  });

  const sendNow = useMutation({
    mutationFn: () => axiosInstance.post(`/campaigns/${id}/send`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign', id] }),
  });

  const { data: emailLists } = useQuery<EmailList[]>({
    queryKey: ['email-lists'],
    queryFn: () => axiosInstance.get('/email-lists').then((r) =>
      Array.isArray(r.data) ? r.data : []),
  });

  const [selectedListId, setSelectedListId] = useState('');
  const [addListMsg, setAddListMsg] = useState('');

  const addFromList = useMutation({
    mutationFn: (listId: string) =>
      axiosInstance.post(`/email-lists/${listId}/add-to-campaign/${id}`).then((r) => r.data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      setAddListMsg(`✅ Added ${result.added} recipients from list`);
      setSelectedListId('');
      setTimeout(() => setAddListMsg(''), 5000);
    },
    onError: () => {
      setAddListMsg('❌ Failed to add recipients from list');
      setTimeout(() => setAddListMsg(''), 5000);
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!campaign) return <div className="text-red-600">Campaign not found.</div>;

  const openRate = campaign.totalRecipients > 0
    ? ((campaign.openedCount / campaign.totalRecipients) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/campaigns" className="text-gray-400 hover:text-gray-600 text-sm">← Campaigns</Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge label={campaign.status} />
            <span className="text-sm text-gray-500">{campaign.subject}</span>
          </div>
        </div>
        {campaign.status === 'DRAFT' && (
          <Button onClick={() => sendNow.mutate()} loading={sendNow.isPending}>Send Now</Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Recipients', value: campaign.totalRecipients.toLocaleString() },
          { label: 'Sent', value: campaign.sentCount.toLocaleString() },
          { label: 'Opened', value: campaign.openedCount.toLocaleString() },
          { label: 'Open Rate', value: `${openRate}%` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Email body */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Email Body</h3>
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap font-mono border border-gray-200">
          {campaign.body}
        </div>
      </div>

      {/* Add from Email List */}
      {campaign.status !== 'SENT' && emailLists && emailLists.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
          <h3 className="text-base font-semibold text-gray-900">Add Recipients from Email List</h3>
          <div className="flex items-center gap-3">
            <select
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Select an email list...</option>
              {emailLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name} ({list._count?.entries ?? 0} contacts)
                </option>
              ))}
            </select>
            <button
              onClick={() => selectedListId && addFromList.mutate(selectedListId)}
              disabled={!selectedListId || addFromList.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
            >
              {addFromList.isPending ? 'Adding...' : 'Add to Campaign'}
            </button>
          </div>
          {addListMsg && <p className="text-sm text-blue-800">{addListMsg}</p>}
        </div>
      )}

      {/* Recipients */}
      {campaign.recipients && campaign.recipients.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-base font-semibold text-gray-900">Recipients ({campaign.recipients.length})</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Email', 'Opened', 'Opened At'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaign.recipients.map((r: CampaignRecipient) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{r.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{r.email}</td>
                  <td className="px-4 py-3">
                    <Badge label={r.opened ? 'YES' : 'NO'} variant={r.opened ? 'success' : 'neutral'} />
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {r.openedAt ? new Date(r.openedAt).toLocaleString('en-GB') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
