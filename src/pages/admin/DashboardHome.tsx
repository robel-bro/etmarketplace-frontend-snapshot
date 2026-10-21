// src/pages/admin/DashboardHome.tsx

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  UsersIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  CheckBadgeIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import api from '../../lib/axios';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const DashboardHome = () => {
  const navigate = useNavigate();

  const { data, isLoading, refetch } = useQuery(
    'adminDashboard',
    () => api.get('/admin/dashboard').then(res => res.data),
    { staleTime: 0, refetchOnWindowFocus: true }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-muted text-sm">Loading dashboard…</div>
      </div>
    );
  }

  const {
    total_revenue,
    total_orders,
    total_sellers,
    total_buyers,
    revenue_by_month = [],
    recent_orders = [],
    pending_approvals = 0,
    top_sellers = [],
  } = data || {};

  const stats = [
    {
      name: 'Total Buyers',
      value: total_buyers?.toLocaleString() || '0',
      icon: UsersIcon,
    },
    {
      name: 'Total Sellers',
      value: total_sellers?.toLocaleString() || '0',
      icon: CheckBadgeIcon,
    },
    {
      name: 'Total Orders',
      value: total_orders?.toLocaleString() || '0',
      icon: ShoppingCartIcon,
    },
    {
      name: 'Total Revenue',
      value: `ETB ${Number(total_revenue || 0).toLocaleString()}`,
      icon: CurrencyDollarIcon,
    },
  ];

  return (
    <div className="space-y-3">
      <h1 className="text-product-title font-semibold text-text-primary flex items-center gap-2">
        Dashboard
        <button onClick={() => refetch()} className="p-1 hover:bg-surface-hover rounded">
          <ArrowPathIcon className="w-4 h-4 text-text-muted" />
        </button>
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="card-product p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted mb-1">{stat.name}</p>
                <p className="text-base font-bold text-text-primary">{stat.value}</p>
              </div>
              <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-brand-light flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-brand" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue chart + Recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Revenue chart */}
        <div className="lg:col-span-2 card-product p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Revenue (last 12 months)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenue_by_month}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis stroke="#6B7280" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '6px', boxShadow: '0 4px 6px rgba(0,0,0,0.06)' }}
                formatter={(value: number) => [`ETB ${value.toLocaleString()}`, 'Revenue']}
              />
              <Line type="monotone" dataKey="revenue" stroke="#F97519" strokeWidth={2.5} dot={{ fill: '#F97519', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Orders */}
        <div className="card-product p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-text-muted" />
            Recent Orders
          </h2>
          <div className="space-y-2.5">
            {recent_orders.length === 0 && <p className="text-xs text-text-muted">No recent orders.</p>}
            {recent_orders.map((order: any) => (
              <div key={order.id} className="flex justify-between items-center border-b border-border-light pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-text-primary">#{order.id}</p>
                  <p className="text-xs text-text-muted">
                    {order.customer_name} · {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-700' : order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Sellers + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Top Sellers */}
        <div className="lg:col-span-2 card-product p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Top Sellers</h2>
          <div className="space-y-2">
            {top_sellers.map((seller: any, idx: number) => (
              <div key={seller.id} className="flex items-center justify-between border-b border-border-light pb-2 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text-muted w-4">{idx + 1}</span>
                  <p className="text-sm font-medium text-text-primary">{seller.business_name}</p>
                </div>
                <p className="text-sm font-semibold text-text-primary">ETB {seller.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card-product p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Quick Actions</h2>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/admin/vendors')}
              className="w-full text-left px-3 py-2 rounded-[var(--radius-sm)] border border-border-light text-sm font-medium text-text-secondary hover:bg-surface-hover transition"
            >
              {`Approve Pending Sellers (${pending_approvals})`}
            </button>
            <button
              onClick={() => navigate('/admin/disputes')}
              className="w-full text-left px-3 py-2 rounded-[var(--radius-sm)] border border-border-light text-sm font-medium text-text-secondary hover:bg-surface-hover transition"
            >
              Review Disputes
            </button>
            <button
              onClick={() => navigate('/admin/announcements')}
              className="w-full text-left px-3 py-2 rounded-[var(--radius-sm)] border border-border-light text-sm font-medium text-text-secondary hover:bg-surface-hover transition"
            >
              Create Announcement
            </button>
            <button
              onClick={() => navigate('/admin/hero_banners')}
              className="w-full text-left px-3 py-2 rounded-[var(--radius-sm)] border border-border-light text-sm font-medium text-text-secondary hover:bg-surface-hover transition"
            >
              Update Hero Banner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;