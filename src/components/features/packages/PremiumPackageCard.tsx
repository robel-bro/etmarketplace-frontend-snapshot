// src/components/features/packages/PremiumPackageCard.tsx (hardened – stock & delivery in one row, no paid badge)
import { useState, useEffect, useRef, useCallback } from 'react';
import { Truck } from 'lucide-react';

const MembershipBadgePlain = ({ tier }: { tier: string }) => {
  const tierLower = tier.toLowerCase();
  if (tierLower === 'free' || !tier) return null;

  const glyphMap: Record<string, string> = {
    platinum: '💎',
    gold: '🏆',
    silver: '🥈',
  };

  let glyph = '✨';
  for (const key of Object.keys(glyphMap)) {
    if (tierLower.includes(key)) {
      glyph = glyphMap[key];
      break;
    }
  }

  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-gray-900">
      <span>{glyph}</span>
      <span>{tier}</span>
    </span>
  );
};

export interface PremiumPackageCardProps {
  id: number;
  name: string;
  images?: string[];
  image_url?: string;
  image_urls?: string[];
  price: number | string;
  originalPrice?: number | string;
  vendor: string;
  vendorBadge?: string | null;
  rating?: number | string;
  reviewsCount?: number | string;
  stock?: number | string | null;
  itemsCount?: number | string;
  free_delivery?: boolean;
  delivery_label?: string;
  out_of_stock?: boolean;
}

const PremiumPackageCard = ({
  id,
  name,
  images,
  image_url,
  image_urls,
  price,
  originalPrice,
  vendor,
  vendorBadge,
  rating,
  reviewsCount,
  stock,
  itemsCount,
  free_delivery,
  delivery_label,
  out_of_stock,
}: PremiumPackageCardProps) => {
  if (!id || !name) {
    return (
      <div className="p-3 text-center text-xs text-gray-900">
        Package unavailable
      </div>
    );
  }

  let imageList: string[] = [];
  if (images?.length) imageList = images;
  else if (image_urls?.length) imageList = image_urls;
  else if (image_url) imageList = [image_url];
  else imageList = ['https://placehold.co/600x600?text=No+Image'];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mainImageLoaded, setMainImageLoaded] = useState(false);
  const [autoScrollPaused, setAutoScrollPaused] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  const [showMembership, setShowMembership] = useState(true);
  const hasBadge = vendorBadge != null && vendorBadge !== '';
  const items = itemsCount != null ? Number(itemsCount) : undefined;
  const hasItems = items != null && items > 0;

  useEffect(() => {
    if (hasBadge && hasItems) {
      const interval = setInterval(() => {
        setShowMembership(prev => !prev);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [hasBadge, hasItems]);

  const showBadgeNow = hasBadge && (!hasItems || showMembership);
  const showItemsNow = hasItems && (!hasBadge || !showMembership);

  const preloadImage = useCallback(
    (index: number) => {
      if (index < 0 || index >= imageList.length || loadedImages.has(index)) return;
      const img = new Image();
      img.src = imageList[index];
      img.onload = () => setLoadedImages((prev) => new Set(prev).add(index));
      img.onerror = () => setLoadedImages((prev) => new Set(prev).add(index));
    },
    [imageList, loadedImages]
  );

  useEffect(() => {
    preloadImage(0);
    if (imageList.length > 1) preloadImage(1);
  }, []);

  useEffect(() => {
    if (imageList.length <= 1) return;
    const nextIdx = (currentImageIndex + 1) % imageList.length;
    const prevIdx = (currentImageIndex - 1 + imageList.length) % imageList.length;
    preloadImage(nextIdx);
    preloadImage(prevIdx);
  }, [currentImageIndex, imageList, preloadImage]);

  const numericPrice = Number(price);
  const numericOriginalPrice = originalPrice ? Number(originalPrice) : undefined;
  const discount =
    numericOriginalPrice && numericOriginalPrice > numericPrice
      ? Math.round(((numericOriginalPrice - numericPrice) / numericOriginalPrice) * 100)
      : 0;

  const safeRating = rating != null ? Number(rating) : 0;
  const safeReviewsCount = reviewsCount != null ? Number(reviewsCount) : 0;

  const stockValue = stock != null ? (stock === null || stock === 'null' ? null : Number(stock)) : undefined;
  const stockDisplay =
    stockValue === null
      ? 'Unlimited'
      : stockValue !== undefined && stockValue > 0
      ? `${stockValue} available`
      : stockValue === 0
      ? 'Out of stock'
      : undefined;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || imageList.length <= 1) return;
    const interval = setInterval(() => {
      if (autoScrollPaused) return;
      const nextIdx = (currentImageIndex + 1) % imageList.length;
      if (loadedImages.has(nextIdx)) setCurrentImageIndex(nextIdx);
    }, 20000);
    return () => clearInterval(interval);
  }, [isVisible, imageList.length, autoScrollPaused, currentImageIndex, loadedImages]);

  const pauseAutoScroll = () => {
    setAutoScrollPaused(true);
    setTimeout(() => setAutoScrollPaused(false), 20000);
  };

  const handleDotClick = (idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loadedImages.has(idx)) setCurrentImageIndex(idx);
    pauseAutoScroll();
  };

  const maxVisibleThumbnails = 4;
  const totalImages = imageList.length;
  const hasMore = totalImages > maxVisibleThumbnails;
  const visibleThumbnails = hasMore
    ? imageList.slice(0, maxVisibleThumbnails - 1)
    : imageList.slice(0, maxVisibleThumbnails);
  const remainingCount = totalImages - (maxVisibleThumbnails - 1);

  const formatPrice = (value: number) =>
    value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // ── Delivery text: only show non-paid labels ──
  const deliveryText = (() => {
    if (!delivery_label) return null;
    const lower = delivery_label.toLowerCase();
    if (lower.includes('paid')) return null;
    return delivery_label;
  })();

  const deliveryClass = free_delivery
    ? 'text-blue-600'
    : 'text-orange-600';

  return (
    <div ref={cardRef} className="group relative">
      {/* Outer card – Alibaba style */}
      <div className="bg-white border border-gray-200 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
        <div className="p-2 flex flex-col">
          {/* Main image */}
          <div className="relative overflow-hidden bg-surface-hover rounded-sm pb-[100%] flex-shrink-0 leading-none">
            {discount > 0 && (
              <div className="absolute top-2 left-2 z-20 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                -{discount}%
              </div>
            )}
            {(!loadedImages.has(currentImageIndex) || !mainImageLoaded) && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse z-10" />
            )}
            <img
              src={imageList[currentImageIndex]}
              alt={name}
              onLoad={() => setMainImageLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                loadedImages.has(currentImageIndex) && mainImageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
            {imageList.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20">
                {imageList.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => handleDotClick(idx, e)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      idx === currentImageIndex ? 'bg-white shadow scale-110' : 'bg-white/60 hover:bg-white/80'
                    }`}
                    aria-label={`Go to image ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Text pad */}
          <div className="px-1.5 py-1 flex flex-col gap-0.5 mt-0.5">
            {/* ★ Thumbnails as FIRST row */}
            {imageList.length > 1 && (
              <div className="flex gap-1.5 items-center">
                {visibleThumbnails.map((img, idx) => {
                  const isActive = idx === currentImageIndex && !hasMore;
                  return (
                    <button
                      key={idx}
                      onClick={(e) => handleDotClick(idx, e)}
                      className={`w-7 h-7 border border-gray-300 shadow-sm overflow-hidden flex-shrink-0 transition-all duration-200
                        ${isActive ? 'ring-2 ring-blue-500 scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
                    >
                      <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  );
                })}
                {hasMore && (
                  <div
                    className={`relative w-7 h-7 border border-gray-300 shadow-sm overflow-hidden flex-shrink-0 transition-all duration-200
                      ${currentImageIndex >= maxVisibleThumbnails - 1 ? 'ring-2 ring-blue-500 scale-110' : 'opacity-70'}`}
                  >
                    <img
                      src={imageList[maxVisibleThumbnails - 1]}
                      alt={`+${remainingCount} more`}
                      className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="text-[10px] font-bold text-white">+{remainingCount}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Vendor + rating row */}
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-gray-900 font-medium truncate">
                {vendor}
              </p>
              <div className="flex items-center gap-1 flex-shrink-0 text-xs text-gray-900">
                {safeRating > 0 ? (
                  <>
                    <span className="font-bold">{safeRating.toFixed(1)}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-2.5 h-2.5 sm:w-3 sm:h-3" viewBox="0 0 24 24" fill={i < Math.round(safeRating) ? '#F59E0B' : 'none'} stroke="#F59E0B" strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <span>({safeReviewsCount} reviews)</span>
                  </>
                ) : (
                  <span className="italic">No reviews yet</span>
                )}
              </div>
            </div>

            {/* Title */}
            <h3 className="text-[13px] font-semibold text-gray-900 line-clamp-2 leading-snug">
              {name}
            </h3>

            {/* Interchange area */}
            <div className="h-[18px] relative overflow-hidden">
              <div
                className={`absolute inset-0 flex items-center transition-opacity duration-500 ${
                  showBadgeNow ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                {hasBadge && <MembershipBadgePlain tier={vendorBadge!} />}
              </div>
              <div
                className={`absolute inset-0 flex items-center transition-opacity duration-500 ${
                  showItemsNow ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                {hasItems && (
                  <span className="text-xs text-gray-900 font-semibold">
                    {items} items in this package
                  </span>
                )}
              </div>
            </div>

            {/* Stock + Delivery in one row */}
            {(stockDisplay || deliveryText) && (
              <div className="flex items-center gap-2 text-[11px]">
                {stockDisplay && (
                  <span className={`font-medium ${stockDisplay === 'Out of stock' ? 'text-red-500' : stockDisplay === 'Unlimited' ? 'text-gray-900' : 'text-gray-500'}`}>
                    {stockDisplay}
                  </span>
                )}
                {deliveryText && (
                  <span className={`font-medium flex items-center gap-0.5 ${deliveryClass}`}>
                    <Truck className="w-3 h-3" />
                    <span>{deliveryText}</span>
                  </span>
                )}
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-2 mt-auto">
              <span className="text-lg font-bold text-gray-900">
                ETB {formatPrice(numericPrice)}
              </span>
              {numericOriginalPrice && (
                <span className="text-xs text-gray-900 line-through font-medium">
                  ETB {formatPrice(numericOriginalPrice)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Out-of-stock overlay */}
      {out_of_stock && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-md pointer-events-none">
          <span className="text-xs font-semibold text-red-600 px-2 py-1 bg-white rounded shadow">
            Out of stock
          </span>
        </div>
      )}
    </div>
  );
};

export default PremiumPackageCard;