// src/components/features/products/ProductCard.tsx (hardened – no cart button, tighter text, more image space)
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Truck } from 'lucide-react';

export const MembershipBadge = ({ tier }: { tier: string }) => {
  const lower = tier.toLowerCase();
  if (lower === 'free' || !lower.match(/platinum|gold|silver/)) return null;

  const glyphMap: Record<string, string> = {
    platinum: '💎',
    gold: '🏆',
    silver: '🥈',
  };

  let glyph = '✨';
  for (const key of Object.keys(glyphMap)) {
    if (lower.includes(key)) {
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

interface Vendor {
  id: number;
  business_name: string;
  membership_tier?: string | null;
  badge?: string | null;
  rating?: number;
  total_sales?: number;
  products_count?: number;
}

interface ApiProduct {
  id: number;
  title?: string;
  price?: number | string;
  effective_price?: number | string;
  original_price?: number | string;
  image_urls?: string[];
  rating?: number;
  reviews_count?: number;
  sold_count?: number;
  free_shipping?: boolean;
  free_delivery?: boolean;
  delivery_label?: string;
  discount?: number;
  stock?: number;
  seller_pays_shipping?: boolean;
  shipping_subsidy_type?: string;
  shipping_subsidy_value?: number;
  is_flash_sale?: boolean;
  flash_sale_price?: number;
  is_super_deal?: boolean;
  super_deal_price?: number;
  variants?: Array<any>;
  variants_count?: number;
  image_ids?: number[];
  bulk_enabled?: boolean;
  minimum_bulk_quantity?: number;
  vendor?: Vendor;
  // NEW – from hardened backend
  orderable?: boolean;
  unavailable_reason?: string | null;
}

interface ProductCardProps {
  product: ApiProduct;
  showOutOfStock?: boolean;
  hideCartButton?: boolean;
  hideMembershipBadge?: boolean;
  compact?: boolean;
}

const ProductCard = ({
  product,
  showOutOfStock = false,
  hideCartButton = false,   // kept for API compatibility – no button rendered regardless
  hideMembershipBadge = false,
  compact = false,
}: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  if (!product || !product.id) return null;

  const {
    id,
    title = 'Untitled Product',
    price,
    effective_price,
    original_price,
    image_urls,
    rating,
    reviews_count,
    free_shipping,
    discount,
    bulk_enabled,
    vendor,
    free_delivery,
    delivery_label,
    orderable,
    unavailable_reason,
  } = product;

  // ── Images ──
  const getImageUrl = (url: string | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_URL || '';
    return `${baseUrl}${url}`;
  };
  const firstImage = getImageUrl(image_urls?.[0]) || 'https://placehold.co/300x300?text=No+Image';
  const secondImage = getImageUrl(image_urls?.[1]);
  const displayImage = isHovered && secondImage ? secondImage : firstImage;

  // ── Pricing ──
  const baseNumericPrice =
    effective_price !== undefined && effective_price !== null
      ? Number(effective_price)
      : price !== undefined && price !== null
        ? Number(price)
        : 0;
  const finalPrice = baseNumericPrice;

  const computedDiscount = discount || 0;

  // ── Rating ──
  let safeRating = 0;
  if (rating !== undefined && rating !== null) {
    const parsed = parseFloat(rating as any);
    if (!isNaN(parsed)) safeRating = Math.min(5, Math.max(0, parsed));
  }
  const fullStars = Math.floor(safeRating);
  const emptyStars = 5 - fullStars;
  const reviewCount = Number(reviews_count) || 0;

  const StarIcon = ({ filled }: { filled: boolean }) => {
    const gold = '#F59E0B';
    return (
      <svg
        className="w-2.5 h-2.5 sm:w-3 sm:h-3"
        viewBox="0 0 24 24"
        fill={filled ? gold : 'none'}
        stroke={gold}
        strokeWidth="2"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  };

  const formatPrice = (value: number) =>
    value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ── Delivery ribbon – now uses free_delivery and delivery_label ──
  const deliveryRibbon = useMemo(() => {
    if (compact) return null;
    if (free_delivery && delivery_label) {
      return { text: delivery_label, className: 'bg-blue-500' };
    }
    // Fallback to old logic if new fields are missing (backward compat)
    if (free_shipping) return { text: 'Free Delivery', className: 'bg-blue-500' };
    if (product.seller_pays_shipping && product.shipping_subsidy_type === 'percent' && product.shipping_subsidy_value)
      return { text: `${product.shipping_subsidy_value}% off Delivery`, className: 'bg-orange-500' };
    if (product.seller_pays_shipping && product.shipping_subsidy_type === 'fixed' && product.shipping_subsidy_value)
      return { text: `ETB ${product.shipping_subsidy_value} off Delivery`, className: 'bg-orange-500' };
    return null;
  }, [free_delivery, delivery_label, free_shipping, product.seller_pays_shipping, product.shipping_subsidy_type, product.shipping_subsidy_value, compact]);

  // ── Unorderable overlay (when orderable is explicitly false) ──
  const isUnorderable = orderable === false;
  const reasonText = unavailable_reason || 'Currently unavailable';

  // ── Compact mode ──
  if (compact) {
    return (
      <Link to={`/product/${id}`} className="block group relative">
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm hover:shadow transition-shadow duration-200 p-0">
          <div className="p-1">
            <div className="relative overflow-hidden bg-surface-hover rounded-sm pb-[100%]">
              <img
                src={displayImage}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                onError={(e) => { e.currentTarget.src = 'https://placehold.co/300x300?text=No+Image'; }}
              />
              {computedDiscount > 0 && (
                <div className="absolute top-1 left-1 bg-red-500 text-white text-[10px] font-bold px-1 py-0.5 rounded z-10">
                  -{computedDiscount}%
                </div>
              )}
            </div>
          </div>
          <div className="px-1 pb-1">
            <h3 className="text-[10px] sm:text-[11px] font-medium text-text-primary line-clamp-1 group-hover:text-[var(--brand)] transition-colors leading-tight">
              {title}
            </h3>
            <div className="text-[11px] sm:text-xs font-bold text-text-primary mt-0.5">
              ETB {formatPrice(finalPrice)}
            </div>
            <div className="flex items-center gap-0.5 mt-0.5">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} filled={i < fullStars} />
              ))}
            </div>
          </div>
        </div>
        {isUnorderable && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-md">
            <span className="text-xs font-semibold text-red-600 px-2 py-1 bg-white rounded shadow">
              {reasonText}
            </span>
          </div>
        )}
      </Link>
    );
  }

  // ── Full card ──
  const showOriginalPrice = original_price != null && Number(original_price) > finalPrice;

  return (
    <Link to={`/product/${id}`} className="block group relative">
      <div className="bg-white border border-gray-200 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 p-0 flex flex-col h-full">
        {/* Tighter padding: p-1.5 instead of p-3, more space for image */}
        <div className="p-1.5 flex flex-col flex-1">
          {/* Image – unchanged square but with less surrounding padding */}
          <div className="relative overflow-hidden bg-surface-hover rounded-sm pb-[100%] flex-shrink-0">
            <img
              src={displayImage}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              onError={(e) => { e.currentTarget.src = 'https://placehold.co/300x300?text=No+Image'; }}
            />
            {computedDiscount > 0 && (
              <div className="absolute top-1 left-1 bg-red-500 text-white text-[10px] font-bold px-1 py-0.5 rounded z-10">
                -{computedDiscount}%
              </div>
            )}
            {deliveryRibbon && (
              <div className={`absolute bottom-0 left-0 right-0 ${deliveryRibbon.className} text-white text-[10px] font-semibold flex items-center justify-center py-0.5 gap-1 z-10`}>
                <Truck className="w-2 h-2" />
                {deliveryRibbon.text}
              </div>
            )}
          </div>

          {/* Text area – compressed spacing and smaller min-heights */}
          <div className="flex-1 flex flex-col mt-1">
            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug group-hover:text-[var(--brand)] transition-colors">
              {title}
            </h3>

            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-bold text-gray-900">
                ETB {formatPrice(finalPrice)}
              </span>
              {showOriginalPrice && (
                <span className="text-xs text-gray-900 line-through font-medium">
                  ETB {formatPrice(Number(original_price))}
                </span>
              )}
            </div>

            <div className="flex items-center text-xs mt-0.5">
              <div className="flex items-center gap-1 text-gray-900">
                {safeRating > 0 ? (
                  <>
                    <div className="flex items-center gap-0.5">
                      {[...Array(fullStars)].map((_, i) => <StarIcon key={`f-${i}`} filled={true} />)}
                      {[...Array(emptyStars)].map((_, i) => <StarIcon key={`e-${i}`} filled={false} />)}
                    </div>
                    <span>({reviewCount})</span>
                  </>
                ) : (
                  <span className="italic">No reviews yet</span>
                )}
                {!hideMembershipBadge && vendor?.badge && <MembershipBadge tier={vendor.badge} />}
              </div>
            </div>

            {bulk_enabled && (
              <div className="mt-0.5 text-xs text-gray-900 font-medium">
                <span className="inline-flex items-center gap-0.5">
                  <span>📦</span> WHOLESALE
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Unorderable overlay */}
      {isUnorderable && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-md pointer-events-none">
          <span className="text-xs font-semibold text-red-600 px-3 py-1.5 bg-white rounded shadow">
            {reasonText}
          </span>
        </div>
      )}
    </Link>
  );
};

export default ProductCard;