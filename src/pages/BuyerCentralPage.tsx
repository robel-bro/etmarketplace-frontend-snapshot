import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Package, TrendingUp, Heart, ShoppingBag, Clock, Search, X } from 'lucide-react';
import ProductCard from '../components/features/products/ProductCard';
import api from '../lib/axios';

const BuyerCentralPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery(
    'buyerCentral',
    () => api.get('/api/v1/buyer_central').then(res => res.data)
  );

  const topPopular = data?.popular_searches?.[0]?.query || '';
  const { data: topSearchProducts } = useQuery(
    ['topSearchProducts', topPopular],
    () => api.get('/products', { params: { q: topPopular, limit: 12 } }).then(res => res.data.data || res.data),
    { enabled: !!topPopular }
  );

  const deleteSavedSearch = async (id: number) => {
    await api.delete(`/api/v1/saved_searches/${id}`);
    queryClient.invalidateQueries('buyerCentral');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--surface-page)] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading Buyer Central...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-[var(--surface-page)] flex items-center justify-center">
        <div className="text-center text-red-500">
          <p className="text-xl font-semibold">Failed to load Buyer Central</p>
          <Link to="/" className="text-sm text-[var(--color-orange-500)] hover:underline mt-2 block">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const {
    orders = [],
    recently_viewed = [],
    wishlist = [],
    total_spent = 0,
    avg_monthly_spend = 0,
    spending_chart = [],
    saved_searches = [],
    popular_searches = [],
  } = data;

  const wishlistTotal = wishlist.reduce((sum: number, item: any) => sum + (item.effective_price || item.price || 0), 0);
  const topProducts = Array.isArray(topSearchProducts) ? topSearchProducts : topSearchProducts?.data || topSearchProducts?.products || [];

  return (
    <div className="min-h-screen bg-[var(--surface-page)]">
      <div className="container-padded py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Buyer Central</h1>
          <p className="text-xs text-gray-500">Manage your orders, track spending, and explore your wishlist</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-1.5">
              <div className="p-1.5 bg-[var(--color-orange-50)] rounded-lg">
                <TrendingUp className="w-4 h-4 text-[var(--color-orange-500)]" />
              </div>
              <span className="text-xs text-green-600 font-medium">+12.5%</span>
            </div>
            <p className="text-xs text-gray-500 mb-0.5">Total Spent</p>
            <p className="text-lg font-bold text-gray-900">ETB {Number(total_spent).toLocaleString()}</p>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between mb-1.5">
              <div className="p-1.5 bg-[var(--color-orange-50)] rounded-lg">
                <Package className="w-4 h-4 text-[var(--color-orange-500)]" />
              </div>
              <span className="text-xs text-gray-500">This month</span>
            </div>
            <p className="text-xs text-gray-500 mb-0.5">Avg Monthly</p>
            <p className="text-lg font-bold text-gray-900">ETB {Number(avg_monthly_spend).toLocaleString()}</p>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between mb-1.5">
              <div className="p-1.5 bg-[var(--color-orange-50)] rounded-lg">
                <Heart className="w-4 h-4 text-[var(--color-orange-500)]" />
              </div>
              <span className="text-xs text-gray-500">{wishlist.length} items</span>
            </div>
            <p className="text-xs text-gray-500 mb-0.5">Wishlist Value</p>
            <p className="text-lg font-bold text-gray-900">ETB {Number(wishlistTotal).toLocaleString()}</p>
          </div>
        </div>

        {/* Main Grid: Chart + Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
          <div className="lg:col-span-2 card p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-0.5">Spending Overview</h2>
                <p className="text-xs text-gray-500">Your monthly spending trends</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Last 6 months</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={spending_chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '11px' }} tickLine={false} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} tickLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [`ETB ${value.toLocaleString()}`, 'Spent']}
                />
                <Line type="monotone" dataKey="amount" stroke="#FF6B00" strokeWidth={2.5} dot={{ fill: '#FF6B00', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900">Recent Orders</h2>
              <ShoppingBag className="w-4 h-4 text-gray-400" />
            </div>
            <div className="space-y-2.5">
              {orders.length === 0 && <p className="text-xs text-gray-500">No orders yet.</p>}
              {orders.map((order: any) => (
                <div key={order.id} className="pb-2.5 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <p className="text-sm font-medium text-gray-900">#{order.id}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-500">
                          {new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${order.status === 'delivered' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500">{order.items_count} items</p>
                    <p className="text-sm font-semibold text-gray-900">ETB {order.total.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/orders" className="btn-outline w-full mt-3 py-2 text-xs font-medium flex items-center justify-center">
              View All Orders
            </Link>
          </div>
        </div>

        {/* Saved Searches */}
        {saved_searches.length > 0 && (
          <div className="card p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <h2 className="text-base font-bold text-gray-900">Saved Searches</h2>
              </div>
              <button className="text-xs font-medium text-[var(--color-orange-500)] hover:underline">Manage</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {saved_searches.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(s.query)}`)}
                  className="bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 hover:text-[var(--color-orange-500)] transition-all inline-flex items-center gap-1"
                >
                  {s.query}
                  <X className="w-3 h-3 text-gray-400 hover:text-red-500" onClick={(e) => { e.stopPropagation(); deleteSavedSearch(s.id); }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Trending Searches */}
        {popular_searches.length > 0 && (
          <div className="card p-4 mb-4">
            <h2 className="text-base font-bold text-gray-900 mb-2">Trending Searches</h2>
            <div className="flex flex-wrap gap-1.5">
              {popular_searches.map((s: any) => (
                <button
                  key={s.query}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(s.query)}`)}
                  className="bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 hover:text-[var(--color-orange-500)] transition-all inline-flex items-center gap-1"
                >
                  {s.query}
                  <span className="text-gray-400">({s.count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Picked for you */}
        {topProducts.length > 0 && (
          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900 mb-2">
              Picked for you
              <span className="text-xs font-normal text-gray-500 ml-1.5">— popular in “{topPopular}”</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {topProducts.slice(0, 12).map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* Recently Viewed */}
        {recently_viewed.length > 0 && (
          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900 mb-2">Recently Viewed</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {recently_viewed.map((item: any) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        )}

        {/* Wishlist */}
        {wishlist.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-0.5">Your Wishlist</h2>
                <p className="text-xs text-gray-500">Items you're interested in</p>
              </div>
              <Link to="/wishlist" className="text-xs font-medium text-[var(--color-orange-500)] hover:underline">
                View All ({wishlist.length})
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {wishlist.map((item: any) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerCentralPage;