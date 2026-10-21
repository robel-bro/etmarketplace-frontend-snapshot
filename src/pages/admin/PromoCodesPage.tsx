import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../lib/axios';

const discountTypeLabel = (type: string) => {
  switch (type) {
    case 'percentage': return '% Off';
    case 'fixed': return 'ETB Off';
    case 'free_shipping': return 'Free Shipping';
    default: return type;
  }
};

const PromoCodesPage = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '',
    start_date: '',
    end_date: '',
    usage_limit: '',
    per_user_limit: '',
    active: true,
  });

  // Fetch coupons
  const { data: coupons = [], isLoading, isError } = useQuery(
    'adminCoupons',
    () => api.get('/admin/coupons').then(res => res.data)
  );

  // Save mutation
  const saveMutation = useMutation(
    (data: any) => {
      const payload = {
        coupon: {
          ...data,
          discount_value: parseFloat(data.discount_value) || 0,
          min_order_amount: parseFloat(data.min_order_amount) || 0,
          usage_limit: parseInt(data.usage_limit, 10) || null,
          per_user_limit: parseInt(data.per_user_limit, 10) || null,
        },
      };
      if (editing) {
        return api.put(`/admin/coupons/${editing.id}`, payload);
      } else {
        return api.post('/admin/coupons', payload);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminCoupons');
        closeModal();
      },
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (id: number) => api.delete(`/admin/coupons/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminCoupons');
        setDeleteTarget(null);
      },
    }
  );

  // Toggle active
  const toggleMutation = useMutation(
    (coupon: any) =>
      api.put(`/admin/coupons/${coupon.id}`, { coupon: { active: !coupon.active } }),
    { onSuccess: () => queryClient.invalidateQueries('adminCoupons') }
  );

  const openAddModal = () => {
    setEditing(null);
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_amount: '',
      start_date: '',
      end_date: '',
      usage_limit: '',
      per_user_limit: '',
      active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (coupon: any) => {
    setEditing(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value?.toString() || '',
      min_order_amount: coupon.min_order_amount?.toString() || '',
      start_date: coupon.start_date || '',
      end_date: coupon.end_date || '',
      usage_limit: coupon.usage_limit?.toString() || '',
      per_user_limit: coupon.per_user_limit?.toString() || '',
      active: coupon.active,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.code.trim()) return;
    saveMutation.mutate(formData);
  };

  const handleDelete = (id: number) => deleteMutation.mutate(id);
  const toggleActive = (coupon: any) => toggleMutation.mutate(coupon);
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  if (isLoading) return <div className="text-sm text-text-muted py-10 text-center">Loading promo codes…</div>;
  if (isError) return <div className="text-sm text-red-500 py-10 text-center">Failed to load promo codes.</div>;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-product-title font-semibold text-text-primary">Promo Codes</h1>
        <button onClick={openAddModal} className="btn-cta px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5">
          <PlusIcon className="w-3.5 h-3.5" />
          New Promo Code
        </button>
      </div>

      {/* Table */}
      <div className="card-product overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-hover border-b border-border-light">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Code</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Type</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Value</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Usage</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Valid</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Status</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-text-muted uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {coupons.map((c: any) => (
              <tr key={c.id} className="hover:bg-surface-hover transition">
                <td className="px-4 py-3 text-sm font-medium text-text-primary">{c.code}</td>
                <td className="px-4 py-3 text-xs text-text-secondary">{discountTypeLabel(c.discount_type)}</td>
                <td className="px-4 py-3 text-xs text-text-secondary">
                  {c.discount_type === 'percentage' ? `${c.discount_value}%` : c.discount_type === 'fixed' ? `ETB ${c.discount_value}` : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-text-secondary">{c.used_count ?? 0} / {c.usage_limit || '∞'}</td>
                <td className="px-4 py-3 text-xs text-text-muted">{c.start_date} – {c.end_date}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(c)} className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-text-secondary'}`}>
                    {c.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => openEditModal(c)} className="text-brand hover:text-brand-hover"><PencilIcon className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteTarget(c)} className="text-red-500 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-[var(--radius-md)] shadow-elevated max-w-lg w-full p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-semibold text-text-primary">{editing ? 'Edit' : 'New'} Promo Code</h2>
                <button onClick={closeModal} className="p-1 hover:bg-surface-hover rounded-[var(--radius-sm)]"><XMarkIcon className="w-5 h-5 text-text-muted" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Code</label>
                  <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">Type</label>
                    <select value={formData.discount_type} onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })} className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand">
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                      <option value="free_shipping">Free Shipping</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">Value</label>
                    <input type="number" value={formData.discount_value} onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })} className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">Min Order (ETB)</label>
                    <input type="number" value={formData.min_order_amount} onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })} className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">Usage Limit</label>
                    <input type="number" value={formData.usage_limit} onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })} className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">Start Date</label>
                    <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">End Date</label>
                    <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} className="h-3.5 w-3.5 rounded border-border-light text-brand focus:ring-brand" />
                  <label className="text-xs text-text-primary">Active</label>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button onClick={closeModal} className="btn-secondary px-4 py-2 text-xs">Cancel</button>
                <button onClick={handleSave} className="btn-cta px-4 py-2 text-xs font-semibold">Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="card-product p-5 max-w-md w-full">
              <h2 className="text-base font-semibold text-text-primary mb-2">Delete Promo Code</h2>
              <p className="text-sm text-text-secondary mb-5">Are you sure you want to delete "{deleteTarget.code}"?</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteTarget(null)} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
                <button onClick={() => handleDelete(deleteTarget.id)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PromoCodesPage;