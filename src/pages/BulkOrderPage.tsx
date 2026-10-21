import { useState } from 'react';
import { useQuery } from 'react-query';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import api from '../lib/axios';

interface OrderItem {
  productId: number;
  title: string;
  quantity: number;
  unitPrice: number;
}

interface BulkOrder {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  items: {
    id: number;
    product_id: number;
    product_title: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
}

const BulkOrderPage = () => {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  // Fetch existing bulk orders
  const { data: orders, isLoading: ordersLoading } = useQuery(
    'bulkOrders',
    async () => {
      const res = await api.get('/bulk_orders');
      return res.data as BulkOrder[];
    }
  );

  const searchProducts = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await api.get(`/products?search=${searchQuery}&limit=5`);
      // The response might be an array or an object with a data property
      const results = Array.isArray(res.data) ? res.data : res.data.data || [];
      setSearchResults(results);
      setShowSearch(true);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const addItem = (product) => {
    if (items.some(i => i.productId === product.id)) {
      alert('Product already added');
      return;
    }
    setItems([...items, {
      productId: product.id,
      title: product.title,
      quantity: 1,
      unitPrice: product.price,
    }]);
    setSearchQuery('');
    setShowSearch(false);
  };

  const updateQuantity = (index, qty) => {
    const updated = [...items];
    updated[index].quantity = qty;
    setItems(updated);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);

  const handleSubmit = async () => {
    if (items.length === 0) return;
    const orderData = {
      bulk_order: {
        items_attributes: items.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
    };
    try {
      await api.post('/bulk_orders', orderData);
      alert('Bulk order submitted!');
      setItems([]);
      // Optionally refresh the orders list
      // queryClient.invalidateQueries('bulkOrders');
    } catch (error) {
      console.error(error);
      alert('Failed to submit bulk order. Please try again.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Bulk Order</h1>

      {/* Search and add items */}
      <div className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <button
            onClick={searchProducts}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            Search
          </button>
        </div>
        {showSearch && searchResults.length > 0 && (
          <div className="mt-2 border rounded-lg divide-y">
            {searchResults.map(p => (
              <div key={p.id} className="p-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-sm text-gray-600">ETB {p.price}</p>
                </div>
                <button
                  onClick={() => addItem(p)}
                  className="bg-primary-600 text-white px-3 py-1 rounded"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current order table */}
      {items.length > 0 && (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden mb-8">
          <table className="w-full">
            <thead className="bg-gray-50/50 border-b">
              <tr>
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-left">Unit Price</th>
                <th className="p-3 text-left">Quantity</th>
                <th className="p-3 text-left">Total</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-3">{item.title}</td>
                  <td className="p-3">ETB {item.unitPrice}</td>
                  <td className="p-3">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(idx, parseInt(e.target.value) || 1)}
                      className="w-20 border rounded px-2 py-1"
                    />
                  </td>
                  <td className="p-3">ETB {item.unitPrice * item.quantity}</td>
                  <td className="p-3">
                    <button onClick={() => removeItem(idx)} className="text-red-500">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="border-t font-bold">
                <td colSpan={3} className="p-3 text-right">Subtotal</td>
                <td className="p-3">ETB {subtotal}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
          <div className="p-4 flex justify-end">
            <button
              onClick={handleSubmit}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Submit Bulk Order
            </button>
          </div>
        </div>
      )}

      {/* Existing bulk orders */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">My Bulk Orders</h2>
        {ordersLoading ? (
          <div className="text-center py-4">Loading orders...</div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white/70 backdrop-blur-sm rounded-xl shadow p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium">Order #{order.id}</span>
                    <span className="ml-3 text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="p-2 text-left">Product</th>
                      <th className="p-2 text-left">Quantity</th>
                      <th className="p-2 text-left">Unit Price</th>
                      <th className="p-2 text-left">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="p-2">{item.product_title}</td>
                        <td className="p-2">{item.quantity}</td>
                        <td className="p-2">ETB {item.unit_price}</td>
                        <td className="p-2">ETB {item.total_price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-2 text-right font-semibold">
                  Total: ETB {order.total_amount}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">No bulk orders yet.</div>
        )}
      </div>
    </div>
  );
};

export default BulkOrderPage;