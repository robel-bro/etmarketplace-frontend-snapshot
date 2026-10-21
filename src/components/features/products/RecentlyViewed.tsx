import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useRecentlyViewed } from '../../../hooks/useRecentlyViewed';
import PremiumProductCard from './PremiumProductCard'; // changed import

const RecentlyViewed = () => {
  const { products, loading } = useRecentlyViewed();

  if (loading) return <div className="animate-pulse h-40 bg-gray-100 rounded-lg" />;
  if (!products || products.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>🕒</span> Recently Viewed
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products.slice(0, 5).map(product => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <PremiumProductCard product={product} />
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewed;