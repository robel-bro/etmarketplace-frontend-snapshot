import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../lib/axios';

const PromoCodeModal = ({ code, onClose, onSave, sellerMode = false, sellerProducts = [] }) => {
  const [form, setForm] = useState(
    code || {
      code: '',
      type: 'percentage',
      value: '',
      minOrder: '',
      startDate: '',
      endDate: '',
      usageLimit: '',
      perUserLimit: 1,
      applicableProducts: [],
      applicableCategories: [],
      status: 'active',
    }
  );
  const [categories, setCategories] = useState([]);

  // Fetch categories if needed
  useEffect(() => {
    if (!sellerMode) {
      api.get('/categories')
        .then(res => setCategories(res.data))
        .catch(console.error);
    }
  }, [sellerMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  // For seller mode, use sellerProducts; otherwise, fetch all products (mock or API)
  const productOptions = sellerMode
    ? sellerProducts.map(p => ({ id: p.id, name: p.title }))
    : [
        { id: 5, name: 'Smartphone X' },
        { id: 8, name: 'Leather Bag' },
        { id: 12, name: 'Running Shoes' },
      ]; // Replace with API later

  const categoryOptions = sellerMode
    ? [] // Sellers might not need categories, but you can still show if needed
    : categories.map(c => ({ id: c.id, name: c.name }));

  const handleMultiSelect = (field, id) => {
    const current = form[field] || [];
    if (current.includes(id)) {
      setForm({ ...form, [field]: current.filter(v => v !== id) });
    } else {
      setForm({ ...form, [field]: [...current, id] });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{code ? 'Edit Promo Code' : 'Create Promo Code'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Code</label>
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
          </div>

          {form.type !== 'free_shipping' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {form.type === 'percentage' ? 'Discount %' : 'Discount Amount (ETB)'}
              </label>
              <input
                type="number"
                name="value"
                value={form.value}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                required={form.type !== 'free_shipping'}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Minimum Order (ETB)</label>
              <input
                type="number"
                name="minOrder"
                value={form.minOrder}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="0 for no minimum"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Per‑User Limit</label>
              <input
                type="number"
                name="perUserLimit"
                value={form.perUserLimit}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Total Usage Limit</label>
            <input
              type="number"
              name="usageLimit"
              value={form.usageLimit}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Leave empty for unlimited"
            />
          </div>

          {/* Applicable Products */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Applicable Products</label>
            <div className="mt-2 space-y-1 max-h-24 overflow-y-auto border rounded-lg p-2">
              {productOptions.map(p => (
                <label key={p.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.applicableProducts?.includes(p.id)}
                    onChange={() => handleMultiSelect('applicableProducts', p.id)}
                    className="rounded text-primary-600"
                  />
                  <span className="text-sm">{p.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Applicable Categories (only for admin) */}
          {!sellerMode && categoryOptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Applicable Categories</label>
              <div className="mt-2 space-y-1 max-h-24 overflow-y-auto border rounded-lg p-2">
                {categoryOptions.map(c => (
                  <label key={c.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.applicableCategories?.includes(c.id)}
                      onChange={() => handleMultiSelect('applicableCategories', c.id)}
                      className="rounded text-primary-600"
                    />
                    <span className="text-sm">{c.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              Save
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default PromoCodeModal;