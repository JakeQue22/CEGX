'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { AIConversation, AISettings } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function AIAssistantPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'analyze' | 'outreach' | 'settings' | 'history'>('analyze');
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');

  // Outreach generation state
  const [outreachForm, setOutreachForm] = useState({
    companyName: '',
    products: '',
    campaignContext: '',
    outputType: 'email_body',
  });
  const [outreachResult, setOutreachResult] = useState('');

  // Settings state
  const [settingsForm, setSettingsForm] = useState({
    apiKey: '',
    model: 'grok-3',
    defaultPrompt: '',
    isActive: true,
  });

  const { data: settings } = useQuery<AISettings | null>({
    queryKey: ['ai-settings'],
    queryFn: () => axiosInstance.get('/ai/settings').then((r) => r.data).catch(() => null),
  });

  const { data: conversations, isLoading: historyLoading } = useQuery<AIConversation[]>({
    queryKey: ['ai-conversations'],
    queryFn: () => axiosInstance.get('/ai/conversations').then((r) =>
      Array.isArray(r.data) ? r.data : []),
    enabled: activeTab === 'history',
  });

  const analyze = useMutation({
    mutationFn: (data: { prompt: string; context?: string }) =>
      axiosInstance.post('/ai/analyze', data),
    onSuccess: (res) => setAnalysisResult(res.data.analysis || ''),
  });

  const generateOutreach = useMutation({
    mutationFn: (data: any) => axiosInstance.post('/ai/outreach', data),
    onSuccess: (res) => setOutreachResult(res.data.content || ''),
  });

  const updateSettings = useMutation({
    mutationFn: (data: any) => axiosInstance.put('/ai/settings', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-settings'] }),
  });

  const tabs = [
    { id: 'analyze' as const, label: 'Data Analysis', icon: '📊' },
    { id: 'outreach' as const, label: 'Generate Outreach', icon: '✍️' },
    { id: 'settings' as const, label: 'AI Settings', icon: '⚙️' },
    { id: 'history' as const, label: 'History', icon: '📋' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-gray-500 text-sm mt-1">Powered by Grok AI — Analyze data, generate outreach, and manage AI settings</p>
      </div>

      {/* Status */}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${settings?.isActive ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
        <span className={`w-2 h-2 rounded-full ${settings?.isActive ? 'bg-green-500' : 'bg-yellow-500'}`} />
        {settings?.isActive ? `Grok AI active (${settings.model})` : 'AI not configured — Add your API key in Settings'}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition ${
              activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'analyze' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Ask Grok AI</h2>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Ask a question about your data, e.g., 'Analyze our pipeline performance this quarter' or 'What products should we focus on?'"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
              placeholder="Optional: Paste data or context for analysis (JSON, CSV, text)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              onClick={() => analyze.mutate({ prompt, context: context || undefined })}
              disabled={analyze.isPending || !prompt.trim()}
              className="px-6 py-2.5 text-sm font-medium text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              {analyze.isPending ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>

          {analysisResult && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Analysis Result</h3>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">{analysisResult}</div>
            </div>
          )}

          {analyze.isError && (
            <div className="bg-red-50 text-red-700 rounded-lg p-4 text-sm">
              Failed to analyze. Make sure your Grok API key is configured in AI Settings.
            </div>
          )}
        </div>
      )}

      {activeTab === 'outreach' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Generate Outreach Content</h2>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Company Name *"
                value={outreachForm.companyName}
                onChange={(e) => setOutreachForm({ ...outreachForm, companyName: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <select
                value={outreachForm.outputType}
                onChange={(e) => setOutreachForm({ ...outreachForm, outputType: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="email_subject">Email Subject Line</option>
                <option value="email_body">Email Body</option>
                <option value="linkedin_message">LinkedIn Message</option>
                <option value="connection_note">LinkedIn Connection Note</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="Products to promote (optional)"
              value={outreachForm.products}
              onChange={(e) => setOutreachForm({ ...outreachForm, products: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <textarea
              placeholder="Additional campaign context or instructions (optional)"
              value={outreachForm.campaignContext}
              onChange={(e) => setOutreachForm({ ...outreachForm, campaignContext: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              onClick={() => generateOutreach.mutate(outreachForm)}
              disabled={generateOutreach.isPending || !outreachForm.companyName}
              className="px-6 py-2.5 text-sm font-medium text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              {generateOutreach.isPending ? 'Generating...' : 'Generate'}
            </button>
          </div>

          {outreachResult && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Generated Content</h3>
                <button
                  onClick={() => navigator.clipboard.writeText(outreachResult)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Copy to clipboard
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">{outreachResult}</div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Grok AI Configuration</h2>
          <p className="text-sm text-gray-500">Configure your Grok AI API key and default settings</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input
              type="password"
              value={settingsForm.apiKey}
              onChange={(e) => setSettingsForm({ ...settingsForm, apiKey: e.target.value })}
              placeholder={settings?.apiKey ? '••••••••' : 'Enter your Grok API key'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <select
              value={settingsForm.model}
              onChange={(e) => setSettingsForm({ ...settingsForm, model: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="grok-3">Grok 3 (Latest)</option>
              <option value="grok-3-mini">Grok 3 Mini</option>
              <option value="grok-2">Grok 2</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default System Prompt</label>
            <textarea
              value={settingsForm.defaultPrompt}
              onChange={(e) => setSettingsForm({ ...settingsForm, defaultPrompt: e.target.value })}
              rows={4}
              placeholder="You are a professional business development and procurement specialist assistant..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settingsForm.isActive}
              onChange={(e) => setSettingsForm({ ...settingsForm, isActive: e.target.checked })}
              className="rounded"
              id="ai-active"
            />
            <label htmlFor="ai-active" className="text-sm text-gray-700">Enable AI features</label>
          </div>

          <button
            onClick={() => updateSettings.mutate(settingsForm)}
            disabled={updateSettings.isPending}
            className="px-6 py-2.5 text-sm font-medium text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
            style={{ backgroundColor: 'var(--primary-color)' }}
          >
            {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
          </button>

          {updateSettings.isSuccess && (
            <p className="text-green-600 text-sm">Settings saved successfully!</p>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">AI Conversation History</h2>
          </div>
          {historyLoading ? (
            <div className="p-4"><LoadingSpinner /></div>
          ) : !conversations || conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No AI conversations yet.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {conversations.map((conv) => (
                <div key={conv.id} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{conv.context}</span>
                    <span className="text-xs text-gray-400">{new Date(conv.createdAt).toLocaleString('en-GB')}</span>
                    {conv.tokensUsed && <span className="text-xs text-gray-400">• {conv.tokensUsed} tokens</span>}
                  </div>
                  <p className="text-sm text-gray-700 mb-1"><strong>Prompt:</strong> {conv.prompt.length > 200 ? conv.prompt.slice(0, 200) + '...' : conv.prompt}</p>
                  <p className="text-sm text-gray-600"><strong>Response:</strong> {conv.response.length > 300 ? conv.response.slice(0, 300) + '...' : conv.response}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
