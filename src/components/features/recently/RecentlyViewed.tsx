import { useRecentlyViewed } from '../../../hooks/useRecentlyViewed';
import ProductCard from '../products/ProductCard';

const RecentlyViewed = () => {
  const { products, loading } = useRecentlyViewed();

  if (loading) return <div className="animate-pulse h-40 bg-gray-100 rounded-lg" />;
  if (!products || products.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Recently Viewed</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewed;