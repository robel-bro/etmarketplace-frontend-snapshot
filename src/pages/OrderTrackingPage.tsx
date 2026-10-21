// src/pages/OrderTrackingPage.tsx
import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CheckCircleIcon,
  TruckIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  MapPinIcon,
  CreditCardIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  PhoneIcon,
  LockClosedIcon,
  ArrowUturnLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import api from '../lib/axios';
import { createConsumer } from '@rails/actioncable';
import ReturnRequestModal from '../components/features/returns/ReturnRequestModal';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/cable';
const API_URL = import.meta.env.VITE_API_URL || '';

const statusSteps = [
  { key: 'placed', label: 'Order Placed', icon: ClockIcon },
  { key: 'accepted', label: 'Accepted', icon: CheckCircleIcon },
  { key: 'on_the_way', label: 'On the Way', icon: TruckIcon },
  { key: 'delivered', label: 'Delivered', icon: CheckCircleIcon },
];

const getStatusIndex = (status: string) => {
  switch (status) {
    case 'pending':
    case 'pending_acceptance':
      return 0;
    case 'accepted':
    case 'processing':
      return 1;
    case 'shipped':
      return 2;
    case 'delivered':
    case 'completed':
      return 3;
    default:
      return 0;
  }
};

interface DeliveryUpdate {
  type: 'location_update' | 'status_update';
  status: string;
  estimated_delivery: string;
  timestamp: string;
}

const OrderTrackingPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<string>('');
  const [eta, setEta] = useState<string>('');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const cableRef = useRef<any>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatEta = (estimated: string) => {
    if (!estimated) return 'Calculating...';
    return new Date(estimated).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const fetchOrder = useCallback(async () => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      const data = res.data;
      setOrder(data);
      setLiveStatus(data.status);
      const estimated = data.estimated_delivery;
      setEta(estimated ? formatEta(estimated) : 'Calculating...');
    } catch (err: any) {
      if (err.response?.status === 401) setError('You need to be logged in to track your order.');
      else if (err.response?.status === 404) setError('Order not found.');
      else setError('Failed to load order.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId, fetchOrder]);

  useEffect(() => {
    if (!orderId) return;

    const cable = createConsumer(WS_URL);
    const channel = cable.subscriptions.create(
      { channel: 'DeliveryChannel', order_id: orderId },
      {
        received(data: DeliveryUpdate) {
          setLiveStatus(data.status);
          if (data.estimated_delivery) {
            setEta(formatEta(data.estimated_delivery));
          }
        },
      }
    );
    cableRef.current = channel;

    return () => {
      channel.unsubscribe();
      cable.disconnect();
    };
  }, [orderId]);

  useEffect(() => {
    if (loading || error) return;
    if (liveStatus === 'delivered' || liveStatus === 'cancelled' || order?.status === 'delivered' || order?.status === 'cancelled') return;

    pollingRef.current = setInterval(fetchOrder, 30000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [loading, error, liveStatus, order?.status, fetchOrder]);

  const downloadPdf = async () => {
    try {
      const res = await api.get(`/orders/${orderId}/invoice.pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${orderId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download failed', err);
      alert('Failed to download PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="w-8 h-8 mx-auto animate-spin text-brand" />
          <p className="mt-3 text-sm text-text-secondary">Loading your tracking...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="max-w-sm text-center">
          <ExclamationTriangleIcon className="w-10 h-10 mx-auto text-amber-500" />
          <h2 className="text-lg font-semibold text-text-primary mt-3">Error</h2>
          <p className="text-sm text-text-secondary mt-1">{error || 'Order not found'}</p>
          <Link to="/orders" className="text-sm text-brand hover:text-brand-hover underline mt-3 inline-block">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const currentStatus = liveStatus || order.status;
  const currentIdx = getStatusIndex(currentStatus);
  const isCancelled = currentStatus === 'cancelled';
  const isDelivered = currentStatus === 'delivered';
  const primaryProduct = order.items?.[0]?.title;
  const title = primaryProduct
    ? `${primaryProduct}${order.items.length > 1 ? ` + ${order.items.length - 1} more` : ''}`
    : `Order #${order.id}`;

  const showDeliveryPin = order.delivery_pin &&
    (currentStatus === 'processing' || currentStatus === 'shipped');

  const getReturnInfo = (order: any) => {
    if (!order.return_window_days) return null;
    const isDelivered = currentStatus === 'delivered';
    let deadline: Date | null = null;
    if (order.return_deadline) {
      deadline = new Date(order.return_deadline);
    } else if (order.delivered_at) {
      deadline = new Date(new Date(order.delivered_at).getTime() + order.return_window_days * 86400000);
    }
    const now = new Date();
    const isOpen = isDelivered && deadline ? now < deadline : false;
    const daysLeft = isOpen && deadline ? Math.ceil((deadline.getTime() - now.getTime()) / 86400000) : 0;
    return { deadline, isOpen, daysLeft };
  };
  const returnInfo = getReturnInfo(order);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="max-w-7xl mx-auto py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Link to="/orders" className="text-text-muted hover:text-brand transition-colors">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-product-title font-semibold text-text-primary truncate">{title}</h1>
            <p className="text-xs text-text-muted">
              Order #{order.id} ·{' '}
              {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          {order.payment_status === 'completed' && (
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={`/invoices/${order.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-brand border border-brand rounded-[var(--radius-sm)] px-3 py-1.5 hover:bg-brand-light transition-colors whitespace-nowrap"
              >
                <DocumentTextIcon className="w-4 h-4" />
                View
              </Link>
              <button
                onClick={downloadPdf}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-brand rounded-[var(--radius-sm)] px-3 py-1.5 hover:bg-brand-hover transition-colors whitespace-nowrap"
              >
                <DocumentTextIcon className="w-4 h-4" />
                PDF
              </button>
            </div>
          )}
        </div>

        {/* Delivery PIN card */}
        {showDeliveryPin && (
          <div className="card-product mb-4 p-4 text-center bg-green-50 border border-green-300">
            <LockClosedIcon className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-green-800">Delivery PIN</p>
            <p className="text-4xl font-extrabold tracking-widest text-green-700 my-2">
              {order.delivery_pin}
            </p>
            <p className="text-xs text-green-600">
              Share this PIN with your delivery rider when they arrive.
            </p>
          </div>
        )}

        {/* Status Tracker */}
        <div className="card-product p-5 mb-4">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Order Status</h2>
          <div className="flex items-center justify-between">
            {statusSteps.map((step, idx) => {
              const completed = idx <= currentIdx;
              const isCurrent = idx === currentIdx;
              return (
                <div key={step.key} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        completed ? 'bg-green-500' : isCurrent ? 'bg-brand animate-pulse' : 'bg-gray-200'
                      }`}
                    >
                      <step.icon className="w-4 h-4 text-white" />
                    </div>
                    <span
                      className={`text-[11px] mt-2 font-medium text-center ${
                        completed ? 'text-green-600' : isCurrent ? 'text-brand' : 'text-text-muted'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < statusSteps.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 rounded ${idx < currentIdx ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
          {isCancelled && (
            <div className="mt-4 text-center">
              <p className="text-sm font-semibold text-red-500">Order Cancelled</p>
            </div>
          )}
          {currentStatus === 'pending_acceptance' && order.acceptance_deadline && (
            <div className="mt-4 text-center bg-brand-light border border-brand/20 rounded-md p-3">
              <p className="text-sm font-semibold text-brand">
                Awaiting seller acceptance — deadline:{' '}
                {new Date(order.acceptance_deadline).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
        </div>

        {/* ETA Card */}
        {!isCancelled && !isDelivered && eta && (
          <div className="card-product p-4 mb-4 bg-brand/5 border border-brand/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TruckIcon className="w-5 h-5 text-brand" />
              <span className="text-sm font-semibold text-text-primary">Estimated arrival</span>
            </div>
            <span className="text-base font-bold text-brand">{eta}</span>
          </div>
        )}

        {/* Delivery Partner Info & Events */}
        {order.delivery_requests?.length > 0 && (
          <div className="card-product p-4 mb-4">
            <h2 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
              <TruckIcon className="w-4 h-4 text-brand" />
              Delivery Partner
            </h2>
            {order.delivery_requests.map((dr: any) => (
              <div key={dr.id} className="mb-2 last:mb-0">
                <div className="flex items-center gap-2 mb-1">
                  <UserIcon className="w-3.5 h-3.5 text-text-muted" />
                  <span className="text-xs font-medium text-text-primary">
                    {dr.logistics_partner?.name || 'Logistics Partner'} —{' '}
                    <span className="text-brand font-semibold">{dr.status.replace(/_/g, ' ')}</span>
                  </span>
                  {dr.logistics_partner?.phone && (
                    <a href={`tel:${dr.logistics_partner.phone}`} className="ml-auto">
                      <PhoneIcon className="w-4 h-4 text-brand hover:text-brand-hover" />
                    </a>
                  )}
                </div>
                {dr.events?.length > 0 && (
                  <div className="pl-5 border-l-2 border-brand/30 space-y-1">
                    {dr.events.slice(-3).map((event: any, idx: number) => (
                      <div key={idx} className="text-xs text-text-secondary">
                        <span className="font-medium text-text-primary">
                          {event.event?.replace(/_/g, ' ') || event.status?.replace(/_/g, ' ')}
                        </span>
                        {event.location && <span> — {event.location}</span>}
                        <span className="text-text-muted ml-2">
                          {new Date(event.at || event.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Order Items & Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            <div className="card-product p-4">
              <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <CubeIcon className="w-4 h-4 text-brand" />
                Items ({order.items?.length || 0})
              </h2>
              {order.items?.length > 0 ? (
                <div className="space-y-3">
                  {order.items.map((item: any) => (
                    <div key={item.product_id} className="flex gap-3">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-16 h-16 rounded-[var(--radius-sm)] object-cover border border-border-light flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-[var(--radius-sm)] bg-surface-hover flex items-center justify-center flex-shrink-0">
                          <CubeIcon className="w-5 h-5 text-text-muted" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary">{item.title}</p>
                        <p className="text-xs text-text-muted mt-0.5">Qty: {item.quantity}</p>
                        <p className="text-sm font-bold text-text-primary mt-1">
                          ETB {Number(item.price).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted">No items found.</p>
              )}
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-border-light">
                <span className="text-sm text-text-secondary">Total</span>
                <span className="text-lg font-bold text-text-primary">
                  ETB {Number(order.total).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            <div className="card-product p-4">
              <h2 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                <MapPinIcon className="w-4 h-4 text-brand" />
                Shipping Address
              </h2>
              <p className="text-sm text-text-primary">{order.shipping_address || '—'}</p>
              <p className="text-xs text-text-muted mt-1">
                <ClockIcon className="w-3 h-3 inline mr-1" />
                Estimated: {eta || 'Not available'}
              </p>
            </div>

            <div className="card-product p-4">
              <h2 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                <CreditCardIcon className="w-4 h-4 text-brand" />
                Payment
              </h2>
              <p className="text-sm text-text-primary">
                {order.payment_method_enum === 'cash_on_delivery'
                  ? 'Cash on Delivery'
                  : order.payment_method_enum?.replace(/_/g, ' ')}
              </p>
              <p className="text-xs text-text-muted mt-1">
                Status: {order.payment_status?.replace(/_/g, ' ')}
              </p>
              <div className="mt-3 space-y-1.5 border-t border-border-light pt-3">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Subtotal</span>
                  <span className="font-medium text-text-primary">ETB {Number(order.subtotal || 0).toLocaleString()}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Discount</span>
                    <span className="font-medium text-red-500">-ETB {Number(order.discount_amount).toLocaleString()}</span>
                  </div>
                )}
                {order.service_fee > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Service Fee</span>
                    <span className="font-medium text-text-primary">ETB {Number(order.service_fee).toLocaleString()}</span>
                  </div>
                )}
                {order.vat_amount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">VAT</span>
                    <span className="font-medium text-text-primary">ETB {Number(order.vat_amount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Shipping</span>
                  <span className="font-medium text-text-primary">
                    ETB {Number(order.consolidated_shipping || order.shipping_cost || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-1 border-t border-border-light">
                  <span>Total</span>
                  <span>ETB {Number(order.total).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Return Policy Card */}
            {returnInfo && (
              <div className="card-product p-4 bg-blue-50 border border-blue-100">
                <h2 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <ArrowUturnLeftIcon className="w-4 h-4 text-blue-600" />
                  Return Policy
                </h2>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>Window: {order.return_window_days} days after delivery</p>
                  {order.restocking_fee_percent > 0 && (
                    <p>Restocking fee: {order.restocking_fee_percent}%</p>
                  )}
                  <p>Return shipping paid by: {order.return_shipping_responsibility || 'buyer'}</p>
                  {returnInfo.deadline && (
                    <p className="mt-1">
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
                            onClick={() => setShowReturnModal(true)}
                            className="text-xs px-3 py-1.5 bg-orange-500 text-white rounded hover:bg-orange-600"
                          >
                            Request Return
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs font-medium text-red-600 mt-1">Return window closed</p>
                  )}
                </div>
              </div>
            )}

            {order.vendor && (
              <div className="card-product p-4">
                <h2 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-brand" />
                  Seller
                </h2>
                <p className="text-sm font-medium">{order.vendor.shop_name}</p>
                <p className="text-xs text-text-muted">{order.vendor.business_address}</p>
                {order.vendor.phone && (
                  <a
                    href={`tel:${order.vendor.phone}`}
                    className="text-xs text-brand hover:text-brand-hover mt-1 inline-block"
                  >
                    <PhoneIcon className="w-3 h-3 inline mr-1" />
                    {order.vendor.phone}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Return Request Modal */}
        {showReturnModal && (
          <ReturnRequestModal
            orderId={order.id}
            onClose={() => setShowReturnModal(false)}
            onSuccess={() => {
              setShowReturnModal(false);
              fetchOrder();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default OrderTrackingPage;