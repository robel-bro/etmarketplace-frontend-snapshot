// src/pages/OrderConfirmationPage.tsx
import { Link, useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  CheckCircleIcon,
  ShoppingBagIcon,
  TruckIcon,
  MapPinIcon,
  CreditCardIcon,
  LockClosedIcon,
  ArrowRightIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import api from '../lib/axios';

interface OrderItem {
  product_id: number;
  title: string;
  quantity: number;
  price: number;
  image: string;
}

interface Order {
  id: number;
  total: number;
  subtotal?: number;
  discount_amount?: number;
  service_fee?: number;
  vat_amount?: number;
  consolidated_shipping?: number;
  shipping_cost?: number;
  shipping_address?: string;
  payment_method_enum?: string;
  payment_status?: string;
  delivery_pin?: string;
  status?: string;
  items?: OrderItem[];
  created_at?: string;
}

const OrderConfirmationPage = () => {
  const { orderId } = useParams<{ orderId: string }>();

  const { data: order, isLoading, isError } = useQuery<Order>(
    ['orderConfirmation', orderId],
    () => api.get(`/orders/${orderId}`).then(res => res.data),
    { enabled: !!orderId }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-sm text-text-secondary">Loading order details…</p>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-red-500">Failed to load order</p>
          <Link to="/orders" className="text-sm text-brand hover:underline mt-2 inline-block">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const shippingCost = order.consolidated_shipping ?? order.shipping_cost ?? 0;
  const showDeliveryPin = order.delivery_pin && (order.status === 'processing' || order.status === 'shipped');

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="max-w-3xl mx-auto py-10 px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary">Thank You!</h1>
          <p className="text-sm text-text-secondary mt-2">
            Your order has been placed successfully.
          </p>
          <p className="text-xs text-text-muted mt-1">
            Order #{order.id} · {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Order Summary Card */}
        <div className="card-product p-5 mb-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <ShoppingBagIcon className="w-4 h-4 text-brand" />
            Order Summary
          </h2>

          {order.items?.length > 0 && (
            <div className="space-y-3 mb-4">
              {order.items.map((item) => (
                <div key={item.product_id} className="flex items-center gap-3">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-12 h-12 rounded object-cover border border-border-light" />
                  ) : (
                    <div className="w-12 h-12 rounded bg-surface-hover flex items-center justify-center">
                      <CubeIcon className="w-5 h-5 text-text-muted" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{item.title}</p>
                    <p className="text-xs text-text-muted">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-text-primary">ETB {(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}

          {/* Totals */}
          <div className="border-t border-border-light pt-3 space-y-1.5">
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
              <span className="text-text-muted">Delivery Fee</span>
              <span className="font-medium text-text-primary">ETB {Number(shippingCost).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-1 border-t border-border-light">
              <span>Total</span>
              <span>ETB {Number(order.total).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Delivery PIN */}
        {showDeliveryPin && (
          <div className="card-product p-5 mb-4 text-center bg-green-50 border border-green-300">
            <LockClosedIcon className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-green-800">Delivery PIN</p>
            <p className="text-3xl font-extrabold tracking-widest text-green-700 my-2">{order.delivery_pin}</p>
            <p className="text-xs text-green-600">Share this PIN with your delivery rider when they arrive.</p>
          </div>
        )}

        {/* Shipping & Payment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="card-product p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 text-brand" />
              Shipping Address
            </h3>
            <p className="text-sm text-text-secondary">{order.shipping_address || '—'}</p>
          </div>
          <div className="card-product p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
              <CreditCardIcon className="w-4 h-4 text-brand" />
              Payment
            </h3>
            <p className="text-sm text-text-primary">
              {order.payment_method_enum === 'cash_on_delivery'
                ? 'Cash on Delivery'
                : order.payment_method_enum?.replace(/_/g, ' ')}
            </p>
            <p className="text-xs text-text-muted mt-1">
              Status: {order.payment_status?.replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={`/order-tracking/${order.id}`}
            className="inline-flex items-center justify-center gap-2 bg-brand text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-hover transition-colors"
          >
            <TruckIcon className="w-4 h-4" />
            Track Order
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 bg-white text-text-primary border border-border-light px-6 py-3 rounded-lg font-semibold hover:bg-surface-hover transition-colors"
          >
            <ShoppingBagIcon className="w-4 h-4" />
            Continue Shopping
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        {/* Review Prompt */}
        <div className="mt-8 bg-white border border-border-light rounded-lg p-6 text-center">
          <h2 className="font-semibold text-text-primary mb-2">Help others shop better</h2>
          <p className="text-sm text-text-secondary mb-4">
            Once your order is delivered, come back to rate the products and the seller.
          </p>
          <Link to="/orders" className="text-brand font-medium hover:underline">
            Go to My Orders
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;