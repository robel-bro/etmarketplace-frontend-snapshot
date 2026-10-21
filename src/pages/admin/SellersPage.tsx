// src/pages/admin/SellersPage.tsx
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
  UserIcon,
  CalendarIcon,
  IdentificationIcon,
  PauseIcon,
  PlayIcon,
  StarIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../lib/axios';

interface Seller {
  id: number;
  business_name: string;
  user: {
    full_name: string;
    phone?: string;
  };
  business_address?: string;
  tin?: string;
  national_id?: string;
  telebirr_number?: string;
  license_document_url?: string;
  id_document_url?: string;
  tin_certificate_url?: string;
  business_license_url?: string;
  is_bulk_supplier?: boolean;
  status: string;
  rejection_reason?: string;
  approved_at?: string;
  rejected_at?: string;
  created_at: string;
  featured?: boolean;
  featured_until?: string;
  membership_plan?: {
    id: number;
    name: string;
    badge_text?: string;
    expires_at?: string;
  };
  sponsored_products_count?: number;
}

interface MembershipPlan {
  id: number;
  name: string;
  price: number;
  duration_days: number;
}

const SellersPage = () => {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Seller | null>(null);
  const [viewTarget, setViewTarget] = useState<Seller | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Seller | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlans, setSelectedPlans] = useState<Record<number, number | null>>({});
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { data: sellers = [], isLoading, error } = useQuery<Seller[]>(
    'adminSellers',
    () => api.get('/admin/vendors').then(res => res.data),
    { staleTime: 30 * 1000 }
  );

  const { data: plans = [] } = useQuery<MembershipPlan[]>(
    'adminMembershipPlans',
    () => api.get('/admin/membership_plans').then(res => res.data),
    { staleTime: 60 * 1000 }
  );

  const approveMutation = useMutation(
    (id: number) => api.patch(`/admin/vendors/${id}/approve`),
    {
      onSuccess: (data, id) => {
        queryClient.setQueryData<Seller[]>('adminSellers', (old) =>
          (old || []).map((v) =>
            v.id === id ? { ...v, status: 'approved', ...data.data.vendor } : v
          )
        );
        setMutationError(null);
      },
      onError: (err: any) => setMutationError(err.response?.data?.error || 'Failed to approve seller.'),
    }
  );

  const rejectMutation = useMutation(
    ({ id, reason }: { id: number; reason: string }) =>
      api.patch(`/admin/vendors/${id}/reject`, { reason }),
    {
      onSuccess: (data, { id }) => {
        queryClient.setQueryData<Seller[]>('adminSellers', (old) =>
          (old || []).map((v) =>
            v.id === id ? { ...v, status: 'rejected', ...data.data.vendor } : v
          )
        );
        setRejectTarget(null);
        setRejectReason('');
        setMutationError(null);
      },
      onError: (err: any) => setMutationError(err.response?.data?.error || 'Failed to reject seller.'),
    }
  );

  const suspendMutation = useMutation(
    (id: number) => api.patch(`/admin/vendors/${id}/suspend`),
    {
      onSuccess: (data, id) => {
        queryClient.setQueryData<Seller[]>('adminSellers', (old) =>
          (old || []).map((v) =>
            v.id === id ? { ...v, status: 'suspended', ...data.data.vendor } : v
          )
        );
        setMutationError(null);
      },
      onError: (err: any) => setMutationError(err.response?.data?.error || 'Failed to suspend seller.'),
    }
  );

  const unsuspendMutation = useMutation(
    (id: number) => api.patch(`/admin/vendors/${id}/unsuspend`),
    {
      onSuccess: (data, id) => {
        queryClient.setQueryData<Seller[]>('adminSellers', (old) =>
          (old || []).map((v) =>
            v.id === id ? { ...v, status: 'approved', ...data.data.vendor } : v
          )
        );
        setMutationError(null);
      },
      onError: (err: any) => setMutationError(err.response?.data?.error || 'Failed to unsuspend seller.'),
    }
  );

  const toggleFeaturedMutation = useMutation(
    ({ id, featured_until }: { id: number; featured_until?: string }) =>
      api.post(`/admin/vendors/${id}/toggle_featured`, { featured_until }),
    {
      onSuccess: (response, { id }) => {
        queryClient.invalidateQueries('homepage');
        const { featured, featured_until } = response.data;
        queryClient.setQueryData<Seller[]>('adminSellers', (old) =>
          (old || []).map((v) =>
            v.id === id ? { ...v, featured, featured_until } : v
          )
        );
        setMutationError(null);
      },
      onError: (err: any) => setMutationError(err.response?.data?.error || 'Failed to toggle featured.'),
    }
  );

  const assignMembershipMutation = useMutation(
    ({ id, planId }: { id: number; planId: number | null }) =>
      api.post(`/admin/vendors/${id}/assign_membership`, { membership_plan_id: planId }),
    {
      onSuccess: (response, { id }) => {
        queryClient.invalidateQueries('homepage');
        const vendorData = response.data;
        queryClient.setQueryData<Seller[]>('adminSellers', (old) =>
          (old || []).map((v) => (v.id === id ? { ...v, ...vendorData } : v))
        );
        setSelectedPlans(prev => ({ ...prev, [id]: null }));
        setMutationError(null);
      },
      onError: (err: any) => setMutationError(err.response?.data?.error || 'Failed to assign membership.'),
    }
  );

  const deleteMutation = useMutation(
    (id: number) => api.delete(`/admin/vendors/${id}`),
    {
      onSuccess: (_data, id) => {
        queryClient.setQueryData<Seller[]>('adminSellers', (old) =>
          (old || []).filter((v) => v.id !== id)
        );
        setDeleteTarget(null);
        setMutationError(null);
      },
      onError: (err: any) => setMutationError(err.response?.data?.error || 'Failed to delete seller.'),
    }
  );

  const handleApprove = (id: number) => approveMutation.mutate(id);
  const handleReject = () => {
    if (rejectTarget && rejectReason.trim()) {
      rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason.trim() });
    }
  };
  const handleDelete = (id: number) => deleteMutation.mutate(id);

  const handleToggleFeatured = (seller: Seller) => {
    if (seller.featured) {
      toggleFeaturedMutation.mutate({ id: seller.id, featured_until: null });
    } else {
      const until = new Date();
      until.setDate(until.getDate() + 30);
      toggleFeaturedMutation.mutate({ id: seller.id, featured_until: until.toISOString() });
    }
  };

  const handleAssignPlan = (sellerId: number) => {
    const planId = selectedPlans[sellerId];
    assignMembershipMutation.mutate({ id: sellerId, planId: planId ?? null });
  };

  const setPlanForSeller = (sellerId: number, planId: number | null) => {
    setSelectedPlans(prev => ({ ...prev, [sellerId]: planId }));
  };

  const filteredSellers = useMemo(() => {
    return sellers.filter((s) => {
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchesSearch =
        !searchTerm ||
        s.business_name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [sellers, statusFilter, searchTerm]);

  const statusCounts = {
    all: sellers.length,
    pending: sellers.filter(s => s.status === 'pending').length,
    approved: sellers.filter(s => s.status === 'approved').length,
    rejected: sellers.filter(s => s.status === 'rejected').length,
    suspended: sellers.filter(s => s.status === 'suspended').length,
  };

  const statusTabClass = (status: string) =>
    `px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] transition border ${
      statusFilter === status
        ? 'bg-orange-500 text-white border-orange-500 shadow-card'
        : 'bg-white text-text-secondary border-border-light hover:border-border-medium'
    }`;

  if (isLoading) return <div className="text-center py-20 text-sm text-text-muted">Loading sellers...</div>;
  if (error) return <div className="text-center py-20 text-sm text-red-500">Failed to load sellers.</div>;

  return (
    <div className="space-y-3">
      <h1 className="text-product-title font-semibold text-text-primary">Sellers</h1>

      {mutationError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center justify-between">
          <span>{mutationError}</span>
          <button onClick={() => setMutationError(null)} className="text-red-500 hover:text-red-700">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Search by business name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-9 pl-9 pr-3 text-xs border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
        />
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setStatusFilter('all')} className={statusTabClass('all')}>
          All ({statusCounts.all})
        </button>
        <button onClick={() => setStatusFilter('pending')} className={statusTabClass('pending')}>
          Pending ({statusCounts.pending})
        </button>
        <button onClick={() => setStatusFilter('approved')} className={statusTabClass('approved')}>
          Approved ({statusCounts.approved})
        </button>
        <button onClick={() => setStatusFilter('rejected')} className={statusTabClass('rejected')}>
          Rejected ({statusCounts.rejected})
        </button>
        <button onClick={() => setStatusFilter('suspended')} className={statusTabClass('suspended')}>
          Suspended ({statusCounts.suspended})
        </button>
      </div>

      {/* Sellers Table */}
      <div className="card-product overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-light bg-surface-hover">
                <th className="text-left py-2.5 px-4 text-xs font-medium text-text-muted uppercase">Business</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-text-muted uppercase">Contact</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-text-muted uppercase">Membership</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-text-muted uppercase">Status</th>
                <th className="text-right py-2.5 px-4 text-xs font-medium text-text-muted uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {filteredSellers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-text-muted">
                    No sellers found.
                  </td>
                </tr>
              )}
              {filteredSellers.map(seller => (
                <tr key={seller.id} className="hover:bg-surface-hover transition">
                  <td className="px-4 py-3 text-sm font-medium text-text-primary">
                    <div className="flex items-center gap-2">
                      {seller.business_name}
                      {seller.is_bulk_supplier && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-orange-100 text-orange-800 rounded text-[10px] font-semibold">
                          <CubeIcon className="w-3 h-3" /> Bulk
                        </span>
                      )}
                    </div>
                    {seller.rejection_reason && seller.status === 'rejected' && (
                      <p className="text-xs text-red-600 mt-1">Reason: {seller.rejection_reason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">
                    <p>{seller.user?.full_name}</p>
                    <p className="text-text-muted">{seller.user?.phone || 'N/A'}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">
                    {seller.membership_plan ? (
                      <div className="flex items-center gap-1">
                        <ShieldCheckIcon className="w-3.5 h-3.5 text-orange-500" />
                        <span className="font-medium">{seller.membership_plan.name}</span>
                      </div>
                    ) : (
                      <span className="text-text-muted">None</span>
                    )}
                    {seller.featured && (
                      <div className="flex items-center gap-1 mt-1">
                        <StarIcon className="w-3.5 h-3.5 text-yellow-500" />
                        <span className="text-yellow-700">Featured</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                      seller.status === 'approved' ? 'bg-green-100 text-green-700' :
                      seller.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      seller.status === 'suspended' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {seller.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {/* View */}
                      <button
                        onClick={() => setViewTarget(seller)}
                        className="text-xs px-2.5 py-1 rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition"
                      >
                        View
                      </button>

                      {/* Approve / Reject */}
                      {seller.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(seller.id)}
                            disabled={approveMutation.isLoading}
                            className="text-xs px-2.5 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectTarget(seller)}
                            className="text-xs px-2.5 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 transition"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {/* Suspend / Unsuspend */}
                      {seller.status === 'approved' && (
                        <button
                          onClick={() => suspendMutation.mutate(seller.id)}
                          disabled={suspendMutation.isLoading}
                          className="text-xs px-2.5 py-1 rounded border border-yellow-300 text-yellow-600 hover:bg-yellow-50 transition disabled:opacity-50"
                        >
                          Suspend
                        </button>
                      )}
                      {seller.status === 'suspended' && (
                        <button
                          onClick={() => unsuspendMutation.mutate(seller.id)}
                          disabled={unsuspendMutation.isLoading}
                          className="text-xs px-2.5 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
                        >
                          Unsuspend
                        </button>
                      )}

                      {/* Feature / Unfeature */}
                      <button
                        onClick={() => handleToggleFeatured(seller)}
                        className={`text-xs px-2.5 py-1 rounded border ${
                          seller.featured
                            ? 'border-yellow-400 text-yellow-700 bg-yellow-50 hover:bg-yellow-100'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        } transition`}
                      >
                        {seller.featured ? 'Unfeature' : 'Feature'}
                      </button>

                      {/* Assign Membership */}
                      {seller.status === 'approved' && (
                        <div className="flex items-center gap-1">
                          <select
                            value={selectedPlans[seller.id] ?? ''}
                            onChange={(e) =>
                              setPlanForSeller(
                                seller.id,
                                e.target.value ? parseInt(e.target.value) : null
                              )
                            }
                            className="text-xs border border-border-light rounded px-2 py-1 bg-white max-w-[120px] truncate"
                          >
                            <option value="">None</option>
                            {plans.map((plan) => (
                              <option key={plan.id} value={plan.id}>
                                {plan.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAssignPlan(seller.id)}
                            className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600 transition"
                          >
                            Assign
                          </button>
                        </div>
                      )}

                      {/* Delete – icon only */}
                      <button
                        onClick={() => setDeleteTarget(seller)}
                        className="p-1.5 rounded hover:bg-red-50 text-red-500 transition"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {viewTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{viewTarget.business_name}</h2>
                  <p className="text-sm text-gray-500">Application Details</p>
                </div>
                <button onClick={() => setViewTarget(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    viewTarget.status === 'approved' ? 'bg-green-100 text-green-700' :
                    viewTarget.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    viewTarget.status === 'suspended' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {viewTarget.status.toUpperCase()}
                  </span>
                  {viewTarget.featured && (
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center gap-1">
                      <StarIcon className="w-3 h-3" /> Featured
                    </span>
                  )}
                  {viewTarget.is_bulk_supplier && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full text-xs">
                      <CubeIcon className="w-3 h-3" /> Bulk Supplier
                    </span>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-orange-500" /> Owner Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Full Name:</span>
                      <p className="font-medium text-gray-900">{viewTarget.user?.full_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <p className="font-medium text-gray-900">{viewTarget.user?.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <BuildingOfficeIcon className="w-4 h-4 text-orange-500" /> Business Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Address:</span>
                      <p className="font-medium text-gray-900">{viewTarget.business_address || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">TIN:</span>
                      <p className="font-medium text-gray-900">{viewTarget.tin || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Fayda ID:</span>
                      <p className="font-medium text-gray-900">{viewTarget.national_id || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Telebirr Number:</span>
                      <p className="font-medium text-gray-900">{viewTarget.telebirr_number || 'N/A'}</p>
                    </div>
                    {viewTarget.membership_plan && (
                      <div className="sm:col-span-2">
                        <span className="text-gray-500">Membership:</span>
                        <p className="font-medium text-gray-900">
                          {viewTarget.membership_plan.name}
                          {viewTarget.membership_plan.expires_at && (
                            <span className="text-xs text-gray-500 ml-1">
                              (expires {new Date(viewTarget.membership_plan.expires_at).toLocaleDateString()})
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                    {viewTarget.sponsored_products_count != null && (
                      <div>
                        <span className="text-gray-500">Sponsored Products:</span>
                        <p className="font-medium text-gray-900">{viewTarget.sponsored_products_count}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <DocumentTextIcon className="w-4 h-4 text-orange-500" /> Documents
                  </h3>
                  <div className="space-y-2">
                    {viewTarget.license_document_url ? (
                      <a
                        href={viewTarget.license_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-brand hover:underline text-sm"
                      >
                        <DocumentTextIcon className="w-4 h-4" /> Business License
                      </a>
                    ) : (
                      <p className="text-sm text-gray-500">No business license uploaded</p>
                    )}
                    {viewTarget.id_document_url ? (
                      <a
                        href={viewTarget.id_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-brand hover:underline text-sm"
                      >
                        <IdentificationIcon className="w-4 h-4" /> ID Document
                      </a>
                    ) : (
                      <p className="text-sm text-gray-500">No ID uploaded</p>
                    )}
                    {viewTarget.tin_certificate_url ? (
                      <a
                        href={viewTarget.tin_certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-brand hover:underline text-sm"
                      >
                        <DocumentTextIcon className="w-4 h-4" /> TIN Certificate
                      </a>
                    ) : (
                      <p className="text-sm text-gray-500">No TIN certificate uploaded</p>
                    )}
                    {viewTarget.business_license_url ? (
                      <a
                        href={viewTarget.business_license_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-brand hover:underline text-sm"
                      >
                        <DocumentTextIcon className="w-4 h-4" /> Business License Document
                      </a>
                    ) : (
                      <p className="text-sm text-gray-500">No additional business license uploaded</p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-orange-500" /> Timeline
                  </h3>
                  <div className="text-sm space-y-1">
                    <p><span className="text-gray-500">Applied:</span> {new Date(viewTarget.created_at).toLocaleDateString()}</p>
                    {viewTarget.approved_at && <p className="text-green-700">Approved: {new Date(viewTarget.approved_at).toLocaleString()}</p>}
                    {viewTarget.rejected_at && <p className="text-red-700">Rejected: {new Date(viewTarget.rejected_at).toLocaleString()}</p>}
                  </div>
                </div>
              </div>

              <button onClick={() => setViewTarget(null)} className="w-full mt-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition">
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rejection Reason Modal */}
      <AnimatePresence>
        {rejectTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="card-product p-5 max-w-md w-full"
            >
              <div className="flex items-center gap-2 mb-4">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
                <h2 className="text-base font-semibold text-text-primary">Reject Seller</h2>
              </div>
              <p className="text-sm text-text-secondary mb-3">
                Reject <strong>{rejectTarget.business_name}</strong>
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                placeholder="Explain why this seller is being rejected..."
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => {
                    setRejectTarget(null);
                    setRejectReason('');
                  }}
                  className="btn-secondary py-2 px-4 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || rejectMutation.isLoading}
                  className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-[var(--radius-sm)] text-sm font-medium transition disabled:opacity-50"
                >
                  {rejectMutation.isLoading ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="card-product p-5 max-w-md w-full"
            >
              <h2 className="text-base font-semibold text-text-primary mb-2">Confirm Delete</h2>
              <p className="text-sm text-text-secondary mb-5">
                Delete seller "{deleteTarget.business_name}"? This cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteTarget(null)} className="btn-secondary py-2 px-4 text-sm">
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteTarget.id)}
                  className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-[var(--radius-sm)] text-sm font-medium transition"
                  disabled={deleteMutation.isLoading}
                >
                  {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SellersPage;