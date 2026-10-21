// src/pages/admin/MembershipPlansPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../lib/axios';

// ---------- Types (badge_text removed) ----------
interface Plan {
  id?: number;
  name: string;
  description: string;
  price: number;
  yearly_price: number | null;
  duration_days: number;
  commission_rate: number;
  priority_support: boolean;
  active: boolean;
  features: string[];
  featured_included: boolean;
  featured_duration_days: number | null;
  sponsored_product_limit: number;
  analytics_access: boolean;
}

const ALLOWED_TIERS = ['silver', 'gold', 'platinum'];

const emptyPlan: Plan = {
  name: 'silver',
  description: '',
  price: 0,
  yearly_price: null,
  duration_days: 30,
  commission_rate: 2.5,
  priority_support: false,
  active: true,
  features: [],
  featured_included: false,
  featured_duration_days: null,
  sponsored_product_limit: 0,
  analytics_access: false,
};

// ---------- Component ----------
const MembershipPlansPage = () => {
  const queryClient = useQueryClient();
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Plan>(emptyPlan);
  const [newFeature, setNewFeature] = useState('');

  // Fetch plans
  const { data: plans, isLoading, error } = useQuery('adminMembershipPlans', () =>
    api.get('/admin/membership_plans').then(res => res.data)
  );

  // Create mutation
  const createMutation = useMutation(
    (data: Plan) => api.post('/admin/membership_plans', { membership_plan: data }),
    { onSuccess: () => { queryClient.invalidateQueries('adminMembershipPlans'); setShowForm(false); } }
  );

  // Update mutation
  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: Plan }) =>
      api.patch(`/admin/membership_plans/${id}`, { membership_plan: data }),
    { onSuccess: () => { queryClient.invalidateQueries('adminMembershipPlans'); setShowForm(false); setEditingPlan(null); } }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (id: number) => api.delete(`/admin/membership_plans/${id}`),
    { onSuccess: () => queryClient.invalidateQueries('adminMembershipPlans') }
  );

  const startEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setForm({ ...plan });
    setShowForm(true);
  };

  const startNew = () => {
    setEditingPlan(null);
    setForm({ ...emptyPlan });
    setShowForm(true);
  };

  const addFeature = () => {
    if (newFeature.trim() === '') return;
    setForm(prev => ({ ...prev, features: [...prev.features, newFeature.trim()] }));
    setNewFeature('');
  };

  const removeFeature = (index: number) => {
    setForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    // badge_text is no longer sent – backend will use tier name automatically
    if (editingPlan?.id) {
      updateMutation.mutate({ id: editingPlan.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  if (isLoading) return <div className="p-4 text-xs text-text-muted">Loading plans…</div>;
  if (error) return <div className="p-4 text-xs text-red-500">Failed to load plans.</div>;

  const inputClass = 'w-full h-9 px-3 text-xs border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand';
  const labelClass = 'text-[10px] font-medium text-text-primary mb-1 block';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold text-text-primary">Membership Plans</h1>
        <button onClick={startNew} className="btn-cta px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1">
          <PlusIcon className="w-3.5 h-3.5" />
          New Plan
        </button>
      </div>

      {/* Plans List */}
      <div className="card-product p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(plans || []).map((plan: Plan) => (
            <motion.div key={plan.id} layout className="border border-border-light rounded-[var(--radius-sm)] p-3 bg-surface-hover hover:border-border-medium transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xs font-bold text-text-primary capitalize">{plan.name}</h3>
                  <p className="text-[10px] text-text-muted">{plan.duration_days} days</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-medium ${plan.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-text-secondary'}`}>
                  {plan.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="text-base font-bold text-text-primary mb-0.5">
                ETB {plan.price.toLocaleString()}
              </div>
              {plan.yearly_price && (
                <div className="text-[10px] text-text-muted mb-1">
                  Yearly: ETB {plan.yearly_price.toLocaleString()}
                </div>
              )}
              <div className="text-[10px] text-text-muted mb-2">
                Commission: {plan.commission_rate}%
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {plan.featured_included && <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[9px] rounded">Featured</span>}
                {plan.sponsored_product_limit > 0 && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] rounded">{plan.sponsored_product_limit} Sponsored</span>}
                {plan.analytics_access && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[9px] rounded">Analytics</span>}
                {plan.priority_support && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[9px] rounded">Priority</span>}
              </div>
              {plan.features && plan.features.length > 0 && (
                <ul className="mb-2 space-y-0.5">
                  {plan.features.slice(0, 3).map((f, i) => (
                    <li key={i} className="text-[9px] text-text-secondary flex items-start gap-1">
                      <span className="text-green-500">✓</span> {f}
                    </li>
                  ))}
                  {plan.features.length > 3 && <li className="text-[9px] text-text-muted">+{plan.features.length - 3} more</li>}
                </ul>
              )}
              <div className="flex gap-1.5 mt-2">
                <button onClick={() => startEdit(plan)} className="flex-1 py-1.5 text-[10px] font-medium border border-border-light rounded hover:bg-white transition flex items-center justify-center gap-1">
                  <PencilIcon className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => window.confirm('Delete this plan?') && deleteMutation.mutate(plan.id!)} className="flex-1 py-1.5 text-[10px] font-medium border border-red-100 text-red-600 rounded hover:bg-red-50 transition flex items-center justify-center gap-1">
                  <TrashIcon className="w-3 h-3" /> Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 mx-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-text-primary">{editingPlan ? 'Edit Plan' : 'New Plan'}</h2>
                <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-text-primary"><XMarkIcon className="w-4 h-4" /></button>
              </div>

              <div className="space-y-3">
                {/* Plan Tier – dropdown locked to 3 options */}
                <div>
                  <label className={labelClass}>Plan Tier</label>
                  <select
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    className={inputClass}
                  >
                    {ALLOWED_TIERS.map(tier => (
                      <option key={tier} value={tier}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</option>
                    ))}
                  </select>
                  <p className="text-[9px] text-text-muted mt-0.5">Only Silver, Gold, and Platinum plans are allowed.</p>
                </div>

                <div>
                  <label className={labelClass}>Description</label>
                  <textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} className={inputClass + ' resize-none'} rows={2} placeholder="Brief description" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Price (ETB) <span className="text-[9px] text-text-muted">Monthly</span></label>
                    <input type="number" value={form.price} onChange={e => setForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Yearly Price (ETB) <span className="text-[9px] text-text-muted">Optional</span></label>
                    <input type="number" value={form.yearly_price ?? ''} onChange={e => setForm(prev => ({ ...prev, yearly_price: e.target.value ? parseFloat(e.target.value) : null }))} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Duration (days)</label>
                    <input type="number" value={form.duration_days} onChange={e => setForm(prev => ({ ...prev, duration_days: parseInt(e.target.value) || 30 }))} className={inputClass} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Commission Rate (%)</label>
                  <input type="number" step="0.1" value={form.commission_rate} onChange={e => setForm(prev => ({ ...prev, commission_rate: parseFloat(e.target.value) || 0 }))} className={inputClass} />
                </div>

                {/* Promotion & Limits */}
                <div className="border-t border-border-light pt-3">
                  <h3 className="text-xs font-semibold text-text-primary mb-2">Promotion & Limits</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-1.5 text-[10px] text-text-primary">
                      <input type="checkbox" checked={form.featured_included} onChange={e => setForm(prev => ({ ...prev, featured_included: e.target.checked }))} className="w-3 h-3 rounded" />
                      Featured Seller
                    </label>
                    {form.featured_included && (
                      <div>
                        <label className={labelClass}>Duration (days)</label>
                        <input type="number" value={form.featured_duration_days ?? ''} onChange={e => setForm(prev => ({ ...prev, featured_duration_days: e.target.value ? parseInt(e.target.value) : null }))} className={inputClass} placeholder="e.g., 30" />
                      </div>
                    )}
                    <div>
                      <label className={labelClass}>Sponsored Slots</label>
                      <input type="number" value={form.sponsored_product_limit} onChange={e => setForm(prev => ({ ...prev, sponsored_product_limit: parseInt(e.target.value) || 0 }))} className={inputClass} />
                    </div>
                    <label className="flex items-center gap-1.5 text-[10px] text-text-primary mt-1">
                      <input type="checkbox" checked={form.analytics_access} onChange={e => setForm(prev => ({ ...prev, analytics_access: e.target.checked }))} className="w-3 h-3 rounded" />
                      Advanced Analytics
                    </label>
                  </div>
                </div>

                {/* Other toggles */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1 text-[10px] text-text-primary">
                    <input type="checkbox" checked={form.priority_support} onChange={e => setForm(prev => ({ ...prev, priority_support: e.target.checked }))} className="w-3 h-3 rounded" />
                    Priority Support
                  </label>
                  <label className="flex items-center gap-1 text-[10px] text-text-primary">
                    <input type="checkbox" checked={form.active} onChange={e => setForm(prev => ({ ...prev, active: e.target.checked }))} className="w-3 h-3 rounded" />
                    Active
                  </label>
                </div>

                {/* Display-only perks */}
                <div>
                  <label className={labelClass}>Display‑Only Perks</label>
                  <div className="flex gap-2 mb-2">
                    <input type="text" value={newFeature} onChange={e => setNewFeature(e.target.value)} className={inputClass + ' flex-1'} placeholder="e.g., Free shipping" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())} />
                    <button type="button" onClick={addFeature} className="btn-cta text-xs px-2 py-1">Add</button>
                  </div>
                  {form.features.length > 0 && (
                    <ul className="space-y-1">
                      {form.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center justify-between bg-surface-hover px-2 py-1 rounded text-[10px] text-text-secondary">
                          <span>{feat}</span>
                          <button onClick={() => removeFeature(idx)} className="text-red-500 hover:text-red-700"><XMarkIcon className="w-3 h-3" /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-border-light">
                <button onClick={() => setShowForm(false)} className="btn-secondary px-3 py-1.5 text-xs font-medium">Cancel</button>
                <button onClick={handleSave} className="btn-cta px-3 py-1.5 text-xs font-semibold">{editingPlan ? 'Update' : 'Create'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MembershipPlansPage;