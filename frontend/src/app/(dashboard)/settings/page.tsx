'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { useSettings } from '@/hooks/useSettings';
import { CompanySettings } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const TABS = ['Company', 'Email', 'Notifications'] as const;
type Tab = (typeof TABS)[number];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('Company');
  const { settings, isLoading, updateSettings } = useSettings();
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [companyForm, setCompanyForm] = useState<Partial<CompanySettings>>({});
  const [emailForm, setEmailForm] = useState<Partial<CompanySettings>>({});
  const [notifForm, setNotifForm] = useState<Partial<CompanySettings>>({});

  // Merge settings into local form state on first load
  const merged = { ...settings, ...companyForm };
  const emailMerged = { ...settings, ...emailForm };
  const notifMerged = { ...settings, ...notifForm };

  const save = useMutation({
    mutationFn: (payload: Partial<CompanySettings>) => updateSettings.mutateAsync(payload),
    onSuccess: () => { setSuccess('Settings saved.'); setError(''); setTimeout(() => setSuccess(''), 3000); },
    onError: (err: unknown) => {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save settings');
      setSuccess('');
    },
  });

  if (isLoading) return <LoadingSpinner />;

  function setC(field: keyof CompanySettings) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setCompanyForm((f) => ({ ...f, [field]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }));
  }

  function setE(field: keyof CompanySettings) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setEmailForm((f) => ({ ...f, [field]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }));
  }

  function toggleNotif(field: keyof CompanySettings) {
    setNotifForm((f) => ({ ...f, [field]: !notifMerged[field] }));
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your company and system preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {success && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">{success}</div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
      )}

      {/* Company Tab */}
      {tab === 'Company' && (
        <form
          onSubmit={(e) => { e.preventDefault(); save.mutate(companyForm); }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4"
        >
          <h2 className="text-base font-semibold text-gray-900">Company Details</h2>
          <Input label="Company Name" value={merged.companyName ?? ''} onChange={setC('companyName')} />
          <Input label="Logo URL" type="url" value={merged.logoUrl ?? ''} onChange={setC('logoUrl')} placeholder="https://..." />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Primary Brand Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={merged.primaryColor ?? '#3b82f6'}
                onChange={setC('primaryColor')}
                className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
              />
              <Input
                value={merged.primaryColor ?? '#3b82f6'}
                onChange={setC('primaryColor')}
                className="max-w-[120px]"
                placeholder="#3b82f6"
              />
              <span
                className="w-8 h-8 rounded-lg border"
                style={{ backgroundColor: merged.primaryColor ?? '#3b82f6' }}
              />
            </div>
          </div>
          <Input label="Currency" value={merged.currency ?? 'GBP'} onChange={setC('currency')} placeholder="GBP" />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Default VAT %"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={merged.defaultVatPercent ?? 20}
              onChange={setC('defaultVatPercent')}
            />
            <Input
              label="Default Ad Spend %"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={merged.defaultAdPercent ?? 10}
              onChange={setC('defaultAdPercent')}
            />
          </div>
          <div className="pt-2">
            <Button type="submit" loading={save.isPending}>Save Company Settings</Button>
          </div>
        </form>
      )}

      {/* Email Tab */}
      {tab === 'Email' && (
        <form
          onSubmit={(e) => { e.preventDefault(); save.mutate(emailForm); }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4"
        >
          <h2 className="text-base font-semibold text-gray-900">SMTP Configuration</h2>
          <Input label="SMTP Host" value={emailMerged.smtpHost ?? ''} onChange={setE('smtpHost')} placeholder="smtp.gmail.com" />
          <Input label="SMTP Port" type="number" value={emailMerged.smtpPort ?? 587} onChange={setE('smtpPort')} />
          <Input label="SMTP Username" value={emailMerged.smtpUser ?? ''} onChange={setE('smtpUser')} placeholder="user@company.com" />
          <Input label="SMTP Password" type="password" value={emailMerged.smtpPass ?? ''} onChange={setE('smtpPass')} placeholder="••••••••" />
          <Input label="Sender Name" value={emailMerged.smtpSenderName ?? ''} onChange={setE('smtpSenderName')} placeholder="CEGX Team" />
          <div className="pt-2">
            <Button type="submit" loading={save.isPending}>Save Email Settings</Button>
          </div>
        </form>
      )}

      {/* Notifications Tab */}
      {tab === 'Notifications' && (
        <form
          onSubmit={(e) => { e.preventDefault(); save.mutate(notifForm); }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5"
        >
          <h2 className="text-base font-semibold text-gray-900">Email Notification Preferences</h2>
          {(
            [
              { field: 'notifyOnDealCreated' as const, label: 'Notify when a deal is created' },
              { field: 'notifyOnDealWon' as const, label: 'Notify when a deal is won' },
              { field: 'notifyOnDealLost' as const, label: 'Notify when a deal is lost' },
              { field: 'notifyOnFollowUpDue' as const, label: 'Notify when a follow-up is due' },
            ] as { field: keyof CompanySettings; label: string }[]
          ).map(({ field, label }) => (
            <label key={field} className="flex items-center gap-3 cursor-pointer">
              <div
                className={`relative w-10 h-6 rounded-full transition-colors ${notifMerged[field] ? 'bg-blue-500' : 'bg-gray-300'}`}
                onClick={() => toggleNotif(field)}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform shadow ${
                    notifMerged[field] ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
          <div className="pt-2">
            <Button type="submit" loading={save.isPending}>Save Notification Settings</Button>
          </div>
        </form>
      )}
    </div>
  );
}
