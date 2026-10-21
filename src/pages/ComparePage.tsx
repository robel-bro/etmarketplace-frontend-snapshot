import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { XMarkIcon, ArrowLeftIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useComparison } from '../contexts/ComparisonContext';
import { useCart } from '../hooks/useCart';
import api from '../lib/axios';

const ComparePage = () => {
  const { items, removeItem } = useComparison();
  const { addToCart } = useCart();

  const { data: products, isLoading } = useQuery(
    ['compare', items],
    () => Promise.all(items.map(item => api.get(`/products/${item.productId}`).then(res => res.data))),
    { enabled: items.length > 0 }
  );

  if (items.length < 2) {
    return (
      <div className="bg-[#F5F5F5] py-20">
        <div className="w-full max-w-md mx-auto bg-white border border-border-light rounded-[var(--radius-md)] shadow-card p-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">Not enough products to compare</h1>
          <p className="text-text-secondary mb-6">
            {items.length === 0
              ? 'Add items to compare them side by side.'
              : 'Please add at least 2 products to start comparing.'}
          </p>
          <Link to="/all-products" className="btn-cta inline-flex items-center gap-2 px-6 py-3">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-[#F5F5F5] py-20">
        <div className="text-center text-text-muted text-sm">Loading comparison...</div>
      </div>
    );
  }

  const safeProducts = products || [];

  // Merge variant_attributes from compare state into product data
  const enrichedProducts = safeProducts.map((p, idx) => ({
    ...p,
    variant_attributes: items[idx]?.variant || {},
  }));

  const allAttrKeys = Array.from(
    new Set(safeProducts.flatMap(p => Object.keys(p?.product_attributes || {})))
  );

  return (
    <div className="bg-[#F5F5F5]">
      <div className="container-marketplace py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-product-title font-semibold text-text-primary">
            Compare Products
            <span className="text-text-muted text-sm font-normal ml-2">({items.length})</span>
          </h1>
          <button
            onClick={() => items.forEach(i => removeItem(i.productId))}
            className="text-sm font-medium text-red-500 hover:text-red-600 flex items-center gap-1.5 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
            Clear All
          </button>
        </div>

        {/* Product cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-6">
          {enrichedProducts.map(product => {
            const variantAttrs = product.variant_attributes || {};
            const hasVariants = Object.keys(variantAttrs).length > 0;
            return (
              <div key={product.id} className="relative group">
                <button
                  onClick={() => removeItem(product.id)}
                  className="absolute top-2 right-2 z-20 bg-white/90 hover:bg-white text-text-muted hover:text-red-500 p-1 rounded-full shadow-card opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
                <div className="card-product p-3">
                  <Link to={`/product/${product.id}`}>
                    <img
                      src={product.image_urls?.[0] || '/placeholder.jpg'}
                      alt={product.title}
                      className="w-full h-40 object-cover rounded-[var(--radius-sm)] mb-2"
                    />
                    <h3 className="text-sm font-medium line-clamp-2 text-text-primary">{product.title}</h3>
                    {/* Variant badges */}
                    {hasVariants && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(variantAttrs).map(([key, val]) => (
                          <span key={key} className="px-2 py-0.5 text-xs rounded-md bg-gray-100 text-gray-700 border border-gray-200">
                            {key}: {val}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-base font-bold text-text-primary">
                        ETB {Number(product.effective_price || product.price).toLocaleString()}
                      </span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          addToCart(
                            { id: product.id, title: product.title, price: Number(product.effective_price || product.price), image_urls: product.image_urls, variant: variantAttrs },
                            1
                          );
                        }}
                        className="p-1.5 bg-brand text-white rounded-full hover:bg-brand-hover transition-colors"
                        title="Add to Cart"
                      >
                        <ShoppingCartIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison table */}
        <div className="card-product overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-hover">
                  <th className="p-3 text-left font-semibold text-text-primary w-48">Feature</th>
                  {enrichedProducts.map(product => (
                    <th key={product.id} className="p-3 text-left font-semibold text-text-primary min-w-[180px]">
                      {product.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border-light">
                  <td className="p-3 text-text-secondary font-medium">Price</td>
                  {enrichedProducts.map(product => (
                    <td key={product.id} className="p-3 font-bold text-text-primary">
                      ETB {Number(product.effective_price || product.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-border-light">
                  <td className="p-3 text-text-secondary font-medium">Brand</td>
                  {enrichedProducts.map(product => (
                    <td key={product.id} className="p-3 text-text-primary">
                      {product.product_attributes?.brand || '—'}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-border-light">
                  <td className="p-3 text-text-secondary font-medium">Category</td>
                  {enrichedProducts.map(product => (
                    <td key={product.id} className="p-3 text-text-primary">
                      {product.category?.name || '—'}
                    </td>
                  ))}
                </tr>
                {allAttrKeys.filter(key => key !== 'brand').map(key => (
                  <tr key={key} className="border-t border-border-light">
                    <td className="p-3 text-text-secondary font-medium capitalize">
                      {key.replace(/_/g, ' ')}
                    </td>
                    {enrichedProducts.map(product => (
                      <td key={product.id} className="p-3 text-text-primary">
                        {product.product_attributes?.[key] || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-border-light">
                  <td className="p-3 text-text-secondary font-medium">Description</td>
                  {enrichedProducts.map(product => (
                    <td key={product.id} className="p-3 text-text-primary text-xs leading-relaxed">
                      {product.description?.slice(0, 120) || '—'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center">
          <Link
            to="/all-products"
            className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-brand transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ComparePage;