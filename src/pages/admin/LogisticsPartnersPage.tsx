// src/pages/admin/LogisticsPartnersPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import {
  PlusIcon, TrashIcon, XMarkIcon,
  CheckCircleIcon, EyeIcon, EyeSlashIcon,
  TruckIcon, UserGroupIcon, CurrencyDollarIcon,
  BuildingOffice2Icon, DocumentTextIcon, ShieldCheckIcon,
  MagnifyingGlassIcon, Cog6ToothIcon, MapPinIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import api from '../../lib/axios';
import ActiveDeliveriesPage from './ActiveDeliveriesPage';

const inputClass =
  'w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand';

const LogisticsPartnersPage = ({ standalone = false }: { standalone?: boolean }) => {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'partners' | 'cod' | 'delivery' | 'settings' | 'active-deliveries'>('partners');

  const [showForm, setShowForm] = useState(false);
  const [editPartner, setEditPartner] = useState<any>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    tin: '',
    address: '',
    status: 'pending',
    dispatch_mode: 'internal_fleet',
    bank_name: '',
    account_number: '',
    account_name: '',
    telebirr_number: '',
    operating_region: '',
    business_license: null as File | null,
    insurance: null as File | null,
    logo: null as File | null,
    tin_doc: null as File | null,
  });

  const [codStartDate, setCodStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [codEndDate, setCodEndDate] = useState(new Date().toISOString().slice(0, 10));

  const [drStatusFilter, setDrStatusFilter] = useState('');
  const [drSearch, setDrSearch] = useState('');
  const [drPartnerId, setDrPartnerId] = useState('');

  const [settings, setSettings] = useState<any>(null);

  // Assign modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignDeliveryId, setAssignDeliveryId] = useState<number | null>(null);
  const [assignPartnerId, setAssignPartnerId] = useState('');
  const [assignVehicleId, setAssignVehicleId] = useState('');
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Queries
  const { data: partners, isLoading: partnersLoading } = useQuery('adminLogisticsPartners', () =>
    api.get('/admin/logistics_partners').then(res => res.data)
  );

  const { data: partnerDetail, isLoading: detailLoading } = useQuery(
    ['adminPartnerDetail', selectedPartnerId],
    () => api.get(`/admin/logistics_partners/${selectedPartnerId}`).then(res => res.data),
    { enabled: !!selectedPartnerId }
  );

  const { data: codDetails, isLoading: codLoading } = useQuery(
    ['codDetails', codStartDate, codEndDate],
    () =>
      api.get('/admin/logistics_partners/cod_details', {
        params: { start_date: codStartDate, end_date: codEndDate },
      }).then(res => res.data.partners),
    { enabled: activeTab === 'cod' || standalone }
  );

  const { data: deliveryRequests, isLoading: drLoading } = useQuery(
    ['adminDeliveryRequests', drStatusFilter, drSearch, drPartnerId],
    () =>
      api.get('/admin/delivery_requests', {
        params: { status: drStatusFilter, search: drSearch, partner_id: drPartnerId },
      }).then(res => res.data),
    { enabled: activeTab === 'delivery' }
  );

  const { data: logisticsSettings, isLoading: settingsLoading } = useQuery(
    'adminLogisticsSettings',
    () => api.get('/admin/logistics_settings').then(res => res.data),
    { enabled: activeTab === 'settings', onSuccess: (data: any) => setSettings(data) }
  );

  // Mutations
  const savePartnerMutation = useMutation(
    (payload: FormData) =>
      editPartner
        ? api.patch(`/admin/logistics_partners/${editPartner.id}`, payload)
        : api.post('/admin/logistics_partners', payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminLogisticsPartners');
        setShowForm(false);
        setEditPartner(null);
        setMutationError(null);
        setForm({
          name: '', phone: '', email: '', password: '', tin: '', address: '',
          status: 'pending', dispatch_mode: 'internal_fleet',
          bank_name: '', account_number: '', account_name: '', telebirr_number: '', operating_region: '',
          business_license: null, insurance: null, logo: null, tin_doc: null,
        });
      },
      onError: (err: any) => {
        setMutationError(err.response?.data?.error || 'Failed to save partner.');
      },
    }
  );

  const statusMutation = useMutation(
    ({ id, status }: { id: number; status: string }) => api.patch(`/admin/logistics_partners/${id}`, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminLogisticsPartners');
        setMutationError(null);
      },
      onError: (err: any) => setMutationError(err.response?.data?.error || 'Failed to update status.'),
    }
  );

  const deletePartnerMutation = useMutation(
    (id: number) => api.delete(`/admin/logistics_partners/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminLogisticsPartners');
        setMutationError(null);
      },
      onError: (err: any) => setMutationError(err.response?.data?.error || 'Failed to delete partner.'),
    }
  );

  const reconcileMutation = useMutation(
    ({ partnerId, orderId }: { partnerId: number; orderId: number }) =>
      api.patch(`/admin/logistics_partners/${partnerId}/reconcile_order`, { order_id: orderId }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('codDetails');
        setMutationError(null);
      },
      onError: (err: any) => setMutationError(err.response?.data?.error || 'Failed to reconcile.'),
    }
  );

  const assignDrMutation = useMutation(
    ({ id, partnerId, vehicleId }: { id: number; partnerId: number; vehicleId?: number }) =>
      api.patch(`/admin/delivery_requests/${id}/assign`, { partner_id: partnerId, vehicle_id: vehicleId }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminDeliveryRequests');
        setShowAssignModal(false);
        setAssignDeliveryId(null);
        setAssignPartnerId('');
        setAssignVehicleId('');
        setMutationError(null);
      },
      onError: (err: any) => setMutationError(err.response?.data?.error || 'Failed to assign.'),
    }
  );

  const cancelDrMutation = useMutation(
    (id: number) => api.patch(`/admin/delivery_requests/${id}/cancel`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminDeliveryRequests');
        setMutationError(null);
      },
      onError: (err: any) => setMutationError(err.response?.data?.error || 'Failed to cancel.'),
    }
  );

  const saveSettingsMutation = useMutation(
    (payload: any) => api.patch('/admin/logistics_settings', payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminLogisticsSettings');
        setMutationError(null);
      },
      onError: (err: any) => setMutationError(err.response?.data?.error || 'Failed to save settings.'),
    }
  );

  const saveVehicleMutation = useMutation(
    (data: any) => data.id ? api.patch(`/admin/logistics_partners/${data.partner_id}/vehicles/${data.id}`, { vehicle: data.vehicle }) : api.post(`/admin/logistics_partners/${data.partner_id}/vehicles`, { vehicle: data.vehicle }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminPartnerDetail', selectedPartnerId]);
        setMutationError(null);
      },
      onError: (err: any) => setMutationError(err.response?.data?.error || 'Failed to save vehicle.'),
    }
  );
  const deleteVehicleMutation = useMutation(
    (ids: { partnerId: number; vehicleId: number }) => api.delete(`/admin/logistics_partners/${ids.partnerId}/vehicles/${ids.vehicleId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminPartnerDetail', selectedPartnerId]);
        setMutationError(null);
      },
      onError: (err: any) => setMutationError(err.response?.data?.error || 'Failed to delete vehicle.'),
    }
  );

  // Updated driver mutation to handle FormData (for photo uploads)
  const saveDriverMutation = useMutation(
    (data: { partnerId: number; driverId?: number; formData: FormData }) => {
      const url = data.driverId
        ? `/admin/logistics_partners/${data.partnerId}/drivers/${data.driverId}`
        : `/admin/logistics_partners/${data.partnerId}/drivers`;
      return data.driverId ? api.patch(url, data.formData) : api.post(url, data.formData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminPartnerDetail', selectedPartnerId]);
        setMutationError(null);
      },
      onError: (err: any) => setMutationError(err.response?.data?.error || 'Failed to save driver.'),
    }
  );
  const deleteDriverMutation = useMutation(
    (ids: { partnerId: number; driverId: number }) => api.delete(`/admin/logistics_partners/${ids.partnerId}/drivers/${ids.driverId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminPartnerDetail', selectedPartnerId]);
        setMutationError(null);
      },
      onError: (err: any) => setMutationError(err.response?.data?.error || 'Failed to delete driver.'),
    }
  );
  const saveRateCardMutation = useMutation(
    (data: any) => data.id ? api.patch(`/admin/logistics_partners/${data.partner_id}/rate_cards/${data.id}`, { rate_card: data.rate_card }) : api.post(`/admin/logistics_partners/${data.partner_id}/rate_cards`, { rate_card: data.rate_card }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminPartnerDetail', selectedPartnerId]);
        setMutationError(null);
      },
      onError: (err: any) => setMutationError(err.response?.data?.error || 'Failed to save rate card.'),
    }
  );
  const deleteRateCardMutation = useMutation(
    (ids: { partnerId: number; rateCardId: number }) => api.delete(`/admin/logistics_partners/${ids.partnerId}/rate_cards/${ids.rateCardId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminPartnerDetail', selectedPartnerId]);
        setMutationError(null);
      },
      onError: (err: any) => setMutationError(err.response?.data?.error || 'Failed to delete rate card.'),
    }
  );

  const handleEditPartner = (partner: any) => {
    setEditPartner(partner);
    setForm({
      name: partner.name || '',
      phone: partner.phone || '',
      email: partner.email || '',
      password: '',
      tin: partner.tin || '',
      address: partner.address || '',
      status: partner.status || 'pending',
      dispatch_mode: partner.dispatch_mode || 'internal_fleet',
      bank_name: partner.bank_name || '',
      account_number: partner.account_number || '',
      account_name: partner.account_name || '',
      telebirr_number: partner.telebirr_number || '',
      operating_region: partner.operating_region || '',
      business_license: null,
      insurance: null,
      logo: null,
      tin_doc: null,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('phone', form.phone);
    fd.append('email', form.email);
    if (form.password) fd.append('password', form.password);
    fd.append('tin', form.tin);
    fd.append('address', form.address);
    fd.append('status', form.status);
    fd.append('dispatch_mode', form.dispatch_mode);
    fd.append('bank_name', form.bank_name);
    fd.append('account_number', form.account_number);
    fd.append('account_name', form.account_name);
    fd.append('telebirr_number', form.telebirr_number);
    fd.append('operating_region', form.operating_region);
    if (form.business_license) fd.append('business_license', form.business_license);
    if (form.insurance) fd.append('insurance', form.insurance);
    if (form.logo) fd.append('logo', form.logo);
    if (form.tin_doc) fd.append('tin_doc', form.tin_doc);
    savePartnerMutation.mutate(fd);
  };

  const handleSettingsChange = (category: string, vehicleType: string, field: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [category]: {
        ...(prev?.[category] || {}),
        [vehicleType]: {
          ...(prev?.[category]?.[vehicleType] || {}),
          [field]: value,
        },
      },
    }));
  };

  const handleThresholdChange = (field: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      vehicle_weight_thresholds: {
        ...(prev?.vehicle_weight_thresholds || {}),
        [field]: value,
      },
    }));
  };

  const handleBusinessHoursChange = (field: 'start' | 'end', value: string) => {
    setSettings((prev: any) => ({
      ...prev,
      business_hours: {
        ...(prev?.business_hours || {}),
        [field]: value,
      },
    }));
  };

  const saveSettings = () => {
    if (settings) {
      saveSettingsMutation.mutate(settings);
    }
  };

  if (standalone) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">COD Collection Statement</h1>
        <p className="text-text-muted">COD statement content</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#111]">Logistics</h1>
        {activeTab === 'partners' && (
          <button onClick={() => { setEditPartner(null); setShowForm(true); }} className="btn-cta flex items-center gap-2">
            <PlusIcon className="w-4 h-4" /> Add Partner
          </button>
        )}
        {activeTab === 'settings' && (
          <button onClick={saveSettings} className="btn-cta flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4" /> Save Settings
          </button>
        )}
      </div>

      {mutationError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center justify-between">
          <span>{mutationError}</span>
          <button onClick={() => setMutationError(null)} className="text-red-500 hover:text-red-700">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border-light">
        <button onClick={() => setActiveTab('partners')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'partners' ? 'border-brand text-brand' : 'border-transparent text-text-muted'}`}>Partners</button>
        <button onClick={() => setActiveTab('cod')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'cod' ? 'border-brand text-brand' : 'border-transparent text-text-muted'}`}>COD Reconciliation</button>
        <button onClick={() => setActiveTab('delivery')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'delivery' ? 'border-brand text-brand' : 'border-transparent text-text-muted'}`}>Delivery Requests</button>
        <button onClick={() => setActiveTab('active-deliveries')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'active-deliveries' ? 'border-brand text-brand' : 'border-transparent text-text-muted'}`}>
          <MapPinIcon className="w-4 h-4 inline mr-1" /> Active Deliveries
        </button>
        <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'settings' ? 'border-brand text-brand' : 'border-transparent text-text-muted'}`}>
          <Cog6ToothIcon className="w-4 h-4 inline mr-1" /> Pricing & Settings
        </button>
      </div>

      {/* Partners Tab */}
      {activeTab === 'partners' && (
        <div className="bg-white border border-border-light shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F8F6F2]">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-[#4B4B4B] uppercase">Name</th>
                <th className="text-left p-3 text-xs font-semibold text-[#4B4B4B] uppercase">Phone</th>
                <th className="text-left p-3 text-xs font-semibold text-[#4B4B4B] uppercase">Status</th>
                <th className="text-left p-3 text-xs font-semibold text-[#4B4B4B] uppercase">Vehicles</th>
                <th className="text-left p-3 text-xs font-semibold text-[#4B4B4B] uppercase">Drivers</th>
                <th className="text-left p-3 text-xs font-semibold text-[#4B4B4B] uppercase">COD Bal.</th>
                <th className="text-left p-3 text-xs font-semibold text-[#4B4B4B] uppercase">Earned</th>
                <th className="text-right p-3 text-xs font-semibold text-[#4B4B4B] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {partnersLoading ? (
                <tr><td colSpan={8} className="p-4 text-center text-text-muted">Loading...</td></tr>
              ) : partners?.length === 0 ? (
                <tr><td colSpan={8} className="p-4 text-center text-text-muted">No partners yet.</td></tr>
              ) : (
                partners?.map((p: any) => (
                  <tr key={p.id} className="hover:bg-[#F8F6F2] transition-colors">
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3">{p.phone}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md ${
                        p.status === 'active' ? 'bg-green-100 text-green-700' :
                        p.status === 'verified' ? 'bg-blue-100 text-blue-700' :
                        p.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />{p.status}
                      </span>
                    </td>
                    <td className="p-3">{p.vehicles_count || 0}</td>
                    <td className="p-3">{p.drivers_count || 0}</td>
                    <td className="p-3">ETB {(p.cod_balance || 0).toFixed(2)}</td>
                    <td className="p-3">ETB {(p.total_earned || 0).toFixed(2)}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setSelectedPartnerId(p.id)} className="text-brand text-xs font-medium hover:underline"><EyeIcon className="w-4 h-4 inline" /> Details</button>
                        <button onClick={() => handleEditPartner(p)} className="text-brand text-xs font-medium hover:underline">Edit</button>
                        {p.status === 'pending' && <button onClick={() => statusMutation.mutate({ id: p.id, status: 'verified' })} className="text-green-600 text-xs font-medium hover:underline">Verify</button>}
                        {p.status === 'verified' && <button onClick={() => statusMutation.mutate({ id: p.id, status: 'active' })} className="text-green-600 text-xs font-medium hover:underline">Activate</button>}
                        {p.status === 'active' && <button onClick={() => statusMutation.mutate({ id: p.id, status: 'suspended' })} className="text-red-500 text-xs font-medium hover:underline">Suspend</button>}
                        {p.status === 'suspended' && <button onClick={() => statusMutation.mutate({ id: p.id, status: 'active' })} className="text-green-600 text-xs font-medium hover:underline">Reactivate</button>}
                        <button onClick={() => deletePartnerMutation.mutate(p.id)} className="text-red-500 text-xs font-medium hover:underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* COD Tab */}
      {activeTab === 'cod' && (
        <div className="bg-white border border-border-light shadow-sm p-4">
          <div className="flex items-center gap-4 mb-4">
            <div><label className="text-xs">Start Date</label><input type="date" value={codStartDate} onChange={e => setCodStartDate(e.target.value)} className={inputClass} /></div>
            <div><label className="text-xs">End Date</label><input type="date" value={codEndDate} onChange={e => setCodEndDate(e.target.value)} className={inputClass} /></div>
          </div>
          {codLoading ? (
            <p className="text-sm text-text-muted">Loading...</p>
          ) : codDetails?.length === 0 ? (
            <p className="text-sm text-text-muted">No COD transactions in this period.</p>
          ) : (
            codDetails?.map((group: any) => (
              <div key={group.partner.id} className="mb-4 border rounded-lg p-3">
                <div className="flex justify-between items-center mb-2"><h4 className="font-medium">{group.partner.name}</h4><span className="text-sm">{group.orders.length} orders</span></div>
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-text-muted uppercase"><th className="text-left p-1">Order ID</th><th className="text-left p-1">Date</th><th className="text-left p-1">Buyer</th><th className="text-right p-1">Total</th><th className="text-right p-1">Fee</th><th className="text-right p-1">Net Owed</th><th className="text-center p-1">Reconciled</th></tr></thead>
                  <tbody>
                    {group.orders.map((order: any) => (
                      <tr key={order.id} className="border-b border-border-light">
                        <td className="p-1">#{order.id}</td><td className="p-1">{new Date(order.delivered_at).toLocaleDateString()}</td><td className="p-1">{order.buyer_name}</td>
                        <td className="p-1 text-right">{order.total_collected.toFixed(2)}</td><td className="p-1 text-right">{order.partner_fee.toFixed(2)}</td><td className="p-1 text-right font-medium">{order.net_owed.toFixed(2)}</td>
                        <td className="p-1 text-center">
                          {order.reconciled ? <CheckCircleIcon className="w-4 h-4 text-green-600 inline" /> : <button onClick={() => reconcileMutation.mutate({ partnerId: group.partner.id, orderId: order.id })} className="text-xs text-brand hover:underline">Mark Received</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      )}

      {/* Delivery Requests Tab */}
      {activeTab === 'delivery' && (
        <div className="space-y-4">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-xs">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-3 text-text-muted" />
              <input placeholder="Search..." value={drSearch} onChange={e => setDrSearch(e.target.value)} className={`${inputClass} pl-9`} />
            </div>
            <select value={drStatusFilter} onChange={e => setDrStatusFilter(e.target.value)} className={inputClass + ' w-44'}>
              <option value="">All Statuses</option>
              {['pending_assignment','assigned','accepted','confirmed_pickup','picked_up','in_transit','delivered','completed','cancelled'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
            </select>
            <select value={drPartnerId} onChange={e => setDrPartnerId(e.target.value)} className={inputClass + ' w-44'}>
              <option value="">All Partners</option>
              {partners?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="bg-white border border-border-light shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F6F2]">
                <tr>
                  <th className="text-left p-3 text-xs font-semibold text-[#4B4B4B] uppercase">ID</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#4B4B4B] uppercase">Order</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#4B4B4B] uppercase">Partner</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#4B4B4B] uppercase">Vehicle</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#4B4B4B] uppercase">Status</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#4B4B4B] uppercase">Pickup</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#4B4B4B] uppercase">Delivery</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#4B4B4B] uppercase">COD</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#4B4B4B] uppercase">Created</th>
                  <th className="text-right p-3 text-xs font-semibold text-[#4B4B4B] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {drLoading ? (
                  <tr><td colSpan={10} className="p-4 text-center text-text-muted">Loading...</td></tr>
                ) : deliveryRequests?.length === 0 ? (
                  <tr><td colSpan={10} className="p-4 text-center text-text-muted">No delivery requests found.</td></tr>
                ) : (
                  deliveryRequests?.map((dr: any) => (
                    <tr key={dr.id} className="hover:bg-[#F8F6F2] transition-colors">
                      <td className="p-3 font-mono">{dr.id}</td><td className="p-3">#{dr.order_id}</td><td className="p-3">{dr.partner_name}</td>
                      <td className="p-3">{dr.vehicle_type}{dr.vehicle_plate ? ` · ${dr.vehicle_plate}` : ''}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md ${
                          dr.status === 'completed' ? 'bg-green-100 text-green-700' :
                          dr.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          dr.status === 'pending_assignment' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{dr.status.replace(/_/g,' ')}</span>
                      </td>
                      <td className="p-3 max-w-[150px] truncate">{dr.pickup_address}</td>
                      <td className="p-3 max-w-[150px] truncate">{dr.delivery_address}</td>
                      <td className="p-3">{dr.cod_amount ? `ETB ${dr.cod_amount}` : '-'}</td>
                      <td className="p-3">{new Date(dr.created_at).toLocaleDateString()}</td>
                      <td className="p-3 text-right">
                        {dr.status === 'pending_assignment' && (
                          <button
                            onClick={() => { setAssignDeliveryId(dr.id); setShowAssignModal(true); }}
                            className="text-xs text-brand font-medium hover:underline"
                          >
                            Assign
                          </button>
                        )}
                        {!['cancelled','completed'].includes(dr.status) && (
                          <button onClick={() => { if (window.confirm('Cancel this request?')) cancelDrMutation.mutate(dr.id); }} className="ml-2 text-xs text-red-500 font-medium hover:underline">Cancel</button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active Deliveries Tab */}
      {activeTab === 'active-deliveries' && <ActiveDeliveriesPage />}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white border border-border-light shadow-sm p-6 rounded-xl space-y-8">
          {settingsLoading ? (
            <p className="text-text-muted">Loading settings...</p>
          ) : settings ? (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold">Default Rate Cards</h3>
              </div>
              {['motorcycle', 'car', 'van', 'truck'].map(vehicleType => (
                <div key={vehicleType} className="border rounded-lg p-4">
                  <h3 className="text-sm font-semibold capitalize mb-3">{vehicleType}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium">Base Rate (ETB)</label>
                      <input type="number" value={settings?.rate_cards?.[vehicleType]?.base_rate ?? 0} onChange={e => handleSettingsChange('rate_cards', vehicleType, 'base_rate', parseFloat(e.target.value))} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Per Km Rate (ETB)</label>
                      <input type="number" value={settings?.rate_cards?.[vehicleType]?.per_km_rate ?? 0} onChange={e => handleSettingsChange('rate_cards', vehicleType, 'per_km_rate', parseFloat(e.target.value))} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Min Charge (ETB)</label>
                      <input type="number" value={settings?.rate_cards?.[vehicleType]?.min_charge ?? 0} onChange={e => handleSettingsChange('rate_cards', vehicleType, 'min_charge', parseFloat(e.target.value))} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Weight Surcharge/kg {'>5kg'} (ETB)</label>
                      <input type="number" value={settings?.rate_cards?.[vehicleType]?.weight_surcharge_per_kg_above_5kg ?? 0} onChange={e => handleSettingsChange('rate_cards', vehicleType, 'weight_surcharge_per_kg_above_5kg', parseFloat(e.target.value))} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Express Surcharge %</label>
                      <input type="number" value={settings?.rate_cards?.[vehicleType]?.express_surcharge_percent ?? 0} onChange={e => handleSettingsChange('rate_cards', vehicleType, 'express_surcharge_percent', parseFloat(e.target.value))} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Fragile Surcharge (ETB)</label>
                      <input type="number" value={settings?.rate_cards?.[vehicleType]?.fragile_surcharge ?? 0} onChange={e => handleSettingsChange('rate_cards', vehicleType, 'fragile_surcharge', parseFloat(e.target.value))} className={inputClass} />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center pt-4">
                <h3 className="text-sm font-semibold">Vehicle Weight Thresholds</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">Motorcycle Max Weight (kg)</label>
                  <input type="number" value={settings?.vehicle_weight_thresholds?.motorcycle_max_kg ?? 20} onChange={e => handleThresholdChange('motorcycle_max_kg', parseFloat(e.target.value))} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-medium">Car Max Weight (kg)</label>
                  <input type="number" value={settings?.vehicle_weight_thresholds?.car_max_kg ?? 200} onChange={e => handleThresholdChange('car_max_kg', parseFloat(e.target.value))} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-medium">Van Max Weight (kg)</label>
                  <input type="number" value={settings?.vehicle_weight_thresholds?.van_max_kg ?? 1000} onChange={e => handleThresholdChange('van_max_kg', parseFloat(e.target.value))} className={inputClass} />
                </div>
              </div>

              {/* Business Hours */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-4">Business Hours</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium">Start Time</label>
                    <input
                      type="time"
                      value={settings?.business_hours?.start || '08:00'}
                      onChange={e => handleBusinessHoursChange('start', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">End Time</label>
                    <input
                      type="time"
                      value={settings?.business_hours?.end || '20:00'}
                      onChange={e => handleBusinessHoursChange('end', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-text-muted">No settings found.</p>
          )}
        </div>
      )}

      {/* Partner Registration Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{editPartner ? 'Edit Partner' : 'Register Logistics Partner'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100"><XMarkIcon className="w-5 h-5 text-[#707070]" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Business Information */}
              <fieldset>
                <legend className="text-sm font-semibold text-[#111] mb-3 flex items-center gap-2"><BuildingOffice2Icon className="w-4 h-4" /> Business Information</legend>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-semibold mb-1">Business Name *</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} /></div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Phone *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-sm text-text-muted">+251</span></div>
                      <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={`${inputClass} pl-16`} placeholder="9XXXXXXXX" />
                    </div>
                  </div>
                  <div><label className="block text-xs font-semibold mb-1">Email <span className="text-text-muted font-normal">(optional)</span></label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} /></div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Password (for partner login)</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={inputClass} placeholder="Set a password" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#707070] hover:text-[#111]">{showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}</button>
                    </div>
                  </div>
                  <div><label className="block text-xs font-semibold mb-1">TIN</label><input value={form.tin} onChange={e => setForm({ ...form, tin: e.target.value })} className={inputClass} /></div>
                  <div className="col-span-2"><label className="block text-xs font-semibold mb-1">Address</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={inputClass} /></div>
                </div>
              </fieldset>

              {/* Operational & Banking */}
              <fieldset>
                <legend className="text-sm font-semibold text-[#111] mb-3 flex items-center gap-2"><CurrencyDollarIcon className="w-4 h-4" /> Operational & Banking</legend>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-semibold mb-1">Bank Name</label><input value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} className={inputClass} /></div>
                  <div><label className="block text-xs font-semibold mb-1">Account Number</label><input value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })} className={inputClass} /></div>
                  <div><label className="block text-xs font-semibold mb-1">Account Name</label><input value={form.account_name} onChange={e => setForm({ ...form, account_name: e.target.value })} className={inputClass} /></div>
                  <div><label className="block text-xs font-semibold mb-1">Telebirr Number</label><input value={form.telebirr_number} onChange={e => setForm({ ...form, telebirr_number: e.target.value })} className={inputClass} /></div>
                  <div className="col-span-2"><label className="block text-xs font-semibold mb-1">Operating Region</label><input value={form.operating_region} onChange={e => setForm({ ...form, operating_region: e.target.value })} className={inputClass} /></div>
                </div>
              </fieldset>

              {/* Account Settings */}
              <fieldset>
                <legend className="text-sm font-semibold text-[#111] mb-3 flex items-center gap-2"><ShieldCheckIcon className="w-4 h-4" /> Account Settings</legend>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-semibold mb-1">Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputClass}><option value="pending">Pending</option><option value="verified">Verified</option><option value="active">Active</option><option value="suspended">Suspended</option></select></div>
                  <div><label className="block text-xs font-semibold mb-1">Dispatch Mode</label><select value={form.dispatch_mode} onChange={e => setForm({ ...form, dispatch_mode: e.target.value })} className={inputClass}><option value="manual">Manual</option><option value="external_api">External API</option><option value="internal_fleet">Internal Fleet</option></select></div>
                </div>
              </fieldset>

              {/* Legal Documents */}
              <fieldset>
                <legend className="text-sm font-semibold text-[#111] mb-3 flex items-center gap-2"><DocumentTextIcon className="w-4 h-4" /> Legal Documents</legend>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-semibold mb-1">Business License</label><input type="file" onChange={e => setForm({ ...form, business_license: e.target.files?.[0] || null })} className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-light file:text-brand hover:file:bg-brand/10 cursor-pointer" /></div>
                  <div><label className="block text-xs font-semibold mb-1">Insurance Document</label><input type="file" onChange={e => setForm({ ...form, insurance: e.target.files?.[0] || null })} className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-light file:text-brand hover:file:bg-brand/10 cursor-pointer" /></div>
                  <div><label className="block text-xs font-semibold mb-1">TIN Document</label><input type="file" onChange={e => setForm({ ...form, tin_doc: e.target.files?.[0] || null })} className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-light file:text-brand hover:file:bg-brand/10 cursor-pointer" /></div>
                  <div><label className="block text-xs font-semibold mb-1">Logo</label><input type="file" onChange={e => setForm({ ...form, logo: e.target.files?.[0] || null })} className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-light file:text-brand hover:file:bg-brand/10 cursor-pointer" /></div>
                </div>
              </fieldset>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-6">Cancel</button>
                <button type="submit" className="btn-cta px-6">{editPartner ? 'Update Partner' : 'Register Partner'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Slide-over Details Panel */}
      {selectedPartnerId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <motion.div initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }} className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[#111]">Partner Details</h2>
                <button onClick={() => setSelectedPartnerId(null)} className="p-1 rounded-lg hover:bg-gray-100"><XMarkIcon className="w-5 h-5 text-[#707070]" /></button>
              </div>
              {detailLoading ? <p className="text-text-muted">Loading...</p> : partnerDetail ? (
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    {partnerDetail.logo_url ? <img src={partnerDetail.logo_url} className="w-12 h-12 rounded-full object-cover" /> : <BuildingOffice2Icon className="w-12 h-12 text-[#707070]" />}
                    <div>
                      <h3 className="font-semibold text-lg">{partnerDetail.name}</h3>
                      <p className="text-sm text-[#707070]">{partnerDetail.phone}</p>
                      <p className="text-sm text-[#707070]">{partnerDetail.email}</p>
                      <p className="text-sm text-[#707070]">Operating Region: {partnerDetail.operating_region || '—'}</p>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-3 rounded-lg"><p className="text-xs text-green-700">Total Earned</p><p className="font-bold text-green-800">ETB {partnerDetail.total_earned?.toFixed(2) || '0.00'}</p></div>
                    <div className="bg-red-50 p-3 rounded-lg"><p className="text-xs text-red-700">COD Balance</p><p className="font-bold text-red-800">ETB {partnerDetail.cod_balance?.toFixed(2) || '0.00'}</p></div>
                  </div>

                  {/* Banking & Settlement */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Banking & Settlement</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#F8F6F2] p-3 rounded-lg"><p className="text-xs text-text-muted">Bank Name</p><p className="font-medium">{partnerDetail.bank_name || '—'}</p></div>
                      <div className="bg-[#F8F6F2] p-3 rounded-lg"><p className="text-xs text-text-muted">Account Number</p><p className="font-medium">{partnerDetail.account_number || '—'}</p></div>
                      <div className="bg-[#F8F6F2] p-3 rounded-lg"><p className="text-xs text-text-muted">Account Name</p><p className="font-medium">{partnerDetail.account_name || '—'}</p></div>
                      <div className="bg-[#F8F6F2] p-3 rounded-lg"><p className="text-xs text-text-muted">Telebirr Number</p><p className="font-medium">{partnerDetail.telebirr_number || '—'}</p></div>
                    </div>
                  </div>

                  {/* Fleet & Drivers sections */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Vehicles</h3>
                    <div className="space-y-2">
                      {partnerDetail.vehicles?.map((v: any) => (
                        <div key={v.id} className="flex items-center justify-between bg-[#F8F6F2] p-2 rounded-lg">
                          <div className="flex items-center gap-3"><TruckIcon className="w-4 h-4 text-[#707070]" /><span className="capitalize font-medium">{v.vehicle_type}</span><span className="text-sm text-[#707070]">{v.plate_number} · {v.max_weight_kg} kg</span></div>
                          <button onClick={() => deleteVehicleMutation.mutate({ partnerId: selectedPartnerId, vehicleId: v.id })} className="text-red-500 text-xs hover:underline">Remove</button>
                        </div>
                      ))}
                      <AddVehicleForm partnerId={selectedPartnerId} onSave={(data: any) => saveVehicleMutation.mutate({ ...data, partner_id: selectedPartnerId })} />
                    </div>
                  </div>

                  {/* Enhanced Drivers section */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Drivers</h3>
                    <div className="space-y-2">
                      {partnerDetail.drivers?.map((d: any) => (
                        <div key={d.id} className="flex items-center justify-between bg-[#F8F6F2] p-2 rounded-lg">
                          <div className="flex items-center gap-3">
                            {d.photo_url ? <img src={d.photo_url} className="w-10 h-10 rounded-full object-cover" alt={d.name} /> : <UserGroupIcon className="w-6 h-6 text-[#707070]" />}
                            <div>
                              <span className="font-medium">{d.name}</span>
                              <p className="text-sm text-[#707070]">{d.phone}</p>
                              <p className="text-xs text-[#707070]">License: {d.license_number || '—'} · {d.address || '—'}</p>
                            </div>
                          </div>
                          <button onClick={() => deleteDriverMutation.mutate({ partnerId: selectedPartnerId, driverId: d.id })} className="text-red-500 text-xs hover:underline">Remove</button>
                        </div>
                      ))}
                      <AddDriverForm partnerId={selectedPartnerId} onSave={saveDriverMutation.mutate} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-2">Rate Cards</h3>
                    <div className="space-y-2">
                      {partnerDetail.rate_cards?.map((rc: any) => (
                        <div key={rc.id} className="flex items-center justify-between bg-[#F8F6F2] p-2 rounded-lg">
                          <div className="flex items-center gap-3"><CurrencyDollarIcon className="w-4 h-4 text-[#707070]" /><span className="capitalize font-medium">{rc.vehicle_type}</span><span className="text-sm text-[#707070]">Base: ETB {rc.base_rate} · Km: ETB {rc.per_km_rate} · Min: ETB {rc.min_charge}</span></div>
                          <button onClick={() => deleteRateCardMutation.mutate({ partnerId: selectedPartnerId, rateCardId: rc.id })} className="text-red-500 text-xs hover:underline">Remove</button>
                        </div>
                      ))}
                      <AddRateCardForm partnerId={selectedPartnerId} onSave={(data: any) => saveRateCardMutation.mutate({ ...data, partner_id: selectedPartnerId })} />
                    </div>
                  </div>

                  {/* Documents */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Documents</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-[#F8F6F2] p-2 rounded-lg"><span className="text-sm">Business License</span>{partnerDetail.business_license_url ? <a href={partnerDetail.business_license_url} target="_blank" className="text-brand text-xs hover:underline">View File</a> : <span className="text-xs text-text-muted">Not uploaded</span>}</div>
                      <div className="flex items-center justify-between bg-[#F8F6F2] p-2 rounded-lg"><span className="text-sm">Insurance</span>{partnerDetail.insurance_url ? <a href={partnerDetail.insurance_url} target="_blank" className="text-brand text-xs hover:underline">View File</a> : <span className="text-xs text-text-muted">Not uploaded</span>}</div>
                      <div className="flex items-center justify-between bg-[#F8F6F2] p-2 rounded-lg"><span className="text-sm">TIN Document</span>{partnerDetail.tin_url ? <a href={partnerDetail.tin_url} target="_blank" className="text-brand text-xs hover:underline">View File</a> : <span className="text-xs text-text-muted">Not uploaded</span>}</div>
                    </div>
                  </div>
                </div>
              ) : <p className="text-text-muted">No data available.</p>}
            </div>
          </motion.div>
        </div>
      )}

      {/* Assign Delivery Modal */}
      {showAssignModal && assignDeliveryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-start gap-3">
              <div className="bg-brand/10 rounded-full p-2">
                <TruckIcon className="w-5 h-5 text-brand" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Assign Delivery #{assignDeliveryId}</h3>
                <p className="text-sm text-gray-600 mt-1">Select a logistics partner and optionally a vehicle.</p>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Partner</label>
                    <select
                      value={assignPartnerId}
                      onChange={e => setAssignPartnerId(e.target.value)}
                      className="mt-1 w-full h-10 px-3 text-sm border border-border-light rounded-md bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
                    >
                      <option value="">Select partner...</option>
                      {partners?.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Vehicle ID (optional)</label>
                    <input
                      type="number"
                      value={assignVehicleId}
                      onChange={e => setAssignVehicleId(e.target.value)}
                      placeholder="Leave blank to auto-select"
                      className="mt-1 w-full h-10 px-3 text-sm border border-border-light rounded-md bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssignDeliveryId(null);
                  setAssignPartnerId('');
                  setAssignVehicleId('');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (assignPartnerId) {
                    assignDrMutation.mutate({
                      id: assignDeliveryId,
                      partnerId: Number(assignPartnerId),
                      vehicleId: assignVehicleId ? Number(assignVehicleId) : undefined,
                    });
                  }
                }}
                disabled={!assignPartnerId || assignDrMutation.isLoading}
                className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-hover disabled:opacity-50"
              >
                {assignDrMutation.isLoading ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const Section = ({ title }: { title: string }) => (
  <div className="flex justify-between items-center"><h3 className="text-sm font-semibold">{title}</h3></div>
);

const AddVehicleForm = ({ partnerId, onSave }: { partnerId: number; onSave: (data: any) => void }) => {
  const [show, setShow] = useState(false);
  const [type, setType] = useState('car'); const [plate, setPlate] = useState(''); const [maxWeight, setMaxWeight] = useState('');
  if (!show) return <button onClick={() => setShow(true)} className="text-xs text-brand hover:underline">+ Add Vehicle</button>;
  return (
    <div className="flex items-center gap-2 mt-2">
      <select value={type} onChange={e => setType(e.target.value)} className={`${inputClass} w-24 h-8 text-xs`}>{['motorcycle','car','van','truck'].map(t=><option key={t} value={t}>{t}</option>)}</select>
      <input placeholder="Plate" value={plate} onChange={e => setPlate(e.target.value)} className={`${inputClass} w-20 h-8 text-xs`} />
      <input type="number" placeholder="kg" value={maxWeight} onChange={e => setMaxWeight(e.target.value)} className={`${inputClass} w-16 h-8 text-xs`} />
      <button onClick={() => { onSave({ vehicle: { vehicle_type: type, plate_number: plate, max_weight_kg: parseFloat(maxWeight) } }); setShow(false); setPlate(''); setMaxWeight(''); }} className="text-green-600 text-xs font-medium hover:underline">Save</button>
      <button onClick={() => setShow(false)} className="text-xs text-red-500 hover:underline">Cancel</button>
    </div>
  );
};

// Updated AddDriverForm with file upload support
const AddDriverForm = ({ partnerId, onSave }: { partnerId: number; onSave: (data: any) => void }) => {
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState('available');
  const [photo, setPhoto] = useState<File | null>(null);
  const [licensePhoto, setLicensePhoto] = useState<File | null>(null);

  const reset = () => {
    setName('');
    setPhone('');
    setLicenseNumber('');
    setAddress('');
    setStatus('available');
    setPhoto(null);
    setLicensePhoto(null);
    setShow(false);
  };

  if (!show) return <button onClick={() => setShow(true)} className="text-xs text-brand hover:underline">+ Add Driver</button>;

  const handleSave = () => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('phone', phone);
    formData.append('license_number', licenseNumber);
    formData.append('address', address);
    formData.append('status', status);
    if (photo) formData.append('photo', photo);
    if (licensePhoto) formData.append('license_photo', licensePhoto);

    onSave({ partnerId, formData });
    reset();
  };

  return (
    <div className="mt-2 space-y-2 p-3 bg-gray-50 rounded-lg">
      <div className="grid grid-cols-2 gap-2">
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} className={`${inputClass} h-8 text-xs`} />
        <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} className={`${inputClass} h-8 text-xs`} />
        <input placeholder="License #" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} className={`${inputClass} h-8 text-xs`} />
        <input placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} className={`${inputClass} h-8 text-xs`} />
        <select value={status} onChange={e => setStatus(e.target.value)} className={`${inputClass} h-8 text-xs`}>
          <option value="available">Available</option>
          <option value="on_delivery">On Delivery</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="flex items-center gap-2">
          <input type="file" onChange={e => setPhoto(e.target.files?.[0] || null)} className="text-xs" />
          <span className="text-xs text-gray-500">Photo</span>
        </div>
        <div className="flex items-center gap-2">
          <input type="file" onChange={e => setLicensePhoto(e.target.files?.[0] || null)} className="text-xs" />
          <span className="text-xs text-gray-500">License Photo</span>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={handleSave} className="text-green-600 text-xs font-medium hover:underline">Save</button>
        <button onClick={() => setShow(false)} className="text-xs text-red-500 hover:underline">Cancel</button>
      </div>
    </div>
  );
};

const AddRateCardForm = ({ partnerId, onSave }: { partnerId: number; onSave: (data: any) => void }) => {
  const [show, setShow] = useState(false);
  const [vtype, setVtype] = useState('car'); const [base, setBase] = useState(''); const [perKm, setPerKm] = useState(''); const [minCharge, setMinCharge] = useState('');
  if (!show) return <button onClick={() => setShow(true)} className="text-xs text-brand hover:underline">+ Add Rate Card</button>;
  return (
    <div className="flex items-center gap-2 mt-2">
      <select value={vtype} onChange={e => setVtype(e.target.value)} className={`${inputClass} w-24 h-8 text-xs`}>{['motorcycle','car','van','truck'].map(t=><option key={t} value={t}>{t}</option>)}</select>
      <input placeholder="Base" value={base} onChange={e => setBase(e.target.value)} className={`${inputClass} w-16 h-8 text-xs`} />
      <input placeholder="Km" value={perKm} onChange={e => setPerKm(e.target.value)} className={`${inputClass} w-16 h-8 text-xs`} />
      <input placeholder="Min" value={minCharge} onChange={e => setMinCharge(e.target.value)} className={`${inputClass} w-16 h-8 text-xs`} />
      <button onClick={() => { onSave({ rate_card: { vehicle_type: vtype, base_rate: parseFloat(base), per_km_rate: parseFloat(perKm), min_charge: parseFloat(minCharge) } }); setShow(false); setBase(''); setPerKm(''); setMinCharge(''); }} className="text-green-600 text-xs font-medium hover:underline">Save</button>
      <button onClick={() => setShow(false)} className="text-xs text-red-500 hover:underline">Cancel</button>
    </div>
  );
};

export default LogisticsPartnersPage;