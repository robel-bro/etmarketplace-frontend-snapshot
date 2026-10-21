// src/pages/admin/UsersPage.tsx
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import api from '../../lib/axios';

const roleLabel = (roles: string[]) => {
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('seller')) return 'seller';
  return 'buyer';
};

const statusOptions = ['active', 'inactive', 'banned'];

const UsersPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    role_mask: 1,
    status: 'active',
  });
  const [mutationError, setMutationError] = useState<string | null>(null);

  const {
    data: users = [],
    isLoading,
    isError,
    refetch,
  } = useQuery('adminUsers', () => api.get('/admin/users').then((r) => r.data), {
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Only count active users
  const roleCounts = useMemo(() => {
    const activeUsers = users.filter((u: any) => u.status === 'active');
    const counts: Record<string, number> = { all: activeUsers.length, buyer: 0, seller: 0, admin: 0 };
    activeUsers.forEach((u: any) => {
      const role = roleLabel(u.roles || []);
      if (counts[role] !== undefined) counts[role] += 1;
    });
    return counts;
  }, [users]);

  const filtered = useMemo(() => {
    return users.filter((u: any) => {
      const matchesSearch =
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.phone?.includes(search);
      const matchesRole =
        filterRole === 'all' || roleLabel(u.roles || []) === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [users, search, filterRole]);

  const updateMutation = useMutation(
    (data: any) => api.patch(`/admin/users/${editingUser?.id}`, { user: data }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminUsers');
        setModalOpen(false);
        setMutationError(null);
      },
      onError: (err: any) => {
        setMutationError(err.response?.data?.error || 'Failed to update user.');
      },
    }
  );

  const deleteMutation = useMutation(
    (id: number) => api.delete(`/admin/users/${id}`),
    {
      onMutate: (id) => {
        queryClient.setQueryData<any[]>('adminUsers', (old) =>
          (old || []).filter((u) => u.id !== id)
        );
      },
      onSettled: () => {
        queryClient.invalidateQueries('adminUsers');
      },
      onError: (err: any) => {
        setMutationError(err.response?.data?.error || 'Failed to delete user.');
      },
    }
  );

  const statusMutation = useMutation(
    ({ id, status }: { id: number; status: string }) =>
      api.patch(`/admin/users/${id}`, { user: { status } }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminUsers');
        setMutationError(null);
      },
      onError: (err: any) => {
        setMutationError(err.response?.data?.error || 'Failed to update status.');
      },
    }
  );

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || '',
      phone: user.phone || '',
      role_mask: user.role_mask || 1,
      status: user.status || 'active',
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleStatusChange = (userId: number, newStatus: string) => {
    statusMutation.mutate({ id: userId, status: newStatus });
  };

  const tabClass = (role: string) =>
    `px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] transition border ${
      filterRole === role
        ? 'bg-brand text-white border-brand shadow-card'
        : 'bg-white text-text-secondary border-border-light hover:border-border-medium'
    }`;

  if (isLoading) return <div className="text-sm text-text-muted py-10 text-center">Loading users…</div>;
  if (isError) return <div className="text-sm text-red-500 py-10 text-center">Failed to load users.</div>;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-product-title font-semibold text-text-primary flex items-center gap-2">
          Users
          <button onClick={() => refetch()} className="p-1 hover:bg-surface-hover rounded">
            <ArrowPathIcon className="w-4 h-4 text-text-muted" />
          </button>
        </h1>
      </div>

      {mutationError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center justify-between">
          <span>{mutationError}</span>
          <button onClick={() => setMutationError(null)} className="text-red-500 hover:text-red-700">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
        <div className="relative flex-1 w-full">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setFilterRole('all')} className={tabClass('all')}>
            All ({roleCounts.all})
          </button>
          <button onClick={() => setFilterRole('buyer')} className={tabClass('buyer')}>
            Buyers ({roleCounts.buyer})
          </button>
          <button onClick={() => setFilterRole('seller')} className={tabClass('seller')}>
            Sellers ({roleCounts.seller})
          </button>
          <button onClick={() => setFilterRole('admin')} className={tabClass('admin')}>
            Admins ({roleCounts.admin})
          </button>
        </div>
      </div>

      <div className="card-product overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-hover border-b border-border-light">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Name</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Phone</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Role</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Joined</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Status</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-text-muted uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-text-muted">
                  No users found.
                </td>
              </tr>
            )}
            {filtered.map((user: any) => (
              <tr key={user.id} className="hover:bg-surface-hover transition">
                <td className="px-4 py-3 text-sm font-medium text-text-primary">{user.full_name}</td>
                <td className="px-4 py-3 text-sm text-text-secondary">{user.phone}</td>
                <td className="px-4 py-3 text-sm text-text-secondary capitalize">
                  {roleLabel(user.roles || [])}
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-4 py-3">
                  {/* Status dropdown */}
                  <select
                    value={user.status || 'active'}
                    onChange={(e) => handleStatusChange(user.id, e.target.value)}
                    className={`h-8 px-2 text-xs border rounded-[var(--radius-sm)] bg-white focus:outline-none focus:ring-1 focus:ring-brand ${
                      user.status === 'active'
                        ? 'text-green-700 border-green-200'
                        : user.status === 'banned'
                        ? 'text-red-700 border-red-200'
                        : 'text-gray-700 border-gray-200'
                    }`}
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    onClick={() => openEditModal(user)}
                    className="text-brand hover:text-brand-hover"
                    title="Edit"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(user)}
                    className="text-red-500 hover:text-red-600"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-[var(--radius-md)] shadow-elevated max-w-md w-full p-5"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-semibold text-text-primary">Edit User</h2>
                <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-surface-hover rounded-[var(--radius-sm)]">
                  <XMarkIcon className="w-5 h-5 text-text-muted" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Role</label>
                  <select
                    value={formData.role_mask}
                    onChange={(e) => setFormData({ ...formData, role_mask: Number(e.target.value) })}
                    className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                  >
                    <option value={1}>Buyer</option>
                    <option value={2}>Seller</option>
                    <option value={4}>Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button onClick={() => setModalOpen(false)} className="btn-secondary px-4 py-2 text-sm">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={updateMutation.isLoading} className="btn-cta px-4 py-2 text-sm font-semibold disabled:opacity-50">
                  {updateMutation.isLoading ? 'Saving…' : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-[var(--radius-md)] shadow-elevated max-w-md w-full p-5"
            >
              <h2 className="text-base font-semibold text-text-primary mb-2">Confirm Delete</h2>
              <p className="text-sm text-text-secondary mb-5">
                Are you sure you want to delete {deleteTarget.full_name}?
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteTarget(null)} className="btn-secondary px-4 py-2 text-sm">
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteTarget.id)}
                  disabled={deleteMutation.isLoading}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition disabled:opacity-50"
                >
                  {deleteMutation.isLoading ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UsersPage;