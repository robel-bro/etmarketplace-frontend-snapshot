// src/pages/AllProductsPage.tsx
import { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery, useQuery } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FunnelIcon,
  XMarkIcon,
  ClockIcon,
  SparklesIcon,
  FireIcon,
  TagIcon,
  BoltIcon,
  CubeIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import api from '../lib/axios';
import ProductCard from '../components/features/products/ProductCard';
import PackageLinkWrapper from '../components/features/packages/PackageLinkWrapper';
import FilterSidebar from '../components/features/products/FilterSidebar';
import SortBar from '../components/features/products/SortBar';
import ActiveFilters from '../components/features/products/ActiveFilters';
import HeroCarousel from '../components/features/home/HeroCarousel';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import CollectionCard from '../components/features/collections/CollectionCard';

type TabType = 'new-arrivals' | 'popular' | 'sale' | 'trending' | 'super-deals' | 'hot-deals' | 'packages' | 'collections';

const tabs: { id: TabType; label: string; icon: JSX.Element; path: string }[] = [
  { id: 'new-arrivals', label: 'New Arrivals', icon: <SparklesIcon className="w-5 h-5" />, path: 'new-arrivals' },
  { id: 'popular', label: 'Best Sellers', icon: <FireIcon className="w-5 h-5" />, path: 'best-sellers' },
  { id: 'trending', label: 'Trending', icon: <BoltIcon className="w-5 h-5" />, path: 'trending' },
  { id: 'sale', label: 'Flash Sales', icon: <TagIcon className="w-5 h-5" />, path: 'flash-sales' },
  { id: 'super-deals', label: 'Super Deals', icon: <SparklesIcon className="w-5 h-5" />, path: 'super-deals' },
  { id: 'hot-deals', label: 'Hot Deals', icon: <FireIcon className="w-5 h-5" />, path: 'hot-deals' },
  { id: 'packages', label: 'Packages', icon: <CubeIcon className="w-5 h-5" />, path: 'packages' },
  { id: 'collections', label: 'Collections', icon: <RectangleStackIcon className="w-5 h-5" />, path: 'collections' },
];

const extractProducts = (data: any): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.products && Array.isArray(data.products)) return data.products;
  return [];
};

const AllProductsPage = ({ activeTab: propActiveTab, onTabChange }: { activeTab?: TabType; onTabChange?: (tab: string) => void }) => {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();

  const resolveActiveTab = (): TabType => {
    if (tab && tabs.some(t => t.id === tab)) return tab as TabType;
    if (propActiveTab && tabs.some(t => t.id === propActiveTab)) return propActiveTab;
    return 'new-arrivals';
  };

  const [activeTab, setActiveTab] = useState<TabType>(resolveActiveTab);

  useEffect(() => {
    if (tab && tabs.some(t => t.id === tab)) setActiveTab(tab as TabType);
  }, [tab]);

  useEffect(() => {
    if (propActiveTab && propActiveTab !== activeTab && tabs.some(t => t.id === propActiveTab)) {
      setActiveTab(propActiveTab);
      navigate(`/products/${propActiveTab}`, { replace: true });
    }
  }, [propActiveTab]);

  const [searchParams, setSearchParams] = useState(new URLSearchParams());
  const [showFilters, setShowFilters] = useState(false);
  const [showRightNav, setShowRightNav] = useState(false);
  const topTabsRef = useRef<HTMLDivElement>(null);
  const { ref, inView } = useInView();
  const { products: recentlyViewed } = useRecentlyViewed();

  const { data: categories } = useQuery('categories', () =>
    api.get('/categories').then(res => res.data.data || res.data || [])
  );

  useEffect(() => {
    const handleScroll = () => {
      if (topTabsRef.current) {
        const rect = topTabsRef.current.getBoundingClientRect();
        setShowRightNav(rect.bottom < 0);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchProducts = async ({ pageParam = 1 }) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageParam.toString());
    params.set('limit', '20');

    if (!params.has('sort')) {
      switch (activeTab) {
        case 'new-arrivals':
          params.set('sort', 'newest');
          break;
        case 'popular':
          params.set('sort', 'best_sellers');
          break;
        case 'trending':
          params.set('sort', 'trending');
          break;
      }
    }

    switch (activeTab) {
      case 'sale':
        params.set('is_flash_sale', 'true');
        break;
      case 'super-deals':
        params.set('is_super_deal', 'true');
        break;
      case 'hot-deals':
        params.set('is_hot_deal', 'true');
        break;
    }

    const res = await api.get(`/products?${params.toString()}`);
    const responseData = res.data;
    const products = extractProducts(responseData);
    const nextPage = responseData?.meta?.next_page || null;
    return { data: products, nextPage };
  };

  const {
    data: productsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery(['products', activeTab, searchParams.toString()], fetchProducts, {
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: activeTab !== 'packages' && activeTab !== 'collections',
  });

  const products = productsData?.pages?.flatMap(page => page.data || []) || [];

  const { data: packages, isLoading: packagesLoading } = useQuery(
    ['packages', searchParams.toString()],
    () => api.get(`/packages?${searchParams.toString()}`).then(res => {
      let data = res.data;
      if (data?.data && Array.isArray(data.data)) data = data.data;
      else if (!Array.isArray(data)) data = [];
      return data;
    }).catch(() => []),
    { enabled: activeTab === 'packages' }
  );

  const { data: apiCollections, isLoading: collectionsLoading } = useQuery(
    ['collections', searchParams.toString()],
    () => api.get('/api/v1/collections').then(res => res.data).catch(() => []),
    { enabled: activeTab === 'collections' }
  );

  const collections = apiCollections || [];

  const { data: heroBanners } = useQuery('heroBanners', () =>
    api.get('/api/v1/banners').then(res => res.data).catch(() => [])
  );

  const isLoading = status === 'loading' && activeTab !== 'packages' && activeTab !== 'collections';
  const error = status === 'error' && activeTab !== 'packages' && activeTab !== 'collections';

  useEffect(() => {
    if (inView && hasNextPage && activeTab !== 'packages' && activeTab !== 'collections') {
      fetchNextPage();
    }
  }, [inView, hasNextPage, activeTab, fetchNextPage]);

  const handleTabClick = (tabId: TabType) => {
    setActiveTab(tabId);
    const matchingTab = tabs.find(t => t.id === tabId);
    if (matchingTab) {
      navigate(`/products/${matchingTab.path}`, { replace: true });
      if (onTabChange) onTabChange(matchingTab.path);
    }
    setSearchParams(new URLSearchParams());
  };

  const topCategories = categories?.filter((c: any) => !c.parent_id && !c.ancestry) || [];

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {heroBanners && heroBanners.length > 0 && (
        <div className="hero-carousel mb-0">
          <div className="max-h-48 sm:max-h-64 md:max-h-none overflow-hidden">
            <HeroCarousel banners={heroBanners} />
          </div>
        </div>
      )}

      <div className="container-marketplace py-4">
        {/* Tabs */}
        <div ref={topTabsRef} className="mb-4 flex justify-center">
          <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                style={{
                  backgroundColor: activeTab === tab.id ? '#F97519' : '#ffffff',
                  color: activeTab === tab.id ? '#ffffff' : '#111827',
                  borderColor: activeTab === tab.id ? '#F97519' : '#D1D5DB',
                }}
                className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap border ${
                  activeTab === tab.id
                    ? 'ring-2 ring-brand/30 shadow-md'
                    : 'hover:border-gray-400'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Category Chips */}
        <div className="mb-4 flex justify-center">
          <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.delete('category');
                setSearchParams(params);
              }}
              style={{
                backgroundColor: !searchParams.get('category') ? '#F97519' : '#ffffff',
                color: !searchParams.get('category') ? '#ffffff' : '#111827',
                borderColor: !searchParams.get('category') ? '#F97519' : '#D1D5DB',
              }}
              className={`px-3 py-1 rounded-[var(--radius-sm)] text-sm font-medium transition whitespace-nowrap border ${
                !searchParams.get('category')
                  ? 'ring-2 ring-brand/30 shadow-md'
                  : 'hover:border-gray-400'
              }`}
            >
              All
            </button>
            {topCategories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set('category', cat.id.toString());
                  setSearchParams(params);
                }}
                style={{
                  backgroundColor: searchParams.get('category') === cat.id.toString() ? '#F97519' : '#ffffff',
                  color: searchParams.get('category') === cat.id.toString() ? '#ffffff' : '#111827',
                  borderColor: searchParams.get('category') === cat.id.toString() ? '#F97519' : '#D1D5DB',
                }}
                className={`px-3 py-1 rounded-[var(--radius-sm)] text-sm font-medium transition whitespace-nowrap border ${
                  searchParams.get('category') === cat.id.toString()
                    ? 'ring-2 ring-brand/30 shadow-md'
                    : 'hover:border-gray-400'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          {/* Filter Sidebar – always present on desktop */}
          {activeTab !== 'collections' && (
            <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-24 self-start">
              <FilterSidebar searchParams={searchParams} setSearchParams={setSearchParams} />
            </aside>
          )}

          {/* Main Content – full width of remaining space */}
          <div className="flex-1 min-w-0">
            <div className="lg:hidden mb-3">
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-sm)] border border-gray-300 text-sm font-medium text-text-secondary hover:text-brand transition-colors bg-white shadow-card"
              >
                <FunnelIcon className="w-4 h-4" /> Filters
              </button>
            </div>

            <ActiveFilters searchParams={searchParams} setSearchParams={setSearchParams} />

            {activeTab !== 'packages' && activeTab !== 'collections' && (
              <div className="mb-3">
                <SortBar searchParams={searchParams} setSearchParams={setSearchParams} />
              </div>
            )}

            {/* Products – no wrapper padding, full grid */}
            {activeTab !== 'packages' && activeTab !== 'collections' && (
              <div>
                {isLoading && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="rounded-[var(--radius-md)] h-72 animate-pulse bg-gray-200" />
                    ))}
                  </div>
                )}
                {error && <div className="text-center py-12 text-red-500 text-sm">Failed to load products.</div>}
                {!isLoading && !error && products.length === 0 && (
                  <div className="text-center py-12 text-text-muted text-sm">No products found.</div>
                )}
                {!isLoading && !error && products.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
                {isFetchingNextPage && (
                  <div ref={ref} className="h-10 flex items-center justify-center mt-4">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Packages */}
            {activeTab === 'packages' && (
              <div>
                {packagesLoading && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="bg-gray-200 rounded-2xl h-64 animate-pulse" />
                    ))}
                  </div>
                )}
                {!packagesLoading && (!packages || packages.length === 0) && (
                  <div className="text-center py-12 text-text-muted text-sm">No packages available.</div>
                )}
                {!packagesLoading && packages && packages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {packages.map((pkg: any) => (
                      <PackageLinkWrapper key={pkg.id} package={pkg} compact={true} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Collections */}
            {activeTab === 'collections' && (
              <div>
                {collectionsLoading && <div className="text-center py-12 text-text-muted text-sm">Loading collections...</div>}
                {!collectionsLoading && (!collections || collections.length === 0) && (
                  <div className="text-center py-12 text-text-muted text-sm">No collections yet.</div>
                )}
                {!collectionsLoading && collections && collections.length > 0 && (
                  <div className="flex flex-col gap-4">
                    {collections.map((col: any) => (
                      <CollectionCard key={col.id} collection={col} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recently Viewed */}
            {activeTab !== 'packages' && activeTab !== 'collections' && recentlyViewed && recentlyViewed.length > 0 && (
              <div className="mt-4">
                <h2 className="text-lg font-bold text-text-primary mb-2 flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-text-muted" /> Recently Viewed
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {recentlyViewed.slice(0, 5).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating side nav – hidden on mobile, visible on desktop only */}
      <div className="hidden md:block">
        <AnimatePresence>
          {showRightNav && (
            <motion.div
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="fixed right-4 top-1/3 transform -translate-y-1/2 z-50 flex flex-col gap-2"
            >
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.1, x: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTabClick(tab.id)}
                  style={{
                    backgroundColor: activeTab === tab.id ? '#F97519' : '#ffffff',
                    color: activeTab === tab.id ? '#ffffff' : '#111827',
                    borderColor: activeTab === tab.id ? '#F97519' : '#D1D5DB',
                  }}
                  className={`group relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    activeTab === tab.id
                      ? 'ring-2 ring-brand/30 shadow-md'
                      : 'hover:border-gray-400 hover:shadow'
                  }`}
                >
                  {tab.icon}
                  <span className="absolute right-12 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-gray-900 text-white text-xs px-2 py-1 rounded pointer-events-none">
                    {tab.label}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {showFilters && (
          <div className="fixed inset-0 bg-black/50 z-50 flex justify-end lg:hidden">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-80 bg-white h-full overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-border-light p-3 flex justify-between items-center z-10">
                <h2 className="text-base font-semibold text-text-primary">Filters</h2>
                <button onClick={() => setShowFilters(false)} className="text-text-muted hover:text-text-primary">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-3">
                <FilterSidebar
                  searchParams={searchParams}
                  setSearchParams={setSearchParams}
                  isMobile
                  onClose={() => setShowFilters(false)}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .hero-carousel .swiper-button-prev,
        .hero-carousel .swiper-button-next,
        .hero-carousel .carousel-arrow,
        .hero-carousel .slick-arrow {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default AllProductsPage;