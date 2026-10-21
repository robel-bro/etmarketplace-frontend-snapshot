// src/components/features/reviews/ReviewList.tsx
import { useQuery } from 'react-query';
import { StarIcon } from '@heroicons/react/20/solid';
import { FunnelIcon } from '@heroicons/react/24/outline';
import api from '../../../lib/axios';
import { useState, useMemo } from 'react';
import AllReviewsModal from './AllReviewsModal';

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

interface ReviewListProps {
  productId?: number;
  vendorId?: number;
  reviewableType?: string;
  reviewableId?: number;
}

const ReviewList = ({ productId, vendorId, reviewableType, reviewableId }: ReviewListProps) => {
  const endpoint = productId
    ? `/products/${productId}/reviews`
    : vendorId
    ? `/vendors/${vendorId}/reviews`
    : reviewableType === 'Package' && reviewableId
    ? `/packages/${reviewableId}/reviews`
    : '';

  const queryKey = ['reviews', endpoint];

  const { data: reviews, isLoading, error } = useQuery(
    queryKey,
    () => api.get(endpoint).then(res => res.data),
    { enabled: !!endpoint }
  );

  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'highest'>('recent');
  const [showAllModal, setShowAllModal] = useState(false);

  const reviewList: Review[] = useMemo(() => {
    if (!reviews) return [];
    const list = Array.isArray(reviews) ? reviews : [];
    const filtered = starFilter
      ? list.filter(r => Math.round(r.rating) === starFilter)
      : list;
    return [...filtered].sort((a, b) => {
      if (sortBy === 'highest') return b.rating - a.rating;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [reviews, starFilter, sortBy]);

  const visibleReviews = reviewList.slice(0, 5);
  const totalAll = Array.isArray(reviews) ? reviews.length : 0;
  const avgRating = totalAll
    ? (reviews as Review[]).reduce((acc, r) => acc + r.rating, 0) / totalAll
    : 0;

  const distribution = [5, 4, 3, 2, 1].map(star => {
    const count = totalAll
      ? (reviews as Review[]).filter(r => Math.round(r.rating) === star).length
      : 0;
    return { star, count, percentage: totalAll ? (count / totalAll) * 100 : 0 };
  });

  if (!endpoint) return null;
  if (isLoading) return <div className="text-sm text-[var(--text-muted)] py-4">Loading reviews…</div>;
  if (error) return <div className="text-sm text-red-500 py-4">Failed to load reviews.</div>;

  return (
    <div className="space-y-5">
      {/* ★ Rating Summary + Quick Filter */}
      <div className="flex flex-col sm:flex-row gap-5 items-start">
        <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg px-6 py-4 min-w-[100px]">
          <span className="text-4xl font-extrabold text-[var(--text-primary)]">
            {avgRating.toFixed(1)}
          </span>
          <div className="flex mt-1">
            {[1, 2, 3, 4, 5].map(star => (
              <StarIcon
                key={star}
                className={`w-4 h-4 ${star <= Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <span className="text-xs text-[var(--text-muted)] mt-1">{totalAll} reviews</span>
        </div>

        <div className="flex-1 w-full max-w-md space-y-1.5">
          {distribution.map(({ star, count, percentage }) => (
            <button
              key={star}
              onClick={() => setStarFilter(starFilter === star ? null : star)}
              className={`flex items-center gap-2 text-xs w-full group transition ${
                starFilter === star ? 'opacity-100' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <span className="w-8 text-right text-[var(--text-secondary)]">{star} ★</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    starFilter === star ? 'bg-[var(--brand)]' : 'bg-yellow-400'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-6 text-right text-[var(--text-muted)]">{count}</span>
            </button>
          ))}
          {starFilter && (
            <button
              onClick={() => setStarFilter(null)}
              className="text-xs text-[var(--brand)] hover:underline mt-1"
            >
              Show all reviews
            </button>
          )}
        </div>
      </div>

      {/* Sort bar */}
      <div className="flex items-center justify-between border-b border-[var(--border-light)] pb-2">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <FunnelIcon className="w-4 h-4" />
          <span>{starFilter ? `${starFilter} star reviews` : 'All reviews'} ({reviewList.length})</span>
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as 'recent' | 'highest')}
          className="text-xs border border-[var(--border-light)] rounded px-2 py-1 bg-white focus:border-[var(--brand)] outline-none"
        >
          <option value="recent">Most Recent</option>
          <option value="highest">Highest Rated</option>
        </select>
      </div>

      {/* Review cards (first 5) */}
      {visibleReviews.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] py-6 text-center">
          No reviews yet.
        </p>
      ) : (
        <div className="space-y-3">
          {visibleReviews.map((review: Review) => {
            const userName = review.user?.name || 'Anonymous';
            const userInitial = userName.charAt(0).toUpperCase();
            const commentText = review.comment || review.body || '';
            const reviewDate = review.created_at
              ? new Date(review.created_at).toLocaleDateString()
              : '';

            return (
              <div
                key={review.id}
                className="border border-[var(--border-light)] rounded-lg p-3 bg-white hover:shadow-sm transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center font-semibold text-sm shrink-0">
                    {userInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[var(--text-primary)]">
                          {userName}
                        </span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map(star => (
                            <StarIcon
                              key={star}
                              className={`w-3.5 h-3.5 ${
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
                    <p className="text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                      {commentText}
                    </p>
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {review.images.map((img, i) => (
                          <img
                            key={i}
                            src={img.url}
                            alt="review"
                            className="w-16 h-16 object-cover rounded-lg border border-[var(--border-light)]"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ★ View all reviews link */}
      {totalAll > 5 && (
        <div className="text-center pt-2">
          <button
            onClick={() => setShowAllModal(true)}
            className="text-sm font-medium text-[var(--brand)] hover:text-[var(--brand-hover)] underline"
          >
            View all {totalAll} reviews →
          </button>
        </div>
      )}

      {/* ★ All Reviews Modal */}
      <AllReviewsModal
        isOpen={showAllModal}
        onClose={() => setShowAllModal(false)}
        productId={productId}
        vendorId={vendorId}
        reviewableType={reviewableType}
        reviewableId={reviewableId}
      />
    </div>
  );
};

export default ReviewList;