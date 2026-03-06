'use client';

import { use, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { User, Role } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const ROLE_OPTIONS = [
  { value: 'VIEWER', label: 'Viewer' },
  { value: 'SALES_MANAGER', label: 'Sales Manager' },
  { value: 'PROCUREMENT_OFFICER', label: 'Procurement Officer' },
  { value: 'ADMIN', label: 'Admin' },
];

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  SALES_MANAGER: 'Sales Manager',
  PROCUREMENT_OFFICER: 'Procurement',
  VIEWER: 'Viewer',
};

interface EditForm {
  name: string;
  email: string;
  phone: string;
  title: string;
  department: string;
  role: Role;
  isActive: boolean;
  password: string;
}

function buildFormFromUser(user: User): EditForm {
  return {
    name: user.name ?? '',
    email: user.email ?? '',
    phone: user.phone ?? '',
    title: user.title ?? '',
    department: user.department ?? '',
    role: user.role,
    isActive: user.isActive ?? true,
    password: '',
  };
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['user', id],
    queryFn: () => axiosInstance.get(`/users/${id}`).then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      axiosInstance.patch(`/users/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditing(false);
      setForm(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => axiosInstance.delete(`/users/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      router.push('/users');
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <div className="text-red-600">User not found.</div>;

  const handleEdit = () => {
    setForm(buildFormFromUser(user));
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setForm(null);
    updateMutation.reset();
  };

  const handleSave = () => {
    if (!form) return;
    const payload: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      title: form.title || undefined,
      department: form.department || undefined,
      role: form.role,
      isActive: form.isActive,
    };
    const trimmedPassword = form.password.trim();
    if (trimmedPassword) {
      payload.password = trimmedPassword;
    }
    updateMutation.mutate(payload);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete user "${user.name}"? This cannot be undone.`)) {
      deleteMutation.mutate();
    }
  };

  const updateField = <K extends keyof EditForm>(key: K, value: EditForm[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/users" className="text-gray-400 hover:text-gray-600 text-sm">← Users</Link>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
          <Badge label={user.isActive ? 'Active' : 'Inactive'} variant={user.isActive ? 'success' : 'neutral'} />
          <Badge
            label={ROLE_LABELS[user.role] ?? user.role}
            variant={user.role === 'ADMIN' ? 'warning' : user.role === 'VIEWER' ? 'neutral' : 'info'}
          />
        </div>
        {!editing && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleEdit}>Edit</Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDelete}
              loading={deleteMutation.isPending}
              className="!text-red-600 !border-red-200 hover:!bg-red-50"
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Read-only view */}
      {!editing && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <dl className="grid grid-cols-2 gap-5">
            {[
              { label: 'Name', value: user.name },
              { label: 'Email', value: user.email },
              { label: 'Phone', value: user.phone ?? '—' },
              { label: 'Job Title', value: user.title ?? '—' },
              { label: 'Department', value: user.department ?? '—' },
              { label: 'Role', value: ROLE_LABELS[user.role] ?? user.role },
              { label: 'Status', value: user.isActive ? 'Active' : 'Inactive' },
              { label: 'Created', value: new Date(user.createdAt).toLocaleDateString() },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs text-gray-500">{label}</dt>
                <dd className="text-sm font-medium text-gray-900 mt-0.5">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Edit form */}
      {editing && form && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <Input label="Name" value={form.name} onChange={(e) => updateField('name', e.target.value)} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} />
            <Input label="Phone" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} />
            <Input label="Job Title" value={form.title} onChange={(e) => updateField('title', e.target.value)} />
            <Input label="Department" value={form.department} onChange={(e) => updateField('department', e.target.value)} />
            <Select
              label="Role"
              value={form.role}
              options={ROLE_OPTIONS}
              onChange={(e) => updateField('role', e.target.value as Role)}
            />
            <Select
              label="Status"
              value={form.isActive ? 'true' : 'false'}
              options={[
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ]}
              onChange={(e) => updateField('isActive', e.target.value === 'true')}
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              placeholder="Leave blank to keep current"
              onChange={(e) => updateField('password', e.target.value)}
            />
          </div>

          {updateMutation.isError && (
            <p className="text-sm text-red-600">
              {(updateMutation.error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
                ? (() => {
                    const msg = (updateMutation.error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
                    return Array.isArray(msg) ? msg.join(', ') : msg;
                  })()
                : (updateMutation.error as Error)?.message ?? 'Failed to update user.'}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} loading={updateMutation.isPending}>Save</Button>
            <Button variant="secondary" onClick={handleCancel} disabled={updateMutation.isPending}>Cancel</Button>
          </div>
        </div>
      )}

      {deleteMutation.isError && (
        <p className="text-sm text-red-600">
          {(deleteMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message
            ?? 'Failed to delete user.'}
        </p>
      )}
    </div>
  );
}
