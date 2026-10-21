// et_marketplace_frontend/src/components/features/search/SearchFilterBar.tsx

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ChevronDown } from 'lucide-react';
import api from '../../../lib/axios';

interface Props {
  filters?: any;
}

// Helper to normalise any array that might contain objects like {value, count} to string[]
const normalizeList = (list: any[]): string[] => {
  return list
    .map((item: any) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') return item.value || item.name || item.label || '';
      return '';
    })
    .filter(Boolean);
};

// Display‑only helper – replaces any occurrence of "Shipping" with "Delivery"
const displayDelivery = (text: string) => text.replace(/Shipping/gi, 'Delivery');

const SearchFilterBar = ({ filters = {} }: Props) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Receive dominant category ID from SearchPage via custom event
  const [dominantCategoryId, setDominantCategoryId] = useState<number | undefined>(
    (window as any).__dominantCategoryId
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setDominantCategoryId(detail);
    };
    window.addEventListener('dominantCategoryChanged', handler);
    return () => window.removeEventListener('dominantCategoryChanged', handler);
  }, []);

  const searchQuery = searchParams.get('q') || '';
  const explicitCategory = searchParams.get('category') || undefined;
  const effectiveCategoryId = explicitCategory || dominantCategoryId;

  // Fetch contextual filter options (ratings, delivery, brands, etc.)
  const { data: fetchedFilters } = useQuery(
    ['searchFilterBarOptions', searchQuery, effectiveCategoryId, searchParams.toString()],
    async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (effectiveCategoryId) params.set('category', String(effectiveCategoryId));
      for (const [key, value] of searchParams.entries()) {
        if (!['q', 'category', 'page', 'sort', 'limit', 'offset'].includes(key)) {
          params.append(key, value);
        }
      }
      const res = await api.get('/products/filter_options', { params });
      return res.data;
    },
    {
      staleTime: 2 * 60 * 1000,
      enabled: !!searchQuery || !!effectiveCategoryId,
    }
  );

  const mergedFilters = useMemo(() => {
    const rawBrands = filters?.brands || fetchedFilters?.brands || [];
    const rawCategories = filters?.categories || fetchedFilters?.categories || [];
    const rawRatings = fetchedFilters?.ratings || filters?.ratings || [5, 4, 3, 2, 1];
    const rawDelivery = fetchedFilters?.delivery_options || filters?.delivery_options || [];
    const rawAttributes = filters?.attributes || fetchedFilters?.attributes || {};

    const categories: { id: number; name: string }[] = rawCategories
      .map((c: any) => {
        if (typeof c === 'object' && c !== null) {
          return { id: c.id ?? 0, name: c.name || c.value || '' };
        }
        return null;
      })
      .filter(Boolean);

    const attributes: Record<string, string[]> = {};
    for (const [key, valArr] of Object.entries(rawAttributes)) {
      if (Array.isArray(valArr)) {
        attributes[key] = normalizeList(valArr as any[]);
      }
    }

    return {
      brands: normalizeList(rawBrands as any[]),
      categories,
      price_range: filters?.price_range || fetchedFilters?.price_range || { min: 0, max: 10000 },
      attributes,
      ratings: (rawRatings as any[]).map((r: any) => Number(r.value ?? r)).filter((r: number) => !isNaN(r)),
      delivery_options: normalizeList(rawDelivery as any[]),  // keep original for param matching
    };
  }, [filters, fetchedFilters]);

  const brands: string[] = mergedFilters.brands;
  const categories: { id: number; name: string }[] = mergedFilters.categories;
  const priceRange = mergedFilters.price_range;
  const attributes: Record<string, string[]> = mergedFilters.attributes;
  const ratings: number[] = mergedFilters.ratings;
  const deliveryOptions: string[] = mergedFilters.delivery_options;

  const selectedBrands = searchParams.getAll('brand');
  const selectedCategories = searchParams.getAll('category');
  const selectedRating = searchParams.get('rating') || '';
  const selectedDeliveries = searchParams.getAll('delivery');
  const priceMin = searchParams.get('price_min') || '';
  const priceMax = searchParams.get('price_max') || '';

  const toggleBrand = (brand: string) => {
    const newParams = new URLSearchParams(searchParams);
    const current = newParams.getAll('brand');
    if (current.includes(brand)) {
      newParams.delete('brand');
      current.filter(b => b !== brand).forEach(b => newParams.append('brand', b));
    } else {
      newParams.append('brand', brand);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const toggleCategory = (catId: number) => {
    const newParams = new URLSearchParams(searchParams);
    const current = newParams.getAll('category');
    if (current.includes(String(catId))) {
      newParams.delete('category');
      current.filter(id => id !== String(catId)).forEach(id => newParams.append('category', id));
    } else {
      newParams.append('category', String(catId));
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const setRating = (rating: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('rating');
    if (selectedRating !== rating) newParams.set('rating', rating);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const toggleDelivery = (option: string) => {
    const newParams = new URLSearchParams(searchParams);
    const current = newParams.getAll('delivery');
    if (current.includes(option)) {
      newParams.delete('delivery');
      current.filter(o => o !== option).forEach(o => newParams.append('delivery', o));
    } else {
      newParams.append('delivery', option);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const setPriceRange = (min: string, max: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (min) newParams.set('price_min', min);
    else newParams.delete('price_min');
    if (max) newParams.set('price_max', max);
    else newParams.delete('price_max');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const toggleAttribute = (key: string, val: string) => {
    const newParams = new URLSearchParams(searchParams);
    const current = newParams.getAll(key);
    if (current.includes(val)) {
      newParams.delete(key);
      current.filter(v => v !== val).forEach(v => newParams.append(key, v));
    } else {
      newParams.append(key, val);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const hasActiveFilters =
    selectedBrands.length > 0 ||
    selectedCategories.length > 0 ||
    !!selectedRating ||
    selectedDeliveries.length > 0 ||
    !!priceMin ||
    !!priceMax;

  // Context-aware filter buttons – only show if data exists
  const filterButtons = (
    <>
      {categories.length > 0 && (
        <button
          onClick={() => setActiveFilter(activeFilter === 'category' ? null : 'category')}
          className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-[13px] font-bold transition backdrop-blur-md border ${
            activeFilter === 'category' ? 'bg-white/70 text-gray-900 border-gray-300 shadow-sm' : 'bg-white/60 text-gray-900 border-gray-200 hover:bg-white/80'
          }`}
        >
          Category <ChevronDown className={`w-3 h-3 transition-transform ${activeFilter === 'category' ? 'rotate-180' : ''}`} />
        </button>
      )}
      {brands.length > 0 && (
        <button
          onClick={() => setActiveFilter(activeFilter === 'brand' ? null : 'brand')}
          className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-[13px] font-bold transition backdrop-blur-md border ${
            activeFilter === 'brand' ? 'bg-white/70 text-gray-900 border-gray-300 shadow-sm' : 'bg-white/60 text-gray-900 border-gray-200 hover:bg-white/80'
          }`}
        >
          Brand <ChevronDown className={`w-3 h-3 transition-transform ${activeFilter === 'brand' ? 'rotate-180' : ''}`} />
        </button>
      )}
      {ratings.length > 0 && (
        <button
          onClick={() => setActiveFilter(activeFilter === 'rating' ? null : 'rating')}
          className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-[13px] font-bold transition backdrop-blur-md border ${
            activeFilter === 'rating' ? 'bg-white/70 text-gray-900 border-gray-300 shadow-sm' : 'bg-white/60 text-gray-900 border-gray-200 hover:bg-white/80'
          }`}
        >
          Rating <ChevronDown className={`w-3 h-3 transition-transform ${activeFilter === 'rating' ? 'rotate-180' : ''}`} />
        </button>
      )}
      {/* Price always available */}
      <button
        onClick={() => setActiveFilter(activeFilter === 'price' ? null : 'price')}
        className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-[13px] font-bold transition backdrop-blur-md border ${
          activeFilter === 'price' ? 'bg-white/70 text-gray-900 border-gray-300 shadow-sm' : 'bg-white/60 text-gray-900 border-gray-200 hover:bg-white/80'
        }`}
      >
        Price <ChevronDown className={`w-3 h-3 transition-transform ${activeFilter === 'price' ? 'rotate-180' : ''}`} />
      </button>
      {deliveryOptions.length > 0 && (
        <button
          onClick={() => setActiveFilter(activeFilter === 'delivery' ? null : 'delivery')}
          className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-[13px] font-bold transition backdrop-blur-md border ${
            activeFilter === 'delivery' ? 'bg-white/70 text-gray-900 border-gray-300 shadow-sm' : 'bg-white/60 text-gray-900 border-gray-200 hover:bg-white/80'
          }`}
        >
          Delivery <ChevronDown className={`w-3 h-3 transition-transform ${activeFilter === 'delivery' ? 'rotate-180' : ''}`} />
        </button>
      )}
      {Object.entries(attributes)
        .filter(([, vals]) => vals.length > 0)
        .map(([key]) => {
          const isActive = activeFilter === `attr_${key}`;
          return (
            <button
              key={key}
              onClick={() => setActiveFilter(isActive ? null : `attr_${key}`)}
              className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-[13px] font-bold transition backdrop-blur-md border capitalize ${
                isActive ? 'bg-white/70 text-gray-900 border-gray-300 shadow-sm' : 'bg-white/60 text-gray-900 border-gray-200 hover:bg-white/80'
              }`}
            >
              {displayDelivery(key)} <ChevronDown className={`w-3 h-3 transition-transform ${isActive ? 'rotate-180' : ''}`} />
            </button>
          );
        })}
    </>
  );

  return (
    <div className="w-full">
      {/* Scrollbar hiding CSS */}
      <style>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
        {filterButtons}
        {hasActiveFilters && (
          <button
            onClick={() => {
              const newParams = new URLSearchParams();
              if (searchParams.get('q')) newParams.set('q', searchParams.get('q')!);
              newParams.set('page', '1');
              setSearchParams(newParams);
              setActiveFilter(null);
            }}
            className="text-[13px] font-bold text-gray-400 hover:text-gray-600 ml-2 whitespace-nowrap"
          >
            Clear all
          </button>
        )}
      </div>

      {activeFilter && (
        <div className="mt-2 py-2 px-3 bg-white/70 backdrop-blur-md rounded-lg border border-gray-100 transition-all max-h-64 overflow-y-auto">
          {activeFilter === 'category' && (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const sel = selectedCategories.includes(String(cat.id));
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`px-3 py-1 rounded text-[13px] min-w-[70px] transition ${
                      sel ? 'bg-white text-gray-900 font-semibold border border-gray-300 shadow-sm' : 'bg-white/50 text-gray-700 border border-gray-200 hover:bg-white/80'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          )}
          {activeFilter === 'brand' && (
            <div className="flex flex-wrap gap-2">
              {brands.map((brand, idx) => {
                const sel = selectedBrands.includes(brand);
                return (
                  <button
                    key={`${brand}-${idx}`}
                    onClick={() => toggleBrand(brand)}
                    className={`px-3 py-1 rounded text-[13px] min-w-[70px] transition ${
                      sel ? 'bg-white text-gray-900 font-semibold border border-gray-300 shadow-sm' : 'bg-white/50 text-gray-700 border border-gray-200 hover:bg-white/80'
                    }`}
                  >
                    {brand}
                  </button>
                );
              })}
            </div>
          )}
          {activeFilter === 'rating' && (
            <div className="flex flex-wrap gap-2">
              {ratings.map(r => (
                <button
                  key={r}
                  onClick={() => setRating(String(r))}
                  className={`px-3 py-1 rounded text-[13px] min-w-[70px] transition ${
                    selectedRating === String(r) ? 'bg-white text-gray-900 font-semibold border border-gray-300 shadow-sm' : 'bg-white/50 text-gray-700 border border-gray-200 hover:bg-white/80'
                  }`}
                >
                  {r}★ & Up
                </button>
              ))}
            </div>
          )}
          {activeFilter === 'price' && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={priceMin}
                onChange={(e) => setPriceRange(e.target.value, priceMax)}
                className="border rounded px-2 py-1 text-[13px] w-24"
              />
              <span className="text-gray-400">–</span>
              <input
                type="number"
                placeholder="Max"
                value={priceMax}
                onChange={(e) => setPriceRange(priceMin, e.target.value)}
                className="border rounded px-2 py-1 text-[13px] w-24"
              />
              <button onClick={() => setPriceRange('', '')} className="text-[13px] text-gray-500 hover:text-gray-700">
                Reset
              </button>
            </div>
          )}
          {activeFilter === 'delivery' && (
            <div className="flex flex-wrap gap-2">
              {deliveryOptions.map(option => (
                <button
                  key={option}
                  onClick={() => toggleDelivery(option)}
                  className={`px-3 py-1 rounded text-[13px] min-w-[100px] transition ${
                    selectedDeliveries.includes(option) ? 'bg-white text-gray-900 font-semibold border border-gray-300 shadow-sm' : 'bg-white/50 text-gray-700 border border-gray-200 hover:bg-white/80'
                  }`}
                >
                  {displayDelivery(option)}
                </button>
              ))}
            </div>
          )}
          {activeFilter?.startsWith('attr_') &&
            (() => {
              const key = activeFilter.replace('attr_', '');
              const values = attributes[key] || [];
              const selectedVals = searchParams.getAll(key);
              return (
                <div className="flex flex-wrap gap-2">
                  {values.map((val, idx) => (
                    <button
                      key={`${val}-${idx}`}
                      onClick={() => toggleAttribute(key, val)}
                      className={`px-3 py-1 rounded text-[13px] min-w-[60px] transition ${
                        selectedVals.includes(val) ? 'bg-white text-gray-900 font-semibold border border-gray-300 shadow-sm' : 'bg-white/50 text-gray-700 border border-gray-200 hover:bg-white/80'
                      }`}
                    >
                      {displayDelivery(val)}
                    </button>
                  ))}
                </div>
              );
            })()}
        </div>
      )}
    </div>
  );
};

export default SearchFilterBar;