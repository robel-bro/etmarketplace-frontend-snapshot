import { useState } from 'react';
import axios from '@/lib/axios';
import { Button } from '@/components/ui/button';

interface Props {
  orderId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReturnRequestModal({ orderId, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await axios.post('/return_requests', {
        order_id: orderId,
        reason: reason,
        details: details,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit return request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-bold mb-4">Request Return</h2>
        <p className="text-sm text-gray-500 mb-4">Order #{orderId}</p>

        <label className="block text-sm font-medium mb-1">Reason</label>
        <select
          className="w-full border rounded px-3 py-2 mb-3"
          value={reason}
          onChange={e => setReason(e.target.value)}
        >
          <option value="">Select a reason</option>
          <option value="defective">Item defective</option>
          <option value="damaged">Damaged during delivery</option>
          <option value="wrong_item">Wrong item received</option>
          <option value="not_as_described">Not as described</option>
          <option value="change_of_mind">Change of mind</option>
          <option value="other">Other</option>
        </select>

        <label className="block text-sm font-medium mb-1">Details (optional)</label>
        <textarea
          className="w-full border rounded px-3 py-2 mb-3"
          rows={3}
          value={details}
          onChange={e => setDetails(e.target.value)}
          placeholder="Describe the issue..."
        />

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </div>
    </div>
  );
}