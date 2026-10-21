// src/pages/MainCategoryPage.tsx
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import api from '../lib/axios';
import ProductCard from '../components/features/products/ProductCard';
import PackageLinkWrapper from '../components/features/packages/PackageLinkWrapper';
import FilterSidebar from '../components/features/products/FilterSidebar';
import SortBar from '../components/features/products/SortBar';
import ActiveFilters from '../components/features/products/ActiveFilters';

const buildCategoryTree = (flatList: any[]) => {
  const map = new Map<number, any>();
  const roots: any[] = [];
  flatList.forEach(cat => map.set(cat.id, { ...cat, children: [] }));
  flatList.forEach(cat => {
    const node = map.get(cat.id);
    if (cat.ancestry) {
      const parentId = parseInt(cat.ancestry.split('/').pop()!, 10);
      const parent = map.get(parentId);
      if (parent) parent.children.push(node);
      else roots.push(node);
    } else if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id).children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
};

const MainCategoryPage = () => {
  const { id } = useParams();
  const numericCategoryId = id ? Number(id) : undefined;
  const [searchParams, setSearchParams] = useState(new URLSearchParams(window.location.search));
  const [showFilters, setShowFilters] = useState(false);

  const subcategoryScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const { data: category, isLoading: catLoading, error: catError } = useQuery(
    ['mainCategory', id],
    () => api.get(`/categories/${id}`).then(res => res.data),
    { enabled: !!id }
  );

  const { data: allCategories } = useQuery(
    'allCategoriesForPage',
    () => api.get('/categories').then(res => res.data),
    { staleTime: 10 * 60 * 1000 }
  );

  const subCategories = allCategories && category
    ? buildCategoryTree(allCategories).find((c: any) => c.id === category.id)?.children || []
    : [];

  const { data: products, isLoading: prodLoading, error: prodError } = useQuery(
    ['mainCategoryProducts', id, searchParams.toString()],
    () => {
      const params = new URLSearchParams(searchParams);
      params.set('category', id || '');
      if (!searchParams.has('price_min')) params.delete('price_min');
      if (!searchParams.has('price_max')) params.delete('price_max');
      return api.get(`/products?${params.toString()}`).then(res => {
        const body = res.data;
        return body?.data || [];
      });
    },
    { enabled: !!id }
  );

  // ★ Scoped packages
  const { data: packages } = useQuery(
    ['mainCategoryPackages', id],
    async () => {
      const res = await api.get(`/packages?category=${id}`);
      let data = res.data;
      if (data && Array.isArray(data.data)) data = data.data;
      return Array.isArray(data) ? data : [];
    },
    { enabled: !!id }
  );

  useEffect(() => {
    const handlePopState = () => setSearchParams(new URLSearchParams(window.location.search));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const checkSubScroll = () => {
    if (subcategoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = subcategoryScrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };
  useEffect(() => {
    checkSubScroll();
    const el = subcategoryScrollRef.current;
    if (el) el.addEventListener('scroll', checkSubScroll, { passive: true });
    return () => { if (el) el.removeEventListener('scroll', checkSubScroll); };
  }, [subCategories]);

  const scrollSubBy = (direction: 'left' | 'right') => {
    if (subcategoryScrollRef.current) {
      subcategoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -200 : 200,
        behavior: 'smooth',
      });
    }
  };

  const packageScrollRef = useRef<HTMLDivElement>(null);
  const scrollPackageBy = (direction: 'left' | 'right') => {
    if (packageScrollRef.current) {
      const container = packageScrollRef.current;
      const scrollAmount = container.clientWidth;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (catLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-text-muted text-sm">Loading category…</div>
      </div>
    );
  }
  if (catError || !category) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-center">
          <p className="text-product-title font-semibold text-text-primary">Category not found</p>
          <Link to="/" className="text-sm text-brand hover:underline mt-2 block">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Hero – full‑cover, HD responsive, dark overlay */}
      <div className="relative h-56 sm:h-64 md:h-80 lg:h-96 overflow-hidden bg-gray-900">
        <img
          src={category.image_url || `https://placehold.co/1200x600?text=${encodeURIComponent(category.name)}`}
          srcSet={
            category.image_url
              ? `${category.image_url}?width=1200 1200w, ${category.image_url}?width=2400 2400w`
              : `https://placehold.co/1200x600?text=${encodeURIComponent(category.name)} 1200w, https://placehold.co/2400x1200?text=${encodeURIComponent(category.name)} 2400w`
          }
          sizes="100vw"
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover"
          fetchPriority="high"
        />
        {/* Dark gradient overlay – exactly as before */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 pl-6 sm:pl-10 pb-6 sm:pb-10 max-w-lg">
          <Link to="/all-products" className="text-white/70 hover:text-white text-sm font-medium mb-3 inline-block transition-colors">
            ← All Categories
          </Link>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-2 text-sm md:text-base text-white/80 max-w-md leading-relaxed drop-shadow">
              {category.description}
            </p>
          )}
        </div>
      </div>

      {/* Main Content – full width, reduced gaps */}
      <div className="w-full px-2 sm:px-4 py-2">
        {/* Browse Subcategories – polished pill buttons with icon */}
        {subCategories.length > 0 && (
          <div className="mb-2">
            <h2 className="text-lg font-bold text-text-primary mb-2">Browse Subcategories</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {subCategories.map((sub: any) => (
                <Link
                  key={sub.id}
                  to={`/subcategory/${sub.id}`}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 border border-orange-300 bg-gray-100 text-gray-800 hover:bg-orange-500 hover:text-white hover:border-orange-500 rounded-full text-sm font-medium transition-colors whitespace-nowrap"
                >
                  <TagIcon className="w-4 h-4" />
                  <span>{sub.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Packages – scoped to the current category */}
        {packages && packages.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-text-primary">Packages in {category.name}</h2>
            </div>
            <div className="relative">
              {packages.length > 5 && (
                <>
                  <button onClick={() => scrollPackageBy('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 p-1.5 rounded-full shadow-card hover:bg-white transition"><ChevronLeftIcon className="w-4 h-4 text-text-secondary" /></button>
                  <button onClick={() => scrollPackageBy('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 p-1.5 rounded-full shadow-card hover:bg-white transition"><ChevronRightIcon className="w-4 h-4 text-text-secondary" /></button>
                </>
              )}
              <div ref={packageScrollRef} className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {packages.map((pkg: any) => (
                  <div key={pkg.id} className="snap-start flex-shrink-0" style={{ flex: '0 0 calc(20% - 0.4rem)' }}>
                    <div className="bg-blue-50 rounded-xl p-1 h-full"><PackageLinkWrapper package={pkg} compact={true} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filters + Products */}
        <div className="flex gap-4">
          {/* Sidebar – desktop only */}
          <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-24 self-start">
            <FilterSidebar searchParams={searchParams} setSearchParams={setSearchParams} currentCategoryId={numericCategoryId} />
          </aside>

          {/* Product area */}
          <div className="flex-1 min-w-0">
            {/* Row: filter button (mobile) + sort bar (right aligned, full width) */}
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-sm)] border border-gray-300 text-sm font-medium text-text-secondary hover:text-brand transition-colors bg-white shadow-card lg:hidden"
              >
                <FunnelIcon className="w-4 h-4" /> Filters
              </button>
              {/* SortBar always visible, aligned to the right */}
              <div className="flex-1 flex justify-end">
                <SortBar searchParams={searchParams} setSearchParams={setSearchParams} />
              </div>
            </div>

            <ActiveFilters searchParams={searchParams} setSearchParams={setSearchParams} />

            {prodLoading && (
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {[...Array(10)].map((_, i) => <div key={i} className="rounded-[var(--radius-md)] h-80 animate-pulse bg-gray-200" />)}
              </div>
            )}
            {prodError && <div className="text-center py-12 text-red-500">Failed to load products.</div>}
            {!prodLoading && !prodError && products?.length === 0 && <div className="text-center py-12 text-text-muted">No products found.</div>}
            {!prodLoading && !prodError && products?.length > 0 && (
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {products.map((product: any) => <ProductCard key={product.id} product={product} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {showFilters && (
          <div className="fixed inset-0 bg-black/50 z-50 flex justify-end lg:hidden">
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className="w-80 bg-white h-full overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-border-light p-4 flex justify-between items-center z-10">
                <h2 className="text-lg font-semibold text-text-primary">Filters</h2>
                <button onClick={() => setShowFilters(false)}><XMarkIcon className="w-5 h-5 text-text-muted" /></button>
              </div>
              <div className="p-4">
                <FilterSidebar searchParams={searchParams} setSearchParams={setSearchParams} currentCategoryId={numericCategoryId} isMobile onClose={() => setShowFilters(false)} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`.scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; } .scrollbar-none::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

export default MainCategoryPage;