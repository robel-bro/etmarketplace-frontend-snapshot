import { useState } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../../lib/axios'; // ✅ fixed path

interface AlertModalProps {
  productId: number;
  productName: string;
  currentPrice: number;
  type: 'price' | 'stock';
  onClose: () => void;
}

const AlertModal = ({ productId, productName, currentPrice, type, onClose }: AlertModalProps) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate target price once
  const targetPrice = type === 'price' ? Math.round(currentPrice * 0.9 * 100) / 100 : 0;
  const title = type === 'price' ? 'Price Drop Alert' : 'Back in Stock Alert';
  const description = type === 'price'
    ? `We'll email you when the price drops below ETB ${targetPrice}.`
    : "We'll email you when this item is back in stock.";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/price_alerts', {
        product_id: productId,
        target_price: targetPrice,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.errors?.join(', ') || 'Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        {submitted ? (
          <div className="text-center">
            <p className="text-green-600 mb-4">✓ You'll be notified at <strong>{email}</strong>.</p>
            <button
              onClick={onClose}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            <p className="text-gray-600">{description}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                placeholder="your@email.com"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Subscribing...' : 'Notify Me'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default AlertModal;