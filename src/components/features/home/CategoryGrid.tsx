import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import api from '../../../lib/axios';

const CategoryGrid = () => {
  const { data: categories, isLoading, error } = useQuery(
    'categories',
    () => api.get('/categories').then(res => res.data),
    {
      staleTime: 0,            // always fetch fresh data
      refetchOnMount: true,    // refetch every time the component appears
    }
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-sm">Failed to load categories.</div>;
  }

  const topCategories = categories?.filter((cat: any) => !cat.parent_id) || [];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 text-center">
      {topCategories.map((cat: any, index: number) => (
        <motion.div
          key={cat.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
          whileHover={{ y: -3 }}
          className="flex flex-col items-center"
        >
          <Link to={`/category/${cat.id}`} className="group">
            <div className="relative w-20 h-20 lg:w-24 lg:h-24 mx-auto rounded-full overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 bg-gray-100">
              {cat.image_url ? (
                <img
                  src={cat.image_url}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                  {cat.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-full" />
            </div>
            <h3 className="mt-2 text-xs md:text-sm font-medium text-gray-800 group-hover:text-[var(--color-orange-500)] transition line-clamp-1">
              {cat.name}
            </h3>
            <p className="text-[11px] text-gray-500">{cat.product_count || 0} items</p>
          </Link>
        </motion.div>
      ))}
    </div>
  );
};

export default CategoryGrid;