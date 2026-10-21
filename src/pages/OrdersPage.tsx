import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  Clock,
  ShoppingBag,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  TruckIcon,
  FileTextIcon,
  DownloadIcon,
  Undo2,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import api from '../lib/axios';
import ReturnRequestModal from '../components/features/returns/ReturnRequestModal';

interface OrderItem {
  product_id: number;
  title: string;
  quantity: number;
  price: number;
  image: string;
}

interface Order {
  id: number;
  status: string;
  created_at: string;
  total: number;
  shipping_address: string;
  consolidated_shipping?: number;
  shipping_cost?: number;
  acceptance_deadline?: string;
  return_window_days?: number;
  restocking_fee_percent?: number;
  return_shipping_responsibility?: string;
  return_deadline?: string;
  active_return_request?: { id: number; status: string } | null;
  items: OrderItem[];
  delivery_requests?: Array<{
    status: string;
    logistics_partner?: { name: string } | null;
  }>;
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

const toDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const OrdersPage = () => {
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [quickRange, setQuickRange] = useState<string>('all');
  const [returnModalOrderId, setReturnModalOrderId] = useState<number | null>(null);

  const { data: response, isLoading, isError, refetch, isFetching } = useQuery<OrdersResponse>(
    ['orders', page, startDate, endDate],
    () =>
      api
        .get('/orders', {
          params: {
            page,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
          },
        })
        .then(res => res.data),
    { keepPreviousData: true }
  );

  const orders = response?.data ?? [];
  const meta = response?.meta;

  const applyQuickRange = (range: string) => {
    const today = new Date();
    let start = '';
    let end = '';
    switch (range) {
      case 'today':
        start = toDateString(today);
        end = toDateString(today);
        break;
      case '7days':
        start = toDateString(new Date(today.getTime() - 6 * 86400000));
        end = toDateString(today);
        break;
      case '30days':
        start = toDateString(new Date(today.getTime() - 29 * 86400000));
        end = toDateString(today);
        break;
      default:
        start = '';
        end = '';
    }
    setStartDate(start);
    setEndDate(end);
    setQuickRange(range);
    setPage(1);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setQuickRange('all');
    setPage(1);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
    setQuickRange('custom');
    setPage(1);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
    setQuickRange('custom');
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="bg-[#F5F5F5]">
        <div className="max-w-7xl mx-auto py-4">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card-product p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-[#F5F5F5] flex items-center justify-center h-64">
        <div className="text-center text-red-500">
          <p className="text-base font-semibold">Failed to load orders</p>
          <button
            onClick={() => refetch()}
            className="mt-2 inline-flex items-center gap-1 text-xs text-brand hover:underline"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
          <Link to="/" className="text-xs text-brand hover:underline mt-2 block">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'shipped':
        return 'bg-blue-100 text-blue-700';
      case 'processing':
      case 'accepted':
        return 'bg-yellow-100 text-yellow-700';
      case 'pending_acceptance':
        return 'bg-orange-100 text-orange-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-text-secondary';
    }
  };

  const getDeadlineInfo = (order: Order) => {
    if (order.status !== 'pending_acceptance' || !order.acceptance_deadline) return null;
    const deadline = new Date(order.acceptance_deadline);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    if (diffMs <= 0) return { text: 'Expired', className: 'text-red-600 font-bold' };
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return { text: `${hours}h ${minutes}m left`, className: 'text-orange-600 font-medium' };
  };

  const getReturnInfo = (order: Order) => {
    if (!order.return_window_days) return null;
    const isDelivered = order.status === 'delivered';
    let deadline: Date | null = null;
    if (order.return_deadline) {
      deadline = new Date(order.return_deadline);
    } else if (order.delivered_at) {
      deadline = new Date(new Date(order.delivered_at).getTime() + order.return_window_days * 86400000);
    }
    const now = new Date();
    const isOpen = isDelivered && deadline ? now < deadline : false;
    const daysLeft = isOpen && deadline ? Math.ceil((deadline.getTime() - now.getTime()) / 86400000) : 0;
    return {
      deadline,
      daysLeft,
      isOpen,
      restockingFee: order.restocking_fee_percent || 0,
      returnShipping: order.return_shipping_responsibility || 'buyer',
      isDelivered,
    };
  };

  const downloadPdf = async (orderId: number) => {
    try {
      const res = await api.get(`/orders/${orderId}/invoice.pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${orderId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF download failed:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && (!meta || newPage <= Math.ceil(meta.total_count / meta.per_page))) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const totalPages = meta ? Math.ceil(meta.total_count / meta.per_page) : 1;

  // Generate page numbers for pagination (with ellipsis if many)
  const getPageNumbers = (): (number | string)[] => {
    const total = totalPages;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const current = page;
    const pages: (number | string)[] = [1];
    if (current > 3) pages.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  };

  return (
    <div className="bg-[#F5F5F5]">
      <div className="max-w-7xl mx-auto py-4">
        <div className="flex items-center gap-2.5 mb-4">
          <Link to="/buyer-central" className="text-text-muted hover:text-text-primary">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-product-title font-semibold text-text-primary">My Orders</h1>
        </div>

        {/* Date Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-4 bg-white p-3 rounded-md border border-border-light">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-text-muted" />
            <span className="text-xs font-medium text-text-primary">Filter by date:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              className="border border-border-light rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <span className="text-xs text-text-muted">to</span>
            <input
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              className="border border-border-light rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {[
              { key: 'today', label: 'Today' },
              { key: '7days', label: 'Last 7 Days' },
              { key: '30days', label: 'Last 30 Days' },
              { key: 'all', label: 'All' },
            ].map(r => (
              <button
                key={r.key}
                onClick={() => applyQuickRange(r.key)}
                className={`px-2.5 py-1 text-xs rounded border ${
                  quickRange === r.key
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white text-text-primary border-border-light hover:bg-surface-hover'
                }`}
              >
                {r.label}
              </button>
            ))}
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-xs text-text-muted hover:text-text-primary border border-border-light rounded"
            >
              Clear
            </button>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-secondary">
              {startDate || endDate ? 'No orders found for the selected dates' : 'No orders yet'}
            </p>
            <Link to="/all-products" className="text-xs text-brand hover:underline mt-2 inline-block">
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {orders.map((order: Order) => {
                const deadline = getDeadlineInfo(order);
                const returnInfo = getReturnInfo(order);
                const primaryProduct = order.items?.[0]?.title;
                const title = primaryProduct
                  ? `${primaryProduct}${order.items.length > 1 ? ` + ${order.items.length - 1} more` : ''}`
                  : `Order #${order.id}`;
                const shippingCost = order.consolidated_shipping ?? order.shipping_cost ?? 0;

                return (
                  <div key={order.id} className="card-product p-4">
                    <div className="flex justify-between items-start mb-2.5">
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="text-sm font-semibold text-text-primary">{title}</p>
                        <p className="text-xs text-text-muted">Order #{order.id}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-text-muted" />
                          <p className="text-xs text-text-muted">
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${getStatusBadge(order.status)}`}>
                        {String(order.status).replace(/_/g, ' ')}
                      </span>
                    </div>

                    {deadline && (
                      <div className="flex items-center gap-1 mb-2">
                        <Clock className="w-3.5 h-3.5 text-orange-500" />
                        <span className={`text-xs ${deadline.className}`}>
                          Awaiting seller acceptance · {deadline.text}
                        </span>
                      </div>
                    )}

                    {order.delivery_requests?.length > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        <TruckIcon className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-xs text-blue-600">
                          Delivery: {order.delivery_requests[0].status?.replace(/_/g, ' ')}
                          {order.delivery_requests[0].logistics_partner?.name &&
                            ` by ${order.delivery_requests[0].logistics_partner.name}`}
                        </span>
                      </div>
                    )}

                    {order.items?.length > 0 && (
                      <div className="space-y-2 mb-2.5">
                        {order.items.map((item: OrderItem) => (
                          <div key={item.product_id} className="flex items-center gap-3">
                            {item.image ? (
                              <img src={item.image} alt={item.title} className="w-10 h-10 rounded object-cover border border-border-light" />
                            ) : (
                              <div className="w-10 h-10 rounded bg-surface-hover flex items-center justify-center">
                                <ShoppingBag className="w-4 h-4 text-text-muted" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text-primary truncate">{item.title}</p>
                              <p className="text-xs text-text-muted">Qty: {item.quantity}</p>
                            </div>
                            <p className="text-sm font-semibold text-text-primary">ETB {formatCurrency(item.price)}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {returnInfo && (
                      <div className="bg-blue-50 p-3 rounded-md mb-2.5 border border-blue-100">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Undo2 className="w-4 h-4 text-blue-600" />
                          <p className="text-xs font-semibold text-blue-900">Return Policy</p>
                        </div>
                        <p className="text-xs text-blue-800">
                          Window: {order.return_window_days} days after delivery
                          {returnInfo.restockingFee > 0 && ` · Restocking fee: ${returnInfo.restockingFee}%`}
                        </p>
                        <p className="text-xs text-blue-800">
                          Return shipping paid by: {returnInfo.returnShipping}
                        </p>
                        {returnInfo.deadline && (
                          <p className="text-xs text-blue-800 mt-0.5">
                            Deadline: {returnInfo.deadline.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                        {returnInfo.isOpen ? (
                          <div className="mt-2 flex items-center gap-2">
                            {order.active_return_request ? (
                              <p className="text-xs font-medium text-blue-600">
                                Return request sent ({order.active_return_request.status})
                              </p>
                            ) : (
                              <>
                                <p className="text-xs font-medium text-green-700">
                                  {returnInfo.daysLeft} day{returnInfo.daysLeft !== 1 ? 's' : ''} left to return
                                </p>
                                <button
                                  onClick={() => setReturnModalOrderId(order.id)}
                                  className="text-xs px-3 py-1 bg-brand text-white rounded hover:bg-brand-hover"
                                >
                                  Request Return
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          !returnInfo.isDelivered ? (
                            <p className="text-xs text-gray-600 mt-1">Returns will be available after delivery.</p>
                          ) : (
                            <p className="text-xs font-medium text-red-600 mt-1">Return window closed</p>
                          )
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap justify-between items-center pt-2 border-t border-border-light gap-y-2">
                      <div>
                        <p className="text-xs text-text-muted">
                          {order.items?.length || 0} items · Total{' '}
                          <span className="font-semibold text-text-primary">ETB {formatCurrency(order.total)}</span>
                        </p>
                        {shippingCost > 0 && (
                          <p className="text-xs text-text-muted mt-0.5">
                            (incl. delivery ETB {formatCurrency(Number(shippingCost))})
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Link
                          to={`/invoices/${order.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-text-muted hover:text-text-primary"
                        >
                          <FileTextIcon className="w-3.5 h-3.5" />
                          Invoice
                        </Link>
                        <button
                          onClick={() => downloadPdf(order.id)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-text-muted hover:text-text-primary"
                          title="Download PDF"
                        >
                          <DownloadIcon className="w-3.5 h-3.5" />
                          PDF
                        </button>
                        <Link
                          to={`/order-tracking/${order.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                        >
                          View Details
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    {order.shipping_address && (
                      <div className="mt-2 pt-2 border-t border-border-light">
                        <p className="text-xs font-medium text-text-primary">Shipping Address</p>
                        <p className="text-xs text-text-muted">{order.shipping_address}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination with page numbers */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center mt-6 gap-1">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1 || isFetching}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border-light text-text-primary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {getPageNumbers().map((item, index) => (
                  item === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-xs text-text-muted">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => goToPage(Number(item))}
                      disabled={isFetching}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-xs font-medium border ${
                        page === item
                          ? 'bg-brand text-white border-brand'
                          : 'bg-white text-text-primary border-border-light hover:bg-surface-hover'
                      }`}
                    >
                      {item}
                    </button>
                  )
                ))}

                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={!meta?.next_page || isFetching}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border-light text-text-primary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

        {returnModalOrderId && (
          <ReturnRequestModal
            orderId={returnModalOrderId}
            onClose={() => setReturnModalOrderId(null)}
            onSuccess={() => {
              setReturnModalOrderId(null);
              refetch();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default OrdersPage;