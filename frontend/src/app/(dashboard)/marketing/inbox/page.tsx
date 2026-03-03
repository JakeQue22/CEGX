'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { LinkedInConnection, LinkedInMessage } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';

export default function MarketingInboxPage() {
  const queryClient = useQueryClient();
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [useAi, setUseAi] = useState(false);

  // Fetch inbox threads
  const { data: threads, isLoading: threadsLoading } = useQuery<LinkedInConnection[]>({
    queryKey: ['linkedin-inbox'],
    queryFn: () => axiosInstance.get('/marketing/linkedin/inbox').then((r) =>
      Array.isArray(r.data) ? r.data : []),
  });

  // Fetch selected thread messages
  const { data: activeThread } = useQuery({
    queryKey: ['linkedin-thread', selectedConnectionId],
    queryFn: () =>
      axiosInstance.get(`/marketing/linkedin/messages/${selectedConnectionId}`).then((r) => r.data),
    enabled: !!selectedConnectionId,
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: (data: { connectionId: string; content: string; useAi?: boolean }) =>
      axiosInstance.post('/marketing/linkedin/messages', data),
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['linkedin-thread', selectedConnectionId] });
      queryClient.invalidateQueries({ queryKey: ['linkedin-inbox'] });
    },
  });

  // AI reply generation
  const generateAiReply = useMutation({
    mutationFn: (originalMessage: string) =>
      axiosInstance.post('/ai/reply', {
        originalMessage,
        contextType: 'linkedin_reply',
      }),
    onSuccess: (res) => {
      setNewMessage(res.data.reply || '');
    },
  });

  const handleSend = () => {
    if (!selectedConnectionId || !newMessage.trim()) return;
    sendMessage.mutate({
      connectionId: selectedConnectionId,
      content: newMessage,
      useAi,
    });
  };

  const connectionsList = threads ?? [];
  const messages: LinkedInMessage[] = activeThread?.messages ?? [];
  const selectedConnection = connectionsList.find((c) => c.id === selectedConnectionId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">LinkedIn Inbox</h1>
          <p className="text-gray-500 text-sm mt-1">Manage conversations with your LinkedIn connections</p>
        </div>
      </div>

      <div className="flex gap-0 bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Left Panel - Thread List */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <div className="p-3 border-b border-gray-100">
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {threadsLoading ? (
              <div className="p-4"><LoadingSpinner /></div>
            ) : connectionsList.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                No conversations yet. Connect with people on LinkedIn to start messaging.
              </div>
            ) : (
              connectionsList.map((conn) => {
                const lastMsg = conn.messages?.[0];
                const unread = conn._count?.messages ?? 0;
                return (
                  <div
                    key={conn.id}
                    onClick={() => setSelectedConnectionId(conn.id)}
                    className={`px-4 py-3 cursor-pointer border-b border-gray-50 transition hover:bg-gray-50 ${
                      selectedConnectionId === conn.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 text-xs font-bold">{conn.name?.charAt(0) || '?'}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{conn.name}</p>
                          <p className="text-xs text-gray-500 truncate">{conn.headline || conn.company || ''}</p>
                        </div>
                      </div>
                      {unread > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                    {lastMsg && (
                      <p className="text-xs text-gray-400 mt-1 truncate pl-10">
                        {lastMsg.direction === 'OUTBOUND' ? 'You: ' : ''}{lastMsg.content}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center Panel - Messages */}
        <div className="flex-1 flex flex-col">
          {!selectedConnectionId ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm mt-1">Choose from your contacts on the left to start messaging</p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-bold">{selectedConnection?.name?.charAt(0) || '?'}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedConnection?.name}</p>
                  <p className="text-xs text-gray-500">{selectedConnection?.headline || selectedConnection?.company || 'LinkedIn Connection'}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm py-8">No messages yet. Send a message to start the conversation.</div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                          msg.direction === 'OUTBOUND'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${msg.direction === 'OUTBOUND' ? 'text-blue-100' : 'text-gray-400'}`}>
                          <span className="text-xs">{new Date(msg.sentAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                          {msg.isAiGenerated && <span className="text-xs">• AI</span>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message input */}
              <div className="p-3 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => {
                      const lastInbound = messages.filter((m) => m.direction === 'INBOUND').pop();
                      if (lastInbound) generateAiReply.mutate(lastInbound.content);
                    }}
                    disabled={generateAiReply.isPending}
                    className="text-xs px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition font-medium disabled:opacity-50"
                  >
                    {generateAiReply.isPending ? 'Generating...' : '🤖 AI Reply'}
                  </button>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      checked={useAi}
                      onChange={(e) => setUseAi(e.target.checked)}
                      className="rounded"
                    />
                    Mark as AI-generated
                  </label>
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type a message..."
                    rows={2}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sendMessage.isPending || !newMessage.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 self-end"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Panel - Connection Details */}
        {selectedConnection && (
          <div className="w-72 border-l border-gray-200 p-4 overflow-y-auto">
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 text-xl font-bold">{selectedConnection.name?.charAt(0) || '?'}</span>
              </div>
              <h3 className="font-semibold text-gray-900">{selectedConnection.name}</h3>
              {selectedConnection.headline && (
                <p className="text-sm text-gray-500 mt-1">{selectedConnection.headline}</p>
              )}
            </div>

            <div className="space-y-3 text-sm">
              {selectedConnection.company && (
                <div>
                  <p className="text-gray-400 text-xs uppercase font-medium">Company</p>
                  <p className="text-gray-900">{selectedConnection.company}</p>
                </div>
              )}
              {selectedConnection.location && (
                <div>
                  <p className="text-gray-400 text-xs uppercase font-medium">Location</p>
                  <p className="text-gray-900">{selectedConnection.location}</p>
                </div>
              )}
              <div>
                <p className="text-gray-400 text-xs uppercase font-medium">Status</p>
                <Badge label={selectedConnection.status} />
              </div>
              {selectedConnection.connectedAt && (
                <div>
                  <p className="text-gray-400 text-xs uppercase font-medium">Connected</p>
                  <p className="text-gray-900">{new Date(selectedConnection.connectedAt).toLocaleDateString('en-GB')}</p>
                </div>
              )}
              {selectedConnection.campaign && (
                <div>
                  <p className="text-gray-400 text-xs uppercase font-medium">Campaign</p>
                  <p className="text-gray-900">{selectedConnection.campaign.name}</p>
                </div>
              )}
              {selectedConnection.profileUrl && (
                <a
                  href={selectedConnection.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-4 text-center px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-medium"
                >
                  View LinkedIn Profile
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
