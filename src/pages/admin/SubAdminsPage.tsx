// src/pages/admin/SubAdminsPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../lib/axios';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const AVAILABLE_SECTIONS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'users', label: 'Users' },
  { key: 'sellers', label: 'Sellers' },
  { key: 'products', label: 'Products' },
  { key: 'packages', label: 'Packages' },
  { key: 'orders', label: 'Orders' },
  { key: 'categories', label: 'Categories' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'promo_codes', label: 'Promo Codes' },
  { key: 'logistics', label: 'Logistics' },
  { key: 'cod_collection', label: 'COD Collections' },
  { key: 'manual_dispatches', label: 'Manual Dispatches' },
  { key: 'payment_gateways', label: 'Payment Gateways' },
  { key: 'payouts', label: 'Seller Payouts' },
  { key: 'partner_payouts', label: 'Partner Payouts' },
  { key: 'financial_ledger', label: 'Financial Ledger' },
  { key: 'return_policies', label: 'Return Policies' },
  { key: 'legal_pages', label: 'Legal Pages' },
  { key: 'collections', label: 'Collections' },
  { key: 'disputes', label: 'Disputes' },
  { key: 'reports', label: 'Reports' },
  { key: 'membership_plans', label: 'Membership Plans' },
  { key: 'settings', label: 'Settings' },
];

const SubAdminsPage = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Pagination & filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    permissions: [] as string[],
  });
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Fetch sub-admins with pagination, search, status
  const { data, isLoading, isError } = useQuery(
    ['adminSubAdmins', page, search, statusFilter],
    () =>
      api
        .get('/admin/sub_admins', {
          params: {
            page,
            per_page: 20,
            search: search || undefined,
            status: statusFilter || undefined,
          },
        })
        .then(res => res.data),
    { keepPreviousData: true, staleTime: 30 * 1000 }
  );

  const subAdmins = data?.data || [];
  const meta = data?.meta || { current_page: 1, total_pages: 1, total_count: 0 };

  const createMutation = useMutation(
    (data: any) => api.post('/admin/sub_admins', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminSubAdmins');
        setShowForm(false);
        resetForm();
      },
      onError: (err: any) =>
        setMutationError(err.response?.data?.error || 'Failed to create.'),
    }
  );

  const updateMutation = useMutation(
    (data: any) => api.patch(`/admin/sub_admins/${editingUser.id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminSubAdmins');
        setShowForm(false);
        resetForm();
      },
      onError: (err: any) =>
        setMutationError(err.response?.data?.error || 'Failed to update.'),
    }
  );

  const deleteMutation = useMutation(
    (id: number) => api.delete(`/admin/sub_admins/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminSubAdmins');
        setDeleteTarget(null);
      },
      onError: (err: any) =>
        setMutationError(err.response?.data?.error || 'Failed to deactivate.'),
    }
  );

  const resetForm = () => {
    setFormData({ full_name: '', email: '', phone: '', password: '', permissions: [] });
    setEditingUser(null);
    setShowPassword(false);
  };

  const openEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      permissions: user.permissions || [],
    });
    setShowForm(true);
  };

  const togglePermission = (section: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(section)
        ? prev.permissions.filter(s => s !== section)
        : [...prev.permissions, section],
    }));
  };

  const generatePassword = () => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    password += 'Aa1!';
    for (let i = password.length; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    setFormData(prev => ({ ...prev, password }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    if (editingUser && !payload.password) {
      delete payload.password;
    }
    if (editingUser) {
      updateMutation.mutate({ sub_admin: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  if (isLoading) return <div className="p-6 text-sm text-text-muted">Loading sub-admins…</div>;
  if (isError) return <div className="p-6 text-sm text-red-500">Failed to load sub-admins.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#111]">Sub-Admins</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn-cta flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" /> Add Sub-Admin
        </button>
      </div>

      {mutationError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {mutationError}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            placeholder="Search by name, email, or phone…"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            className="w-full h-10 pl-9 pr-3 text-sm border border-border-light rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => handleStatusChange(e.target.value)}
          className="h-10 px-3 text-sm border border-border-light rounded-md bg-white"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {/* Table */}
      <div className="card-product overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-hover border-b border-border-light">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Name</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Email</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Phone</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Permissions</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Last Login</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-text-muted uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {subAdmins.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-text-muted">
                  No sub-admins found.
                </td>
              </tr>
            ) : (
              subAdmins.map((user: any) => (
                <tr key={user.id} className="hover:bg-surface-hover transition">
                  <td className="px-4 py-3 text-sm font-medium text-text-primary">{user.full_name}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{user.email || '—'}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{user.phone || '—'}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {user.permissions?.length > 0
                      ? user.permissions
                          .map(p => p.replace(/_/g, ' '))
                          .join(', ')
                      : 'No access'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(user)} className="text-brand hover:text-brand-hover">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(user)} className="text-red-500 hover:text-red-600">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">
            Page {meta.current_page} of {meta.total_pages} — {meta.total_count} total
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              className="p-2 border border-border-light rounded-md disabled:opacity-50"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <button
              disabled={page >= meta.total_pages}
              onClick={() => setPage(prev => Math.min(meta.total_pages, prev + 1))}
              className="p-2 border border-border-light rounded-md disabled:opacity-50"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {editingUser ? 'Edit Sub-Admin' : 'Create Sub-Admin'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-gray-100">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  required
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full h-10 px-3 text-sm border border-border-light rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full h-10 px-3 text-sm border border-border-light rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone (optional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full h-10 px-3 text-sm border border-border-light rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}
                </label>
                <div className="relative">
                  <input
                    required={!editingUser}
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full h-10 px-3 text-sm border border-border-light rounded-md pr-16"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="text-xs text-brand hover:underline"
                    >
                      Generate
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 8 characters with uppercase, lowercase, number, and special character.
                </p>
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium mb-2">Dashboard Access</label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_SECTIONS.map(section => (
                    <label key={section.key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(section.key)}
                        onChange={() => togglePermission(section.key)}
                        className="rounded border-gray-300 text-brand focus:ring-brand"
                      />
                      {section.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-4 py-2 text-sm">
                  Cancel
                </button>
                <button type="submit" className="btn-cta px-4 py-2 text-sm">
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h2 className="text-lg font-bold text-gray-900">Deactivate Sub-Admin?</h2>
            <p className="text-sm text-gray-600 mt-1">
              This will set the account to inactive but not permanently delete it.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary px-4 py-2 text-sm">
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubAdminsPage;