import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Button } from '@/components/ui/button';

const toast = {
  success: (msg: string) => alert('✅ ' + msg),
  error: (msg: string) => alert('❌ ' + msg),
};

interface Category {
  id: number;
  name: string;
  parent_id?: number | null;
}

interface ReturnPolicy {
  id: number;
  name: string;
  description: string;
  return_window_days: number;
  restocking_fee_percent: number;
  return_shipping_responsibility: string;
  is_active: boolean;
  applicable_categories: number[];
  excluded_categories: number[];
}

export default function ReturnPoliciesPage() {
  const [policies, setPolicies] = useState<ReturnPolicy[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<ReturnPolicy>>({
    name: '',
    description: '',
    return_window_days: 7,
    restocking_fee_percent: 0,
    return_shipping_responsibility: 'buyer',
    is_active: true,
    applicable_categories: [],
    excluded_categories: [],
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  // Load policies and categories on mount
  useEffect(() => {
    fetchPolicies();
    fetchCategories();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/admin/return_policies');
      setPolicies(res.data);
    } catch (err) {
      toast.error('Failed to load return policies');
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/admin/categories');
      // Keep only main categories (parent_id is null or undefined)
      const allCategories: Category[] = res.data || [];
      const mainCategories = allCategories.filter(cat => !cat.parent_id);
      setCategories(mainCategories);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const toggleCategory = (catId: number) => {
    setForm(prev => {
      const current = prev.applicable_categories || [];
      if (current.includes(catId)) {
        return { ...prev, applicable_categories: current.filter(id => id !== catId) };
      } else {
        return { ...prev, applicable_categories: [...current, catId] };
      }
    });
  };

  const handleSave = async () => {
    if (!form.name) return toast.error('Name is required');
    try {
      const payload = {
        ...form,
        applicable_categories: form.applicable_categories || [],
        excluded_categories: form.excluded_categories || [],
      };
      if (editingId) {
        await axios.put(`/admin/return_policies/${editingId}`, payload);
        toast.success('Policy updated');
      } else {
        await axios.post('/admin/return_policies', payload);
        toast.success('Policy created');
      }
      setForm({
        name: '',
        description: '',
        return_window_days: 7,
        restocking_fee_percent: 0,
        return_shipping_responsibility: 'buyer',
        is_active: true,
        applicable_categories: [],
        excluded_categories: [],
      });
      setEditingId(null);
      fetchPolicies();
    } catch (err) {
      toast.error('Save failed');
    }
  };

  const handleEdit = (policy: ReturnPolicy) => {
    setForm({
      name: policy.name,
      description: policy.description || '',
      return_window_days: policy.return_window_days,
      restocking_fee_percent: policy.restocking_fee_percent,
      return_shipping_responsibility: policy.return_shipping_responsibility,
      is_active: policy.is_active,
      applicable_categories: policy.applicable_categories || [],
      excluded_categories: policy.excluded_categories || [],
    });
    setEditingId(policy.id);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this policy?')) return;
    try {
      await axios.delete(`/admin/return_policies/${id}`);
      toast.success('Policy deleted');
      fetchPolicies();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Return Policies</h1>

      {/* Form */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium">Policy Name</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.name || ''}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Food – No Returns"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Return Window (days)</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              value={form.return_window_days ?? 7}
              onChange={e => setForm({ ...form, return_window_days: parseInt(e.target.value) || 7 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Restocking Fee (%)</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              value={form.restocking_fee_percent ?? 0}
              onChange={e => setForm({ ...form, restocking_fee_percent: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Return Shipping Paid By</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={form.return_shipping_responsibility || 'buyer'}
              onChange={e => setForm({ ...form, return_shipping_responsibility: e.target.value })}
            >
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="platform">Platform</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_active ?? true}
              onChange={e => setForm({ ...form, is_active: e.target.checked })}
            />
            <label className="text-sm font-medium">Active</label>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          <label className="block text-sm font-medium">Description / Template (shown to buyers)</label>
          <textarea
            className="w-full border rounded px-3 py-2 mt-1"
            rows={3}
            value={form.description || ''}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="e.g., 'Food items cannot be returned for safety reasons. For all other issues, please contact support within 24 hours.'"
          />
        </div>

        {/* Category Assignment — main categories only */}
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">
            Applicable Categories (check to apply policy to that category; leave all unchecked for global policy)
          </label>
          <div className="max-h-48 overflow-y-auto border rounded p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {categories.length === 0 && <p className="text-gray-400 text-sm">Loading main categories...</p>}
            {categories.map(cat => (
              <label key={cat.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={(form.applicable_categories || []).includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                />
                {cat.name}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button onClick={handleSave}>{editingId ? 'Update' : 'Create'}</Button>
          {editingId && (
            <Button variant="outline" onClick={() => {
              setForm({
                name: '',
                description: '',
                return_window_days: 7,
                restocking_fee_percent: 0,
                return_shipping_responsibility: 'buyer',
                is_active: true,
                applicable_categories: [],
                excluded_categories: [],
              });
              setEditingId(null);
            }}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <p>Loading...</p>
      ) : policies.length === 0 ? (
        <p className="text-gray-500">No return policies defined.</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Name</th>
              <th>Window (days)</th>
              <th>Restock Fee %</th>
              <th>Return Ship By</th>
              <th>Categories</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {policies.map(p => (
              <tr key={p.id} className="border-t">
                <td className="p-2">{p.name}</td>
                <td className="text-center">{p.return_window_days}</td>
                <td className="text-center">{p.restocking_fee_percent}</td>
                <td className="text-center capitalize">{p.return_shipping_responsibility}</td>
                <td className="text-center text-sm">
                  {p.applicable_categories.length === 0
                    ? 'Global'
                    : p.applicable_categories
                        .map(id => categories.find(c => c.id === id)?.name || id)
                        .join(', ')}
                </td>
                <td className="text-center">{p.is_active ? 'Yes' : 'No'}</td>
                <td className="text-center space-x-2">
                  <Button size="sm" onClick={() => handleEdit(p)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}