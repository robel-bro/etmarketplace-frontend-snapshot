// src/pages/ProductDetailPage.tsx
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  Star, Heart, Share2, Bell, Minus, Plus, ShoppingCart, ShoppingBag,
  ChevronRight, Maximize2, X, GitCompare, Trash2, Clock, Truck, Play,
  Package, Building2, Phone, ArrowLeft
} from 'lucide-react';
import api from '../lib/axios';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { useComparison } from '../contexts/ComparisonContext';
import ProductCard from '../components/features/products/ProductCard';
import ReviewList from '../components/features/reviews/ReviewList';
import AllReviewsModal from '../components/features/reviews/AllReviewsModal';
import { useAuth } from '../hooks/useAuth';

const formatPrice = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .replace(/\.00$/, '');

const COLOR_MAP: Record<string, string> = {
  red: '#EF4444', blue: '#3B82F6', green: '#10B981', black: '#1F2937',
  white: '#F9FAFB', yellow: '#F59E0B', purple: '#8B5CF6', pink: '#EC4899',
  orange: '#F97316', grey: '#6B7280', gray: '#6B7280', brown: '#92400E',
  navy: '#1E3A8A', beige: '#F5F5DC', gold: '#D97706', silver: '#9CA3AF',
};
const stringToColor = (str: string) => { let hash = 0; for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash); return `hsl(${hash % 360}, 60%, 70%)`; };
const getColorHex = (name: string): string => COLOR_MAP[name?.trim().toLowerCase()] || stringToColor(name);

const Countdown = ({ endsAt }: { endsAt: string }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const diff = new Date(endsAt).getTime() - now;
  if (diff <= 0) return <span className="text-red-500 text-xs font-bold">Expired</span>;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return <span className="text-orange-600 text-xs font-bold">{h}h {m}m {s}s left</span>;
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const fromCompany = searchParams.get('from') === 'company';
  const companyId = searchParams.get('companyId');

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [fullscreenImage, setFullscreenImage] = useState(false);
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showPriceAlert, setShowPriceAlert] = useState(false);
  const [priceAlertEmail, setPriceAlertEmail] = useState('');
  const [priceAlertError, setPriceAlertError] = useState('');
  const [priceAlertActive, setPriceAlertActive] = useState(false);
  const [deliveryEstimate, setDeliveryEstimate] = useState<string | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);

  const [showVariantModal, setShowVariantModal] = useState(false);
  const [variantAction, setVariantAction] = useState<'cart' | 'buy'>('cart');
  const [variantQuantities, setVariantQuantities] = useState<Record<number, number>>({});

  const { addToCart, removeFromCart, cart, refreshCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const wishlisted = isInWishlist(Number(id));
  const { items: compareItems, addItem: addToCompare, removeItem: removeFromCompare } = useComparison();
  const isCompared = compareItems.includes(Number(id));

  const { data: product, isLoading: productLoading, error: productError, refetch: refetchProduct } = useQuery(
    ['product', id], () => api.get(`/products/${id}`).then(r => r.data),
    { enabled: !!id, staleTime: 30 * 1000 }
  );

  // ★ SIMILAR ITEMS: use dedicated backend endpoint
  const { data: similarProductsData, isLoading: similarLoading } = useQuery(
    ['similarProducts', id],
    () => api.get(`/products/${id}/similar`).then(r => r.data),
    { enabled: !!id }
  );
  const similarProducts = Array.isArray(similarProductsData) ? similarProductsData : [];

  const variants: Array<any> = product?.variants || [];
  const variantKeys = useMemo(() => {
    const keys = new Set<string>();
    variants.forEach(v => v.attributes && Object.keys(v.attributes).forEach(k => keys.add(k)));
    return Array.from(keys);
  }, [variants]);

  const allVariantsFlat = useMemo(() => {
    if (!product?.variants || !Array.isArray(product.variants)) return [];
    return product.variants.filter((v: any) => v.attributes && Object.keys(v.attributes).length > 0);
  }, [product]);

  const hasVariants = variantKeys.length > 0;

  const isBulk = product?.bulk_enabled === true || product?.bulk_enabled === 'true';
  const moq = isBulk ? (product?.minimum_bulk_quantity || 1) : 1;

  // Stock helpers for non‑variant products
  const effectiveStock = useMemo(() => {
    if (!product) return 0;
    if (product.available_stock == null) {
      if (product.bulk_enabled && product.stock == null) return Infinity;
      if (product.has_variants && product.variants?.some((v: any) => v.unlimited_stock)) return Infinity;
      return 0;
    }
    const stock = Number(product.available_stock);
    return isNaN(stock) ? 0 : stock;
  }, [product]);

  const remainingDaily = useMemo(() => {
    if (!product || product.remaining_daily_quantity == null) return undefined;
    return Number(product.remaining_daily_quantity);
  }, [product]);

  const mainMaxQty = useMemo(() => {
    let cap = effectiveStock === Infinity ? 999999 : effectiveStock;
    if (remainingDaily != null && remainingDaily < cap) cap = remainingDaily;
    return cap;
  }, [effectiveStock, remainingDaily]);

  const isOutOfStock = effectiveStock <= 0 && effectiveStock !== Infinity;

  const isFlashDeal = product?.is_flash_sale && product?.flash_sale_ends_at && new Date(product.flash_sale_ends_at) > new Date();
  const isSuperDeal = product?.is_super_deal && product?.super_deal_ends_at && new Date(product.super_deal_ends_at) > new Date();
  const dealPrice = isFlashDeal ? Number(product?.flash_sale_price) : isSuperDeal ? Number(product?.super_deal_price) : null;
  const dealEndsAt = isFlashDeal ? product?.flash_sale_ends_at : isSuperDeal ? product?.super_deal_ends_at : null;

  const baseEffectivePrice = product?.effective_price ?? product?.price ?? 0;
  const displayPrice = dealPrice ?? baseEffectivePrice;

  const originalPrice = dealPrice
    ? baseEffectivePrice
    : product?.original_price ? Number(product.original_price) : undefined;

  const discount = product?.discount_percentage
    ? Number(product.discount_percentage)
    : (originalPrice && originalPrice > displayPrice)
      ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
      : 0;

  const minVariantPrice = useMemo(() => {
    if (!hasVariants || allVariantsFlat.length === 0) return null;
    return Math.min(...allVariantsFlat.map(v => Number(v.price) || 0));
  }, [allVariantsFlat, hasVariants]);

  // ★ DELIVERY RIBBON – only show badge for FREE or DISCOUNTED delivery, never "Paid Delivery"
  const deliveryRibbon = useMemo(() => {
    if (!product) return null;
    if (product.free_delivery || product.free_shipping) {
      return { text: 'Free Delivery', className: 'bg-blue-500' };
    }
    if (product.seller_pays_shipping && product.shipping_subsidy_type === 'percent' && product.shipping_subsidy_value) {
      return { text: `${product.shipping_subsidy_value}% off Delivery`, className: 'bg-orange-500' };
    }
    if (product.seller_pays_shipping && product.shipping_subsidy_type === 'fixed' && product.shipping_subsidy_value) {
      return { text: `ETB ${product.shipping_subsidy_value} off Delivery`, className: 'bg-orange-500' };
    }
    return null;
  }, [product]);

  const vendor = product?.vendor || {};
  const shopClosed = !vendor.accepting_orders;
  const orderable = product?.orderable !== false;

  const cartItemsForProduct = cart?.items?.filter(
    (item: any) => item.productId === product?.id || item.id === product?.id
  ) || [];

  const currentProductCartQty = cartItemsForProduct.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const isCurrentVariantInCart = useMemo(() => {
    if (hasVariants) return false;
    return cartItemsForProduct.some(i => Object.keys(i.variant || {}).length === 0);
  }, [cartItemsForProduct, hasVariants]);

  const totalSelectedQty = Object.values(variantQuantities).reduce((sum, q) => sum + q, 0);

  const isNonVariantAddAllowed = useMemo(() => {
    if (hasVariants) return true;
    if (!isBulk || moq <= 1) return true;
    const projected = currentProductCartQty + quantity;
    return projected >= moq;
  }, [isBulk, moq, currentProductCartQty, quantity, hasVariants]);

  const bulkMoqMetForVariants = useMemo(() => {
    if (!isBulk || moq <= 1) return true;
    if (!hasVariants) return true;
    return (currentProductCartQty + totalSelectedQty) >= moq;
  }, [isBulk, moq, currentProductCartQty, totalSelectedQty, hasVariants]);

  const getVariantMaxQuantity = (variant: any) => {
    let physical = variant.unlimited_stock ? 999999 : (Number(variant.stock) || 0);
    const dailyCap = product?.remaining_daily_quantity != null
      ? Number(product.remaining_daily_quantity)
      : 999999;
    return Math.min(physical, dailyCap);
  };

  const openVariantModal = (action: 'cart' | 'buy') => {
    setVariantAction(action);
    setShowVariantModal(true);
    setVariantQuantities({});
    setErrorMessage('');
  };

  const closeVariantModal = () => {
    setShowVariantModal(false);
    setVariantQuantities({});
  };

  const handleMultiAddToCart = async () => {
    if (!orderable || shopClosed || isOutOfStock) return;
    if (!bulkMoqMetForVariants) {
      setErrorMessage(`Minimum order is ${moq} units. Add ${moq - currentProductCartQty} more across variants.`);
      return;
    }

    setAddingToCart(true);
    setErrorMessage('');

    const items = allVariantsFlat
      .map((variant, idx) => ({
        product_id: product.id,
        variant: variant.attributes,
        quantity: variantQuantities[idx] || 0,
      }))
      .filter(i => i.quantity > 0);

    try {
      await api.post('/cart/add_items', { items });
      await refetchProduct();
      await refreshCart();
      closeVariantModal();
      if (variantAction === 'buy') navigate('/checkout');
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || 'Failed to add items');
    } finally {
      setAddingToCart(false);
    }
  };

  const addToCartSafe = async () => {
    if (!orderable || shopClosed || isOutOfStock) return;
    setErrorMessage('');
    setAddingToCart(true);
    try {
      await addToCart(
        { id: product.id, title: product.title, price: displayPrice, image_urls: product.image_urls },
        quantity
      );
      await refetchProduct();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to add to cart';
      setErrorMessage(msg);
      throw err;
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!orderable || isOutOfStock) return;
    if (hasVariants) {
      openVariantModal('buy');
    } else {
      if (!isNonVariantAddAllowed) {
        setErrorMessage(`Minimum order is ${moq}. Add ${moq - currentProductCartQty} more.`);
        return;
      }
      try {
        if (!isCurrentVariantInCart) await addToCartSafe();
        navigate('/checkout');
      } catch { /* error shown */ }
    }
  };

  const handleAddToCart = async () => {
    if (!orderable || isOutOfStock) return;
    if (hasVariants) {
      openVariantModal('cart');
    } else {
      if (!isNonVariantAddAllowed) {
        setErrorMessage(`Minimum order is ${moq}. Add ${moq - currentProductCartQty} more.`);
        return;
      }
      if (isCurrentVariantInCart) {
        const item = cartItemsForProduct.find((i: any) => Object.keys(i.variant || {}).length === 0);
        if (item) removeFromCart(item.id);
      } else {
        try { await addToCartSafe(); } catch { return; }
      }
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: product?.title, url }); } catch {} }
    else {
      try { await navigator.clipboard.writeText(url); setCopyMessage('Link copied!'); setTimeout(() => setCopyMessage(''), 2000); } catch {}
    }
  };

  const submitPriceAlert = async () => {
    if (!priceAlertEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(priceAlertEmail)) { setPriceAlertError('Valid email required'); return; }
    try {
      await api.post('/price_alerts', { product_id: product.id, email: priceAlertEmail });
      setShowPriceAlert(false);
      setPriceAlertEmail('');
      setPriceAlertActive(true);
    } catch (e: any) { setPriceAlertError(e.response?.data?.error || 'Failed'); }
  };

  // ★ RECENTLY VIEWED TRACKING
  useEffect(() => {
    if (!product?.id) return;
    const productId = product.id;
    if (user?.id) {
      api.post('/api/v1/recently_vieweds', { product_id: productId }).catch(() => {
        // silently fail; not critical
      });
    } else {
      try {
        const key = 'recently_viewed_product_ids';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const updated = [productId, ...existing.filter((id: number) => id !== productId)].slice(0, 20);
        localStorage.setItem(key, JSON.stringify(updated));
      } catch {}
    }
  }, [product?.id, user?.id]);

  useEffect(() => {
    if (!product || !user?.id) return;
    const controller = new AbortController();
    api.get('/addresses', { signal: controller.signal }).then(res => {
      const addr = (res.data || []).find((a: any) => a.is_default) || res.data?.[0];
      if (!addr) return;
      setEstimateLoading(true);
      return api.get('/shipping_estimate', { params: { vendor_id: vendor.id, address_id: addr.id }, signal: controller.signal });
    }).then(r => {
      if (r) {
        const opt = r.data?.options?.[0];
        if (opt) setDeliveryEstimate(`${opt.partner_name} – ${opt.estimated_days} day(s)`);
      }
    }).catch(() => {}).finally(() => {
      if (!controller.signal.aborted) setEstimateLoading(false);
    });
    return () => controller.abort();
  }, [product, user]);

  const thumbnailItems = useMemo(() => {
    const vids = (product?.video_urls || []).map((url: string, i: number) => ({ type: 'video', url, idx: i }));
    const imgs = (product?.image_urls || []).map((url: string, i: number) => ({ type: 'image', url, idx: i }));
    return [...vids, ...imgs];
  }, [product]);

  if (productLoading) return <div className="p-10 text-center">Loading…</div>;
  if (productError || !product) return <div className="p-10 text-center text-red-500">Product not found</div>;

  const attributeList = Object.entries(
    variantKeys.reduce((acc, key) => {
      acc[key] = [...new Set(allVariantsFlat.map(v => v.attributes?.[key] || ''))].filter(Boolean).join(', ');
      return acc;
    }, {} as Record<string, string>)
  ).filter(([_, vals]) => vals.length > 0).map(([key, vals]) => ({ key, values: vals }));

  const membershipTier = vendor?.membership_tier || 'free';
  const tierBadge = (() => {
    if (membershipTier === 'platinum') return { label: 'Platinum', className: 'bg-purple-100 text-purple-800 border-purple-300' };
    if (membershipTier === 'gold') return { label: 'Gold', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    if (membershipTier === 'silver') return { label: 'Silver', className: 'bg-gray-100 text-gray-700 border-gray-300' };
    return null;
  })();
  const isBulkSupplier = vendor?.is_bulk_supplier === true;

  const stockDisplayText = effectiveStock === Infinity ? 'Unlimited' : effectiveStock > 0 ? `${effectiveStock} available` : 'Out of stock';
  const showBulkBadge = isBulk && moq > 0;
  const dailyLimitInfo = remainingDaily != null ? ` (${remainingDaily} left today)` : '';

  return (
    <div className="min-h-screen bg-gray-100 pb-20 md:pb-0">
      {/* Breadcrumb */}
      <div className="bg-white border-b px-4 py-2 text-xs text-gray-500 flex items-center gap-1.5">
        {fromCompany && companyId ? (
          <Link to={`/company/${companyId}`} className="flex items-center gap-1 text-brand hover:text-brand-hover font-medium"><ArrowLeft className="w-3 h-3" /> Back to Company</Link>
        ) : (
          <>
            <Link to="/">Home</Link><ChevronRight className="w-3" />
            {product.category?.name && <><Link to={`/category/${product.category.id}`}>{product.category.name}</Link><ChevronRight className="w-3" /></>}
          </>
        )}
        <span className="text-gray-900">{product.title}</span>
      </div>

      <div className="max-w-7xl mx-auto p-4 flex flex-col lg:flex-row gap-6">
        {/* LEFT – images */}
        <div className="w-full lg:w-1/2">
          <div className="flex flex-col-reverse md:flex-row gap-2">
            {thumbnailItems.length > 1 && (
              <div className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible md:overflow-y-auto max-h-16 md:max-h-[480px] flex-shrink-0">
                {thumbnailItems.map((item, i) => (
                  <button key={i} onClick={() => item.type === 'image' ? setSelectedImage(item.idx) : setPlayingVideoUrl(item.url)} className={`w-12 h-12 md:w-16 md:h-16 border-2 flex-shrink-0 ${item.type === 'image' && selectedImage === item.idx ? 'border-brand' : 'border-gray-200'}`}>
                    {item.type === 'video' ? <div className="w-full h-full bg-gray-800 flex items-center justify-center"><Play className="w-3 md:w-4 h-3 md:h-4 text-white" /></div> : <img src={item.url} alt="" className="w-full h-full object-cover" />}
                  </button>
                ))}
              </div>
            )}
            <div className="flex-1 bg-gray-200 relative aspect-square md:aspect-auto md:h-[480px]">
              <img src={product.image_urls?.[selectedImage] || 'https://placehold.co/600?text=No+Image'} alt={product.title} className="absolute inset-0 w-full h-full object-cover" />
              <button onClick={() => setFullscreenImage(true)} className="absolute bottom-2 right-2 bg-white/80 p-1.5 rounded"><Maximize2 className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex gap-2 mt-2 text-xs">
            <button onClick={() => isCompared ? removeFromCompare(Number(id)) : addToCompare(Number(id), undefined)} className={`flex-1 py-2 border rounded text-center ${isCompared ? 'bg-brand-light border-brand text-brand' : ''}`}><GitCompare className="w-3.5 h-3.5 inline mr-1" /> {isCompared ? 'Compared' : 'Compare'}</button>
            <button onClick={() => wishlisted ? removeFromWishlist(Number(id)) : addToWishlist(product, undefined)} className={`flex-1 py-2 border rounded text-center ${wishlisted ? 'bg-gray-100 border-gray-400 text-gray-800' : ''}`}><Heart className={`w-3.5 h-3.5 inline mr-1 ${wishlisted ? 'fill-black' : ''}`} /> {wishlisted ? 'Saved' : 'Save'}</button>
            <button onClick={handleShare} className="flex-1 py-2 border rounded"><Share2 className="w-3.5 h-3.5 inline mr-1" /> Share</button>
            <button onClick={() => { setShowPriceAlert(true); setPriceAlertError(''); }} className={`flex-1 py-2 border rounded ${priceAlertActive ? 'bg-brand-light border-brand text-brand' : ''}`}><Bell className="w-3.5 h-3.5 inline mr-1" /> {priceAlertActive ? 'Alert on' : 'Alert'}</button>
          </div>
        </div>

        {/* RIGHT – details */}
        <div className="w-full lg:w-1/2 space-y-4">
          <h1 className="text-xl font-bold">{product.title}</h1>
          {showBulkBadge && (
            <div className="bg-white border border-orange-200 rounded-lg p-3 space-y-2 border-l-4 border-l-orange-500 shadow-sm">
              <div className="flex items-center gap-2"><Package className="w-4 h-4 text-orange-600" /><span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">BULK</span></div>
              <div className="text-xs text-gray-700 space-y-1">
                <p><strong>Minimum Order:</strong> {moq} units</p>
                <p><strong>Stock:</strong> {stockDisplayText}</p>
                {product?.max_quantity_per_day && <p><strong>Daily Quantity Limit:</strong> {product.max_quantity_per_day} units</p>}
                {remainingDaily != null && <p><strong>Remaining today:</strong> {remainingDaily}</p>}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>{product.rating}</span><Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" /><span>({product.reviews_count} reviews)</span><span>|</span><span>{product.sold_count} sold</span>
          </div>

          {isFlashDeal && <div className="bg-red-50 border-red-200 p-2 flex items-center gap-2"><Clock className="w-4" /> FLASH SALE <Countdown endsAt={dealEndsAt!} /></div>}
          {isSuperDeal && !isFlashDeal && <div className="bg-purple-50 border-purple-200 p-2 flex items-center gap-2"><Clock className="w-4" /> SUPER DEAL <Countdown endsAt={dealEndsAt!} /></div>}

          <div>
            {!hasVariants ? (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold">ETB {formatPrice(displayPrice)}</span>
                {originalPrice && originalPrice > displayPrice && <><span className="text-sm line-through text-gray-500">ETB {formatPrice(originalPrice)}</span><span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">{dealPrice ? (isFlashDeal ? 'FLASH' : 'SUPER') : `-${discount}%`}</span></>}
                {!originalPrice && discount > 0 && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">-{discount}%</span>}
              </div>
            ) : (
              <div><p className="text-lg font-bold text-gray-900">From ETB {formatPrice(minVariantPrice || baseEffectivePrice)}</p><p className="text-xs text-gray-500 mt-1">Select variants to add</p></div>
            )}
            {deliveryRibbon && <div className={`mt-1 flex items-center justify-center py-1 px-2 text-white text-xs font-semibold gap-1 ${deliveryRibbon.className}`}><Truck className="w-3 h-3" /> {deliveryRibbon.text}</div>}
            {isOutOfStock && !hasVariants && <p className="text-sm text-red-600 font-semibold mt-2">Out of stock</p>}
            {!hasVariants && orderable && !isOutOfStock && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-sm font-medium">Qty:</span>
                <div className="flex items-center border rounded">
                  <button onClick={() => setQuantity(Math.max(moq, quantity - 1))} disabled={quantity <= moq} className="w-8 h-8 flex items-center justify-center disabled:opacity-30"><Minus className="w-3" /></button>
                  <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(mainMaxQty, quantity + 1))} disabled={quantity >= mainMaxQty} className="w-8 h-8 flex items-center justify-center disabled:opacity-30"><Plus className="w-3" /></button>
                </div>
                <span className="text-xs text-gray-500">{stockDisplayText}{dailyLimitInfo}</span>
              </div>
            )}
          </div>

          {errorMessage && <div className="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded text-sm">{errorMessage}</div>}

          {isBulk && moq > 1 && !hasVariants && !isNonVariantAddAllowed && (
            <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-3 py-2 rounded text-sm">
              ⚠️ Minimum order of {moq} units required. You have {currentProductCartQty} in cart – add {moq - currentProductCartQty - quantity} more.
            </div>
          )}

          {hasVariants && attributeList.length > 0 && (
            <div className="text-sm text-gray-600 space-y-1 mt-2">
              <span className="font-medium text-gray-800">Available options:</span>
              <ul className="list-disc ml-5 space-y-0.5">{attributeList.map(attr => <li key={attr.key}><span className="font-medium capitalize">{attr.key}:</span> {attr.values}</li>)}</ul>
            </div>
          )}

          {vendor.business_name && (
            <div className="flex items-center justify-between py-2 border-t border-b">
              <div className="flex items-center gap-2">
                {vendor.logo_url ? <img src={vendor.logo_url} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 bg-brand text-white flex items-center justify-center rounded-full text-sm">{vendor.business_name[0]}</div>}
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm">{vendor.business_name}</p>
                    {tierBadge && <span className={`text-[10px] px-1 py-0.5 rounded-full border ${tierBadge.className} font-medium`}>{tierBadge.label}</span>}
                    {isBulkSupplier && <span className="text-[10px] px-1 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 font-medium flex items-center gap-0.5"><Building2 className="w-3 h-3" /> Company</span>}
                    {shopClosed && <span className="text-[11px] px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-300 font-semibold">Currently closed – try later</span>}
                  </div>
                  <p className="text-xs text-gray-500">{vendor.rating ? Number(vendor.rating).toFixed(1) : '0.0'} · {vendor.products_count || 0} products</p>
                </div>
              </div>
              <Link to={`/find-shop?vendor=${vendor.id}`} className="text-xs font-semibold">Visit Store →</Link>
            </div>
          )}

          {(vendor.is_bulk_supplier || vendor.is_company) && vendor.phone && <a href={`tel:${vendor.phone}`} className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-green-700 transition"><Phone className="w-4 h-4 text-green-600" /> {vendor.phone}</a>}

          <p className="text-xs text-gray-500">{estimateLoading ? 'Calculating…' : deliveryEstimate || (user ? <Link to="/profile#addresses">Add address</Link> : <Link to="/login">Login for estimate</Link>)}</p>

          <div className="hidden md:flex gap-2 max-w-xs">
            <button
              onClick={handleBuyNow}
              disabled={
                shopClosed || !orderable || isOutOfStock || addingToCart ||
                (!hasVariants && !isNonVariantAddAllowed)
              }
              className="btn-cta flex-1 py-2 rounded text-white bg-brand hover:bg-brand-hover disabled:opacity-50"
            >
              <ShoppingBag className="w-4 h-4 inline mr-1" /> Buy Now
            </button>
            <button
              onClick={handleAddToCart}
              disabled={
                shopClosed || !orderable || isOutOfStock || addingToCart ||
                (!hasVariants && !isNonVariantAddAllowed)
              }
              className={`flex-1 py-2 rounded border-2 font-semibold text-sm ${
                isCurrentVariantInCart
                  ? 'bg-red-50 border-red-400 text-red-600'
                  : 'bg-white border-gray-500 text-gray-800'
              }`}
            >
              {addingToCart
                ? 'Adding…'
                : isCurrentVariantInCart
                ? <><Trash2 className="w-4 h-4 inline" /> Remove</>
                : <><ShoppingCart className="w-4 h-4 inline" /> Add to Cart</>}
            </button>
          </div>

          {cartItemsForProduct.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 border-l-4 border-l-orange-500 shadow-sm">
              <div className="flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-orange-500 animate-pulse" /><span className="font-semibold text-sm text-gray-800">{cartItemsForProduct.length} {cartItemsForProduct.length === 1 ? 'variant' : 'variants'} in cart</span></div>
              {cartItemsForProduct.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-b-0">
                  <div className="flex flex-col">
                    <span className="text-gray-700 font-medium text-sm">{Object.entries(item.variant || {}).length > 0 ? Object.entries(item.variant).map(([k, v]) => `${k}: ${v}`).join(', ') : 'Base'}</span>
                    <span className="text-gray-500 text-xs mt-0.5">ETB {item.price?.toLocaleString?.() ?? item.price} × {item.quantity}</span>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Specifications, Description, Reviews, Dimensions & Weight */}
      <div className="max-w-7xl mx-auto px-4 space-y-6 pb-10">
        {Object.keys(product.product_attributes || {}).length > 0 && (
          <div className="bg-white p-4 rounded shadow-sm"><h2 className="font-bold mb-2">Specifications</h2><table className="w-full text-sm"><tbody>{Object.entries(product.product_attributes).map(([k, v]) => <tr key={k} className="border-b"><td className="py-1 font-medium capitalize">{k}</td><td className="py-1">{String(v)}</td></tr>)}</tbody></table></div>
        )}

        {/* ★ DIMENSIONS & WEIGHT */}
        {['weight_kg', 'length_cm', 'width_cm', 'height_cm'].some(field => product[field] != null && product[field] !== '') && (
          <div className="bg-white p-4 rounded shadow-sm">
            <h2 className="font-bold mb-2">Dimensions & Weight</h2>
            <table className="w-full text-sm">
              <tbody>
                {product.weight_kg != null && product.weight_kg !== '' && (
                  <tr className="border-b"><td className="py-1 font-medium">Weight</td><td className="py-1">{product.weight_kg} kg</td></tr>
                )}
                {product.length_cm != null && product.length_cm !== '' && (
                  <tr className="border-b"><td className="py-1 font-medium">Length</td><td className="py-1">{product.length_cm} cm</td></tr>
                )}
                {product.width_cm != null && product.width_cm !== '' && (
                  <tr className="border-b"><td className="py-1 font-medium">Width</td><td className="py-1">{product.width_cm} cm</td></tr>
                )}
                {product.height_cm != null && product.height_cm !== '' && (
                  <tr className="border-b"><td className="py-1 font-medium">Height</td><td className="py-1">{product.height_cm} cm</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {product.description && <div className="bg-white p-4 rounded shadow-sm"><h2 className="font-bold mb-2">Description</h2><p className="text-sm whitespace-pre-line">{product.description}</p></div>}
        <div className="bg-white p-4 rounded shadow-sm"><h2 className="font-bold mb-2">Customer Reviews</h2><ReviewList productId={product.id} onSeeAll={() => setShowAllReviews(true)} /></div>
      </div>

      {similarProducts.length > 0 && (
        <div className="w-full mt-6 pb-10">
          <h2 className="text-sm font-bold text-gray-900 mb-3 px-4">Similar Items</h2>
          {similarLoading ? <div className="text-gray-500 text-sm px-4">Loading similar products…</div> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 px-4">
              {similarProducts.slice(0, 12).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      )}

      <AllReviewsModal isOpen={showAllReviews} onClose={() => setShowAllReviews(false)} productId={product.id} />
      {fullscreenImage && <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setFullscreenImage(false)}><img src={product.image_urls?.[selectedImage]} className="max-h-[90vh] max-w-full" /></div>}
      {showPriceAlert && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded p-6 w-full max-w-sm">
            <h3 className="font-bold mb-2">Set Price Alert</h3><p className="text-sm mb-4">Get notified when the price drops.</p>
            <input type="email" value={priceAlertEmail} onChange={e => setPriceAlertEmail(e.target.value)} placeholder="your@email.com" className="w-full border p-2 rounded mb-2" />
            {priceAlertError && <p className="text-red-500 text-xs">{priceAlertError}</p>}
            <div className="flex gap-2 justify-end"><button onClick={() => setShowPriceAlert(false)} className="px-4 py-2 border rounded">Cancel</button><button onClick={submitPriceAlert} className="px-4 py-2 bg-brand text-white rounded">Set Alert</button></div>
          </div>
        </div>
      )}

      {/* ★ MULTI‑VARIANT MODAL */}
      <AnimatePresence>
        {showVariantModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4" onClick={closeVariantModal}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-gray-900">Select Variants</h3><button onClick={closeVariantModal} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button></div>

                {allVariantsFlat.map((variant: any, idx: number) => {
                  const maxQty = getVariantMaxQuantity(variant);
                  const currentQty = variantQuantities[idx] || 0;
                  const label = Object.entries(variant.attributes || {}).map(([k, v]) => `${k}: ${v}`).join(', ');
                  const price = Number(variant.price) || product.price;
                  const disabled = maxQty <= 0;

                  return (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{label}</p>
                        <p className="text-xs text-gray-500">
                          ETB {formatPrice(price)}
                          {disabled ? <span className="text-red-500 ml-2">Unavailable today</span> : <span className="ml-2">{variant.unlimited_stock ? 'Unlimited' : `Stock: ${variant.stock}`}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setVariantQuantities(prev => ({ ...prev, [idx]: Math.max(0, currentQty - 1) }))} disabled={currentQty <= 0} className="w-7 h-7 flex items-center justify-center rounded border disabled:opacity-30"><Minus className="w-3 h-3" /></button>
                        <input type="number" min={0} max={maxQty} value={currentQty} onChange={e => { const val = parseInt(e.target.value, 10); setVariantQuantities(prev => ({ ...prev, [idx]: isNaN(val) ? 0 : Math.min(maxQty, Math.max(0, val)) })); }} className="w-12 text-center border rounded py-0.5 text-sm" disabled={disabled} />
                        <button onClick={() => setVariantQuantities(prev => ({ ...prev, [idx]: Math.min(maxQty, currentQty + 1) }))} disabled={disabled || currentQty >= maxQty} className="w-7 h-7 flex items-center justify-center rounded border disabled:opacity-30"><Plus className="w-3 h-3" /></button>
                      </div>
                    </div>
                  );
                })}

                {isBulk && moq > 1 && (
                  <div className="mt-3 text-xs text-gray-600">
                    {bulkMoqMetForVariants ? (
                      <span className="text-green-600">✓ Minimum order of {moq} units met</span>
                    ) : (
                      <span className="text-yellow-700">
                        ⚠️ Add {moq - currentProductCartQty - totalSelectedQty} more to reach {moq} minimum.
                      </span>
                    )}
                  </div>
                )}

                <button
                  onClick={handleMultiAddToCart}
                  disabled={totalSelectedQty === 0 || !orderable || shopClosed || !bulkMoqMetForVariants || addingToCart}
                  className="mt-4 w-full py-3 bg-[var(--brand)] text-white font-bold text-sm rounded-lg hover:bg-[var(--brand-hover)] transition disabled:opacity-50"
                >
                  {addingToCart ? 'Adding…' : variantAction === 'buy' ? 'Buy Now' : `Add to Cart (${totalSelectedQty})`}
                </button>
                {totalSelectedQty === 0 && !addingToCart && <p className="text-xs text-gray-400 text-center mt-2">Select quantities for the variants you want</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE STICKY BOTTOM BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-3 z-50 flex gap-2 shadow-lg">
        <button
          onClick={handleBuyNow}
          disabled={
            shopClosed || !orderable || isOutOfStock || addingToCart ||
            (!hasVariants && !isNonVariantAddAllowed)
          }
          className="flex-1 py-3 rounded bg-brand text-white font-semibold text-sm disabled:opacity-50"
        >
          Buy Now
        </button>
        <button
          onClick={handleAddToCart}
          disabled={
            shopClosed || !orderable || isOutOfStock || addingToCart ||
            (!hasVariants && !isNonVariantAddAllowed)
          }
          className={`flex-1 py-3 rounded font-semibold text-sm border-2 ${
            isCurrentVariantInCart ? 'bg-red-50 border-red-400 text-red-600' : 'bg-white border-gray-500 text-gray-800'
          }`}
        >
          {addingToCart ? 'Adding…' : isCurrentVariantInCart ? 'Remove' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductDetailPage;