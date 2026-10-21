// src/pages/seller/OrdersPage.tsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from 'react-query';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import api from '../../lib/axios';
import OrderDetailsModal from '../../components/seller/OrderDetailsModal';
import { useAuth } from '../../hooks/useAuth';
import { initCable, subscribeToSellerOrders } from '../../lib/cable';

interface OrderItem {
  product_id: number;
  title: string;
  quantity: number;
  price: number;
  image: string;
}

interface DeliveryRequest {
  id: number;
  status: string;
  logistics_partner?: { id: number; name: string } | null;
}

interface Order {
  id: number;
  buyer_name: string;
  total: number;
  shipping_cost?: number;
  consolidated_shipping?: number;
  status: string;
  payment_status: string;
  created_at: string;
  acceptance_deadline?: string;
  shipping_address: string;
  items: OrderItem[];
  delivery_requests?: DeliveryRequest[];
  return_request?: {
    status: string;
    reason: string;
    liability?: string;
    return_shipping_cost: number;
    admin_notes?: string;
  } | null;
}

interface OrdersResponse {
  data: Order[];
  meta: {
    current_page: number;
    per_page: number;
    total_count: number;
    next_page: number | null;
  };
}

const OrdersPage = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const vendorId = user?.vendor?.id;

  // Initialize ActionCable when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('access_token');
      if (token) initCable(token);
    }
  }, [isAuthenticated, user]);

  // Subscribe to seller orders channel for live updates
  useEffect(() => {
    if (!vendorId) return;

    const subscription = subscribeToSellerOrders({
      received: (data) => {
        if (data.type === 'order_created' || data.type === 'order_updated') {
          queryClient.invalidateQueries(['sellerOrders']);
        }
      },
      connected: () => {
        console.log('SellerOrdersChannel connected.');
      },
      disconnected: () => {
        console.log('SellerOrdersChannel disconnected.');
      },
      rejected: () => {
        console.warn('SellerOrdersChannel rejected.');
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [vendorId, queryClient]);

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery<OrdersResponse>(
    ['sellerOrders', search, filterStatus],
    async ({ pageParam = 1 }) => {
      const res = await api.get('/seller/orders', {
        params: { page: pageParam },
      });
      return res.data;
    },
    {
      getNextPageParam: (lastPage) => lastPage.meta?.next_page || undefined,
      staleTime: 30 * 1000,
      keepPreviousData: true,
    }
  );

  const orders = data?.pages.flatMap((page) => page.data) ?? [];
  const totalCount = data?.pages[0]?.meta?.total_count ?? 0;

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const acceptOrder = useMutation(
    (orderId: number) => api.post(`/seller/orders/${orderId}/accept`),
    {
      onSuccess: () => queryClient.invalidateQueries(['sellerOrders']),
      onError: (err: any) => {
        alert(err?.response?.data?.error || 'Failed to accept order');
      },
    }
  );

  const rejectOrder = useMutation(
    (orderId: number) => api.post(`/seller/orders/${orderId}/reject`),
    {
      onSuccess: () => queryClient.invalidateQueries(['sellerOrders']),
      onError: (err: any) => {
        alert(err?.response?.data?.error || 'Failed to reject order');
      },
    }
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="card-product overflow-hidden">
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-6 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-red-500">Failed to load orders.</p>
        <button
          onClick={() => refetch()}
          className="mt-2 inline-flex items-center gap-1 text-xs text-brand hover:underline"
        >
          <ArrowPathIcon className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  const filteredOrders = orders.filter((o) => {
    const term = search.toLowerCase();
    const status = String(o.status || '');
    const buyerName = (o.buyer_name || '').toLowerCase();
    const matchesSearch =
      String(o.id).includes(term) ||
      buyerName.includes(term) ||
      (o.shipping_address || '').toLowerCase().includes(term) ||
      (o.items || []).some((item: any) => (item.title || '').toLowerCase().includes(term));
    const matchesFilter = filterStatus === 'all' || status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'shipped':
        return 'bg-blue-100 text-blue-700';
      case 'processing':
      case 'accepted':
        return 'bg-yellow-100 text-yellow-700';
      case 'pending':
        return 'bg-purple-100 text-purple-700';
      case 'pending_acceptance':
        return 'bg-orange-100 text-orange-700';
      case 'cancelled':
      case 'returned':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-text-secondary';
    }
  };

  const getDeadlineInfo = (order: any) => {
    if ((order.status !== 'pending_acceptance' && order.status !== 'pending') || !order.acceptance_deadline) return null;
    const deadline = new Date(order.acceptance_deadline);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    if (diffMs <= 0) return { text: 'Expired', className: 'text-red-600 font-bold' };
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return { text: `${hours}h ${minutes}m left`, className: 'text-orange-600 font-medium' };
  };

  // Helper to display delivery request status/partner
  const getDeliveryDisplay = (order: Order) => {
    const dr = order.delivery_requests?.[0];
    if (!dr) return '—';
    const partnerName = dr.logistics_partner?.name || 'Pending';
    return (
      <span className="text-xs">
        <span className={`inline-block px-2 py-0.5 rounded-full ${getStatusBadge(dr.status)}`}>
          {dr.status.replace(/_/g, ' ')}
        </span>
        <span className="block text-[10px] text-text-muted mt-0.5">{partnerName}</span>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <h1 className="text-product-title font-semibold text-text-primary">Orders</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by order ID, customer, or address…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-4 h-4 text-text-muted" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand w-full md:w-48"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Payment</option>
            <option value="pending_acceptance">Pending Acceptance</option>
            <option value="accepted">Accepted</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="returned">Returned</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card-product overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-hover border-b border-border-light">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Order ID</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Customer</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Date</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Total</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Delivery</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Return Info</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Deadline</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-text-muted uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-text-muted">No orders found.</td>
              </tr>
            ) : (
              filteredOrders.map((order: Order) => {
                const status = order.status;
                const deadline = getDeadlineInfo(order);
                const customer = order.buyer_name || '—';
                const shippingCost = order.consolidated_shipping ?? order.shipping_cost ?? 0;
                const returnRequest = order.return_request;
                const isPendingAccept = status === 'pending' || status === 'pending_acceptance';

                return (
                  <tr key={order.id} className="hover:bg-surface-hover transition">
                    <td className="px-4 py-3 text-xs font-medium text-text-primary">{order.id}</td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{customer}</td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-text-primary">ETB {order.total}</td>
                    <td className="px-4 py-3">{getDeliveryDisplay(order)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full ${getStatusBadge(status)}`}>
                        {status.replace(/_/g, ' ')}
                      </span>
                      {order.payment_status === 'refunded' && (
                        <span className="ml-1 inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full bg-red-100 text-red-700">
                          Refunded
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {returnRequest ? (
                        <div className="space-y-1">
                          <span className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-100 text-blue-700">
                            {returnRequest.status?.replace(/_/g, ' ')}
                          </span>
                          <p className="text-text-secondary">Reason: {returnRequest.reason?.replace(/_/g, ' ')}</p>
                          {returnRequest.liability && (
                            <p className="text-text-secondary">Liability: {returnRequest.liability}</p>
                          )}
                          {returnRequest.return_shipping_cost > 0 && (
                            <p className="text-red-600 font-medium">
                              Penalty: ETB {returnRequest.return_shipping_cost}
                            </p>
                          )}
                          {returnRequest.admin_notes && (
                            <p className="text-text-muted text-[10px] italic">"{returnRequest.admin_notes}"</p>
                          )}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {deadline ? (
                        <span className={deadline.className}>{deadline.text}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isPendingAccept && (
                          <>
                            <button
                              onClick={() => acceptOrder.mutate(order.id)}
                              disabled={acceptOrder.isLoading}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-emerald-600 text-emerald-700 hover:bg-emerald-50 transition disabled:opacity-50"
                            >
                              {acceptOrder.isLoading ? (
                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircleIcon className="w-4 h-4" />
                              )}
                              Accept
                            </button>
                            <button
                              onClick={() => rejectOrder.mutate(order.id)}
                              disabled={rejectOrder.isLoading}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-rose-600 text-rose-700 hover:bg-rose-50 transition disabled:opacity-50"
                            >
                              {rejectOrder.isLoading ? (
                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                              ) : (
                                <XCircleIcon className="w-4 h-4" />
                              )}
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedOrderId(order.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                        >
                          <EyeIcon className="w-4 h-4" />
                          View
                        </button>
                        {(status === 'delivered' || status === 'completed') && (
                          <Link
                            to={`/invoices/${order.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                          >
                            Invoice
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={loadMoreRef} className="flex justify-center py-4">
        {isFetchingNextPage ? (
          <span className="text-xs text-text-muted">Loading more orders…</span>
        ) : hasNextPage ? (
          <span className="text-xs text-text-muted">Scroll for more</span>
        ) : (
          <span className="text-xs text-text-muted">
            {totalCount > 0 ? `All ${totalCount} orders loaded` : ''}
          </span>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrderId && (
        <OrderDetailsModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onAccept={(id) => acceptOrder.mutate(id)}
          onReject={(id) => rejectOrder.mutate(id)}
        />
      )}
    </div>
  );
};

export default OrdersPage;