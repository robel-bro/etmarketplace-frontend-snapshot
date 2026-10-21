import { useState } from 'react';
import { useQuery } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FunnelIcon } from '@heroicons/react/24/outline';
import api from '../lib/axios';
import PackageLinkWrapper from '../components/features/packages/PackageLinkWrapper';
import FilterSidebar from '../components/features/products/FilterSidebar';

const PackagesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const selectedCategory = searchParams.get('category') || '';
  const priceMin = searchParams.get('price_min') ? Number(searchParams.get('price_min')) : undefined;
  const priceMax = searchParams.get('price_max') ? Number(searchParams.get('price_max')) : undefined;
  const sortBy = searchParams.get('sort') || 'relevance';

  const {
    data: packages,
    isLoading,
    error,
  } = useQuery(
    ['publicPackages', selectedCategory, priceMin, priceMax, sortBy],
    async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);   // ★ use 'category', not 'category_id'
      if (priceMin !== undefined) params.append('price_min', priceMin.toString());
      if (priceMax !== undefined) params.append('price_max', priceMax.toString());
      if (sortBy !== 'relevance') {
        if (sortBy === 'price_asc') params.append('sort', 'price_asc');
        else if (sortBy === 'price_desc') params.append('sort', 'price_desc');
        else if (sortBy === 'newest') params.append('sort', 'newest');
        else params.append('sort', sortBy);
      }
      const res = await api.get(`/packages?${params.toString()}`);
      let data = res.data;
      if (data?.data && Array.isArray(data.data)) data = data.data;
      else if (!Array.isArray(data)) data = [];
      return data;
    },
    { staleTime: 0 }
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="container-marketplace py-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Mobile filter button */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-sm)] border border-border-light text-sm font-medium text-text-secondary hover:text-brand transition-colors bg-white shadow-card"
            >
              <FunnelIcon className="w-4 h-4" /> Filters
            </button>
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-[var(--radius-md)] shadow-elevated bg-white mt-2"
                >
                  <FilterSidebar
                    searchParams={searchParams}
                    setSearchParams={setSearchParams}
                    isMobile
                    onClose={() => setShowFilters(false)}
                    type="package"        // ★ package context
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-24 self-start">
            <FilterSidebar
              searchParams={searchParams}
              setSearchParams={setSearchParams}
              type="package"           // ★ package context
            />
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <h1 className="text-product-title font-semibold text-text-primary mb-1">
              Bundle Packages
            </h1>
            <p className="text-body-sm text-text-muted mb-4">
              Curated bundles with everything you need
            </p>

            {/* Sort bar */}
            <div className="flex items-center justify-between mb-4 px-3 py-2 bg-white rounded-[var(--radius-sm)] border border-border-light shadow-card">
              <span className="text-sm text-text-secondary">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('sort', e.target.value);
                  setSearchParams(newParams);
                }}
                className="border-0 bg-transparent text-sm font-medium focus:ring-0 text-text-primary cursor-pointer"
              >
                <option value="relevance">Relevance</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest First</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-gray-200 rounded-2xl h-64 animate-pulse" />
                ))}
              </div>
            )}

            {/* Error state */}
            {error && !isLoading && (
              <div className="text-center py-12 text-red-500">Failed to load packages. Please try again later.</div>
            )}

            {/* Empty state */}
            {!isLoading && !error && packages?.length === 0 && (
              <div className="text-center py-12 text-text-muted">No packages found. Check back later!</div>
            )}

            {/* Packages grid – 4 per row on xl screens */}
            {!isLoading && packages?.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {packages.map((pkg: any) => (
                  <PackageLinkWrapper key={pkg.id} package={pkg} compact={true} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackagesPage;