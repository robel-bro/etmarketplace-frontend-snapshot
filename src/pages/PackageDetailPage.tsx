// src/pages/PackageDetailPage.tsx (updated with weight & dimensions per item + superior layout)
import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/axios';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { useAuth } from '../hooks/useAuth';
import {
  ChevronRight,
  ShoppingCart,
  Heart,
  Share2,
  Trash2,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Play,
  Truck,
  Minus,
  Plus,
  Building2,
  Phone,
  Ruler,
  Weight,
} from 'lucide-react';
import ReviewList from '../components/features/reviews/ReviewList';

const formatPrice = (value: number) => {
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatted.endsWith('.00') ? formatted.slice(0, -3) : formatted;
};

// ── Full‑screen lightbox (only for images) ──
const ImageLightbox = ({
  images,
  index,
  onClose,
}: {
  images: string[];
  index: number;
  onClose: () => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(index);
  const total = images.length;

  const prev = () => setCurrentIndex((p) => (p - 1 + total) % total);
  const next = () => setCurrentIndex((p) => (p + 1) % total);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white p-3 hover:bg-white/20 transition rounded-full"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </button>
      <div className="relative max-w-5xl max-h-[90vh] px-4">
        <img
          src={images[currentIndex]}
          alt="Full screen"
          className="max-w-full max-h-[85vh] object-contain mx-auto"
        />
        {total > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                  className={`w-2.5 h-2.5 rounded-full ${
                    idx === currentIndex ? 'bg-white scale-110' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

const PackageDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, removeFromCart, cart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { user } = useAuth();
  const packageId = Number(id);

  const [deliveryEstimate, setDeliveryEstimate] = useState<string | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const {
    data: pkg,
    isLoading,
    error,
  } = useQuery(
    ['package', packageId],
    () => api.get(`/packages/${packageId}`).then(res => res.data),
    { enabled: !!packageId }
  );

  const features = useMemo(() => {
    const raw = pkg?.features;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try { return JSON.parse(raw || '[]'); } catch { return []; }
    }
    return [];
  }, [pkg?.features]);

  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pkg || !user?.id) return;
    api.get('/addresses').then(res => {
      const addresses = res.data;
      const defaultAddr = addresses.find((a: any) => a.is_default) || addresses[0];
      if (!defaultAddr) return;

      setEstimateLoading(true);
      api.get('/shipping_estimate', {
        params: { vendor_id: pkg.vendor?.id, address_id: defaultAddr.id }
      }).then(res => {
        const options = res.data.options;
        if (options && options.length > 0) {
          const fastest = options[0];
          setDeliveryEstimate(
            `Est. delivery: ${fastest.partner_name} – ${fastest.estimated_days} day(s)`
          );
        }
      }).catch(() => {}).finally(() => setEstimateLoading(false));
    });
  }, [pkg, user]);

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxImages([]);
    setLightboxIndex(0);
    document.body.style.overflow = '';
  };

  if (isLoading) {
    return (
      <div className="text-center py-20 text-[var(--text-muted)] text-sm">
        Loading package details…
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="text-center py-20 text-red-600 text-sm font-semibold">
        Package not found.
      </div>
    );
  }

  const images = pkg.image_urls?.length ? pkg.image_urls : ['https://placehold.co/600x400?text=No+Image'];
  const price = Number(pkg.price);
  const originalPrice = pkg.original_price ? Number(pkg.original_price) : undefined;
  const discount = originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  const items = pkg.products || [];
  const vendor = pkg.vendor || {};
  const videoUrls: string[] = pkg.video_urls || [];

  const shopClosed = vendor.accepting_orders === false;
  const reopenAt = vendor.reopen_at ? new Date(vendor.reopen_at) : null;

  const membershipTier = vendor.membership_tier || 'free';
  const tierBadge = (() => {
    if (membershipTier === 'platinum') return { label: 'Platinum', className: 'bg-purple-100 text-purple-800 border-purple-300' };
    if (membershipTier === 'gold') return { label: 'Gold', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    if (membershipTier === 'silver') return { label: 'Silver', className: 'bg-gray-100 text-gray-700 border-gray-300' };
    return null;
  })();
  const isBulkSupplier = vendor.is_bulk_supplier === true;

  const packageImageSet = new Set(images);

  const galleryItems = [
    ...videoUrls.map((url, idx) => ({
      type: 'video' as const,
      url,
      source: 'package' as const,
      index: idx,
    })),
    ...images.map((url, idx) => ({
      type: 'image' as const,
      url,
      source: 'package' as const,
      index: idx,
    })),
    ...items.flatMap((item: any) => {
      const allImgs = item.image_urls ?? [];
      const uniqueImgs = allImgs.filter(img => !packageImageSet.has(img));
      const imgsToShow = uniqueImgs.length > 0 ? uniqueImgs : (allImgs.length ? [allImgs[0]] : []);
      return imgsToShow.map((imgUrl, imgIdx) => ({
        type: 'product-image' as const,
        url: imgUrl,
        source: 'product' as const,
        productId: item.id,
        item,
        productImageIndex: imgIdx,
      }));
    }),
  ];

  const currentGalleryItem = galleryItems[selectedGalleryIndex] || galleryItems[0];
  const isPackageImageSelected = currentGalleryItem?.source === 'package';

  const thumbnailItems = galleryItems;

  const availableStock = pkg.available_stock != null ? Number(pkg.available_stock) : undefined;
  const isUnlimited = availableStock === undefined || pkg.stock === null;
  const outOfStock = pkg.out_of_stock === true;

  const maxQty = isUnlimited || outOfStock ? 999 : Math.max(1, availableStock ?? 0);
  const minQty = 1;

  const clampQuantity = (qty: number) => Math.min(maxQty, Math.max(minQty, qty));

  const deliveryLabel = pkg.delivery_label || (pkg.free_delivery ? 'Free Delivery' : undefined);
  const showDeliveryBadge = deliveryLabel && deliveryLabel !== 'Paid Delivery';

  const stockDisplayText = isUnlimited
    ? 'Unlimited'
    : outOfStock
      ? 'Out of stock'
      : `Stock: ${availableStock ?? pkg.stock ?? 0}`;

  const stockColor = isUnlimited
    ? 'text-green-600'
    : outOfStock
      ? 'text-red-600'
      : 'text-gray-600';

  const cartItem = cart?.items?.find(
    (item: any) => item.productId === packageId || item.packageId === packageId || item.id === packageId
  );
  const isInCart = !!cartItem;

  const handleCartToggle = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (shopClosed || outOfStock) return;
    if (isInCart && cartItem) {
      removeFromCart(cartItem.id);
    } else {
      addToCart({
        id: pkg!.id,
        packageId: true,
        title: pkg!.name,
        price: price,
        image_urls: pkg!.image_urls || [],
        stock: availableStock ?? pkg.stock,
      }, clampQuantity(quantity));
    }
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (shopClosed || outOfStock) return;
    if (!isInCart) {
      addToCart({
        id: pkg!.id,
        packageId: true,
        title: pkg!.name,
        price: price,
        image_urls: pkg!.image_urls || [],
        stock: availableStock ?? pkg.stock,
      }, clampQuantity(quantity));
    }
    navigate('/checkout');
  };

  const wishlisted = isInWishlist(packageId);
  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (wishlisted) {
      removeFromWishlist(packageId);
    } else {
      addToWishlist({ id: pkg!.id, title: pkg!.name, price: price, image: images[0] });
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: pkg!.name,
          text: pkg!.description || 'Check out this bundle!',
          url: window.location.origin + '/packages/' + pkg!.id,
        });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(window.location.origin + '/packages/' + pkg!.id);
      alert('Link copied!');
    }
  };

  const handleThumbnailClick = (item: typeof galleryItems[0], index: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (item.type === 'video') {
      setPlayingVideoUrl(item.url);
    } else {
      setSelectedGalleryIndex(index);
    }
  };

  const handleMainImageClick = () => {
    if (isPackageImageSelected && currentGalleryItem?.type === 'image') {
      openLightbox(images, currentGalleryItem.index);
    } else if (currentGalleryItem?.source === 'product' && currentGalleryItem?.item) {
      const itemImgs = currentGalleryItem.item.image_urls ?? [];
      if (itemImgs.length) {
        openLightbox(itemImgs, currentGalleryItem.productImageIndex ?? 0);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-1.5 text-xs text-gray-500">
          <Link to="/" className="hover:text-gray-900 font-medium">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/packages" className="hover:text-gray-900 font-medium">Packages</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-900 font-semibold truncate">{pkg.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {shopClosed && (
          <div className="mb-4 bg-amber-50 border border-amber-300 text-amber-800 p-3 rounded-md text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div>
              <strong>{vendor.business_name || 'This shop'} is currently not accepting orders.</strong>
              {reopenAt ? (
                <span className="block mt-0.5">
                  Expected to reopen {reopenAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at {reopenAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}.
                </span>
              ) : (
                <span className="block mt-0.5">Please check back later.</span>
              )}
            </div>
          </div>
        )}

        {outOfStock && (
          <div className="mb-4 bg-red-50 border border-red-300 text-red-800 p-3 rounded-md text-sm font-medium">
            This package is currently out of stock.
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT – Image gallery */}
          <div className="w-full lg:w-1/2 flex flex-col gap-3">
            <div className="flex gap-3">
              {thumbnailItems.length > 1 && (
                <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar max-h-[480px] flex-shrink-0 pr-1">
                  {thumbnailItems.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => handleThumbnailClick(item, idx, e)}
                      className={`w-20 h-20 border-2 transition relative flex-shrink-0 ${
                        selectedGalleryIndex === idx
                          ? 'border-[var(--brand)]'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {item.type === 'video' ? (
                        <div className="w-full h-full bg-black relative">
                          <img
                            src={images[0] || 'https://placehold.co/400x300?text=No+Image'}
                            alt="Video thumbnail"
                            className="w-full h-full object-cover opacity-60"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow">
                              <Play className="w-4 h-4 text-gray-900" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={item.url}
                          alt={item.source === 'product' ? 'Product image' : `Thumbnail`}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400?text=No+Image'; }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1 bg-gray-100 relative group" style={{ maxHeight: '480px' }}>
                <img
                  src={currentGalleryItem?.url || images[0]}
                  alt={pkg.name}
                  className="w-full h-full object-cover cursor-pointer"
                  style={{ maxHeight: '480px' }}
                  onClick={handleMainImageClick}
                  onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x600?text=No+Image'; }}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); handleMainImageClick(); }}
                  className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-gray-600 p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex gap-2 text-xs">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleToggleWishlist}
                className={`flex-1 py-2 border font-medium flex items-center justify-center gap-1.5 transition ${
                  wishlisted
                    ? 'bg-gray-100 border-gray-400 text-gray-800'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-gray-800 text-gray-800' : ''}`} />
                {wishlisted ? 'Saved' : 'Save'}
              </motion.button>
              <button
                onClick={handleShare}
                className="flex-1 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 transition flex items-center justify-center gap-1.5 font-medium"
              >
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
            </div>
          </div>

          {/* RIGHT – Package details */}
          <div className="w-full lg:w-1/2 px-3 lg:px-4 flex flex-col space-y-3">
            <h1 className="text-lg font-bold text-gray-900 leading-snug">{pkg.name}</h1>

            {typeof pkg.rating === 'number' && pkg.rating > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="text-sm font-bold text-gray-900">{Number(pkg.rating).toFixed(1)}</span>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => {
                    const filled = i < Math.round(pkg.rating);
                    return (
                      <svg
                        key={i}
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill={filled ? '#F59E0B' : 'none'}
                        stroke="#F59E0B"
                        strokeWidth="2"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    );
                  })}
                </div>
                <span>({pkg.reviews_count} reviews)</span>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-gray-900">ETB {formatPrice(price)}</span>
                {originalPrice && originalPrice > price && (
                  <span className="text-xs text-gray-500 line-through">ETB {formatPrice(originalPrice)}</span>
                )}
                {discount > 0 && <span className="badge-discount text-xs">-{discount}%</span>}
              </div>
              {discount > 0 && (
                <p className="text-[11px] text-gray-600 font-medium">You save ETB {formatPrice(originalPrice! - price)}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded-sm">
                  Package includes {pkg.items_count || items.length} items
                </span>
                {showDeliveryBadge && (
                  <span className="text-green-700 flex items-center gap-1 font-semibold">
                    <Truck className="w-3.5 h-3.5" /> {deliveryLabel}
                  </span>
                )}
                {!showDeliveryBadge && pkg.shipping_type === 'free' && (
                  <span className="text-green-700 flex items-center gap-1 font-semibold">
                    <Truck className="w-3.5 h-3.5" /> Free delivery
                  </span>
                )}
                {!showDeliveryBadge && pkg.shipping_type === 'percentage' && pkg.shipping_value != null && (
                  <span className="text-blue-700 font-semibold">{Number(pkg.shipping_value)}% off delivery</span>
                )}
              </div>
              <p className={`text-xs font-medium mt-1 ${stockColor}`}>
                {stockDisplayText}
              </p>
            </div>

            {/* Rich vendor section (same as ProductDetailPage) */}
            {vendor.business_name && (
              <div className="flex items-center justify-between py-2 border-t border-b border-gray-200">
                <div className="flex items-center gap-2">
                  {vendor.logo_url ? (
                    <img
                      src={vendor.logo_url}
                      alt={vendor.business_name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-[var(--brand)] text-white text-sm font-bold flex items-center justify-center rounded-full">
                      {(vendor.business_name[0] || 'S').toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-gray-900">{vendor.business_name}</p>
                      {tierBadge && (
                        <span className={`text-[10px] px-1 py-0.5 rounded-full border ${tierBadge.className} font-medium`}>
                          {tierBadge.label}
                        </span>
                      )}
                      {isBulkSupplier && (
                        <span className="text-[10px] px-1 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 font-medium flex items-center gap-0.5">
                          <Building2 className="w-3 h-3" /> Company
                        </span>
                      )}
                      {shopClosed && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-300 font-semibold">
                          Currently closed – try later
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {vendor.rating ? Number(vendor.rating).toFixed(1) : '0.0'} · {vendor.products_count || 0} products
                    </p>
                  </div>
                </div>
                <Link to={`/find-shop?vendor=${vendor.id}`} className="text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]">
                  Visit Store →
                </Link>
              </div>
            )}

            {(vendor.is_bulk_supplier || vendor.is_company) && vendor.phone && (
              <a href={`tel:${vendor.phone}`} className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-green-700 transition">
                <Phone className="w-4 h-4 text-green-600" /> {vendor.phone}
              </a>
            )}

            <div className="text-xs font-medium text-gray-600">
              {estimateLoading ? (
                <span>Calculating delivery…</span>
              ) : deliveryEstimate ? (
                <span className="text-gray-800">{deliveryEstimate}</span>
              ) : user ? (
                <Link to="/profile#addresses" className="text-gray-700 hover:underline font-semibold">Add delivery address to see estimate</Link>
              ) : (
                <Link to="/login" className="text-gray-700 hover:underline font-semibold">Log in to see delivery estimate</Link>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Qty:</span>
              <div className="flex items-center border border-gray-300 rounded">
                <button
                  onClick={() => setQuantity(prev => clampQuantity(prev - 1))}
                  disabled={quantity <= minQty || shopClosed || outOfStock}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition disabled:opacity-30 text-sm"
                >
                  <Minus className="w-3" />
                </button>
                <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(prev => clampQuantity(prev + 1))}
                  disabled={quantity >= maxQty || shopClosed || outOfStock}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition disabled:opacity-30 text-sm"
                >
                  <Plus className="w-3" />
                </button>
              </div>
              {!isUnlimited && !outOfStock && availableStock != null && availableStock > 0 && (
                <span className="text-xs text-gray-500">{availableStock} available</span>
              )}
              {isUnlimited && !outOfStock && (
                <span className="text-xs text-green-600 font-medium">Unlimited stock</span>
              )}
              {outOfStock && (
                <span className="text-xs text-red-600 font-medium">Out of stock</span>
              )}
            </div>

            <div className="max-w-xs flex gap-2">
              <button
                onClick={handleBuyNow}
                disabled={shopClosed || outOfStock}
                className="btn-cta flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                title={shopClosed ? 'Shop is closed' : outOfStock ? 'Out of stock' : ''}
              >
                Buy Now
              </button>
              <button
                onClick={handleCartToggle}
                disabled={shopClosed || outOfStock}
                className={`flex-1 py-2 font-semibold text-xs border-2 transition flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] ${
                  isInCart ? 'bg-[var(--brand-light)] border-red-400 text-red-600 hover:bg-red-50' : 'bg-white border-gray-500 text-gray-800 hover:border-gray-700 hover:bg-gray-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={shopClosed ? 'Shop is closed' : outOfStock ? 'Out of stock' : ''}
              >
                {isInCart ? <><Trash2 className="w-3.5 h-3.5" /> Remove</> : <><ShoppingCart className="w-3.5 h-3.5" /> Add to Cart</>}
              </button>
            </div>
          </div>
        </div>

        {(pkg.description || features.length > 0) && (
          <div className="mt-6 bg-white shadow-sm p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">About this package</h2>
            {pkg.description && <p className="text-base text-gray-700 leading-relaxed mb-3">{pkg.description}</p>}
            {features.length > 0 && (
              <ul className="space-y-1.5">
                {features.map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-2 text-base text-gray-700">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-6 bg-white shadow-sm p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Items in this package</h2>
            <div className="space-y-3">
              {items.map((item: any) => {
                const itemPrice = parseFloat(item.effective_price || item.price) || 0;
                const itemOriginalPrice = parseFloat(item.original_price) || undefined;
                const itemDiscount = itemOriginalPrice && itemOriginalPrice > itemPrice
                  ? Math.round(((itemOriginalPrice - itemPrice) / itemOriginalPrice) * 100) : 0;
                const itemImages = item.image_urls?.length > 0 ? item.image_urls : ['https://placehold.co/400x400?text=No+Image'];
                const stockDisplay = item.available_stock != null
                  ? `${item.available_stock} available`
                  : item.stock != null
                    ? `${item.stock} available`
                    : 'Out of stock';

                // Weight & dimensions from backend (if present)
                const hasDimensions = item.weight_kg != null || item.length_cm != null || item.width_cm != null || item.height_cm != null;

                return (
                  <div key={item.id} className="bg-gray-50 border border-gray-200 p-4 rounded-lg hover:border-gray-300 transition">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-semibold text-gray-900 line-clamp-2 leading-snug">
                          {item.title}
                        </h4>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-lg font-bold text-gray-900">ETB {formatPrice(itemPrice)}</span>
                          {itemOriginalPrice && itemOriginalPrice > itemPrice && (
                            <>
                              <span className="text-sm text-gray-400 line-through">ETB {formatPrice(itemOriginalPrice)}</span>
                              <span className="text-sm font-bold text-red-600">{itemDiscount}% off</span>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5 font-medium">{stockDisplay}</p>
                      </div>
                      <ChevronRightIcon className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2 mt-1" />
                    </div>

                    {item.description && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 mb-1">Description</p>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                          {item.description}
                        </p>
                      </div>
                    )}

                    {item.variant_attributes && Object.keys(item.variant_attributes).length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 mb-1">Options</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(item.variant_attributes).map(([key, value]) => (
                            <span key={key} className="text-sm bg-white border border-gray-200 rounded-full px-3 py-1">
                              <span className="text-gray-500 capitalize">{key}:</span>{' '}
                              <span className="font-medium text-gray-800">{String(value)}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.product_attributes && Object.keys(item.product_attributes).length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 mb-1">Specifications</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Object.entries(item.product_attributes).slice(0, 4).map(([key, value]) => (
                            <div key={key} className="text-sm">
                              <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                              <span className="text-gray-800 font-medium">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ★ Weight & Dimensions Section */}
                    {hasDimensions && (
                      <div className="mt-3 bg-white border border-gray-200 rounded-lg p-3">
                        <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                          <Ruler className="w-4 h-4 text-gray-500" />
                          Dimensions & Weight
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {item.weight_kg != null && (
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Weight className="w-3 h-3" /> Weight
                              </span>
                              <span className="text-sm font-medium text-gray-800">{item.weight_kg} kg</span>
                            </div>
                          )}
                          {item.length_cm != null && (
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500">Length</span>
                              <span className="text-sm font-medium text-gray-800">{item.length_cm} cm</span>
                            </div>
                          )}
                          {item.width_cm != null && (
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500">Width</span>
                              <span className="text-sm font-medium text-gray-800">{item.width_cm} cm</span>
                            </div>
                          )}
                          {item.height_cm != null && (
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500">Height</span>
                              <span className="text-sm font-medium text-gray-800">{item.height_cm} cm</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mt-2">
                      {itemImages.map((imgUrl: string, imgIdx: number) => (
                        <button
                          key={imgIdx}
                          onClick={(e) => {
                            e.stopPropagation();
                            openLightbox(itemImages, imgIdx);
                          }}
                          className="w-16 h-16 flex-shrink-0 border border-gray-200 hover:border-gray-400 transition rounded overflow-hidden"
                        >
                          <img
                            src={imgUrl}
                            alt={`${item.title} ${imgIdx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400?text=No+Image'; }}
                          />
                        </button>
                      ))}
                      {itemImages.length === 0 && (
                        <div className="w-16 h-16 bg-gray-100 flex items-center justify-center text-sm text-gray-400">No img</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {originalPrice && originalPrice > price && (
              <div className="mt-4 bg-gray-50 border border-gray-200 p-4 flex items-center justify-between rounded-md">
                <span className="text-base font-bold text-gray-900">Bundle Savings</span>
                <span className="text-base font-extrabold text-red-600">Save ETB {formatPrice(originalPrice - price)} ({discount}%)</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 bg-white shadow-sm p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Customer Reviews</h2>
          <ReviewList reviewableType="Package" reviewableId={Number(id)} />
        </div>
      </div>

      <AnimatePresence>
        {lightboxImages.length > 0 && (
          <ImageLightbox
            images={lightboxImages}
            index={lightboxIndex}
            onClose={closeLightbox}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {playingVideoUrl && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setPlayingVideoUrl(null)}
          >
            <button className="absolute top-4 right-4 text-white p-3 hover:bg-white/20 transition z-20 rounded-full" onClick={() => setPlayingVideoUrl(null)}>
              <X className="w-6 h-6" />
            </button>
            <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
              <video controls autoPlay className="w-full max-h-[85vh]" src={playingVideoUrl}>
                Your browser does not support the video tag.
              </video>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PackageDetailPage;