import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../lib/axios';
import {
  TruckIcon,
  PhoneIcon,
  MapPinIcon,
  ArrowPathIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

const STATUS_OPTIONS = ['pending', 'contacted', 'accepted', 'picked_up', 'in_transit', 'delivered', 'failed'];

const ManualDispatchPage = () => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: dispatches, isLoading } = useQuery(
    'manualDispatches',
    () => api.get('/admin/manual_dispatches').then(res => res.data)
  );

  const { data: partners } = useQuery(
    'manualPartners',
    () => api.get('/admin/logistics_partners?dispatch_mode=manual').then(res => res.data)
  );

  const assignMutation = useMutation(
    ({ id, partnerId }: { id: number; partnerId: number }) =>
      api.patch(`/admin/manual_dispatches/${id}/assign`, { logistics_partner_id: partnerId }),
    { onSuccess: () => queryClient.invalidateQueries('manualDispatches') }
  );

  const statusMutation = useMutation(
    ({ id, status }: { id: number; status: string }) =>
      api.patch(`/admin/manual_dispatches/${id}/update_status`, { status }),
    { onSuccess: () => queryClient.invalidateQueries('manualDispatches') }
  );

  const notesMutation = useMutation(
    ({ id, note }: { id: number; note: string }) =>
      api.post(`/admin/manual_dispatches/${id}/notes`, { note }),
    { onSuccess: () => { queryClient.invalidateQueries('manualDispatches'); setNoteText(''); } }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-muted text-sm">Loading manual dispatches…</div>
      </div>
    );
  }

  const filtered = filterStatus === 'all'
    ? (dispatches || [])
    : (dispatches || []).filter((d: any) => d.status === filterStatus);

  const selected = (dispatches || []).find((d: any) => d.id === selectedId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-product-title font-semibold text-text-primary flex items-center gap-2">
          <TruckIcon className="w-5 h-5" /> Manual Dispatches
          <button onClick={() => queryClient.invalidateQueries('manualDispatches')} className="p-1 hover:bg-surface-hover rounded">
            <ArrowPathIcon className="w-4 h-4 text-text-muted" />
          </button>
        </h1>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <FunnelIcon className="w-4 h-4 text-text-muted" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-9 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left side: list */}
        <div className="lg:col-span-1 space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto admin-nav-scroll">
          {filtered.length === 0 && (
            <p className="text-sm text-text-muted">No dispatches found.</p>
          )}
          {filtered.map((md: any) => (
            <motion.div
              key={md.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`card-product p-3 cursor-pointer transition border ${
                selectedId === md.id ? 'border-brand' : 'border-border-light'
              }`}
              onClick={() => setSelectedId(md.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-text-primary">DR #{md.delivery_request_id}</p>
                  <p className="text-xs text-text-muted">{md.buyer_name}</p>
                  <p className="text-xs text-text-muted flex items-center gap-1">
                    <MapPinIcon className="w-3 h-3" /> {md.buyer_address}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  md.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  md.status === 'contacted' ? 'bg-blue-100 text-blue-700' :
                  md.status === 'accepted' ? 'bg-green-100 text-green-700' :
                  md.status === 'delivered' ? 'bg-green-200 text-green-800' :
                  md.status === 'failed' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>{md.status}</span>
              </div>
              {md.logistics_partner && (
                <p className="text-xs text-text-muted mt-1">Partner: {md.logistics_partner.name}</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Right side: details */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="card-product p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-semibold text-text-primary">
                  Delivery Request #{selected.delivery_request_id}
                </h2>
                <span className="text-xs bg-brand-light text-brand px-2 py-0.5 rounded-full">{selected.status}</span>
              </div>

              {/* Buyer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-text-muted">Buyer</p>
                  <p className="text-sm font-medium">{selected.buyer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Phone</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <PhoneIcon className="w-3 h-3" /> {selected.buyer_phone}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-text-muted">Delivery Address</p>
                  <p className="text-sm">{selected.buyer_address}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Delivery PIN</p>
                  <p className="text-sm font-bold">{selected.delivery_pin}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Consolidated Shipping</p>
                  <p className="text-sm font-semibold">ETB {selected.consolidated_shipping?.toFixed(2) || 'N/A'}</p>
                </div>
              </div>

              {/* Pickup Points */}
              <div>
                <p className="text-xs text-text-muted mb-1">Pickup Points & Items</p>
                <div className="space-y-2">
                  {(selected.pickup_points || []).map((point: any, idx: number) => (
                    <div key={idx} className="border border-border-light rounded-[var(--radius-sm)] p-2">
                      <p className="text-sm font-medium">{point.address}</p>
                      <p className="text-xs text-text-muted">{point.phone}</p>
                      <p className="text-xs text-text-muted">Weight: {point.package_weight}kg</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assign Partner (only if status is pending or contacted) */}
              {['pending', 'contacted'].includes(selected.status) && (
                <div>
                  <p className="text-xs text-text-muted mb-1">Assign Logistics Partner</p>
                  <select
                    className="input-product w-full"
                    value={selected.logistics_partner?.id || ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        assignMutation.mutate({ id: selected.id, partnerId: Number(e.target.value) });
                      }
                    }}
                  >
                    <option value="">Select partner...</option>
                    {(partners || []).map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status Actions */}
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.filter(s => s !== 'pending' || selected.status === 'pending' || selected.status === 'contacted')
                  .map(status => (
                    <button
                      key={status}
                      onClick={() => statusMutation.mutate({ id: selected.id, status })}
                      className="btn-secondary text-xs px-3 py-1 rounded-lg"
                      disabled={status === selected.status}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
              </div>

              {/* Notes */}
              <div>
                <p className="text-xs text-text-muted mb-1">Notes</p>
                <textarea
                  className="input-product w-full text-sm"
                  rows={2}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <button
                  onClick={() => {
                    if (noteText.trim()) {
                      notesMutation.mutate({ id: selected.id, note: noteText });
                    }
                  }}
                  className="btn-cta text-xs px-3 py-1 rounded-lg mt-1"
                >
                  Add Note
                </button>
                {selected.notes && (
                  <p className="text-xs text-text-muted mt-2 whitespace-pre-wrap">{selected.notes}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="card-product p-4 text-center text-text-muted text-sm">
              Select a dispatch from the list to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManualDispatchPage;