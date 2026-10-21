// et_marketplace_frontend/src/pages/SearchPage.tsx
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowRight, Sparkles, Building2, Zap, Star, Package } from 'lucide-react';
import api from '../lib/axios';
import ProductCard from '../components/features/products/ProductCard';
import PackageLinkWrapper from '../components/features/packages/PackageLinkWrapper';
import ActiveFilters from '../components/features/products/ActiveFilters';
import { expandSynonyms } from '../utils/searchSynonyms';

// ⚡ Simple debounce hook – reusable
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawQuery = searchParams.get('q') || '';
  const expandedQuery = expandSynonyms(rawQuery);

  const debouncedQuery = useDebounce(rawQuery, 300);

  const [allResults, setAllResults] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dominantCategory, setDominantCategory] = useState<{ id: number; name: string } | null>(null);
  const [suggestionCats, setSuggestionCats] = useState<any[]>([]);
  const [spellSuggestion, setSpellSuggestion] = useState<string | null>(null);

  const [sponsoredProducts, setSponsoredProducts] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  const filterParams = useFilterParams(searchParams);
  const [lastSearchedQuery, setLastSearchedQuery] = useState(debouncedQuery);

  const fetchResults = async (pageNum: number) => {
    const perPage = 28;
    const params = new URLSearchParams();
    params.set('q', debouncedQuery);
    params.set('page', pageNum.toString());
    params.set('per_page', perPage.toString());

    for (const [key, value] of searchParams.entries()) {
      if (key !== 'q' && key !== 'page' && key !== 'per_page' && key !== 'sort') {
        params.set(key, value);
      }
    }

    const res = await api.get('/api/v1/search', { params });

    const meta = res.data?.meta;
    setDominantCategory(meta?.dominant_category || null);
    setSpellSuggestion(meta?.suggestion || null);

    if (pageNum === 1) {
      setSponsoredProducts(meta?.sponsored || []);
      setFeaturedProducts(meta?.featured || []);
      // Future: setCompanies(res.data.companies || []);
    }

    if (meta?.dominant_category) {
      (window as any).__dominantCategoryId = meta.dominant_category.id;
      window.dispatchEvent(
        new CustomEvent('dominantCategoryChanged', { detail: meta.dominant_category.id })
      );
    } else {
      (window as any).__dominantCategoryId = undefined;
    }

    return res.data.data || [];
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const newResults = await fetchResults(nextPage);
    if (newResults.length === 0) {
      setHasMore(false);
    } else {
      setAllResults(prev => [...prev, ...newResults]);
      setPage(nextPage);
    }
    setLoadingMore(false);
  };

  useEffect(() => {
    if (!debouncedQuery) {
      setAllResults([]);
      setLoading(false);
      setSponsoredProducts([]);
      setFeaturedProducts([]);
      setCompanies([]);
      return;
    }
    const loadInitial = async () => {
      setPage(1);
      setLoading(true);
      setAllResults([]);
      setHasMore(true);
      setDominantCategory(null);
      const initialResults = await fetchResults(1);
      setAllResults(initialResults);
      setHasMore(initialResults.length === 28);
      setLoading(false);
      setLastSearchedQuery(debouncedQuery);
    };
    loadInitial();
  }, [debouncedQuery]);

  useEffect(() => {
    if (!debouncedQuery) return;
    if (debouncedQuery !== lastSearchedQuery) return;

    const load = async () => {
      setPage(1);
      setLoading(true);
      setAllResults([]);
      setHasMore(true);
      const initialResults = await fetchResults(1);
      setAllResults(initialResults);
      setHasMore(initialResults.length === 28);
      setLoading(false);
    };
    load();
  }, [filterParams]);

  useEffect(() => {
    if (!rawQuery) {
      setSuggestionCats([]);
      return;
    }
    if (!searchParams.get('category')) {
      api.get('/api/v1/suggestions', { params: { q: rawQuery } })
        .then(res => setSuggestionCats(res.data?.categories || []))
        .catch(() => setSuggestionCats([]));
    } else {
      setSuggestionCats([]);
    }
  }, [rawQuery, searchParams.get('category')]);

  const setCategoryParam = (catId: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (catId) {
      newParams.set('category', catId);
    } else {
      newParams.delete('category');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const activeCategory = searchParams.get('category') || '';

  const deals = allResults.filter(
    item => item.type === 'product' && (item.is_flash_sale || item.is_super_deal || item.is_hot_deal)
  ).slice(0, 10);

  const packages = allResults.filter(item => item.type === 'package').slice(0, 10);

  const excludedIds = useMemo(() => {
    const ids = new Set<number>();
    sponsoredProducts.forEach(p => ids.add(p.id));
    deals.forEach(p => ids.add(p.id));
    featuredProducts.forEach(p => ids.add(p.id));
    return ids;
  }, [sponsoredProducts, deals, featuredProducts]);

  const mainResults = useMemo(() => {
    return allResults.filter(item => !excludedIds.has(item.id));
  }, [allResults, excludedIds]);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <style>{`
        .filter-zone::-webkit-scrollbar { display: none; }
        .filter-zone { -ms-overflow-style: none; scrollbar-width: none; }
        .section-scroll::-webkit-scrollbar { height: 4px; }
        .section-scroll::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }
      `}</style>

      {rawQuery && (
        <div className="bg-white border-b border-border-light">
          <div className="container-marketplace py-3">
            <h1 className="text-product-title font-semibold text-text-primary">
              Results for "<span className="text-brand">{rawQuery}</span>"
              {expandedQuery !== rawQuery && (
                <span className="text-sm font-normal text-text-muted ml-2">
                  (including synonyms: {expandedQuery})
                </span>
              )}
            </h1>

            {(dominantCategory || suggestionCats.length > 0) && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-xs text-text-muted self-center mr-1">
                  {activeCategory ? 'Filtered by:' : 'Popular categories:'}
                </span>

                {!activeCategory && dominantCategory && (
                  <button
                    onClick={() => setCategoryParam(String(dominantCategory.id))}
                    className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-lg hover:bg-amber-100 transition-colors inline-flex items-center gap-1 border border-amber-200 shadow-sm"
                  >
                    <Sparkles className="w-3 h-3" />
                    {dominantCategory.name}
                  </button>
                )}

                {!activeCategory &&
                  suggestionCats
                    .filter(c => !dominantCategory || c.id !== dominantCategory.id)
                    .slice(0, 8)
                    .map((cat: any) => (
                      <button
                        key={cat.id}
                        onClick={() => setCategoryParam(String(cat.id))}
                        className="px-2.5 py-0.5 bg-brand-light text-brand text-xs rounded-lg hover:bg-brand/20 transition-colors border border-brand/20 shadow-sm"
                      >
                        {cat.name}
                      </button>
                    ))}

                {activeCategory && (
                  <button
                    onClick={() => setCategoryParam(null)}
                    className="px-2.5 py-0.5 bg-surface-hover text-text-muted text-xs rounded-lg hover:bg-gray-200 transition-colors border border-border-light shadow-sm"
                  >
                    ✕ Remove
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="container-marketplace py-4">
        <div className="filter-zone flex flex-nowrap md:flex-wrap gap-1.5 overflow-x-auto md:overflow-visible">
          <ActiveFilters searchParams={searchParams} setSearchParams={setSearchParams} />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="rounded-[var(--radius-md)] h-80 animate-pulse bg-gray-200" />
            ))}
          </div>
        ) : allResults.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-white rounded-[var(--radius-md)] shadow-card border border-border-light flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-text-muted" />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">Nothing found</h2>
              <p className="text-sm text-text-secondary mb-2 leading-relaxed">
                We couldn't find any products or packages matching "{rawQuery}".
              </p>

              {spellSuggestion && (
                <p className="text-sm text-text-secondary mb-4">
                  Did you mean{" "}
                  <button
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set('q', spellSuggestion);
                      newParams.set('page', '1');
                      setSearchParams(newParams);
                    }}
                    className="text-brand hover:underline font-medium"
                  >
                    "{spellSuggestion}"
                  </button>
                  ?
                </p>
              )}

              <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                Try a different spelling or browse our popular categories.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={() => window.location.href = '/all-products'} className="btn-cta inline-flex items-center gap-2 px-5 py-2.5 text-sm">
                  Browse Products <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => window.location.href = '/'} className="btn-secondary inline-flex items-center gap-2 px-5 py-2.5 text-sm">
                  Go to Home
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Sponsored Products Section */}
            {sponsoredProducts.length > 0 && (
              <div className="mt-4">
                <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-amber-500" /> Sponsored
                </h2>
                <div className="section-scroll flex space-x-3 overflow-x-auto pb-2">
                  {sponsoredProducts.map(item => (
                    <div key={`sponsored-${item.id}`} className="flex-shrink-0 w-48">
                      <ProductCard product={item} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Featured Products Section (future) */}
            {featuredProducts.length > 0 && (
              <div className="mt-4">
                <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-500" /> Featured
                </h2>
                <div className="section-scroll flex space-x-3 overflow-x-auto pb-2">
                  {featuredProducts.map(item => (
                    <div key={`featured-${item.id}`} className="flex-shrink-0 w-48">
                      <ProductCard product={{ ...item, price: item.effective_price ?? item.price }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deals Section – Brochure-style background */}
            {deals.length > 0 && (
              <div className="mt-4 bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 border border-orange-200 rounded-xl p-4 shadow-inner">
                <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-red-500" />
                  🔥 Hot Deals – Limited Time
                </h2>
                <div className="section-scroll flex space-x-3 overflow-x-auto pb-2">
                  {deals.map(item => (
                    <div key={`deal-${item.id}`} className="flex-shrink-0 w-48">
                      <ProductCard product={{ ...item, price: item.effective_price ?? item.price }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Packages Section */}
            {packages.length > 0 && (
              <div className="mt-4">
                <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-green-500" /> Packages
                </h2>
                <div className="section-scroll flex space-x-3 overflow-x-auto pb-2">
                  {packages.map(item => (
                    <div key={`package-${item.id}`} className="flex-shrink-0 w-48">
                      <PackageLinkWrapper
                        package={{
                          id: item.id,
                          name: item.title,
                          price: item.price,
                          original_price: item.original_price,
                          discount_type: item.discount_type,
                          discount_value: item.discount_value,
                          items_count: item.items_count,
                          status: item.status,
                          image_urls: item.image_urls,
                          vendor: item.vendor,
                          seller_pays_shipping: item.seller_pays_shipping,
                        }}
                        compact={true}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Product Grid – 5 items per row, equal heights */}
            {mainResults.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
                {mainResults.map((item, idx) => {
                  const normalizedProduct =
                    item.type === 'product'
                      ? { ...item, price: item.effective_price ?? item.price }
                      : item;

                  return (
                    <motion.div
                      key={`${item.type}-${item.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.01, duration: 0.2 }}
                      className="h-full"
                    >
                      {item.type === 'package' ? (
                        <div className="h-full">
                          <PackageLinkWrapper
                            package={{
                              id: item.id,
                              name: item.title,
                              price: item.price,
                              original_price: item.original_price,
                              discount_type: item.discount_type,
                              discount_value: item.discount_value,
                              items_count: item.items_count,
                              status: item.status,
                              image_urls: item.image_urls,
                              vendor: item.vendor,
                              seller_pays_shipping: item.seller_pays_shipping,
                            }}
                            compact={true}
                          />
                        </div>
                      ) : (
                        <div className="h-full">
                          <ProductCard product={normalizedProduct} />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {hasMore && (
              <div className="text-center mt-6">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="text-brand text-sm font-medium hover:underline focus:outline-none disabled:text-text-muted disabled:cursor-not-allowed"
                >
                  {loadingMore ? 'Loading…' : 'Load More →'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

function useFilterParams(params: URLSearchParams): string {
  const filterEntries: string[] = [];
  for (const [key, value] of params.entries()) {
    if (key === 'q') continue;
    filterEntries.push(`${key}=${value}`);
  }
  return filterEntries.join('&');
}

export default SearchPage;