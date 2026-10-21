// src/components/features/reviews/ReviewForm.tsx
import { useState } from 'react';
import { StarIcon } from '@heroicons/react/20/solid';
import api from '../../../lib/axios';

interface ReviewFormProps {
  productId?: number;
  vendorId?: number;
  reviewableType?: string;
  reviewableId?: number;
  onSuccess: () => void;
  onCancel?: () => void;
}

const ReviewForm = ({ productId, vendorId, reviewableType, reviewableId, onSuccess, onCancel }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reviewType = productId ? 'product' : vendorId ? 'shop' : 'item';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload: any = { rating, comment };
    // Title is still sent for products (backend requires it), but hidden from the user
    if (reviewType === 'product') payload.title = title || `Review of ${productId}`;
    if (productId) payload.product_id = productId;
    if (vendorId) payload.vendor_id = vendorId;
    if (reviewableType && reviewableId) {
      payload.reviewable_type = reviewableType;
      payload.reviewable_id = reviewableId;
    }

    try {
      await api.post('/reviews', { review: payload });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.errors?.join(', ') || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-lg border border-[var(--border-light)]">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>
      )}
      <div>
        <label className="block text-sm font-semibold text-[var(--text-primary)]">Rating</label>
        <div className="flex items-center mt-1">
          {[1, 2, 3, 4, 5].map(star => (
            <StarIcon
              key={star}
              className={`w-6 h-6 cursor-pointer transition ${
                (hover || rating) >= star ? 'text-yellow-400' : 'text-gray-300'
              }`}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(star)}
            />
          ))}
        </div>
      </div>
      {/* Title removed from the UI – we auto-generate a generic one if needed */}
      <div>
        <label className="block text-sm font-semibold text-[var(--text-primary)]">
          {reviewType === 'product' ? 'Review' : 'Comment'}
        </label>
        <textarea
          rows={4}
          value={comment}
          onChange={e => setComment(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-[var(--border-light)] rounded-lg text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none"
          required
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="btn-cta text-sm"
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary text-sm">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default ReviewForm;