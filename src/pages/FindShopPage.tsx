// src/pages/FindShopPage.tsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  StarIcon,
  MapPinIcon,
  ShoppingBagIcon,
  CubeIcon,
  TagIcon,
  InformationCircleIcon,
  ArrowLeftIcon,
  TruckIcon,
  ShieldCheckIcon,
  ClockIcon,
  ChatBubbleBottomCenterIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  ChevronDownIcon,
  CheckBadgeIcon,
  CubeTransparentIcon,
  SparklesIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import api from '../lib/axios';
import ProductCard, { MembershipBadge } from '../components/features/products/ProductCard';
import PackageLinkWrapper from '../components/features/packages/PackageLinkWrapper';
import ReviewList from '../components/features/reviews/ReviewList';
import ReviewForm from '../components/features/reviews/ReviewForm';

/* ── Helpers ── */
const safeRating = (r: any) => Number(r || 0);
const toNum = (v: any) => Number(v || 0);

/* ── Category tree for subcategory matching ── */
let categoryMap: Record<string, string[]> = {};

const buildCategoryMap = (categories: any[]) => {
  const map: Record<string, string[]> = {};
  const rootNodes = categories.filter((c: any) => !c.parent_id && !c.ancestry);
  const getChildren = (parentId: number | null): any[] =>
    categories.filter((c: any) => c.parent_id === parentId);

  const walk = (node: any, parentName: string) => {
    const currentName = node.name;
    if (!map[parentName]) map[parentName] = [];
    map[parentName].push(currentName);
    const children = getChildren(node.id);
    children.forEach(child => walk(child, currentName));
  };

  rootNodes.forEach(root => {
    map[root.name] = [root.name];
    const children = getChildren(root.id);
    children.forEach(child => walk(child, root.name));
  });
  categoryMap = map;
};

/* ── Filter state ── */
interface VendorFilterState {
  search: string;
  sort: string;
  minPrice: string;
  maxPrice: string;
  selectedCategories: string[];
  selectedRatings: number[];
  selectedDelivery: string[];
}

const defaultFilters: VendorFilterState = {
  search: '',
  sort: '',
  minPrice: '',
  maxPrice: '',
  selectedCategories: [],
  selectedRatings: [],
  selectedDelivery: [],
};

const sortOptions = [
  { label: 'Default', value: '' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Highest Rated', value: 'rating' },
  { label: 'Newest', value: 'newest' },
];

/* ── Filter Panel ── */
const FilterPanel = ({
  open,
  onClose,
  filters,
  onApply,
  meta,
  section,
}: {
  open: boolean;
  onClose: () => void;
  filters: VendorFilterState;
  onApply: (f: VendorFilterState) => void;
  meta: any;
  section: string;
}) => {
  if (!open) return null;

  const sectionMeta = meta?.[section] || {};
  const vendorCategoriesRaw = sectionMeta.categories || [];
  const ratings = sectionMeta.ratings || [];
  const priceRange = sectionMeta.price_range || { min: 0, max: 0 };
  const deliveryOptions = (sectionMeta.delivery_options || []).filter((o: any) => o.label && o.label.trim() !== '');

  const enrichedCategories = useMemo(() => {
    if (!vendorCategoriesRaw.length || Object.keys(categoryMap).length === 0) return vendorCategoriesRaw.filter((c: any) => c.name && c.name.trim() !== '');
    const countByName: Record<string, number> = {};
    vendorCategoriesRaw.forEach((c: any) => { countByName[c.name] = c.count; });
    vendorCategoriesRaw.forEach((cat: any) => {
      const name = cat.name;
      Object.entries(categoryMap).forEach(([parent, children]) => {
        if (children.includes(name) && parent !== name) {
          countByName[parent] = (countByName[parent] || 0) + cat.count;
        }
      });
    });
    return Object.entries(countByName)
      .filter(([name]) => name && name.trim() !== '')
      .map(([name, count]) => ({ name, count }));
  }, [vendorCategoriesRaw]);

  const [local, setLocal] = useState(filters);
  useEffect(() => { setLocal(filters); }, [filters]);

  const toggleCategory = (cat: string) => {
    setLocal(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(cat)
        ? prev.selectedCategories.filter(c => c !== cat)
        : [...prev.selectedCategories, cat],
    }));
  };
  const toggleRating = (star: number) => {
    setLocal(prev => ({
      ...prev,
      selectedRatings: prev.selectedRatings.includes(star)
        ? prev.selectedRatings.filter(r => r !== star)
        : [...prev.selectedRatings, star],
    }));
  };
  const toggleDelivery = (label: string) => {
    setLocal(prev => ({
      ...prev,
      selectedDelivery: prev.selectedDelivery.includes(label)
        ? prev.selectedDelivery.filter(d => d !== label)
        : [...prev.selectedDelivery, label],
    }));
  };

  const handleApply = () => { onApply({ ...local }); onClose(); };
  const handleReset = () => { onApply(defaultFilters); onClose(); };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 h-full w-80 bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-bold">Filters</h2>
          <button onClick={onClose}><XMarkIcon className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div>
            <label className="text-sm font-semibold">Search</label>
            <input type="text" value={local.search} onChange={e => setLocal({ ...local, search: e.target.value })} placeholder="Search..." className="w-full h-10 border rounded px-3 mt-1" />
          </div>
          <div>
            <label className="text-sm font-semibold">Sort By</label>
            <select value={local.sort} onChange={e => setLocal({ ...local, sort: e.target.value })} className="w-full h-10 border rounded px-3 mt-1">
              {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold">Price (ETB)</label>
            <div className="flex gap-2 mt-1">
              <input type="number" value={local.minPrice} onChange={e => setLocal({ ...local, minPrice: e.target.value })} placeholder={`Min ${priceRange.min}`} className="w-full h-10 border rounded px-3" />
              <input type="number" value={local.maxPrice} onChange={e => setLocal({ ...local, maxPrice: e.target.value })} placeholder={`Max ${priceRange.max}`} className="w-full h-10 border rounded px-3" />
            </div>
          </div>
          {deliveryOptions.length > 0 && (
            <div>
              <label className="text-sm font-semibold">Delivery</label>
              {deliveryOptions.map((opt: any) => (
                <label key={opt.label} className="flex items-center gap-2 text-sm mt-1">
                  <input type="checkbox" checked={local.selectedDelivery.includes(opt.label)} onChange={() => toggleDelivery(opt.label)} />
                  {opt.label} ({opt.count})
                </label>
              ))}
            </div>
          )}
          {enrichedCategories.length > 0 && (
            <div>
              <label className="text-sm font-semibold">Category</label>
              {enrichedCategories.map((cat: any) => (
                <label key={cat.name} className="flex items-center gap-2 text-sm mt-1">
                  <input type="checkbox" checked={local.selectedCategories.includes(cat.name)} onChange={() => toggleCategory(cat.name)} />
                  {cat.name} ({cat.count})
                </label>
              ))}
            </div>
          )}
          {ratings.length > 0 && (
            <div>
              <label className="text-sm font-semibold">Rating</label>
              {ratings.map((r: any) => (
                <label key={r.star} className="flex items-center gap-2 text-sm mt-1">
                  <input type="checkbox" checked={local.selectedRatings.includes(r.star)} onChange={() => toggleRating(r.star)} />
                  {r.star}★ & up ({r.count})
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="border-t px-4 py-3 flex gap-3">
          <button onClick={handleReset} className="flex-1 py-2 border rounded">Reset</button>
          <button onClick={handleApply} className="flex-1 py-2 bg-orange-500 text-white rounded">Apply</button>
        </div>
      </div>
    </>
  );
};

/* ── Company & Bulk badges ── */
const CompanyBadge = () => (
  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700">
    <BuildingOfficeIcon className="w-3.5 h-3.5" />
    COMPANY
  </span>
);

const BulkBadge = () => (
  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-700">
    <BuildingOfficeIcon className="w-3.5 h-3.5" />
    BULK
  </span>
);

/* ── Shop Card (listing view – badge stays) ── */
const ShopCard = ({ shop, onSelect }: { shop: any; onSelect: (id: number) => void }) => {
  const { data: products } = useQuery(
    ['vendorProducts', shop.id],
    () => api.get('/api/v1/products', { params: { vendor_id: shop.id, per_page: 5 } }).then(r => r.data.data || []),
    { staleTime: 5 * 60 * 1000 }
  );

  const displayRating = safeRating(shop.rating);

  const badgeText = shop.badge || (shop.membership_tier && shop.membership_tier !== 'free'
    ? `${shop.membership_tier.charAt(0).toUpperCase()}${shop.membership_tier.slice(1)} Seller`
    : undefined);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(shop.id)}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 transition-all duration-200 hover:shadow-md cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg border border-gray-200 bg-gray-100 flex-shrink-0 overflow-hidden">
          {shop.logo_url ? (
            <img src={shop.logo_url} alt={shop.business_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-black text-white flex items-center justify-center text-base font-bold">
              {shop.business_name?.[0]}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-bold text-xs text-black truncate">{shop.business_name}</h3>
            {shop.is_company && <CompanyBadge />}
            {shop.is_bulk_supplier && !shop.is_company && <BulkBadge />}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className={`w-3 h-3 ${i < Math.round(displayRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
              ))}
            </div>
            <span className="text-[11px] font-semibold text-black">{displayRating.toFixed(1)}</span>
            <span className="text-[10px] text-black">({shop.reviews_count})</span>
            {badgeText && (
              <span className="ml-1">
                <MembershipBadge tier={badgeText} />
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px] text-black">
            <span className="bg-gray-100 px-1.5 py-0.5 rounded-full">{shop.categories?.[0]?.name || 'General'}</span>
            <span className="flex items-center gap-0.5"><MapPinIcon className="w-3 h-3" />{shop.business_address || 'Ethiopia'}</span>
          </div>
        </div>
      </div>

      {products && products.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[10px] font-bold text-black mb-2">Top Picks</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {products.slice(0, 5).map((product: any) => (
              <div key={product.id} className="w-24 sm:w-28 flex-shrink-0">
                <ProductCard product={product} hideMembershipBadge compact />
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

/* ── Main Page ── */
const FindShopPage = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [bulkOnly, setBulkOnly] = useState(false);
  const [expandedFilter, setExpandedFilter] = useState<'sort' | 'rating' | 'category' | null>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'newest'>('rating');
  const [searchParams] = useSearchParams();
  const vendorIdFromUrl = searchParams.get('vendor');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [productFilters, setProductFilters] = useState<VendorFilterState>(defaultFilters);
  const [packageFilters, setPackageFilters] = useState<VendorFilterState>(defaultFilters);
  const [productFilterOpen, setProductFilterOpen] = useState(false);
  const [packageFilterOpen, setPackageFilterOpen] = useState(false);

  const { data: shops, isLoading: shopsLoading, error: shopsError } = useQuery(
    ['vendors', search, selectedCategory, minRating, bulkOnly],
    () => api.get('/api/v1/vendors', {
      params: { search: search || undefined, category: selectedCategory || undefined, min_rating: minRating || undefined, bulk: bulkOnly || undefined },
    }).then(res => res.data),
    { staleTime: 2 * 60 * 1000 }
  );

  useEffect(() => { if (vendorIdFromUrl && shops?.length > 0) setSelectedShopId(Number(vendorIdFromUrl)); }, [vendorIdFromUrl, shops]);

  const { data: selectedShop, isLoading: shopLoading, error: shopError } = useQuery(
    ['vendor', selectedShopId],
    () => api.get(`/api/v1/vendors/${selectedShopId}`).then(res => res.data),
    { enabled: !!selectedShopId, staleTime: 2 * 60 * 1000 }
  );

  const { data: filterMeta } = useQuery(
    ['vendorFilterOptions', selectedShopId],
    () => api.get(`/api/v1/vendors/${selectedShopId}/filter_options`).then(res => res.data),
    { enabled: !!selectedShopId, staleTime: 2 * 60 * 1000 }
  );

  const { data: allCategories } = useQuery('allCategories', () =>
    api.get('/categories').then(res => res.data)
  );

  useEffect(() => {
    if (allCategories) buildCategoryMap(allCategories);
  }, [allCategories]);

  const [activeTab, setActiveTab] = useState<'products' | 'packages' | 'discounts' | 'about' | 'reviews'>('products');
  const { data: mainCategories } = useQuery('categories', () => api.get('/categories').then(res => res.data), { staleTime: 5 * 60 * 1000 });

  const sortedShops = shops ? [...shops].sort((a: any, b: any) => {
    if (sortBy === 'rating') return safeRating(b.rating) - safeRating(a.rating);
    if (sortBy === 'reviews') return (b.reviews_count || 0) - (a.reviews_count || 0);
    return 0;
  }) : [];
  const filteredShops = minRating > 0 ? sortedShops.filter((s: any) => safeRating(s.rating) >= minRating) : sortedShops;
  const mainCategoriesList = mainCategories?.filter((c: any) => !c.parent_id && !c.ancestry) || [];

  useEffect(() => {
    setProductFilters(defaultFilters);
    setPackageFilters(defaultFilters);
  }, [selectedShopId]);

  const applyProducts = useCallback(
    (list: any[]) => {
      if (!list || list.length === 0) return [];
      const f = productFilters;
      let filtered = [...list];

      if (f.search.trim()) {
        filtered = filtered.filter(item => item.title?.toLowerCase().includes(f.search.toLowerCase()));
      }

      if (f.selectedCategories.length > 0) {
        const expandedCategories = new Set<string>();
        f.selectedCategories.forEach(sel => {
          expandedCategories.add(sel);
          if (categoryMap[sel]) {
            categoryMap[sel].forEach(sub => expandedCategories.add(sub));
          }
        });
        filtered = filtered.filter(item => {
          const productCat = item.category?.name || '';
          return expandedCategories.has(productCat);
        });
      }

      if (f.selectedDelivery.length > 0) {
        filtered = filtered.filter(item => f.selectedDelivery.includes(item.delivery_label));
      }

      if (f.minPrice) {
        filtered = filtered.filter(item => toNum(item.effective_price || item.price) >= Number(f.minPrice));
      }
      if (f.maxPrice) {
        filtered = filtered.filter(item => toNum(item.effective_price || item.price) <= Number(f.maxPrice));
      }

      if (f.selectedRatings.length > 0) {
        const minR = Math.min(...f.selectedRatings);
        filtered = filtered.filter(item => (item.rating || 0) >= minR);
      }

      switch (f.sort) {
        case 'price_asc': filtered.sort((a,b) => toNum(a.effective_price||a.price) - toNum(b.effective_price||b.price)); break;
        case 'price_desc': filtered.sort((a,b) => toNum(b.effective_price||b.price) - toNum(a.effective_price||a.price)); break;
        case 'rating': filtered.sort((a,b) => (b.rating||0) - (a.rating||0)); break;
        case 'newest': filtered.sort((a,b) => (b.id||0) - (a.id||0)); break;
      }
      return filtered;
    },
    [productFilters, categoryMap]
  );

  const applyPackages = useCallback(
    (list: any[]) => {
      if (!list || list.length === 0) return [];
      const f = packageFilters;
      let filtered = [...list];

      if (f.search.trim()) {
        filtered = filtered.filter(item => item.name?.toLowerCase().includes(f.search.toLowerCase()));
      }

      if (f.selectedCategories.length > 0) {
        const expandedCategories = new Set<string>();
        f.selectedCategories.forEach(sel => {
          expandedCategories.add(sel);
          if (categoryMap[sel]) {
            categoryMap[sel].forEach(sub => expandedCategories.add(sub));
          }
        });
        filtered = filtered.filter(item => {
          const itemCats = item.categories?.map((c: any) => c.name) || [];
          return itemCats.some((name: string) => expandedCategories.has(name));
        });
      }

      if (f.selectedDelivery.length > 0) {
        filtered = filtered.filter(item => f.selectedDelivery.includes(item.delivery_label));
      }

      if (f.minPrice) {
        filtered = filtered.filter(item => toNum(item.price) >= Number(f.minPrice));
      }
      if (f.maxPrice) {
        filtered = filtered.filter(item => toNum(item.price) <= Number(f.maxPrice));
      }

      switch (f.sort) {
        case 'price_asc': filtered.sort((a,b) => toNum(a.price) - toNum(b.price)); break;
        case 'price_desc': filtered.sort((a,b) => toNum(b.price) - toNum(a.price)); break;
      }
      return filtered;
    },
    [packageFilters, categoryMap]
  );

  const filteredProducts = useMemo(() => applyProducts(selectedShop?.products || []), [selectedShop, applyProducts]);
  const filteredDeals = useMemo(() => applyProducts(selectedShop?.discounts || []), [selectedShop, applyProducts]);
  const filteredPackages = useMemo(() => applyPackages(selectedShop?.packages || []), [selectedShop, applyPackages]);

  if (shopsLoading) return <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center"><div className="text-sm text-black">Loading shops…</div></div>;
  if (shopsError) return <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center"><div className="text-sm text-red-500">Failed to load shops.</div></div>;

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <div className="w-full px-4 md:px-6 py-4">
        {!selectedShopId ? (
          <>
            <div className="mb-4 text-center">
              <h1 className="text-2xl font-extrabold text-black">Find Suppliers</h1>
              <p className="text-sm text-black mt-1">Connect with verified Ethiopian sellers and wholesalers</p>
            </div>

            <div className="max-w-lg mx-auto mb-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
                <input type="text" placeholder="Search by shop name..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 text-sm border border-gray-300 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand shadow-sm text-black" />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              <div className="relative">
                <button onClick={() => setExpandedFilter(expandedFilter === 'sort' ? null : 'sort')} className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium border border-gray-300 rounded-full bg-white hover:bg-gray-50 transition shadow-sm text-black">
                  Sort: {sortBy === 'rating' ? 'Top Rated' : sortBy === 'reviews' ? 'Most Reviews' : 'Newest'} <ChevronDownIcon className="w-3 h-3" />
                </button>
                {expandedFilter === 'sort' && (
                  <div className="absolute top-full mt-1 left-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 min-w-[150px]">
                    {['rating','reviews','newest'].map(opt => (
                      <button key={opt} onClick={() => { setSortBy(opt as any); setExpandedFilter(null); }}
                        className={`block w-full text-left px-2 py-1 text-[11px] rounded ${sortBy === opt ? 'bg-brand-light text-brand font-semibold' : 'hover:bg-gray-50 text-black'}`}>
                        {opt === 'rating' ? 'Top Rated' : opt === 'reviews' ? 'Most Reviews' : 'Newest'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button onClick={() => setExpandedFilter(expandedFilter === 'rating' ? null : 'rating')} className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium border border-gray-300 rounded-full bg-white hover:bg-gray-50 transition shadow-sm text-black">
                  Rating: {minRating === 0 ? 'Any' : `${minRating}★+`} <ChevronDownIcon className="w-3 h-3" />
                </button>
                {expandedFilter === 'rating' && (
                  <div className="absolute top-full mt-1 left-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 min-w-[130px]">
                    {[0,4,3,2].map(r => (
                      <button key={r} onClick={() => { setMinRating(r); setExpandedFilter(null); }}
                        className={`block w-full text-left px-2 py-1 text-[11px] rounded ${minRating === r ? 'bg-brand-light text-brand font-semibold' : 'hover:bg-gray-50 text-black'}`}>
                        {r === 0 ? 'Any Rating' : `${r}★ & up`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button onClick={() => setExpandedFilter(expandedFilter === 'category' ? null : 'category')} className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium border border-gray-300 rounded-full bg-white hover:bg-gray-50 transition shadow-sm text-black">
                  Category: {selectedCategory ? mainCategoriesList.find(c => c.id.toString() === selectedCategory)?.name || 'All' : 'All'} <ChevronDownIcon className="w-3 h-3" />
                </button>
                {expandedFilter === 'category' && (
                  <div className="absolute top-full mt-1 left-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 min-w-[170px] max-h-40 overflow-y-auto">
                    <button onClick={() => { setSelectedCategory(''); setExpandedFilter(null); }} className="block w-full text-left px-2 py-1 text-[11px] rounded hover:bg-gray-50 text-black">All Categories</button>
                    {mainCategoriesList.map((cat: any) => (
                      <button key={cat.id} onClick={() => { setSelectedCategory(cat.id.toString()); setExpandedFilter(null); }}
                        className={`block w-full text-left px-2 py-1 text-[11px] rounded ${selectedCategory === cat.id.toString() ? 'bg-brand-light text-brand font-semibold' : 'hover:bg-gray-50 text-black'}`}>
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium border border-gray-300 rounded-full bg-white hover:bg-gray-50 transition cursor-pointer shadow-sm text-black">
                <input type="checkbox" checked={bulkOnly} onChange={e => setBulkOnly(e.target.checked)} className="w-3 h-3 accent-brand" /> Bulk Suppliers Only
              </label>
            </div>

            {filteredShops.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredShops.map((shop: any) => (
                  <ShopCard
                    key={shop.id}
                    shop={shop}
                    onSelect={(id) => {
                      const selected = filteredShops.find(s => s.id === id);
                      if (selected && (selected.is_company || selected.is_bulk_supplier)) {
                        navigate(`/company/${id}`);
                      } else {
                        setSelectedShopId(id);
                      }
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-24">
                <MagnifyingGlassIcon className="w-12 h-12 text-black mx-auto mb-4 opacity-20" />
                <p className="text-sm text-black">No suppliers match your search.</p>
              </div>
            )}
          </>
        ) : (
          <AnimatePresence>
            {shopLoading ? (
              <div className="text-center py-20 text-black text-sm">Loading shop details…</div>
            ) : shopError ? (
              <div className="text-center py-20 text-red-500 text-sm">Failed to load shop.</div>
            ) : selectedShop ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                <button onClick={() => setSelectedShopId(null)} className="mb-5 flex items-center gap-2 text-sm font-medium text-black hover:text-brand transition-colors">
                  <ArrowLeftIcon className="w-4 h-4" /> Back to shops
                </button>

                {/* ── Hero ── */}
                <div className="relative h-80 md:h-96 overflow-hidden mb-8 shadow-2xl rounded-none">
                  {selectedShop.banner_url ? (
                    <img src={selectedShop.banner_url} alt={selectedShop.business_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
                      <SparklesIcon className="w-16 h-16 text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 flex flex-col sm:flex-row items-end sm:items-center gap-5">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white shadow-2xl bg-white overflow-hidden flex-shrink-0 -mb-4 sm:mb-0">
                      {selectedShop.logo_url ? (
                        <img src={selectedShop.logo_url} alt={selectedShop.business_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-black text-white flex items-center justify-center text-3xl font-extrabold">
                          {selectedShop.business_name?.[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-white">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                          {selectedShop.business_name}
                        </h1>
                        <div className="flex gap-2 items-center">
                          {selectedShop.is_bulk_supplier && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 ring-1 ring-orange-200">
                              <BuildingOfficeIcon className="w-3.5 h-3.5" /> BULK
                            </span>
                          )}
                          {/* ★ Large membership badge – no verified badge */}
                          {selectedShop.badge && (
                            <span className="scale-125 origin-left">
                              <MembershipBadge tier={selectedShop.badge} />
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm md:text-base text-white/90 max-w-2xl leading-relaxed line-clamp-2 mb-3">
                        {selectedShop.description || "A trusted Ethiopian seller."}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <StarIcon className="w-4 h-4 text-yellow-400" />
                          <span className="font-bold">{safeRating(selectedShop.rating).toFixed(1)}</span>
                          <span>({selectedShop.reviews_count} reviews)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ShoppingBagIcon className="w-4 h-4" />
                          <span>{selectedShop.products_count} Products</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="w-4 h-4" />
                          <span>{selectedShop.business_address || 'Ethiopia'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Stats Ribbon ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Rating', value: safeRating(selectedShop.rating).toFixed(1) },
                    { label: 'Reviews', value: selectedShop.reviews_count || 0 },
                    { label: 'Products', value: selectedShop.products_count || 0 },
                    { label: 'Sales', value: selectedShop.total_sales || 0 },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
                      <div className="text-2xl font-extrabold text-black">{stat.value}</div>
                      <div className="text-xs font-medium text-black mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* ── Tabs + Filter ── */}
                <div className="sticky top-0 z-20 bg-[#F8F9FB] pt-2 pb-4 flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-1.5 bg-gray-100 rounded-lg p-1 overflow-x-auto">
                    {[
                      { id: 'products', label: 'Products', icon: ShoppingBagIcon },
                      { id: 'packages', label: 'Packages', icon: CubeIcon },
                      { id: 'discounts', label: 'Discounts', icon: TagIcon },
                      { id: 'about', label: 'About', icon: InformationCircleIcon },
                      { id: 'reviews', label: 'Reviews', icon: ChatBubbleBottomCenterIcon },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all whitespace-nowrap
                          ${activeTab === tab.id ? 'bg-white text-brand shadow-sm border border-gray-200' : 'text-black hover:text-brand hover:bg-white'}`}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  {(activeTab === 'products' || activeTab === 'discounts') && (
                    <button onClick={() => setProductFilterOpen(true)} className="flex items-center gap-2 text-sm font-medium text-black bg-white border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition shadow-sm">
                      <FunnelIcon className="w-4 h-4" /> Filters
                    </button>
                  )}
                  {activeTab === 'packages' && (
                    <button onClick={() => setPackageFilterOpen(true)} className="flex items-center gap-2 text-sm font-medium text-black bg-white border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition shadow-sm">
                      <FunnelIcon className="w-4 h-4" /> Filters
                    </button>
                  )}
                </div>

                {/* ── Content (products hide membership badge) ── */}
                <div className="mt-2">
                  {activeTab === 'products' && (
                    filteredProducts.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {filteredProducts.map((product: any) => (
                          <ProductCard key={product.id} product={product} hideMembershipBadge />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20 text-gray-500">
                        <p>No products match your filters.</p>
                        <button onClick={() => { setProductFilters(defaultFilters); setProductFilterOpen(false); }} className="text-brand underline text-sm mt-2">
                          Clear all filters
                        </button>
                      </div>
                    )
                  )}
                  {activeTab === 'packages' && (
                    filteredPackages.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredPackages.map((pkg: any) => (
                          <PackageLinkWrapper key={pkg.id} package={pkg} compact={true} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20 text-gray-500">
                        <p>No packages match your filters.</p>
                        <button onClick={() => { setPackageFilters(defaultFilters); setPackageFilterOpen(false); }} className="text-brand underline text-sm mt-2">
                          Clear all filters
                        </button>
                      </div>
                    )
                  )}
                  {activeTab === 'discounts' && (
                    filteredDeals.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {filteredDeals.map((item: any) => (
                          <ProductCard key={item.id} product={item} hideMembershipBadge />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20 text-gray-500">
                        <p>No deals match your filters.</p>
                        <button onClick={() => { setProductFilters(defaultFilters); setProductFilterOpen(false); }} className="text-brand underline text-sm mt-2">
                          Clear all filters
                        </button>
                      </div>
                    )
                  )}
                  {activeTab === 'about' && (
                    <div className="max-w-3xl">
                      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
                        <h3 className="text-lg font-bold text-black mb-3">About {selectedShop.business_name}</h3>
                        <p className="text-sm text-black leading-relaxed">
                          {selectedShop.long_description || selectedShop.description || 'No additional description.'}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                          <div className="flex items-start gap-3">
                            <MapPinIcon className="w-5 h-5 text-brand mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-black">Address</p>
                              <p className="text-sm text-black">{selectedShop.business_address || 'Ethiopia'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <TruckIcon className="w-5 h-5 text-brand mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-black">Shipping</p>
                              <p className="text-sm text-black">{selectedShop.shipping_policy || 'Fast delivery across Ethiopia'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <ShieldCheckIcon className="w-5 h-5 text-brand mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-black">Returns</p>
                              <p className="text-sm text-black">{selectedShop.return_policy || 'Trade Assurance covered'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <ClockIcon className="w-5 h-5 text-brand mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-black">Payment</p>
                              <p className="text-sm text-black">{selectedShop.payment_policy || 'Multiple options available'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {selectedShop.latitude && selectedShop.longitude && (
                        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm mb-6">
                          <iframe
                            title="Location"
                            width="100%"
                            height="250"
                            frameBorder="0"
                            scrolling="no"
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(selectedShop.longitude) - 0.02},${Number(selectedShop.latitude) - 0.02},${Number(selectedShop.longitude) + 0.02},${Number(selectedShop.latitude) + 0.02}&layer=mapnik&marker=${selectedShop.latitude},${selectedShop.longitude}`}
                            className="w-full"
                            loading="lazy"
                          />
                          <div className="px-4 py-3 bg-white border-t border-gray-100 flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4 text-brand" />
                            <span className="text-sm font-medium text-black">{selectedShop.business_address || 'Ethiopia'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {activeTab === 'reviews' && (
                    <div className="max-w-3xl">
                      <ReviewList vendorId={selectedShop.id} />
                      <div className="mt-6">
                        <ReviewForm
                          vendorId={selectedShop.id}
                          onSuccess={() => {
                            queryClient.invalidateQueries(['reviews', `/vendors/${selectedShop.id}/reviews`]);
                            queryClient.invalidateQueries(['vendor', selectedShop.id]);
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        )}
      </div>

      <FilterPanel
        open={productFilterOpen}
        onClose={() => setProductFilterOpen(false)}
        filters={productFilters}
        onApply={setProductFilters}
        meta={filterMeta}
        section="products"
      />
      <FilterPanel
        open={packageFilterOpen}
        onClose={() => setPackageFilterOpen(false)}
        filters={packageFilters}
        onApply={setPackageFilters}
        meta={filterMeta}
        section="packages"
      />

      <style>{`.scrollbar-none::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

export default FindShopPage;