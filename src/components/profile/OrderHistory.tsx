import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Clock, ShoppingBag } from 'lucide-react';
import api from '../../lib/axios';

const OrderHistory = () => {
  const { data: response } = useQuery('orders', () =>
    api.get('/orders').then(r => r.data)
  );

  // The backend wraps the list in a "data" key
  const orders = response?.data || [];

  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-3">Order History</h2>
      {orders.length === 0 && <p className="text-sm text-gray-500">No orders yet.</p>}
      <div className="space-y-3">
        {orders.slice(0, 10).map((order: any) => {
          const items = order.items || [];
          const total = order.total || 0;
          const statusLabel = order.status || 'pending';

          return (
            <div key={order.id} className="card p-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">#{order.id}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    statusLabel === 'delivered'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  {statusLabel}
                </span>
              </div>

              {items.length > 0 && (
                <div className="space-y-2 mb-2">
                  {items.map((item: any, idx: number) => {
                    const productImage = item.image || null;   // direct URL from backend
                    const productTitle = item.title || 'Product';
                    const qty = item.quantity || 1;
                    const price = item.price || 0;

                    return (
                      <div key={item.product_id || idx} className="flex items-center gap-3">
                        {productImage ? (
                          <img
                            src={productImage}
                            alt={productTitle}
                            className="w-10 h-10 rounded-lg object-cover border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <ShoppingBag className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {productTitle}
                          </p>
                          <p className="text-xs text-gray-500">Qty: {qty}</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          ETB {price.toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  {items.length} items · Total{' '}
                  <span className="font-semibold text-gray-900">
                    ETB {total.toLocaleString()}
                  </span>
                </p>
                <Link
                  to={`/order-tracking/${order.id}`}
                  className="text-xs font-medium text-[var(--color-orange-500)] hover:underline"
                >
                  Track Order
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderHistory;