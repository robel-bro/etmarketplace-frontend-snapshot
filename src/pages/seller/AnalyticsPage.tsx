import { useState } from 'react';
import { useQuery } from 'react-query';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api from '../../lib/axios';

interface SellerStats {
  revenue_by_month: Record<string, number>;
  total_orders: number;
  total_earnings: number;
  recent_orders: any[];
}

const AnalyticsPage = () => {
  const [timeframe, setTimeframe] = useState('month');

  const { data: stats, isLoading, error } = useQuery<SellerStats>('sellerStats', () =>
    api.get('/seller/stats').then(res => res.data)
  );

  if (isLoading) return <div className="text-center py-20 text-sm text-gray-500">Loading analytics...</div>;
  if (error) return <div className="text-center py-20 text-sm text-red-500">Failed to load data.</div>;

  const chartData = stats?.revenue_by_month
    ? Object.entries(stats.revenue_by_month).map(([month, revenue]) => ({
        name: month,
        sales: revenue,
      }))
    : [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">Analytics</h1>

      {/* Timeframe selector – pill style */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {['day', 'week', 'month', 'year'].map(t => (
          <button
            key={t}
            onClick={() => setTimeframe(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              timeframe === t
                ? 'bg-[var(--color-orange-500)] text-white shadow-sm'
                : 'text-gray-600 hover:bg-white/80'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-xs text-gray-500 mb-1">Total Orders</h3>
          <p className="text-xl font-bold text-gray-900">{stats?.total_orders?.toLocaleString()}</p>
        </div>
        <div className="card p-5">
          <h3 className="text-xs text-gray-500 mb-1">Total Earnings</h3>
          <p className="text-xl font-bold text-gray-900">ETB {stats?.total_earnings?.toLocaleString()}</p>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="card p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Monthly Revenue</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => `ETB ${value}`}
              contentStyle={{
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                fontSize: '13px',
              }}
            />
            <Line type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={2.5} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Orders Table */}
      {stats?.recent_orders && stats.recent_orders.length > 0 && (
        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_orders.map((order: any) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="py-2.5 px-3 text-xs font-medium text-gray-800">#{order.id}</td>
                    <td className="py-2.5 px-3 text-xs text-gray-600">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-xs font-semibold text-gray-900">
                      ETB {order.total?.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-xs capitalize text-gray-700">{order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;