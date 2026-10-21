// src/components/seller/OrderDetailsModal.tsx
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import {
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import api from '../../lib/axios';

interface OrderDetailsModalProps {
  orderId: number;
  onClose: () => void;
  onAccept?: (id: number) => void;
  onReject?: (id: number) => void;
}

const OrderDetailsModal = ({
  orderId,
  onClose,
  onAccept,
  onReject,
}: OrderDetailsModalProps) => {
  const { data: order, isLoading, isError, refetch } = useQuery(
    ['sellerOrder', orderId],
    () => api.get(`/seller/orders/${orderId}`).then(res => res.data),
    { enabled: !!orderId, staleTime: 30 * 1000 }
  );

  const status = order?.status || '';
  const items = order?.items || [];
  const calculatedSubtotal = items.reduce(
    (sum: number, item: any) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  );
  const subtotal = order?.subtotal ?? calculatedSubtotal;
  const shippingCost = order?.consolidated_shipping ?? order?.shipping_cost ?? 0;
  const discount = order?.discount_amount ?? 0;
  const serviceFee = order?.service_fee ?? 0;
  const vat = order?.vat_amount ?? 0;
  const total = order?.total ?? subtotal + shippingCost + serviceFee + vat - discount;
  const pickupReady = order?.vendor?.pickup_ready ?? false;
  const returnRequest = order?.return_request;

  const formatCurrency = (amount: number) => {
    return `ETB ${Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'shipped':
        return 'bg-blue-100 text-blue-700';
      case 'processing':
      case 'accepted':
        return 'bg-yellow-100 text-yellow-700';
      case 'pending_acceptance':
      case 'pending':
        return 'bg-orange-100 text-orange-700';
      case 'cancelled':
      case 'returned':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const renderActions = () => {
    // Only show Accept/Reject for pending or pending_acceptance orders
    if (status !== 'pending_acceptance' && status !== 'pending') return null;
    if (!onAccept && !onReject) return null;

    return (
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => onAccept?.(orderId)}
          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition"
        >
          <CheckCircleIcon className="w-4 h-4" />
          Accept
        </button>
        <button
          onClick={() => onReject?.(orderId)}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition"
        >
          <XCircleIcon className="w-4 h-4" />
          Reject
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Order #{orderId}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {isLoading && (
          <div className="p-6 text-center">
            <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Loading order details…</p>
          </div>
        )}

        {isError && (
          <div className="p-6 text-center">
            <ExclamationTriangleIcon className="w-10 h-10 mx-auto text-amber-500" />
            <p className="mt-2 text-sm text-red-500">Failed to load order details.</p>
            <button
              onClick={() => refetch()}
              className="mt-3 text-sm text-brand hover:underline"
            >
              Try Again
            </button>
          </div>
        )}

        {order && (
          <div className="p-6 space-y-6">
            {/* Delivery PIN */}
            {order.delivery_pin && (status === 'processing' || status === 'shipped') && (
              <div className="bg-green-50 border border-green-300 rounded-xl p-4 text-center">
                <p className="text-sm font-bold text-green-800">Delivery PIN</p>
                <p className="text-3xl font-extrabold tracking-widest text-green-700 my-2">{order.delivery_pin}</p>
                <p className="text-xs text-green-600">Share this PIN with your delivery rider.</p>
              </div>
            )}

            {/* Acceptance deadline if pending acceptance or pending */}
            {(status === 'pending_acceptance' || status === 'pending') && order.acceptance_deadline && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-orange-800">
                  <ClockIcon className="w-5 h-5" />
                  Awaiting acceptance – deadline:{' '}
                  {new Date(order.acceptance_deadline).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Customer</p>
                <p className="font-medium text-gray-900">{order.buyer_name || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-medium text-gray-900">
                  {order.created_at
                    ? new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Shipping Address</p>
                <p className="font-medium text-gray-900">{order.shipping_address || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Payment Method</p>
                <p className="font-medium text-gray-900 capitalize">{order.payment_method || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Pickup Status</p>
                <p className={`font-medium ${pickupReady ? 'text-green-600' : 'text-red-600'}`}>
                  {pickupReady ? 'Ready for pickup' : 'Not ready'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Delivery Status</p>
                <div className="font-medium text-gray-900">
                  {order.delivery_requests?.[0] ? (
                    <>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(order.delivery_requests[0].status)}`}>
                        {order.delivery_requests[0].status.replace(/_/g, ' ')}
                      </span>
                      {order.delivery_requests[0].logistics_partner?.name && (
                        <span className="block text-xs text-gray-500 mt-0.5">
                          {order.delivery_requests[0].logistics_partner.name}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Items</h3>
              <div className="space-y-3">
                {items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                    <img
                      src={item.image || 'https://via.placeholder.com/80?text=No+Image'}
                      alt={item.title}
                      className="w-16 h-16 rounded-lg object-cover bg-white border border-gray-200"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity} × ETB {item.price}</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        ETB {(Number(item.quantity) * Number(item.price)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Discount</span>
                  <span className="font-medium text-red-500">-{formatCurrency(discount)}</span>
                </div>
              )}
              {serviceFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Service Fee</span>
                  <span className="font-medium">{formatCurrency(serviceFee)}</span>
                </div>
              )}
              {vat > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">VAT</span>
                  <span className="font-medium">{formatCurrency(vat)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span className="font-medium">{formatCurrency(shippingCost)}</span>
              </div>
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">Status:</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadgeClass(status)}`}>
                {status.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Return Info Section */}
            {returnRequest && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Return Information
                </h3>
                <div className="text-sm text-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="font-medium">Status:</span>{' '}
                    <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                      {returnRequest.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Reason:</span>{' '}
                    <span className="capitalize">{returnRequest.reason?.replace(/_/g, ' ')}</span>
                  </div>
                  {returnRequest.details && (
                    <div className="sm:col-span-2">
                      <span className="font-medium">Details:</span>{' '}
                      <span>{returnRequest.details}</span>
                    </div>
                  )}
                  {returnRequest.liability && (
                    <div>
                      <span className="font-medium">Liability:</span>{' '}
                      <span className="capitalize">{returnRequest.liability}</span>
                    </div>
                  )}
                  {returnRequest.return_shipping_cost > 0 && (
                    <div>
                      <span className="font-medium">Penalty:</span>{' '}
                      <span className="text-red-600 font-semibold">
                        ETB {returnRequest.return_shipping_cost.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {returnRequest.admin_notes && (
                    <div className="sm:col-span-2">
                      <span className="font-medium">Admin Notes:</span>{' '}
                      <span className="italic text-gray-600">"{returnRequest.admin_notes}"</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {renderActions()}
          </div>
        )}

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderDetailsModal;