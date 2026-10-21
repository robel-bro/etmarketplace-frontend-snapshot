import { useState, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  CubeIcon,
  PercentBadgeIcon,
  BanknotesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '@/lib/axios';

const DashboardHome = () => {
  const queryClient = useQueryClient();
  const [reopenAt, setReopenAt] = useState('');
  const [showCategoryRates, setShowCategoryRates] = useState(false);
  const cooldownTimerRef = useRef<number | null>(null);

  // ── Dashboard data (now includes is_open) ──
  const { data: statsData, isLoading } = useQuery(
    'sellerStats',
    () => api.get('/seller/dashboard').then(res => res.data),
    { staleTime: 2 * 60 * 1000 }
  );

  // ── Toggle mutation (uses cooldown to prevent double-click) ──
  const toggleMutation = useMutation(
    () => {
      const payload: any = {};
      if (!statsData?.is_open && reopenAt) {
        payload.reopen_at = reopenAt;
      }
      return api.post('/seller/toggle_shop', payload);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sellerStats');
        queryClient.invalidateQueries({
          predicate: query => query.queryKey[0] === 'product',
        });
      },
      onError: (err: any) => {
        console.error('Toggle failed', err);
        alert('Failed to toggle shop. Please try again.');
      },
    }
  );

  const toggleShop = () => {
    if (cooldownTimerRef.current) return;
    cooldownTimerRef.current = window.setTimeout(() => {
      cooldownTimerRef.current = null;
    }, 500);
    toggleMutation.mutate();
  };

  if (isLoading || !statsData) {
    return (
      <div className="container-marketplace py-16 text-center text-text-muted text-sm">
        Loading dashboard…
      </div>
    );
  }

  const {
    is_open: isOpen = true,
    reopen_at: serverReopenAt,
    total_orders = 0,
    total_revenue = 0,
    total_earnings = 0,
    average_order_value = 0,
    total_commissions = 0,
    commission_rate = 0,
    category_commission_rates = [],
    revenue_by_month = {},
    recent_orders = [],
    total_return_shipping_penalties = 0,
    refunded_orders_count = 0,
    total_refunded_amount = 0,
  } = statsData;

  // Sync reopenAt from server
  if (serverReopenAt && !reopenAt) {
    setReopenAt(serverReopenAt);
  }

  const chartData = Object.entries(revenue_by_month)
    .map(([month, revenue]) => ({
      name: month?.slice(0, 7) || month,
      revenue: Number(revenue),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const stats = [
    { name: 'Total Revenue', value: `ETB ${total_revenue.toLocaleString()}`, icon: CurrencyDollarIcon },
    { name: 'Orders', value: total_orders.toLocaleString(), icon: ShoppingCartIcon },
    { name: 'Avg Order Value', value: `ETB ${average_order_value.toLocaleString()}`, icon: ChartBarIcon },
    { name: 'Earnings', value: `ETB ${total_earnings.toLocaleString()}`, icon: CubeIcon },
  ];

  return (
    <div className="container-marketplace py-4">
      {/* Shop Status */}
      <div className="p-4 bg-white rounded-lg shadow-sm mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Shop Status</h2>
            <p className="text-xs text-text-muted mt-0.5">
              {isOpen
                ? 'Your shop is open — customers can place orders.'
                : 'Your shop is on a break — products remain visible and can be added to cart, but checkout is paused until you reopen.'}
            </p>
          </div>
          <button
            onClick={toggleShop}
            disabled={toggleMutation.isLoading || cooldownTimerRef.current !== null}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isOpen ? 'bg-green-500' : 'bg-gray-300'
            } ${(toggleMutation.isLoading || cooldownTimerRef.current !== null) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isOpen ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        {!isOpen && (
          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Expected reopening time (optional)
            </label>
            <input
              type="datetime-local"
              value={reopenAt}
              onChange={e => setReopenAt(e.target.value)}
              className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>
        )}
      </div>

      {/* Commission Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-product p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted mb-1">Commission Rate</p>
              <p className="text-lg font-bold text-text-primary">{commission_rate}%</p>
            </div>
            <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-purple-100 flex items-center justify-center">
              <PercentBadgeIcon className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-product p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted mb-1">Total Commissions Paid</p>
              <p className="text-lg font-bold text-text-primary">ETB {total_commissions.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-amber-100 flex items-center justify-center">
              <BanknotesIcon className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Deductions & Refunds */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-product p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted mb-1">Return Shipping Penalties</p>
              <p className="text-lg font-bold text-red-600">
                ETB {total_return_shipping_penalties.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-red-100 flex items-center justify-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-product p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted mb-1">Refunded Orders</p>
              <p className="text-lg font-bold text-text-primary">{refunded_orders_count}</p>
            </div>
            <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-purple-100 flex items-center justify-center">
              <ArrowUturnLeftIcon className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-product p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted mb-1">Total Refunded</p>
              <p className="text-lg font-bold text-text-primary">
                ETB {total_refunded_amount.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-orange-100 flex items-center justify-center">
              <BanknotesIcon className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Category Commission Rates (collapsible) */}
      {category_commission_rates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card-product mb-4"
        >
          <button
            onClick={() => setShowCategoryRates(!showCategoryRates)}
            className="w-full p-4 flex items-center justify-between text-left"
          >
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <PercentBadgeIcon className="w-4 h-4 text-purple-600" />
              Commission by Category
            </h2>
            {showCategoryRates ? (
              <ChevronUpIcon className="w-5 h-5 text-text-muted" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-text-muted" />
            )}
          </button>

          <AnimatePresence>
            {showCategoryRates && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-1.5">
                  {category_commission_rates.map((cat: any) => (
                    <div key={cat.category_id} className="flex justify-between text-xs py-1 border-b border-border-light last:border-0">
                      <span className="text-text-secondary">{cat.category_name}</span>
                      <span className="font-medium text-text-primary">{cat.commission_rate}%</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card-product p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted mb-1">{stat.name}</p>
                <p className="text-lg font-bold text-text-primary">{stat.value}</p>
              </div>
              <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-brand-light flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-brand" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="card-product p-5 mb-4"
      >
        <h2 className="text-base font-semibold text-text-primary mb-4">Revenue Overview</h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97519" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#F97519" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" tick={{ fontSize: 12 }} />
              <YAxis stroke="#6B7280" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'white', borderRadius: '6px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px rgba(0,0,0,0.06)', fontSize: '13px' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#F97519" fill="url(#colorRevenue)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-text-muted text-sm text-center py-12">No revenue data yet</div>
        )}
      </motion.div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-product p-5"
      >
        <h2 className="text-base font-semibold text-text-primary mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-light">
                <th className="text-left py-2 px-3 text-xs font-medium text-text-muted uppercase tracking-wider">Order ID</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-text-muted uppercase tracking-wider">Customer</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-text-muted uppercase tracking-wider">Amount</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-text-muted uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {recent_orders.length > 0 ? (
                recent_orders.map((order: any) => (
                  <tr key={order.id} className="border-b border-border-light hover:bg-surface-hover transition">
                    <td className="py-2.5 px-3 text-xs font-medium text-text-primary">{order.id}</td>
                    <td className="py-2.5 px-3 text-xs text-text-secondary">{order.customer}</td>
                    <td className="py-2.5 px-3 text-xs font-semibold text-text-primary">ETB {order.total.toLocaleString()}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full ${
                          order.status === 'delivered'
                            ? 'bg-green-100 text-green-700'
                            : order.status === 'shipped'
                            ? 'bg-blue-100 text-blue-700'
                            : order.status === 'processing'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-text-secondary'
                        }`}
                      >
                        {order.status}
                      </span>
                      {order.payment_status === 'refunded' && (
                        <span className="ml-1 inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full bg-red-100 text-red-700">
                          Refunded
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-text-muted">{order.created_at}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-sm text-text-muted">No orders yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardHome;