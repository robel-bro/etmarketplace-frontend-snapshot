// src/pages/admin/PaymentGatewaysPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../lib/axios';

const inputClass =
  'w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand';
const textareaClass =
  'w-full px-3 py-2 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand';

const PaymentGatewaysPage = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    provider: '',
    api_key: '',
    merchant_id: '',
    webhook_secret: '',
    api_endpoint: '',
    active: true,
    supports_refunds: false,
    // Telebirr‑specific fields
    fabric_app_id: '',
    fabric_app_secret: '',
    merchant_app_id: '',
    private_key: '',
    public_key: '',
    redirect_url: '',
    web_base_url: '',
  });

  const { data: gateways, isLoading, error } = useQuery(
    'adminPaymentGateways',
    () => api.get('/admin/payment-gateways').then(res => res.data),
    { staleTime: 30 * 1000 }
  );

  const saveMutation = useMutation(
    (payload: any) =>
      editId
        ? api.patch(`/admin/payment-gateways/${editId}`, { payment_gateway: payload })
        : api.post('/admin/payment-gateways', { payment_gateway: payload }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminPaymentGateways');
        setShowForm(false);
        setEditId(null);
        resetForm();
      },
    }
  );

  const deleteMutation = useMutation(
    (id: number) => api.delete(`/admin/payment-gateways/${id}`),
    { onSuccess: () => queryClient.invalidateQueries('adminPaymentGateways') }
  );

  const resetForm = () => {
    setForm({
      name: '',
      provider: '',
      api_key: '',
      merchant_id: '',
      webhook_secret: '',
      api_endpoint: '',
      active: true,
      supports_refunds: false,
      fabric_app_id: '',
      fabric_app_secret: '',
      merchant_app_id: '',
      private_key: '',
      public_key: '',
      redirect_url: '',
      web_base_url: '',
    });
  };

  const handleEdit = (g: any) => {
    setEditId(g.id);
    // Merge existing credentials_json values into the form state
    const creds = g.credentials_json || {};
    setForm({
      name: g.name || '',
      provider: g.provider || '',
      api_key: g.api_key || '',
      merchant_id: g.merchant_id || '',
      webhook_secret: g.webhook_secret || '',
      api_endpoint: g.api_endpoint || '',
      active: g.active,
      supports_refunds: g.supports_refunds,
      fabric_app_id: creds.fabric_app_id || '',
      fabric_app_secret: creds.fabric_app_secret || '',
      merchant_app_id: creds.merchant_app_id || '',
      private_key: creds.private_key || '',
      public_key: creds.public_key || '',
      redirect_url: g.config?.redirect_url || '',
      web_base_url: g.config?.web_base_url || '',
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Build the payload – separate Telebirr fields into config / credentials_json
    const payload: any = {
      name: form.name,
      provider: form.provider,
      api_key: form.api_key,
      merchant_id: form.merchant_id,
      webhook_secret: form.webhook_secret,
      api_endpoint: form.api_endpoint,
      active: form.active,
      supports_refunds: form.supports_refunds,
      config: {
        redirect_url: form.redirect_url,
        web_base_url: form.web_base_url,
      },
    };

    // If provider is Telebirr, include the extra fields as top‑level (the controller will permit them)
    if (form.provider === 'telebirr') {
      payload.fabric_app_id = form.fabric_app_id;
      payload.fabric_app_secret = form.fabric_app_secret;
      payload.merchant_app_id = form.merchant_app_id;
      payload.private_key = form.private_key;
      payload.public_key = form.public_key;
    }

    saveMutation.mutate(payload);
  };

  if (isLoading) return <div className="text-center py-10 text-text-muted text-sm">Loading…</div>;
  if (error) return <div className="text-center py-10 text-red-500 text-sm">Failed to load.</div>;

  const isTelebirr = form.provider === 'telebirr';

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-product-title font-semibold text-text-primary">Payment Gateways</h1>
        <button
          onClick={() => { setEditId(null); setShowForm(true); }}
          className="btn-cta flex items-center gap-2 px-4 py-2 text-sm"
        >
          <PlusIcon className="w-4 h-4" /> Add Gateway
        </button>
      </div>

      <div className="card-product overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-hover border-b border-border-light">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Name</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Provider</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Status</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-text-muted uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {gateways?.length === 0 ? (
              <tr><td colSpan={4} className="py-8 text-center text-sm text-text-muted">No gateways configured.</td></tr>
            ) : (
              gateways?.map((g: any) => (
                <tr key={g.id} className="hover:bg-surface-hover transition">
                  <td className="px-4 py-3 text-sm font-medium text-text-primary">{g.name}</td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{g.provider}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${g.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-text-secondary'}`}>
                      {g.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => handleEdit(g)} className="text-brand hover:text-brand-hover"><PencilIcon className="w-4 h-4" /></button>
                    <button onClick={() => deleteMutation.mutate(g.id)} className="text-red-500 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[var(--radius-md)] p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-elevated">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-text-primary">{editId ? 'Edit Gateway' : 'Add Gateway'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-[var(--radius-sm)] hover:bg-surface-hover"><XMarkIcon className="w-5 h-5 text-text-muted" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Display Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Provider Key (e.g., telebirr, chapa)</label>
                <input type="text" value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} className={inputClass} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">API Key</label>
                <input type="text" value={form.api_key} onChange={e => setForm({ ...form, api_key: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Merchant ID (Short Code)</label>
                <input type="text" value={form.merchant_id} onChange={e => setForm({ ...form, merchant_id: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">API Endpoint URL</label>
                <input type="text" value={form.api_endpoint} onChange={e => setForm({ ...form, api_endpoint: e.target.value })} className={inputClass} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Webhook URL / Secret</label>
                <input type="text" value={form.webhook_secret} onChange={e => setForm({ ...form, webhook_secret: e.target.value })} className={inputClass} />
              </div>

              {/* ─── Telebirr‑specific fields (shown only when provider = telebirr) ─── */}
              {isTelebirr && (
                <>
                  <div className="border-t border-border-light pt-3 mt-3">
                    <h4 className="text-sm font-semibold text-text-primary mb-2">Telebirr Credentials</h4>
                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1">Fabric App ID (X‑APP‑Key)</label>
                      <input type="text" value={form.fabric_app_id} onChange={e => setForm({ ...form, fabric_app_id: e.target.value })} className={inputClass} />
                    </div>
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-text-primary mb-1">App Secret</label>
                      <input type="text" value={form.fabric_app_secret} onChange={e => setForm({ ...form, fabric_app_secret: e.target.value })} className={inputClass} />
                    </div>
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-text-primary mb-1">Merchant App ID (appid)</label>
                      <input type="text" value={form.merchant_app_id} onChange={e => setForm({ ...form, merchant_app_id: e.target.value })} className={inputClass} />
                    </div>
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-text-primary mb-1">Private Key (PEM)</label>
                      <textarea rows={4} value={form.private_key} onChange={e => setForm({ ...form, private_key: e.target.value })} className={textareaClass} />
                    </div>
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-text-primary mb-1">Public Key (PEM)</label>
                      <textarea rows={4} value={form.public_key} onChange={e => setForm({ ...form, public_key: e.target.value })} className={textareaClass} />
                    </div>
                  </div>
                  <div className="border-t border-border-light pt-3 mt-3">
                    <h4 className="text-sm font-semibold text-text-primary mb-2">URLs</h4>
                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1">Redirect URL (after payment)</label>
                      <input type="text" value={form.redirect_url} onChange={e => setForm({ ...form, redirect_url: e.target.value })} className={inputClass} />
                    </div>
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-text-primary mb-1">Web Base URL (checkout page)</label>
                      <input type="text" value={form.web_base_url} onChange={e => setForm({ ...form, web_base_url: e.target.value })} className={inputClass} />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center gap-2 mt-3">
                <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="rounded border-border-light text-brand focus:ring-brand" />
                <label className="text-sm text-text-secondary">Active</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.supports_refunds} onChange={e => setForm({ ...form, supports_refunds: e.target.checked })} className="rounded border-border-light text-brand focus:ring-brand" />
                <label className="text-sm text-text-secondary">Supports Refunds</label>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="btn-cta px-4 py-2 text-sm">Save</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PaymentGatewaysPage;