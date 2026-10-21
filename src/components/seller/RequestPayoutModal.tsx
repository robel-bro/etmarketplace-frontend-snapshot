import { useState } from 'react';
import { motion } from 'framer-motion';

interface RequestPayoutModalProps {
  availableAmount: number;
  onClose: () => void;
  onRequest: (periodStart?: string, periodEnd?: string) => void;
}

const RequestPayoutModal = ({ availableAmount, onClose, onRequest }: RequestPayoutModalProps) => {
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  // Ensure we never call toLocaleString on undefined
  const safeAmount = availableAmount ?? 0;

  const handleSubmit = () => {
    onRequest(periodStart || undefined, periodEnd || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-2">Request Payout</h3>
        <p className="text-sm text-gray-500 mb-4">
          You are requesting your entire available balance of{' '}
          <span className="font-semibold text-gray-900">ETB {safeAmount.toLocaleString()}</span>.
        </p>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Period Start (optional)</label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Period End (optional)</label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm bg-[var(--color-orange-500)] text-white rounded-lg hover:bg-orange-600"
          >
            Confirm Request
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default RequestPayoutModal;