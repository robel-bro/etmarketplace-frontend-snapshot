import { Link } from 'react-router-dom';

/* ---------- types ---------- */
interface CategoryItem {
  name: string;
  image?: string;
  count?: number;
  path: string;
}

interface ProductPreview {
  id: number | string;
  title?: string;
  image_urls?: string[];
  image?: string;
  price?: number | string;
  effective_price?: number | string;
  original_price?: number | string;
  discount?: number | string;
  rating?: number | string;
  free_shipping?: boolean;
  is_flash_sale?: boolean;
  is_super_deal?: boolean;
}

interface CollectionCardProps {
  collection: {
    id: number | string;
    slug?: string;
    name: string;
    description?: string;
    label?: string;
    cover_image_url?: string;
    product_count?: number;
    categories?: CategoryItem[];
    showcase_products?: ProductPreview[];
    products?: ProductPreview[];
  };
}

/* ---------- helpers ---------- */
const toNum = (v: any, fallback = 0): number => {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
};

/* ---------- Clean SVG icons ---------- */
const IconBox = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const IconTag = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
    <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

const IconTruck = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="2" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const IconStar = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

/* ---------- Row components ---------- */
const CategoryRow = ({ category }: { category: CategoryItem }) => (
  <Link
    to={category.path}
    className="flex items-center gap-3 p-3 bg-white border border-[#E5E7EB] hover:bg-[#FFF7ED] transition-all group rounded-none"
  >
    {category.image ? (
      <img src={category.image} alt={category.name} className="w-12 h-12 object-cover bg-[#F9FAFB] rounded-none" />
    ) : (
      <div className="w-12 h-12 bg-[#F9FAFB] flex items-center justify-center text-xl rounded-none">🛍️</div>
    )}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-900 leading-tight">{category.name}</p>
      {category.count != null && <p className="text-xs text-gray-500 mt-0.5">{category.count}+ items</p>}
    </div>
    <span className="text-gray-400 group-hover:text-orange-600 transition-colors text-lg">→</span>
  </Link>
);

const ProductRow = ({ product }: { product: ProductPreview }) => {
  const img = product.image_urls?.[0] || product.image || 'https://placehold.co/80x80?text=No+Image';
  const title = product.title || 'Product';
  const price = toNum(product.price) || toNum(product.effective_price) || 0;
  const old = toNum(product.original_price);
  const discount = product.discount || (old > price ? Math.round(((old - price) / old) * 100) : null);

  return (
    <Link
      to={`/product/${product.id}`}
      className="flex items-center gap-3 p-2.5 bg-white border border-[#E5E7EB] hover:bg-[#FFF7ED] transition-all rounded-none"
    >
      <img src={img} alt={title} className="w-12 h-12 object-cover bg-[#F9FAFB] rounded-none" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{title}</p>
        <div className="flex items-center gap-2 text-xs mt-0.5">
          <span className="font-bold text-gray-900">ETB {price.toLocaleString()}</span>
          {old > price && <span className="text-gray-400 line-through">ETB {old.toLocaleString()}</span>}
        </div>
        {product.is_flash_sale && (
          <span className="inline-block mt-1 px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded">FLASH</span>
        )}
        {product.is_super_deal && (
          <span className="inline-block mt-1 px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded">SUPER DEAL</span>
        )}
        {discount && !product.is_flash_sale && !product.is_super_deal && (
          <span className="inline-block mt-1 px-1.5 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded">-{discount}%</span>
        )}
      </div>
    </Link>
  );
};

/* ---------- Main Card ---------- */
const CollectionCard = ({ collection }: CollectionCardProps) => {
  const {
    id, slug, name, description, label, cover_image_url,
    product_count = 0,
    categories = [],
    showcase_products = [],
    products = [],
  } = collection;

  const heroImage = cover_image_url || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1200&q=80';
  const hasCategories = categories.length > 0;
  const showcaseItems = showcase_products.length > 0 ? showcase_products : products.slice(0, 4);
  const hasShowcase = showcaseItems.length > 0;

  const allPrices = showcaseItems.map(p => toNum(p.price) || toNum(p.effective_price)).filter(v => v > 0);
  const totalValue = allPrices.reduce((a, b) => a + b, 0);
  const savings = showcaseItems.reduce((sum, p) => {
    const old = toNum(p.original_price);
    const curr = toNum(p.price) || toNum(p.effective_price);
    return old > curr ? sum + (old - curr) : sum;
  }, 0);
  const hasFreeShipping = showcaseItems.some(p => p.free_shipping);
  const avgRating = showcaseItems.length
    ? (showcaseItems.reduce((s, p) => s + toNum(p.rating), 0) / showcaseItems.length).toFixed(1)
    : null;

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-0">
        {/* ── LEFT + CENTER: image with guaranteed text readability ── */}
        <div className="lg:w-[75%] relative min-h-[280px] lg:min-h-[360px] bg-gray-900">
          <img
            src={heroImage}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{ filter: 'brightness(1.05) contrast(1.05)' }}
          />

          {/* Subtle bottom gradient – the guaranteed contrast layer */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/25 to-transparent" />

          {/* Text – plain white, no blend mode */}
          <div className="relative h-full flex flex-col justify-end p-6 lg:p-8 text-white z-10">
            {label && (
              <span className="text-xs font-bold uppercase tracking-wide mb-1">{label}</span>
            )}
            <h2 className="text-2xl lg:text-3xl font-extrabold leading-tight mb-2">{name}</h2>
            {description && (
              <p className="text-sm leading-relaxed mb-4 max-w-xl">{description}</p>
            )}

            <div className="flex flex-wrap gap-3 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <IconBox />
                <span>{product_count}+ Products</span>
              </div>
              {totalValue > 0 && (
                <div className="flex items-center gap-2">
                  <IconTag />
                  <span>Total ETB {totalValue.toLocaleString()}</span>
                </div>
              )}
              {savings > 0 && (
                <div className="flex items-center gap-2">
                  <IconTag />
                  <span>Save ETB {savings.toLocaleString()}</span>
                </div>
              )}
              {hasFreeShipping && (
                <div className="flex items-center gap-2">
                  <IconTruck />
                  <span>Free Shipping</span>
                </div>
              )}
              {avgRating && (
                <div className="flex items-center gap-2">
                  <IconStar />
                  <span>{avgRating} rating</span>
                </div>
              )}
            </div>

            <Link
              to={`/collections/${slug || id}`}
              className="inline-flex items-center justify-center gap-1.5 h-8 px-3 bg-orange-600 hover:bg-orange-700 text-white font-medium text-xs transition-all active:scale-95 shadow-sm w-fit"
            >
              Explore Collection
              <span className="text-sm">→</span>
            </Link>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        {(hasCategories || hasShowcase) && (
          <div className="lg:w-[25%] p-4 lg:p-6 flex flex-col gap-2 bg-white border-l border-[#E5E7EB]">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-gray-900">
                {hasCategories ? 'Categories' : '🔥 Top Picks'}
              </h3>
              {!hasCategories && (
                <Link to={`/collections/${slug || id}`} className="text-xs font-medium text-orange-600 hover:underline">
                  View All
                </Link>
              )}
            </div>
            {hasCategories
              ? categories.slice(0, 4).map((cat, idx) => <CategoryRow key={idx} category={cat} />)
              : showcaseItems.map((item) => <ProductRow key={item.id} product={item} />)}
            {!hasCategories && hasShowcase && products.length > 4 && (
              <Link
                to={`/collections/${slug || id}`}
                className="text-xs text-orange-600 font-medium hover:underline mt-1 self-end"
              >
                +{products.length - 4} more
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionCard;