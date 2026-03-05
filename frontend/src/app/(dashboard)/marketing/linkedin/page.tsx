'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import axiosInstance from '@/lib/axios';
import { LinkedInAccount } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function LinkedInAccountsPage() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccount, setNewAccount] = useState({ email: '', password: '', name: '', profileUrl: '' });

  const { data, isLoading } = useQuery<LinkedInAccount[]>({
    queryKey: ['linkedin-accounts'],
    queryFn: () => axiosInstance.get('/marketing/linkedin/accounts').then((r) =>
      Array.isArray(r.data) ? r.data : []),
  });

  const createAccount = useMutation({
    mutationFn: (data: any) => axiosInstance.post('/marketing/linkedin/accounts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkedin-accounts'] });
      setShowAddForm(false);
      setNewAccount({ email: '', password: '', name: '', profileUrl: '' });
    },
  });

  const syncAccount = useMutation({
    mutationFn: (accountId: string) => axiosInstance.post(`/marketing/linkedin/sync/${accountId}`),
  });

  const accounts = data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">LinkedIn Accounts</h1>
          <p className="text-gray-500 text-sm mt-1">Manage LinkedIn accounts for automated outreach</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition"
          style={{ backgroundColor: 'var(--primary-color)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Account
        </button>
      </div>

      {/* Add Account Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Add LinkedIn Account</h2>
          <div className="grid grid-cols-2 gap-4">
            <input type="email" placeholder="LinkedIn Email *" required value={newAccount.email} onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <input type="password" placeholder="LinkedIn Password *" required value={newAccount.password} onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <input type="text" placeholder="Display Name" value={newAccount.name} onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <input type="text" placeholder="Profile URL" value={newAccount.profileUrl} onChange={(e) => setNewAccount({ ...newAccount, profileUrl: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => createAccount.mutate(newAccount)} disabled={!newAccount.email || !newAccount.password || createAccount.isPending} className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition disabled:opacity-50">
              {createAccount.isPending ? 'Adding...' : 'Add Account'}
            </button>
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
          </div>
        </div>
      )}

      {/* Accounts */}
      {isLoading ? (
        <LoadingSpinner />
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          No LinkedIn accounts configured yet. Add an account to start automated outreach.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div key={account.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">{account.name?.charAt(0) || account.email.charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">{account.name || account.email}</p>
                  <p className="text-xs text-gray-500 truncate">{account.email}</p>
                </div>
                <Badge label={account.isActive ? 'Active' : 'Inactive'} />
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span>{account._count?.connections ?? 0} connections</span>
                <span>{account._count?.messages ?? 0} messages</span>
              </div>

              {account.lastSyncAt && (
                <p className="text-xs text-gray-400 mb-3">
                  Last synced: {new Date(account.lastSyncAt).toLocaleString('en-GB')}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => syncAccount.mutate(account.id)}
                  disabled={syncAccount.isPending}
                  className="flex-1 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition disabled:opacity-50"
                >
                  {syncAccount.isPending ? 'Syncing...' : 'Sync Inbox'}
                </button>
                {account.profileUrl && (
                  <a
                    href={account.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    Profile
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
