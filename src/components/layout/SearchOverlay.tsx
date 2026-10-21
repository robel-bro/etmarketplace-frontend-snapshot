import { useState, useEffect, useRef, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import { XMarkIcon, StarIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import api from '../../lib/axios';
import ProductCard from '../features/products/ProductCard';

interface SearchOverlayProps {
  initialQuery: string;          // starting search text
  onClose: () => void;          // called when user clicks X or presses Escape
}

const BRANDS = ['Apple', 'Samsung', 'Nike', 'Adidas', 'Sony', 'LG', 'Canon', 'Dell', 'HP', 'Lenovo'];

type FilterType = 'brand' | 'rating' | 'inStock' | 'freeShipping' | null;

const SearchOverlay = ({ initialQuery, onClose }: SearchOverlayProps) => {
  // ---------- local search state ----------
  const [query, setQuery] = useState(initialQuery || '');
  const [sort, setSort] = useState('relevance');
  const [rating, setRating] = useState(0);
  const [brand, setBrand] = useState('');
  const [inStock, setInStock] = useState(false);
  const [freeShipping, setFreeShipping] = useState(false);
  const [expandedFilter, setExpandedFilter] = useState<FilterType>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const { ref: loadMoreRef, inView } = useInView();

  // Focus input when overlay opens
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Debounced fetch when query or filters change
  const fetchProducts = useCallback(async (pageNum = 1) => {
    if (!query.trim()) return { data: [], hasMore: false };
    const limit = 20;
    const offset = (pageNum - 1) * limit;
    const params = new URLSearchParams();
    params.append('search', query);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    if (sort !== 'relevance') params.append('sort', sort);
    if (rating) params.append('rating', rating.toString());
    if (brand) params.append('brand', brand);
    if (inStock) params.append('in_stock', 'true');
    if (freeShipping) params.append('free_shipping', 'true');

    const res = await api.get(`/products?${params.toString()}`);
    const products = res.data.data || res.data || [];
    return { data: products, hasMore: products.length === limit };
  }, [query, sort, rating, brand, inStock, freeShipping]);

  // Load first page when query/filters change
  useEffect(() => {
    if (!query.trim()) {
      setAllProducts([]);
      setHasMore(false);
      return;
    }
    setLoadingInitial(true);
    setPage(1);
    fetchProducts(1).then(({ data, hasMore }) => {
      setAllProducts(data);
      setHasMore(hasMore);
      setLoadingInitial(false);
    });
  }, [query, sort, rating, brand, inStock, freeShipping, fetchProducts]);

  // Infinite scroll
  useEffect(() => {
    if (inView && hasMore && !loadingMore && query.trim()) {
      setLoadingMore(true);
      const nextPage = page + 1;
      fetchProducts(nextPage).then(({ data, hasMore: more }) => {
        setAllProducts(prev => [...prev, ...data]);
        setPage(nextPage);
        setHasMore(more);
        setLoadingMore(false);
      });
    }
  }, [inView, hasMore, loadingMore, query, page, fetchProducts]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-white flex flex-col"
    >
      {/* Top bar: close button + search input */}
      <div className="border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100"
          aria-label="Close search"
        >
          <XMarkIcon className="w-5 h-5 text-gray-600" />
        </button>
        <form onSubmit={(e) => e.preventDefault()} className="flex-1">
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full py-2.5 pl-5 pr-12 text-sm border-2 border-gray-200 rounded-full focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
            />
            <button
              type="submit"
              className="absolute right-1.5 p-1.5 bg-orange-500 text-white rounded-full shadow-sm hover:bg-orange-600 transition-colors"
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Filter bubbles – always visible */}
      <div className="border-b border-gray-100 px-4 py-2 flex flex-wrap items-center gap-2">
        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-1.5 rounded-full text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-500)] transition"
        >
          <option value="relevance">Sort: Relevance</option>
          <option value="price_asc">Price: Low–High</option>
          <option value="price_desc">Price: High–Low</option>
          <option value="newest">Newest First</option>
          <option value="rating">Top Rated</option>
        </select>

        {/* Brand */}
        <button
          onClick={() => setExpandedFilter(expandedFilter === 'brand' ? null : 'brand')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
            expandedFilter === 'brand'
              ? 'bg-[var(--color-orange-500)] text-white shadow-sm'
              : brand
              ? 'bg-[var(--color-orange-50)] text-[var(--color-orange-600)] border border-[var(--color-orange-300)]'
              : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
          }`}
        >
          Brand {brand ? `: ${brand}` : ''}
        </button>

        {/* Rating */}
        <button
          onClick={() => setExpandedFilter(expandedFilter === 'rating' ? null : 'rating')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 transition ${
            expandedFilter === 'rating'
              ? 'bg-[var(--color-orange-500)] text-white shadow-sm'
              : rating > 0
              ? 'bg-[var(--color-orange-50)] text-[var(--color-orange-600)] border border-[var(--color-orange-300)]'
              : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
          }`}
        >
          <StarIcon className="w-3.5 h-3.5" />
          {rating > 0 ? `${rating}★ & Up` : 'Rating'}
        </button>

        {/* In Stock */}
        <button
          onClick={() => setInStock(!inStock)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
            inStock
              ? 'bg-[var(--color-orange-500)] text-white shadow-sm'
              : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
          }`}
        >
          In Stock
        </button>

        {/* Free Shipping */}
        <button
          onClick={() => setFreeShipping(!freeShipping)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
            freeShipping
              ? 'bg-[var(--color-orange-500)] text-white shadow-sm'
              : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
          }`}
        >
          Free Shipping
        </button>
      </div>

      {/* Expanded filter options */}
      {expandedFilter === 'brand' && (
        <div className="px-4 py-2 border-b border-gray-100 flex flex-wrap gap-2">
          {BRANDS.map((b) => (
            <button
              key={b}
              onClick={() => { setBrand(brand === b ? '' : b); setExpandedFilter(null); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                brand === b
                  ? 'bg-[var(--color-orange-500)] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      )}
      {expandedFilter === 'rating' && (
        <div className="px-4 py-2 border-b border-gray-100 flex flex-wrap gap-2">
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              onClick={() => { setRating(rating === star ? 0 : star); setExpandedFilter(null); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 transition ${
                rating === star
                  ? 'bg-[var(--color-orange-500)] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <StarIcon className="w-3.5 h-3.5" />
              {star}★ {star < 5 ? '& Up' : ''}
            </button>
          ))}
        </div>
      )}

      {/* Product area – scrollable, 5 columns on large screens */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loadingInitial && (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-[var(--color-orange-500)] rounded-full animate-spin" />
          </div>
        )}

        {!loadingInitial && query.trim().length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Start typing to search products...
          </div>
        )}

        {!loadingInitial && query.trim().length > 0 && allProducts.length === 0 && (
          <div className="text-center py-10 text-gray-500 text-sm">
            No products found for "{query}".
          </div>
        )}

        {allProducts.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {allProducts.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {hasMore && (
              <div ref={loadMoreRef} className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-[var(--color-orange-500)] rounded-full animate-spin" />
              </div>
            )}
            {!hasMore && allProducts.length > 0 && (
              <p className="text-center text-gray-400 text-xs py-4">All products loaded</p>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default SearchOverlay;