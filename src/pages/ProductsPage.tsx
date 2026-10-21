import { useState } from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { FunnelIcon } from '@heroicons/react/24/outline';
import api from '../lib/axios';
import { PremiumProductCard } from '../components/features/products/PremiumProductCard';
import PriceSlider from '../components/common/PriceSlider';

const ProductsPage = () => {
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);

  const { data: products, isLoading } = useQuery(
    ['products', priceRange, sortBy],
    () => {
      const params = new URLSearchParams();
      params.append('price_min', priceRange[0]);
      params.append('price_max', priceRange[1]);
      params.append('sort', sortBy);
      return api.get(`/products?${params.toString()}`).then(res => res.data.data);
    }
  );

  return (
    <div className="px-4 md:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">All Products</h1>

      {/* Filters and Sort */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        {/* Mobile filter toggle */}
        <div className="lg:hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow"
          >
            <FunnelIcon className="w-5 h-5" /> Filters
          </button>
          {showFilters && (
            <div className="mt-4 p-4 bg-white rounded-lg shadow">
              <FilterContent priceRange={priceRange} setPriceRange={setPriceRange} />
            </div>
          )}
        </div>

        {/* Desktop filter sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="bg-white rounded-xl p-4 sticky top-24 shadow">
            <h3 className="font-bold text-lg mb-4">Filters</h3>
            <FilterContent priceRange={priceRange} setPriceRange={setPriceRange} />
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-4 bg-white rounded-xl p-3 shadow">
            <span className="text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border-0 bg-transparent font-medium focus:ring-0"
            >
              <option value="relevance">Relevance</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-3xl aspect-[3/4] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {products?.map(product => (
                <PremiumProductCard
                  key={product.id}
                  id={product.id}
                  image={product.image_urls?.[0] || product.images?.[0] || '/placeholder.jpg'}
                  title={product.title}
                  vendor={product.vendor?.business_name || product.shop_name || 'Unknown Vendor'}
                  price={product.price}
                  originalPrice={product.original_price}
                  rating={product.rating || 4.5}
                  reviews={product.reviews_count || 0}
                  isFlashSale={product.is_flash_sale}
                  flashSaleEndsAt={product.flash_sale_ends_at}
                  isSuperDeal={product.is_super_deal}
                  superDealEndsAt={product.super_deal_ends_at}
                />
              ))}
            </div>
          )}

          {products?.length === 0 && (
            <p className="text-center text-gray-500 py-12">No products found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const FilterContent = ({ priceRange, setPriceRange }) => (
  <div className="space-y-4">
    <div>
      <h4 className="font-medium mb-2">Price Range</h4>
      <PriceSlider min={0} max={10000} value={priceRange} onChange={setPriceRange} />
      <div className="flex justify-between text-sm text-gray-600 mt-2">
        <span>ETB {priceRange[0]}</span>
        <span>ETB {priceRange[1]}</span>
      </div>
    </div>
    <div>
      <h4 className="font-medium mb-2">Rating</h4>
      {[4, 3, 2, 1].map(star => (
        <label key={star} className="flex items-center gap-2">
          <input type="checkbox" className="rounded text-primary-600" />
          <span>{star}★ & up</span>
        </label>
      ))}
    </div>
    <button className="w-full bg-primary-600 text-white py-2 rounded-lg">Apply Filters</button>
  </div>
);

export default ProductsPage;