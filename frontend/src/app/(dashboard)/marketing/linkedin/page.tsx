'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import axiosInstance from '@/lib/axios';
import { LinkedInAccount, LinkedInConnection, LinkedInMessage } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

type Tab = 'accounts' | 'connections' | 'inbox';

export default function LinkedInPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('accounts');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccount, setNewAccount] = useState({ email: '', password: '', name: '', profileUrl: '' });
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  // Accounts
  const { data: accountsData, isLoading: accountsLoading } = useQuery<LinkedInAccount[]>({
    queryKey: ['linkedin-accounts'],
    queryFn: () => axiosInstance.get('/marketing/linkedin/accounts').then((r) =>
      Array.isArray(r.data) ? r.data : []),
  });
  const accounts = accountsData ?? [];

  // Connections
  const { data: connectionsData, isLoading: connectionsLoading } = useQuery<LinkedInConnection[]>({
    queryKey: ['linkedin-connections', selectedAccountId],
    queryFn: () => {
      const params = selectedAccountId ? `?accountId=${selectedAccountId}` : '';
      return axiosInstance.get(`/marketing/linkedin/connections${params}`).then((r) =>
        Array.isArray(r.data) ? r.data : []);
    },
    enabled: tab === 'connections',
  });
  const connections = connectionsData ?? [];

  // Inbox
  const { data: inboxData, isLoading: inboxLoading } = useQuery<LinkedInConnection[]>({
    queryKey: ['linkedin-inbox', selectedAccountId],
    queryFn: () => {
      const params = selectedAccountId ? `?accountId=${selectedAccountId}` : '';
      return axiosInstance.get(`/marketing/linkedin/inbox${params}`).then((r) =>
        Array.isArray(r.data) ? r.data : []);
    },
    enabled: tab === 'inbox',
  });
  const inbox = inboxData ?? [];

  // Thread
  const { data: threadData, isLoading: threadLoading } = useQuery<LinkedInConnection & { messages: LinkedInMessage[] }>({
    queryKey: ['linkedin-thread', selectedConnectionId],
    queryFn: () => axiosInstance.get(`/marketing/linkedin/messages/${selectedConnectionId}`).then((r) => r.data),
    enabled: !!selectedConnectionId,
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
    mutationFn: (accountId: string) => axiosInstance.post(`/marketing/linkedin/sync/${accountId}`, {}, { timeout: 300000 }).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['linkedin-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['linkedin-connections'] });
      queryClient.invalidateQueries({ queryKey: ['linkedin-inbox'] });
      const email = data?.email ?? 'account';
      const stats = data?.stats;
      const parts: string[] = [];
      if (stats?.importedConnections > 0) parts.push(`${stats.importedConnections} new connections imported`);
      if (stats?.importedMessages > 0) parts.push(`${stats.importedMessages} new messages fetched`);
      if (stats?.activeConnections !== undefined) parts.push(`${stats.activeConnections} active connections`);
      if (stats?.expiredThisSync > 0) parts.push(`${stats.expiredThisSync} expired`);
      const statsInfo = parts.length > 0 ? ` — ${parts.join(', ')}` : '';
      const errorInfo = data?.errors?.length > 0 ? `\n⚠️ ${data.errors.join('\n⚠️ ')}` : '';
      setSyncMessage(`✅ Sync complete for ${email}${statsInfo}${errorInfo}`);
      setTimeout(() => setSyncMessage(null), 15000);
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.message || err?.message || '';
      setSyncMessage(`❌ Sync failed${detail ? `: ${detail}` : ''}`);
      setTimeout(() => setSyncMessage(null), 8000);
    },
  });

  const deleteAccount = useMutation({
    mutationFn: (accountId: string) => axiosInstance.delete(`/marketing/linkedin/accounts/${accountId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['linkedin-accounts'] }),
  });

  const sendMessage = useMutation({
    mutationFn: (data: { connectionId: string; content: string }) =>
      axiosInstance.post('/marketing/linkedin/messages', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkedin-thread', selectedConnectionId] });
      queryClient.invalidateQueries({ queryKey: ['linkedin-inbox'] });
      setNewMessage('');
    },
  });

  const connectRequest = useMutation({
    mutationFn: (data: { accountId: string; profileUrl: string; message?: string }) =>
      axiosInstance.post('/marketing/linkedin/connect', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkedin-connections'] });
      setSyncMessage('✅ Connection request queued');
      setTimeout(() => setSyncMessage(null), 5000);
    },
  });

  const [connectForm, setConnectForm] = useState({ profileUrl: '', message: '' });

  const tabs: { key: Tab; label: string }[] = [
    { key: 'accounts', label: 'Accounts' },
    { key: 'connections', label: 'Connections' },
    { key: 'inbox', label: 'Inbox' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">LinkedIn</h1>
          <p className="text-gray-500 text-sm mt-1">Automated LinkedIn outreach and inbox management</p>
        </div>
        {tab === 'accounts' && (
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
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSelectedConnectionId(null); }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Sync/Status Message */}
      {syncMessage && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm text-blue-800 whitespace-pre-line">{syncMessage}</p>
        </div>
      )}

      {/* Account filter (for connections/inbox tabs) */}
      {(tab === 'connections' || tab === 'inbox') && accounts.length > 1 && (
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-500">Account:</span>
          <select
            value={selectedAccountId || ''}
            onChange={(e) => setSelectedAccountId(e.target.value || null)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name || a.email}</option>
            ))}
          </select>
        </div>
      )}

      {/* === ACCOUNTS TAB === */}
      {tab === 'accounts' && (
        <>
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

          {accountsLoading ? <LoadingSpinner /> : accounts.length === 0 ? (
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
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => syncAccount.mutate(account.id)}
                      disabled={syncAccount.isPending}
                      className="flex-1 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition disabled:opacity-50"
                    >
                      {syncAccount.isPending ? 'Syncing...' : 'Sync'}
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
                    <button
                      onClick={() => {
                        if (confirm('Remove this LinkedIn account? This will delete all connections and messages.')) {
                          deleteAccount.mutate(account.id);
                        }
                      }}
                      disabled={deleteAccount.isPending}
                      className="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* === CONNECTIONS TAB === */}
      {tab === 'connections' && (
        <>
          {/* Send connection request form */}
          {accounts.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Send Connection Request</h3>
              <div className="flex gap-3 flex-wrap">
                {accounts.length > 1 && (
                  <select
                    value={selectedAccountId || accounts[0]?.id || ''}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name || a.email}</option>
                    ))}
                  </select>
                )}
                <input
                  type="text"
                  placeholder="LinkedIn Profile URL"
                  value={connectForm.profileUrl}
                  onChange={(e) => setConnectForm({ ...connectForm, profileUrl: e.target.value })}
                  className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Optional message"
                  value={connectForm.message}
                  onChange={(e) => setConnectForm({ ...connectForm, message: e.target.value })}
                  className="flex-1 min-w-[150px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => {
                    if (!connectForm.profileUrl) return;
                    connectRequest.mutate({
                      accountId: selectedAccountId || accounts[0]?.id,
                      profileUrl: connectForm.profileUrl,
                      message: connectForm.message || undefined,
                    });
                    setConnectForm({ profileUrl: '', message: '' });
                  }}
                  disabled={!connectForm.profileUrl || connectRequest.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                >
                  Connect
                </button>
              </div>
            </div>
          )}

          {connectionsLoading ? <LoadingSpinner /> : connections.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              No connections yet. Sync an account to import connections from LinkedIn.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Headline</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Company</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Messages</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {connections.map((conn) => (
                    <tr key={conn.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <a href={conn.profileUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                          {conn.name}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-gray-600 truncate max-w-[200px]">{conn.headline || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{conn.company || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge
                          label={conn.status}
                          variant={conn.status === 'CONNECTED' ? 'success' : conn.status === 'PENDING' ? 'warning' : 'danger'}
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-500">{conn._count?.messages ?? 0}</td>
                      <td className="px-4 py-3">
                        {conn.status === 'CONNECTED' && (
                          <button
                            onClick={() => { setSelectedConnectionId(conn.id); setTab('inbox'); }}
                            className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition"
                          >
                            Message
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* === INBOX TAB === */}
      {tab === 'inbox' && (
        <div className="flex gap-5">
          {/* Thread list */}
          <div className={`${selectedConnectionId ? 'hidden md:block md:w-1/3' : 'w-full'}`}>
            {inboxLoading ? <LoadingSpinner /> : inbox.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                No message threads yet. Sync an account to fetch your LinkedIn inbox.
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {inbox.map((thread) => {
                    const lastMsg = thread.messages?.[0];
                    const unread = (thread._count?.messages ?? 0) > 0;
                    return (
                      <div
                        key={thread.id}
                        onClick={() => setSelectedConnectionId(thread.id)}
                        className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition ${
                          selectedConnectionId === thread.id ? 'bg-blue-50' : ''
                        } ${unread ? 'font-medium' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-600 text-xs font-bold">{thread.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-gray-900 truncate">{thread.name}</p>
                              {unread && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                            </div>
                            {lastMsg && (
                              <p className="text-xs text-gray-500 truncate mt-0.5">{lastMsg.content}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Message thread */}
          {selectedConnectionId && (
            <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col" style={{ minHeight: 400 }}>
              {threadLoading ? (
                <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
              ) : threadData ? (
                <>
                  {/* Thread header */}
                  <div className="px-4 py-3 border-b flex items-center gap-3">
                    <button
                      onClick={() => setSelectedConnectionId(null)}
                      className="md:hidden text-gray-400 hover:text-gray-600"
                    >
                      ←
                    </button>
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-xs">{threadData.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{threadData.name}</p>
                      <p className="text-xs text-gray-500">{threadData.headline || threadData.company || ''}</p>
                    </div>
                    <a
                      href={threadData.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-xs text-blue-600 hover:underline"
                    >
                      View Profile
                    </a>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                    {threadData.messages?.length === 0 ? (
                      <p className="text-center text-sm text-gray-400 py-8">No messages yet. Send the first message below.</p>
                    ) : (
                      threadData.messages?.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-xl px-3 py-2 text-sm ${
                              msg.direction === 'OUTBOUND'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <p>{msg.content}</p>
                            <p className={`text-xs mt-1 ${msg.direction === 'OUTBOUND' ? 'text-blue-100' : 'text-gray-400'}`}>
                              {new Date(msg.sentAt).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message input */}
                  <div className="px-4 py-3 border-t">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newMessage.trim()) {
                            sendMessage.mutate({ connectionId: selectedConnectionId, content: newMessage.trim() });
                          }
                        }}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => {
                          if (newMessage.trim()) {
                            sendMessage.mutate({ connectionId: selectedConnectionId, content: newMessage.trim() });
                          }
                        }}
                        disabled={!newMessage.trim() || sendMessage.isPending}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                  Thread not found
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
