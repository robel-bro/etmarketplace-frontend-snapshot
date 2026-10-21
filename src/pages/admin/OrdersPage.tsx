// src/pages/admin/OrdersPage.tsx
import { useState } from 'react';
import { useQuery } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  TruckIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  UserIcon,
  BuildingStorefrontIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CubeIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowUturnLeftIcon,          // ★ FOR RETURN POLICY
} from '@heroicons/react/24/outline';
import api from '../../lib/axios';

const statusColors: Record<string, string> = {
  pending_acceptance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  accepted: 'bg-blue-100 text-blue-800 border-blue-200',
  shipped: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  returned: 'bg-gray-100 text-gray-800 border-gray-200',
};

type SortField = 'id' | 'buyer' | 'vendor' | 'total' | 'created_at';

const AdminOrdersPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailTab, setDetailTab] = useState<'items' | 'financial' | 'delivery' | 'timeline'>('items');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading, error } = useQuery(
    ['adminOrders', statusFilter, page, sortBy, sortOrder],
    () => {
      const params: any = {
        status: statusFilter,
        page: page || 1,
        per_page: 25,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      return api.get('/admin/orders', { params }).then(r => r.data);
    },
    { staleTime: 0, refetchOnMount: true }
  );

  const orders = data?.data || [];
  const meta = data?.meta || { current_page: 1, total_pages: 1, total_count: 0 };

  const filtered = orders.filter((o: any) =>
    o.buyer?.toLowerCase().includes(search.toLowerCase()) ||
    o.vendor?.toLowerCase().includes(search.toLowerCase()) ||
    o.id.toString().includes(search)
  );

  const fetchOrderDetail = async (id: number) => {
    try {
      const res = await api.get(`/admin/orders/${id}`);
      setSelectedOrder(res.data);
    } catch (e: any) {
      alert('Failed to load order details. Please try again.');
    }
  };

  const formatCurrency = (val: number | string) =>
    Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <ChevronUpDownIcon className="w-3.5 h-3.5 text-gray-400" />;
    return sortOrder === 'asc' ? (
      <ChevronUpIcon className="w-3.5 h-3.5 text-brand" />
    ) : (
      <ChevronDownIcon className="w-3.5 h-3.5 text-brand" />
    );
  };

  const handlePrevPage = () => setPage(p => Math.max(1, p - 1));
  const handleNextPage = () => setPage(p => Math.min(meta.total_pages, p + 1));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            {meta.total_count} total · Page {meta.current_page} of {meta.total_pages}
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by buyer, seller, order ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 text-sm border border-gray-200 rounded-none bg-white focus:ring-2 focus:ring-brand focus:border-brand"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-10 px-3 text-sm border border-gray-200 rounded-none bg-white"
        >
          <option value="all">All Status</option>
          <option value="pending_acceptance">Pending Acceptance</option>
          <option value="accepted">Accepted</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {isLoading && <div className="text-center py-10 text-gray-500">Loading orders...</div>}
      {error && <div className="text-red-500 text-center py-10">Failed to load orders.</div>}

      {/* Enterprise Table – rectangular styling */}
      <div className="bg-white shadow-sm border border-gray-200 overflow-hidden rounded-none">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[
                { label: 'Order', field: 'id' as SortField },
                { label: 'Buyer', field: 'buyer' as SortField },
                { label: 'Seller', field: 'vendor' as SortField },
                { label: 'Items' },
                { label: 'Total', field: 'total' as SortField },
                { label: 'Status' },
                { label: 'Date', field: 'created_at' as SortField },
                { label: 'Carrier' },
                { label: '', className: 'w-20' },
              ].map(col =>
                col.field ? (
                  <th
                    key={col.field}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                    onClick={() => toggleSort(col.field!)}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      <SortIcon field={col.field} />
                    </div>
                  </th>
                ) : (
                  <th
                    key={col.label}
                    className={`px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${col.className || ''}`}
                  >
                    {col.label}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((order: any) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">#{order.id}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{order.buyer}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{order.vendor}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{order.items_count} items</td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">ETB {formatCurrency(order.total)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full border ${statusColors[order.status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                    {order.status?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <TruckIcon className="w-4 h-4 text-gray-400" />
                    {order.carrier || '—'}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => fetchOrderDetail(order.id)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover transition-colors"
                  >
                    <EyeIcon className="w-4 h-4" />
                    View
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-none">
          <span className="text-sm text-gray-600">
            Showing {filtered.length} of {meta.total_count} orders
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={meta.current_page <= 1}
              className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-none hover:bg-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-700">
              Page {meta.current_page} of {meta.total_pages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={meta.current_page >= meta.total_pages}
              className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-none hover:bg-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ===== Order Detail Modal ===== */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 px-4 overflow-y-auto"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto mb-10 rounded-none"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-none">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Order #{selectedOrder.id}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {new Date(selectedOrder.dates?.created).toLocaleDateString('en-US', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    })}
                    {' · '}
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${statusColors[selectedOrder.status] || ''}`}>
                      {selectedOrder.status?.replace(/_/g, ' ')}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-100 rounded-none transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Buyer & Vendor cards */}
              <div className="grid grid-cols-2 gap-4 px-6 py-4 border-b border-gray-50">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-none bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedOrder.buyer?.name}</p>
                    <p className="text-xs text-gray-500">{selectedOrder.buyer?.email}</p>
                    <p className="text-xs text-gray-500">{selectedOrder.buyer?.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-none bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <BuildingStorefrontIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedOrder.vendor?.name}</p>
                    <p className="text-xs text-gray-500">{selectedOrder.vendor?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100 px-6">
                {(['items', 'financial', 'delivery', 'timeline'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setDetailTab(tab)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors rounded-none ${
                      detailTab === tab
                        ? 'border-brand text-brand'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab === 'items' && 'Items'}
                    {tab === 'financial' && 'Financial'}
                    {tab === 'delivery' && 'Delivery'}
                    {tab === 'timeline' && 'Timeline'}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="px-6 py-4">
                {detailTab === 'items' && (
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex gap-4 items-start p-3 bg-gray-50 rounded-none">
                        {item.image ? (
                          <img src={item.image} className="w-16 h-16 rounded-none object-cover border border-gray-200" />
                        ) : (
                          <div className="w-16 h-16 rounded-none bg-gray-200 flex items-center justify-center">
                            <CubeIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Qty: {item.quantity} × ETB {formatCurrency(item.unit_price)}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-gray-900">ETB {formatCurrency(item.total_price)}</p>
                      </div>
                    ))}
                  </div>
                )}

                {detailTab === 'financial' && (
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-none p-4 space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-medium">ETB {formatCurrency(selectedOrder.financial?.subtotal)}</span></div>
                      {selectedOrder.financial?.discount > 0 && (
                        <div className="flex justify-between"><span className="text-gray-600">Discount</span><span className="font-medium text-red-600">-ETB {formatCurrency(selectedOrder.financial.discount)}</span></div>
                      )}
                      {selectedOrder.financial?.service_fee > 0 && (
                        <div className="flex justify-between"><span className="text-gray-600">Service Fee</span><span className="font-medium">ETB {formatCurrency(selectedOrder.financial.service_fee)}</span></div>
                      )}
                      {selectedOrder.financial?.vat > 0 && (
                        <div className="flex justify-between"><span className="text-gray-600">VAT</span><span className="font-medium">ETB {formatCurrency(selectedOrder.financial.vat)}</span></div>
                      )}
                      <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span className="font-medium">ETB {formatCurrency(selectedOrder.financial?.shipping_cost || 0)}</span></div>
                      <hr className="border-gray-200" />
                      <div className="flex justify-between text-base font-bold"><span>Grand Total</span><span>ETB {formatCurrency(selectedOrder.financial?.grand_total)}</span></div>
                    </div>

                    {/* ★ Return Policy Block – frozen at checkout */}
                    {selectedOrder.return_window_days != null && (
                      <div className="bg-blue-50 rounded-none p-4 border border-blue-100">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <ArrowUturnLeftIcon className="w-4 h-4 text-blue-600" /> Return Policy
                        </h4>
                        <div className="text-sm text-gray-700 space-y-1">
                          <p><span className="font-medium">Window:</span> {selectedOrder.return_window_days} days after delivery</p>
                          <p><span className="font-medium">Restocking Fee:</span> {selectedOrder.restocking_fee_percent}%</p>
                          <p><span className="font-medium">Return Shipping Paid By:</span> {selectedOrder.return_shipping_responsibility}</p>
                          {selectedOrder.return_deadline && (
                            <p className="text-xs text-gray-500 mt-1">
                              Deadline: {new Date(selectedOrder.return_deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CurrencyDollarIcon className="w-4 h-4" />
                      <span>Payment: {selectedOrder.payment_method?.replace(/_/g, ' ')} · {selectedOrder.payment_status?.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                )}

                {detailTab === 'delivery' && (
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-none p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Shipping Address</h4>
                      <p className="text-sm text-gray-600">{selectedOrder.shipping_address || 'No address provided'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-none p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Carrier</h4>
                      <div className="flex items-center gap-2">
                        <TruckIcon className="w-5 h-5 text-gray-500" />
                        <span className="text-sm text-gray-700">{selectedOrder.delivery?.carrier || 'Not assigned'}</span>
                      </div>
                      {selectedOrder.delivery?.estimated_delivery && (
                        <p className="text-xs text-gray-500 mt-1">
                          Estimated delivery: {new Date(selectedOrder.delivery.estimated_delivery).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {detailTab === 'timeline' && (
                  <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                    {selectedOrder.dates?.created && (
                      <div className="relative">
                        <div className="absolute -left-[25px] mt-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
                        <p className="text-sm font-medium text-gray-900">Order Created</p>
                        <p className="text-xs text-gray-500">{new Date(selectedOrder.dates.created).toLocaleString()}</p>
                      </div>
                    )}
                    {selectedOrder.dates?.accepted && (
                      <div className="relative">
                        <div className="absolute -left-[25px] mt-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                        <p className="text-sm font-medium text-gray-900">Accepted by Seller</p>
                        <p className="text-xs text-gray-500">{new Date(selectedOrder.dates.accepted).toLocaleString()}</p>
                      </div>
                    )}
                    {selectedOrder.dates?.shipped && (
                      <div className="relative">
                        <div className="absolute -left-[25px] mt-1 w-3 h-3 rounded-full bg-purple-500 border-2 border-white" />
                        <p className="text-sm font-medium text-gray-900">Shipped</p>
                        <p className="text-xs text-gray-500">{new Date(selectedOrder.dates.shipped).toLocaleString()}</p>
                      </div>
                    )}
                    {selectedOrder.dates?.delivered && (
                      <div className="relative">
                        <div className="absolute -left-[25px] mt-1 w-3 h-3 rounded-full bg-green-600 border-2 border-white" />
                        <p className="text-sm font-medium text-gray-900">Delivered</p>
                        <p className="text-xs text-gray-500">{new Date(selectedOrder.dates.delivered).toLocaleString()}</p>
                      </div>
                    )}
                    {selectedOrder.delivery?.events?.map((event: any, idx: number) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[25px] mt-1 w-3 h-3 rounded-full bg-gray-400 border-2 border-white" />
                        <p className="text-sm font-medium text-gray-900 capitalize">{event.status?.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-500">{new Date(event.at || event.timestamp).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="border-t border-gray-100 px-6 py-4 flex justify-between items-center">
                <div className="flex gap-2">
                  <a
                    href={selectedOrder.invoice_url}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-brand border border-brand rounded-none hover:bg-brand-light transition-colors"
                  >
                    <DocumentTextIcon className="w-4 h-4" />
                    Invoice
                  </a>
                  <a
                    href={`${import.meta.env.VITE_API_URL}${selectedOrder.pdf_url}`}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-brand rounded-none hover:bg-brand-hover transition-colors"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    PDF
                  </a>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-none hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrdersPage;