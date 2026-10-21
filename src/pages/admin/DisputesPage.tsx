// src/pages/admin/DisputesPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../lib/axios';
import { motion } from 'framer-motion';
import {
  XMarkIcon,
  EyeIcon,
  CubeIcon,
  ArrowUturnLeftIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const statusOptions = ['all', 'pending', 'approved', 'received', 'completed', 'rejected'];

const DisputesPage = () => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [liability, setLiability] = useState('');
  const [returnShippingCost, setReturnShippingCost] = useState('');
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { data: requests, isLoading, error } = useQuery(
    'adminDisputes',
    () => api.get('/admin/return_requests').then(res => res.data),
    { staleTime: 30 * 1000 }
  );

  // Approve mutation
  const approveMutation = useMutation(
    (payload: any) => api.post(`/admin/return_requests/${payload.id}/approve`, payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminDisputes');
        setShowApproveModal(false);
        setSelectedDispute(null);
        resetFormFields();
        setMutationError(null);
      },
      onError: (err: any) => {
        setMutationError(err.response?.data?.error || 'Failed to approve dispute.');
      },
    }
  );

  // Reject mutation
  const rejectMutation = useMutation(
    (payload: any) => api.post(`/admin/return_requests/${payload.id}/reject`, payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminDisputes');
        setShowRejectModal(false);
        setSelectedDispute(null);
        resetFormFields();
        setMutationError(null);
      },
      onError: (err: any) => {
        setMutationError(err.response?.data?.error || 'Failed to reject dispute.');
      },
    }
  );

  // Mark received mutation
  const markReceivedMutation = useMutation(
    (id: number) => api.post(`/admin/return_requests/${id}/mark_received`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminDisputes');
        setMutationError(null);
      },
      onError: (err: any) => {
        setMutationError(err.response?.data?.error || 'Failed to mark as received.');
      },
    }
  );

  // Complete mutation
  const completeMutation = useMutation(
    (id: number) => api.post(`/admin/return_requests/${id}/complete`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminDisputes');
        setMutationError(null);
      },
      onError: (err: any) => {
        setMutationError(err.response?.data?.error || 'Failed to complete return.');
      },
    }
  );

  const resetFormFields = () => {
    setAdminNotes('');
    setLiability('');
    setReturnShippingCost('');
    setMutationError(null);
  };

  const filteredDisputes = Array.isArray(requests)
    ? requests.filter((r: any) => (filterStatus === 'all' ? true : r.status === filterStatus))
    : [];

  if (isLoading) return <div className="text-center py-10 text-text-muted text-sm">Loading disputes…</div>;
  if (error) return <div className="text-center py-10 text-red-500 text-sm">Failed to load disputes.</div>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-product-title font-semibold text-text-primary">Disputes</h1>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="w-full sm:w-48 h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
        >
          {statusOptions.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Mutation error banner */}
      {mutationError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center justify-between">
          <span>{mutationError}</span>
          <button onClick={() => setMutationError(null)} className="text-red-500 hover:text-red-700">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="card-product overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-hover border-b border-border-light">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase">Order #</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase">Buyer</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase">Status</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase">Reason</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-text-muted uppercase">View</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-text-muted uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {filteredDisputes.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-sm text-text-muted">No disputes found.</td></tr>
            ) : (
              filteredDisputes.map((req: any) => (
                <tr key={req.id} className="hover:bg-surface-hover transition">
                  <td className="py-3 px-4 text-sm font-medium text-text-primary">#{req.order_id}</td>
                  <td className="py-3 px-4 text-sm text-text-secondary">{req.user?.full_name || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      req.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                      req.status === 'received' ? 'bg-purple-100 text-purple-700' :
                      req.status === 'completed' ? 'bg-green-100 text-green-700' :
                      req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-text-secondary'
                    }`}>{req.status}</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-text-secondary">{req.reason || '—'}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => { setSelectedDispute(req); setShowDetailModal(true); }}
                      className="text-brand hover:text-brand-hover text-xs font-medium inline-flex items-center gap-1"
                    >
                      <EyeIcon className="w-4 h-4" /> View
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    {req.status === 'pending' && (
                      <>
                        <button
                          onClick={() => { setSelectedDispute(req); setShowApproveModal(true); }}
                          disabled={approveMutation.isLoading}
                          className="text-green-600 hover:underline text-xs font-medium disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => { setSelectedDispute(req); setShowRejectModal(true); }}
                          disabled={rejectMutation.isLoading}
                          className="text-red-600 hover:underline text-xs font-medium disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {req.status === 'approved' && (
                      <>
                        <button
                          onClick={() => markReceivedMutation.mutate(req.id)}
                          disabled={markReceivedMutation.isLoading}
                          className="text-blue-600 hover:underline text-xs font-medium disabled:opacity-50"
                        >
                          Mark Received
                        </button>
                        <button
                          onClick={() => {
                            if (!confirm('Complete this return? The refund will be processed and the seller will be charged if liable.')) return;
                            completeMutation.mutate(req.id);
                          }}
                          disabled={completeMutation.isLoading}
                          className="text-green-600 hover:underline text-xs font-medium disabled:opacity-50"
                        >
                          Complete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ===== Detail Modal ===== */}
      {showDetailModal && selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowDetailModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[var(--radius-md)] p-5 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-elevated" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-text-primary">Dispute Details - Order #{selectedDispute.order_id}</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-1 rounded-[var(--radius-sm)] hover:bg-surface-hover"><XMarkIcon className="w-5 h-5 text-text-muted" /></button>
            </div>

            {/* Buyer Info */}
            <div className="mb-4 bg-blue-50 p-3 rounded-md border border-blue-100">
              <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2"><UserIcon className="w-4 h-4" /> Buyer</h4>
              <p className="text-sm text-blue-800">{selectedDispute.user?.full_name}</p>
              <div className="flex items-center gap-4 mt-1 text-xs text-blue-700">
                {selectedDispute.user?.phone && <span><PhoneIcon className="w-3 h-3 inline mr-1" />{selectedDispute.user.phone}</span>}
                {selectedDispute.user?.email && <span><EnvelopeIcon className="w-3 h-3 inline mr-1" />{selectedDispute.user.email}</span>}
              </div>
            </div>

            {/* Seller Info */}
            {selectedDispute.order?.vendor && (
              <div className="mb-4 bg-purple-50 p-3 rounded-md border border-purple-100">
                <h4 className="text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2"><BuildingStorefrontIcon className="w-4 h-4" /> Seller</h4>
                <p className="text-sm text-purple-800 font-medium">{selectedDispute.order.vendor.name}</p>
                <div className="flex items-center gap-4 mt-1 text-xs text-purple-700">
                  {selectedDispute.order.vendor.phone && <span><PhoneIcon className="w-3 h-3 inline mr-1" />{selectedDispute.order.vendor.phone}</span>}
                  {selectedDispute.order.vendor.address && <span><MapPinIcon className="w-3 h-3 inline mr-1" />{selectedDispute.order.vendor.address}</span>}
                </div>
              </div>
            )}

            {/* Order Items with images */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2"><CubeIcon className="w-4 h-4 text-brand" /> Order Items</h4>
              <div className="space-y-2">
                {selectedDispute.order?.items?.map((item: any) => (
                  <div key={item.product_id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-12 h-12 rounded object-cover border border-border-light" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-surface-hover flex items-center justify-center">
                        <CubeIcon className="w-5 h-5 text-text-muted" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-text-muted">Qty: {item.quantity} × ETB {item.price.toLocaleString()}</p>
                    </div>
                    <p className="text-sm font-semibold">ETB {(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Return Policy frozen on the order */}
            {selectedDispute.order?.return_window_days != null && (
              <div className="mb-4 bg-blue-50 p-3 rounded-md border border-blue-100">
                <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2"><ArrowUturnLeftIcon className="w-4 h-4" /> Return Policy</h4>
                <p className="text-sm text-blue-800">Window: {selectedDispute.order.return_window_days} days after delivery</p>
                {selectedDispute.order.restocking_fee_percent > 0 && (
                  <p className="text-sm text-blue-800">Restocking Fee: {selectedDispute.order.restocking_fee_percent}%</p>
                )}
                <p className="text-sm text-blue-800">Return Shipping Paid By: {selectedDispute.order.return_shipping_responsibility || 'buyer'}</p>
              </div>
            )}

            {/* Reason & Details */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2"><DocumentTextIcon className="w-4 h-4 text-brand" /> Reason</h4>
              <p className="text-sm font-medium capitalize mb-1">{selectedDispute.reason?.replace(/_/g, ' ')}</p>
              {selectedDispute.details && <p className="text-sm text-text-secondary">{selectedDispute.details}</p>}
            </div>

            {/* Admin Notes if any */}
            {selectedDispute.admin_notes && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-text-primary mb-2">Admin Notes</h4>
                <p className="text-sm text-text-secondary">{selectedDispute.admin_notes}</p>
              </div>
            )}

            <div className="text-right">
              <button onClick={() => setShowDetailModal(false)} className="btn-secondary px-4 py-2 text-sm">Close</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ===== Approve Modal ===== */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[var(--radius-md)] p-5 w-full max-w-md shadow-elevated">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-text-primary">Approve Dispute</h3>
              <button onClick={() => setShowApproveModal(false)} className="p-1 rounded-[var(--radius-sm)] hover:bg-surface-hover"><XMarkIcon className="w-5 h-5 text-text-muted" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Liability</label>
                <select value={liability} onChange={e => setLiability(e.target.value)} className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary">
                  <option value="">-- Select --</option>
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="platform">Platform</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Return Shipping Cost (ETB)</label>
                <input type="number" value={returnShippingCost} onChange={e => setReturnShippingCost(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Admin Notes</label>
                <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand resize-none" rows={3} placeholder="Instructions for resolution..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowApproveModal(false)} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
              <button
                onClick={() => approveMutation.mutate({
                  id: selectedDispute.id,
                  admin_notes: adminNotes,
                  liability: liability,
                  return_shipping_cost: returnShippingCost,
                })}
                disabled={approveMutation.isLoading}
                className="btn-cta px-4 py-2 text-sm disabled:opacity-50"
              >
                {approveMutation.isLoading ? 'Approving…' : 'Approve'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ===== Reject Modal ===== */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[var(--radius-md)] p-5 w-full max-w-md shadow-elevated">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-text-primary">Reject Dispute</h3>
              <button onClick={() => setShowRejectModal(false)} className="p-1 rounded-[var(--radius-sm)] hover:bg-surface-hover"><XMarkIcon className="w-5 h-5 text-text-muted" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Admin Notes (reason for rejection)</label>
                <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand resize-none" rows={3} placeholder="Explain why the dispute is rejected..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowRejectModal(false)} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
              <button
                onClick={() => rejectMutation.mutate({
                  id: selectedDispute.id,
                  admin_notes: adminNotes,
                })}
                disabled={rejectMutation.isLoading}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition disabled:opacity-50"
              >
                {rejectMutation.isLoading ? 'Rejecting…' : 'Reject'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DisputesPage;