// src/pages/admin/ActiveDeliveriesPage.tsx
import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from 'react-query';
import {
  EyeIcon,
  ArrowPathIcon,
  TruckIcon,
  UserIcon,
  ShoppingBagIcon,
  XMarkIcon,
  CreditCardIcon,
  ArrowPathRoundedSquareIcon,
  ArrowUturnLeftIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import api from '../../lib/axios';

const inputClass =
  'w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand';

const ActiveDeliveriesPage = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassignPartnerId, setReassignPartnerId] = useState('');
  const [reassignVehicleId, setReassignVehicleId] = useState('');
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { data: deliveries, isLoading, refetch } = useQuery(
    ['adminActiveDeliveries', statusFilter],
    () => api.get('/admin/delivery_requests/active', { params: { status: statusFilter } }).then(res => res.data),
    { refetchInterval: 30000 }
  );

  const { data: partners } = useQuery('adminLogisticsPartners', () =>
    api.get('/admin/logistics_partners').then(res => res.data)
  );

  const cancelMutation = useMutation(
    ({ id, reason }: { id: number; reason?: string }) =>
      api.patch(`/admin/delivery_requests/${id}/cancel`, { reason }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminActiveDeliveries');
        setSelectedDelivery(null);
        setShowCancelModal(false);
        setCancelReason('');
        setMutationError(null);
      },
      onError: (err: any) => {
        setMutationError(err.response?.data?.error || 'Failed to cancel delivery.');
      },
    }
  );

  const reassignMutation = useMutation(
    ({ id, partnerId, vehicleId }: { id: number; partnerId: number; vehicleId?: number }) =>
      api.patch(`/admin/delivery_requests/${id}/reassign`, { partner_id: partnerId, vehicle_id: vehicleId }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminActiveDeliveries');
        setReassignModalOpen(false);
        setSelectedDelivery(null);
        setReassignPartnerId('');
        setReassignVehicleId('');
        setMutationError(null);
      },
      onError: (err: any) => {
        setMutationError(err.response?.data?.error || 'Failed to reassign delivery.');
      },
    }
  );

  const handleCancelRequest = () => {
    if (selectedDelivery) {
      cancelMutation.mutate({ id: selectedDelivery.id, reason: cancelReason || 'Cancelled by admin' });
    }
  };

  const handleReassign = () => {
    if (selectedDelivery && reassignPartnerId) {
      reassignMutation.mutate({
        id: selectedDelivery.id,
        partnerId: Number(reassignPartnerId),
        vehicleId: reassignVehicleId ? Number(reassignVehicleId) : undefined,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#111]">Active Deliveries</h2>
        <button
          onClick={() => refetch()}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowPathIcon className="w-4 h-4" /> Refresh
        </button>
      </div>

      {mutationError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center justify-between">
          <span>{mutationError}</span>
          <button onClick={() => setMutationError(null)} className="text-red-500 hover:text-red-700">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className={inputClass + ' w-44'}
        >
          <option value="">All Active</option>
          <option value="picked_up">Picked Up</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-border-light shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8F6F2]">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-[#4B4B4B] uppercase">Delivery</th>
                <th className="text-left p-3 text-xs font-semibold text-[#4B4B4B] uppercase">Order / Products</th>
                <th className="text-left p-3 text-xs font-semibold text-[#4B4B4B] uppercase">Pickup</th>
                <th className="text-left p-3 text-xs font-semibold text-[#4B4B4B] uppercase">Drop‑off</th>
                <th className="text-left p-3 text-xs font-semibold text-[#4B4B4B] uppercase">Partner</th>
                <th className="text-left p-3 text-xs font-semibold text-[#4B4B4B] uppercase">Status</th>
                <th className="text-left p-3 text-xs font-semibold text-[#4B4B4B] uppercase">COD</th>
                <th className="text-left p-3 text-xs font-semibold text-[#4B4B4B] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {isLoading ? (
                <tr><td colSpan={8} className="p-4 text-center text-text-muted">Loading...</td></tr>
              ) : deliveries?.length === 0 ? (
                <tr><td colSpan={8} className="p-4 text-center text-text-muted">No active deliveries found.</td></tr>
              ) : (
                deliveries?.map((d: any) => (
                  <tr key={d.id} className={`hover:bg-[#F8F6F2] transition-colors ${selectedDelivery?.id === d.id ? 'bg-brand-light' : ''}`}>
                    <td className="p-3">
                      <div className="font-mono text-xs text-text-muted">#{d.id}</div>
                      <div className="text-xs">{d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}</div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-text-muted">
                        <TruckIcon className="w-3 h-3" />
                        {d.vehicle_type}{d.vehicle_plate ? ` · ${d.vehicle_plate}` : ''}
                      </div>
                      {d.is_return && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 text-xs font-medium bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md">
                            <ArrowUturnLeftIcon className="w-3 h-3" /> Return
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="font-medium">Order #{d.order_id}</div>
                      <div className="flex flex-col gap-0.5 mt-1">
                        {d.products?.slice(0, 3).map((p: any, i: number) => (
                          <span key={i} className="text-xs text-text-muted">
                            {p.quantity}x {p.title}
                          </span>
                        ))}
                        {d.products?.length > 3 && (
                          <span className="text-xs text-brand">+ {d.products.length - 3} more</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-start gap-1">
                        <ShoppingBagIcon className="w-3.5 h-3.5 text-text-muted mt-0.5" />
                        <div>
                          <div className="font-medium text-xs">{d.is_return ? d.buyer_name : d.seller_name || 'Unknown'}</div>
                          {d.seller_phone && !d.is_return && <div className="text-xs text-text-muted">{d.seller_phone}</div>}
                          {d.buyer_phone && d.is_return && <div className="text-xs text-text-muted">{d.buyer_phone}</div>}
                        </div>
                      </div>
                      <div className="text-xs text-text-muted mt-1">
                        {d.pickup_address?.slice(0, 30) || '—'}…
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-start gap-1">
                        <UserIcon className="w-3.5 h-3.5 text-text-muted mt-0.5" />
                        <div>
                          <div className="font-medium text-xs">{d.is_return ? d.seller_name : d.buyer_name || 'Unknown'}</div>
                          {d.buyer_phone && !d.is_return && <div className="text-xs text-text-muted">{d.buyer_phone}</div>}
                          {d.seller_phone && d.is_return && <div className="text-xs text-text-muted">{d.seller_phone}</div>}
                        </div>
                      </div>
                      <div className="text-xs text-text-muted mt-1">
                        {d.delivery_address?.slice(0, 30) || '—'}…
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-medium text-xs">{d.partner_name}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md ${
                          d.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          d.status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {d.status.replace(/_/g, ' ')}
                        </span>
                        {d.return_reason && (
                          <span className="text-xs text-text-muted italic">
                            Reason: {d.return_reason}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      {d.cod_amount ? <span className="font-medium">ETB {d.cod_amount}</span> : '—'}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedDelivery(d)}
                          className="text-brand text-xs font-medium hover:underline flex items-center gap-1"
                        >
                          <EyeIcon className="w-3.5 h-3.5" /> Details
                        </button>
                        {!['delivered','completed','cancelled'].includes(d.status) && (
                          <button
                            onClick={() => { setSelectedDelivery(d); setShowCancelModal(true); }}
                            className="text-red-500 text-xs font-medium hover:underline"
                          >
                            Cancel
                          </button>
                        )}
                        {['assigned','accepted','confirmed_pickup','picked_up','in_transit'].includes(d.status) && (
                          <button
                            onClick={() => { setSelectedDelivery(d); setReassignModalOpen(true); }}
                            className="text-brand text-xs font-medium hover:underline flex items-center gap-1"
                          >
                            <ArrowPathRoundedSquareIcon className="w-3 h-3" /> Reassign
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide‑over Detail Panel */}
      {selectedDelivery && !showCancelModal && !reassignModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-[#111]">
                  {selectedDelivery.is_return ? 'Return Delivery' : 'Delivery Details'}
                </h2>
                <button onClick={() => setSelectedDelivery(null)} className="p-1 rounded-lg hover:bg-gray-100">
                  <XMarkIcon className="w-5 h-5 text-[#707070]" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md ${
                      selectedDelivery.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      selectedDelivery.status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      <span className="w-2 h-2 rounded-full bg-current" />
                      {selectedDelivery.status.replace(/_/g, ' ')}
                    </span>
                    {selectedDelivery.is_return && (
                      <span className="inline-flex items-center gap-1 text-sm font-medium bg-orange-100 text-orange-700 px-3 py-1.5 rounded-md">
                        <ArrowUturnLeftIcon className="w-4 h-4" /> Return
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-[#707070]">
                    {selectedDelivery.partner_name} · {selectedDelivery.vehicle_type} {selectedDelivery.vehicle_plate}
                  </span>
                </div>

                {selectedDelivery.return_reason && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
                    <span className="font-medium text-orange-700">Return reason:</span>{' '}
                    {selectedDelivery.return_reason}
                  </div>
                )}

                {/* Timeline */}
                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border-light" />
                  <div className="relative">
                    <div className="absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
                    <p className="text-xs font-semibold text-red-600 uppercase">Created</p>
                    <p className="text-sm">{new Date(selectedDelivery.created_at).toLocaleString()}</p>
                  </div>
                  {selectedDelivery.accepted_at && (
                    <div className="relative">
                      <div className="absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
                      <p className="text-xs font-semibold text-blue-600 uppercase">Accepted</p>
                      <p className="text-sm">{new Date(selectedDelivery.accepted_at).toLocaleString()}</p>
                    </div>
                  )}
                  {selectedDelivery.picked_up_at && (
                    <div className="relative">
                      <div className="absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white" />
                      <p className="text-xs font-semibold text-indigo-600 uppercase">Picked Up</p>
                      <p className="text-sm">{new Date(selectedDelivery.picked_up_at).toLocaleString()}</p>
                    </div>
                  )}
                  {selectedDelivery.delivered_at && (
                    <div className="relative">
                      <div className="absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                      <p className="text-xs font-semibold text-green-600 uppercase">Delivered</p>
                      <p className="text-sm">{new Date(selectedDelivery.delivered_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {/* Products */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Products</h3>
                  <div className="space-y-2">
                    {selectedDelivery.products?.map((p: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-[#F8F6F2] p-2 rounded-lg text-sm">
                        <span>{p.title}</span>
                        <span className="text-text-muted">{p.quantity}x</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pickup / Delivery (swapped for returns) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-red-600 uppercase">
                      {selectedDelivery.is_return ? 'Pickup (Buyer)' : 'Pickup (Seller)'}
                    </p>
                    <p className="font-medium text-sm">
                      {selectedDelivery.is_return ? selectedDelivery.buyer_name : selectedDelivery.seller_name || '—'}
                    </p>
                    <p className="text-xs text-text-muted">
                      {selectedDelivery.is_return ? selectedDelivery.buyer_phone : selectedDelivery.seller_phone}
                    </p>
                    <p className="text-xs text-text-muted mt-1">Pickup: {selectedDelivery.pickup_address}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-blue-600 uppercase">
                      {selectedDelivery.is_return ? 'Delivery (Seller)' : 'Delivery (Buyer)'}
                    </p>
                    <p className="font-medium text-sm">
                      {selectedDelivery.is_return ? selectedDelivery.seller_name : selectedDelivery.buyer_name || '—'}
                    </p>
                    <p className="text-xs text-text-muted">
                      {selectedDelivery.is_return ? selectedDelivery.seller_phone : selectedDelivery.buyer_phone}
                    </p>
                    <p className="text-xs text-text-muted mt-1">Delivery: {selectedDelivery.delivery_address}</p>
                  </div>
                </div>

                {/* Payment */}
                <div className="flex items-center justify-between bg-[#F8F6F2] p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CreditCardIcon className="w-4 h-4 text-text-muted" />
                    <span className="text-sm">
                      {selectedDelivery.payment_method === 'cash_on_delivery' ? 'Cash on Delivery' : 'Prepaid'}
                    </span>
                  </div>
                  {selectedDelivery.cod_amount && (
                    <span className="font-bold text-yellow-700">ETB {selectedDelivery.cod_amount}</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-start gap-3">
              <div className="bg-red-100 rounded-full p-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Cancel Delivery?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  This will cancel the delivery request. Provide a reason for audit.
                </p>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={2}
                  className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="Reason (optional)"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCancelRequest}
                disabled={cancelMutation.isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {cancelMutation.isLoading ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reassign Modal */}
      {reassignModalOpen && selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Reassign Delivery</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold">New Partner</label>
                <select
                  value={reassignPartnerId}
                  onChange={e => setReassignPartnerId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select partner...</option>
                  {partners?.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold">Vehicle ID (optional)</label>
                <input
                  type="number"
                  value={reassignVehicleId}
                  onChange={e => setReassignVehicleId(e.target.value)}
                  className={inputClass}
                  placeholder="Leave blank to auto-select"
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => { setReassignModalOpen(false); setReassignPartnerId(''); setReassignVehicleId(''); }} className="btn-secondary">Cancel</button>
                <button
                  onClick={handleReassign}
                  disabled={!reassignPartnerId || reassignMutation.isLoading}
                  className="btn-cta disabled:opacity-50"
                >
                  {reassignMutation.isLoading ? 'Reassigning...' : 'Reassign'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ActiveDeliveriesPage;