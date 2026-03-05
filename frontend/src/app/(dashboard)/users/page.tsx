'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { User, Role } from '@/types';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  SALES_MANAGER: 'Sales Manager',
  PROCUREMENT_OFFICER: 'Procurement',
  VIEWER: 'Viewer',
};

export default function UsersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () =>
      axiosInstance.get('/users').then((r) => (Array.isArray(r.data) ? r.data : r.data.data ?? [])),
  });

  const users: User[] = (data ?? []).filter(
    (u: User) => {
      const matchesSearch =
        !search ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.department ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesRole = !roleFilter || u.role === roleFilter;
      return matchesSearch && matchesRole;
    },
  );

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (u) => (
        <div>
          <span className="font-medium text-gray-900">{u.name}</span>
          {u.title && <p className="text-xs text-gray-400">{u.title}</p>}
        </div>
      ),
    },
    { key: 'email', header: 'Email', render: (u) => u.email },
    {
      key: 'role',
      header: 'Role',
      render: (u) => (
        <Badge
          label={ROLE_LABELS[u.role] ?? u.role}
          variant={u.role === 'ADMIN' ? 'warning' : u.role === 'VIEWER' ? 'neutral' : 'info'}
        />
      ),
    },
    { key: 'department', header: 'Department', render: (u) => u.department ?? '—' },
    {
      key: 'isActive',
      header: 'Status',
      render: (u) => (
        <Badge label={u.isActive ? 'Active' : 'Inactive'} variant={u.isActive ? 'success' : 'neutral'} />
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (u) => new Date(u.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <Link
          href="/users/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition"
          style={{ backgroundColor: 'var(--primary-color)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="SALES_MANAGER">Sales Manager</option>
          <option value="PROCUREMENT_OFFICER">Procurement Officer</option>
          <option value="VIEWER">Viewer</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <Table
          columns={columns}
          data={users}
          rowKey={(u) => u.id}
          onRowClick={(u) => router.push(`/users/${u.id}`)}
          emptyMessage="No users found."
        />
      )}
    </div>
  );
}
