import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/axios';

const AccountDetails = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.patch('/api/v1/profile', { user: form });
      setMessage('Profile updated.');
    } catch {
      setMessage('Update failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
      <h2 className="text-base font-semibold text-gray-900">Account Details</h2>
      <div>
        <label className="text-sm font-medium text-gray-700">Full Name</label>
        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="mt-1 block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">Email</label>
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="mt-1 block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">Phone</label>
        <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="mt-1 block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" />
      </div>
      {message && <p className="text-sm text-green-600">{message}</p>}
      <button type="submit" disabled={saving}
        className="bg-[var(--color-orange-500)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-orange-600)] disabled:opacity-50">
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  );
};

export default AccountDetails;