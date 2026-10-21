// src/components/features/reviews/AllReviewsModal.tsx
import { useQuery } from 'react-query';
import { StarIcon, XMarkIcon } from '@heroicons/react/20/solid';
import api from '../../../lib/axios';

interface Review {
  id: number;
  user?: { name?: string };
  rating: number;
  title?: string;
  comment?: string;
  body?: string;
  created_at: string;
  images?: { url: string }[];
}

interface AllReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: number;
  vendorId?: number;
  reviewableType?: string;
  reviewableId?: number;
}

const AllReviewsModal = ({ isOpen, onClose, productId, vendorId, reviewableType, reviewableId }: AllReviewsModalProps) => {
  const endpoint = productId
    ? `/products/${productId}/reviews`
    : vendorId
    ? `/vendors/${vendorId}/reviews`
    : reviewableType === 'Package' && reviewableId
    ? `/packages/${reviewableId}/reviews`
    : '';

  const { data: reviews, isLoading } = useQuery(
    ['allReviews', endpoint],
    () => api.get(endpoint).then(res => res.data),
    { enabled: isOpen && !!endpoint }
  );

  if (!isOpen) return null;

  const reviewsArray: Review[] = Array.isArray(reviews) ? reviews : [];
  const averageRating = reviewsArray.length
    ? reviewsArray.reduce((acc, r) => acc + r.rating, 0) / reviewsArray.length
    : 0;

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-start justify-center pt-10 px-4">
      <div className="bg-white w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-5 border-b border-[var(--border-light)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            All Reviews ({reviewsArray.length})
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Summary */}
          <div className="flex items-center gap-4 bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-2xl font-bold text-[var(--text-primary)]">
              {averageRating.toFixed(1)}
            </span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map(star => (
                <StarIcon
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-[var(--text-muted)]">{reviewsArray.length} reviews</span>
          </div>

          {isLoading ? (
            <div className="text-sm text-[var(--text-muted)] py-8 text-center">
              Loading all reviews…
            </div>
          ) : (
            reviewsArray.map(review => {
              const userName = review.user?.name || 'Anonymous';
              const userInitial = userName.charAt(0).toUpperCase();
              const commentText = review.comment || review.body || '';
              const reviewDate = review.created_at
                ? new Date(review.created_at).toLocaleDateString()
                : '';

              return (
                <div
                  key={review.id}
                  className="border-b border-[var(--border-light)] pb-4 last:border-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center font-semibold text-sm shrink-0">
                      {userInitial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-semibold text-sm text-[var(--text-primary)]">
                            {userName}
                          </span>
                          <div className="flex items-center mt-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <StarIcon
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-[var(--text-muted)] shrink-0">
                          {reviewDate}
                        </span>
                      </div>
                      {review.title && (
                        <h4 className="text-sm font-medium text-[var(--text-primary)] mt-1.5">
                          {review.title}
                        </h4>
                      )}
                      <p className="text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                        {commentText}
                      </p>
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {review.images.map((img, i) => (
                            <img
                              key={i}
                              src={img.url}
                              alt="attachment"
                              className="w-16 h-16 object-cover rounded-lg border border-[var(--border-light)]"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AllReviewsModal;