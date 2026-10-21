import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../lib/axios'; // ✅ fixed import

const BuyerVerificationModal = ({ onClose, onVerified }) => {
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/buyer_verification', { user: { phone, national_id: nationalId, email } });
      onVerified();
    } catch (err) {
      setError(err.response?.data?.errors?.join(', ') || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full"
      >
        <h2 className="text-xl font-bold mb-2">Complete Your Profile</h2>
        <p className="text-sm text-gray-600 mb-4">
          To place an order, we need your phone number and national ID for delivery and verification. Your information is encrypted and never shared.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 text-red-500 p-2 rounded text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number <span className="text-red-500">*</span></label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">National ID Number <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border rounded-lg"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Used only for verification and secure transactions.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email (optional for updates)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border rounded-lg"
              placeholder="you@example.com"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Later</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default BuyerVerificationModal;