'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { useSettings } from '@/hooks/useSettings';
import { CompanySettings, User, Role } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const TABS = ['Company', 'Email', 'Payments', 'Invoices', 'Notifications', 'Users'] as const;

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SALES_MANAGER', label: 'Sales Manager' },
  { value: 'PROCUREMENT_OFFICER', label: 'Procurement Officer' },
  { value: 'VIEWER', label: 'Viewer' },
];

interface CreateUserPayload {
  name: string;
  email: string;
  phone?: string;
  title?: string;
  department?: string;
  role: Role;
  password?: string;
  sendSetPasswordEmail?: boolean;
  sendWelcomeEmail?: boolean;
}
type Tab = (typeof TABS)[number];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('Company');
  const { settings, isLoading, updateSettings } = useSettings();
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const queryClient = useQueryClient();
  const [companyForm, setCompanyForm] = useState<Partial<CompanySettings>>({});
  const [emailForm, setEmailForm] = useState<Partial<CompanySettings>>({});
  const [notifForm, setNotifForm] = useState<Partial<CompanySettings>>({});
  const [paymentForm, setPaymentForm] = useState<Partial<CompanySettings>>({});
  const [invoiceForm, setInvoiceForm] = useState<Partial<CompanySettings>>({});

  const emptyUserForm: CreateUserPayload = { name: '', email: '', phone: '', title: '', department: '', role: 'VIEWER', password: '', sendSetPasswordEmail: false, sendWelcomeEmail: false };
  const [userForm, setUserForm] = useState<CreateUserPayload>(emptyUserForm);

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => (await axiosInstance.get('/users')).data,
    enabled: tab === 'Users',
  });

  const createUser = useMutation({
    mutationFn: (payload: CreateUserPayload) => {
      const body = { ...payload };
      if (!body.password) delete body.password;
      if (!body.phone) delete body.phone;
      if (!body.title) delete body.title;
      if (!body.department) delete body.department;
      return axiosInstance.post('/users', body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserForm(emptyUserForm);
      setSuccess('User created successfully.');
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: unknown) => {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create user');
      setSuccess('');
    },
  });

  // Merge settings into local form state on first load
  const merged = { ...settings, ...companyForm };
  const emailMerged = { ...settings, ...emailForm };
  const notifMerged = { ...settings, ...notifForm };
  const paymentMerged = { ...settings, ...paymentForm };
  const invoiceMerged = { ...settings, ...invoiceForm };

  const [testEmailAddr, setTestEmailAddr] = useState('');
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string } | null>(null);

  const testEmail = useMutation({
    mutationFn: (email: string) => axiosInstance.post('/settings/test-email', { email }).then((r) => r.data),
    onSuccess: (data: { success: boolean; message: string }) => {
      setTestEmailResult(data);
      setTimeout(() => setTestEmailResult(null), 8000);
    },
    onError: (err: unknown) => {
      setTestEmailResult({ success: false, message: (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to send test email' });
      setTimeout(() => setTestEmailResult(null), 8000);
    },
  });

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

  function setP(field: keyof CompanySettings) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setPaymentForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function setI(field: keyof CompanySettings) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setInvoiceForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function toggleNotif(field: keyof CompanySettings) {
    setNotifForm((f) => ({ ...f, [field]: !notifMerged[field] }));
  }

  return (
    <div className={`space-y-6 ${tab === 'Users' ? 'max-w-4xl' : 'max-w-2xl'}`}>
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
          <Input label="Base Domain URL" type="url" value={merged.baseDomainUrl ?? ''} onChange={setC('baseDomainUrl')} placeholder="https://cegx.quantumonline.co.uk" />
          <Input label="Logo URL" type="url" value={merged.logoUrl ?? ''} onChange={setC('logoUrl')} placeholder="https://..." />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Primary Brand Colour</label>
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

          <h2 className="text-base font-semibold text-gray-900 pt-4">Invoice / Business Details</h2>
          <Input label="Company Address" value={merged.companyAddress ?? ''} onChange={setC('companyAddress')} placeholder="123 Business St, London, EC1A 1BB" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Company Phone" value={merged.companyPhone ?? ''} onChange={setC('companyPhone')} placeholder="+44 20 1234 5678" />
            <Input label="Company Email" type="email" value={merged.companyEmail ?? ''} onChange={setC('companyEmail')} placeholder="info@company.com" />
          </div>
          <Input label="Company Website" type="url" value={merged.companyWebsite ?? ''} onChange={setC('companyWebsite')} placeholder="https://www.company.com" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="VAT Number" value={merged.vatNumber ?? ''} onChange={setC('vatNumber')} placeholder="GB 123 4567 89" />
            <Input label="Company Reg. Number" value={merged.companyRegNumber ?? ''} onChange={setC('companyRegNumber')} placeholder="12345678" />
          </div>

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
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={emailMerged.smtpSecure ?? false}
              onChange={(e) => setEmailForm((f) => ({ ...f, smtpSecure: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Use SSL/TLS</span>
          </label>
          <Input label="SMTP Username" value={emailMerged.smtpUser ?? ''} onChange={setE('smtpUser')} placeholder="user@company.com" />
          <Input label="SMTP Password" type="password" value={emailMerged.smtpPass ?? ''} onChange={setE('smtpPass')} placeholder="••••••••" />
          <Input label="Sender Name" value={emailMerged.smtpSenderName ?? ''} onChange={setE('smtpSenderName')} placeholder="CEGX Team" />
          <div className="pt-2">
            <Button type="submit" loading={save.isPending}>Save Email Settings</Button>
          </div>
        </form>
      )}

      {/* Test Email — shown below the email settings form */}
      {tab === 'Email' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Test SMTP Connection</h2>
          <p className="text-sm text-gray-500">Send a test email to verify your SMTP settings are working correctly.</p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                label="Recipient Email"
                type="email"
                value={testEmailAddr}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestEmailAddr(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <Button
              type="button"
              loading={testEmail.isPending}
              onClick={() => { if (testEmailAddr && testEmailAddr.includes('@')) testEmail.mutate(testEmailAddr); }}
            >
              Send Test Email
            </Button>
          </div>
          {testEmailResult && (
            <div className={`text-sm p-3 rounded-lg ${testEmailResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {testEmailResult.success ? '✅' : '❌'} {testEmailResult.message}
            </div>
          )}
        </div>
      )}

      {/* Payments Tab */}
      {tab === 'Payments' && (
        <form
          onSubmit={(e) => { e.preventDefault(); save.mutate(paymentForm); }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4"
        >
          <h2 className="text-base font-semibold text-gray-900">Bank Details</h2>
          <p className="text-sm text-gray-500">Bank account information for invoices and payments.</p>
          <Input label="Account Name" value={paymentMerged.bankAccountName ?? ''} onChange={setP('bankAccountName')} placeholder="CEGX Ltd" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Sort Code" value={paymentMerged.bankSortCode ?? ''} onChange={setP('bankSortCode')} placeholder="12-34-56" />
            <Input label="Account Number" value={paymentMerged.bankAccountNumber ?? ''} onChange={setP('bankAccountNumber')} placeholder="12345678" />
          </div>
          <Input label="IBAN" value={paymentMerged.bankIban ?? ''} onChange={setP('bankIban')} placeholder="GB29 NWBK 6016 1331 9268 19" />

          <h2 className="text-base font-semibold text-gray-900 pt-4">Stripe Integration</h2>
          <p className="text-sm text-gray-500">Connect Stripe for online card payments.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mode</label>
            <div className="flex gap-3">
              {(['test', 'live'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentForm((f) => ({ ...f, stripeMode: mode }))}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${
                    (paymentMerged.stripeMode ?? 'test') === mode
                      ? mode === 'live'
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {mode === 'test' ? '🧪 Test' : '🟢 Live'}
                </button>
              ))}
            </div>
          </div>

          <h3 className="text-sm font-semibold text-gray-700 pt-2">Test Keys</h3>
          <Input label="Test Publishable Key" value={paymentMerged.stripeTestPublicKey ?? ''} onChange={setP('stripeTestPublicKey')} placeholder="pk_test_..." />
          <Input label="Test Secret Key" type="password" value={paymentMerged.stripeTestSecretKey ?? ''} onChange={setP('stripeTestSecretKey')} placeholder="sk_test_..." />

          <h3 className="text-sm font-semibold text-gray-700 pt-2">Live Keys</h3>
          <Input label="Live Publishable Key" value={paymentMerged.stripeLivePublicKey ?? ''} onChange={setP('stripeLivePublicKey')} placeholder="pk_live_..." />
          <Input label="Live Secret Key" type="password" value={paymentMerged.stripeLiveSecretKey ?? ''} onChange={setP('stripeLiveSecretKey')} placeholder="sk_live_..." />

          <div className="pt-2">
            <Button type="submit" loading={save.isPending}>Save Payment Settings</Button>
          </div>
        </form>
      )}

      {/* Invoices Tab */}
      {tab === 'Invoices' && (
        <form
          onSubmit={(e) => { e.preventDefault(); save.mutate(invoiceForm); }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4"
        >
          <h2 className="text-base font-semibold text-gray-900">Invoice Settings</h2>
          <p className="text-sm text-gray-500">Configure default settings for generated invoices.</p>
          <Input label="Invoice Prefix" value={invoiceMerged.invoicePrefix ?? 'INV'} onChange={setI('invoicePrefix')} placeholder="INV" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Terms</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              rows={3}
              value={invoiceMerged.invoiceTerms ?? ''}
              onChange={setI('invoiceTerms')}
              placeholder="Payment is due within 30 days of the invoice date..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Invoice Notes</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              rows={2}
              value={invoiceMerged.invoiceNotes ?? ''}
              onChange={setI('invoiceNotes')}
              placeholder="Thank you for your business."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice Footer</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              rows={2}
              value={invoiceMerged.invoiceFooter ?? ''}
              onChange={setI('invoiceFooter')}
              placeholder="Registered in England & Wales. Company No. ..."
            />
          </div>
          <div className="pt-2">
            <Button type="submit" loading={save.isPending}>Save Invoice Settings</Button>
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

      {/* Users Tab */}
      {tab === 'Users' && (
        <>
          {/* Users List */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Existing Users</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Role</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">No users found</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-6 py-3 text-gray-900">{u.name}</td>
                      <td className="px-6 py-3 text-gray-600">{u.email}</td>
                      <td className="px-6 py-3"><Badge label={u.role} /></td>
                      <td className="px-6 py-3">
                        <Badge
                          label={u.isActive !== false ? 'Active' : 'Inactive'}
                          variant={u.isActive !== false ? 'success' : 'neutral'}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Create User Form */}
          <form
            onSubmit={(e) => { e.preventDefault(); createUser.mutate(userForm); }}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4"
          >
            <h2 className="text-base font-semibold text-gray-900">Create User</h2>
            <Input
              label="Name *"
              value={userForm.name}
              onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Input
              label="Email *"
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <Input
              label="Phone"
              value={userForm.phone ?? ''}
              onChange={(e) => setUserForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <Input
              label="Title"
              value={userForm.title ?? ''}
              onChange={(e) => setUserForm((f) => ({ ...f, title: e.target.value }))}
            />
            <Input
              label="Department"
              value={userForm.department ?? ''}
              onChange={(e) => setUserForm((f) => ({ ...f, department: e.target.value }))}
            />
            <Select
              label="Role"
              value={userForm.role}
              onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value as Role }))}
              options={ROLE_OPTIONS}
            />
            <div>
              <Input
                label="Password"
                type="password"
                value={userForm.password ?? ''}
                onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-400 mt-1">Leave blank to generate a random password</p>
            </div>
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700">Email Options</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={userForm.sendSetPasswordEmail ?? false}
                  onChange={(e) => setUserForm((f) => ({ ...f, sendSetPasswordEmail: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Send email for user to set their own password</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={userForm.sendWelcomeEmail ?? false}
                  onChange={(e) => setUserForm((f) => ({ ...f, sendWelcomeEmail: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Send welcome email with username, password &amp; login URL</span>
              </label>
            </div>
            <div className="pt-2">
              <Button type="submit" loading={createUser.isPending}>Create User</Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
