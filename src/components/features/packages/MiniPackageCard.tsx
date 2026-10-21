import { motion } from 'framer-motion';
import { ShoppingCart, Star, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

interface MiniPackageCardProps {
  id: number;
  name: string;
  image: string;
  price: number | string;
  originalPrice?: number | string;
  itemsCount: number;
  vendor: string;
  rating?: number;
}

const MiniPackageCard = ({
  id,
  name,
  image,
  price,
  originalPrice,
  itemsCount,
  vendor,
  rating = 4.5,
}: MiniPackageCardProps) => {
  const [imgError, setImgError] = useState(false);
  const numericPrice = Number(price);
  const numericOriginalPrice = originalPrice ? Number(originalPrice) : undefined;
  const discount = numericOriginalPrice && numericOriginalPrice > numericPrice
    ? Math.round(((numericOriginalPrice - numericPrice) / numericOriginalPrice) * 100)
    : 0;
  const imageUrl = imgError || !image ? 'https://via.placeholder.com/300?text=No+Image' : image;

  return (
    <Link to={`/package/${id}`} className="block group">
      <motion.div
        whileHover={{ y: -3 }}
        className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden border border-gray-200"
      >
        {/* Image – increased height for better proportions */}
        <div className="relative h-52 bg-gray-100 overflow-hidden">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
          {discount > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              -{discount}%
            </div>
          )}
        </div>

        <div className="p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 truncate max-w-[100px]">{vendor}</span>
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-semibold text-gray-700">{rating}</span>
            </div>
          </div>

          <h3 className="font-semibold text-gray-800 line-clamp-2 text-sm leading-tight mb-1.5">
            {name}
          </h3>

          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-base font-bold text-red-600">ETB {numericPrice.toFixed(2)}</span>
            {numericOriginalPrice && (
              <span className="text-xs text-gray-400 line-through">ETB {numericOriginalPrice.toFixed(2)}</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Package className="w-3 h-3" /> {itemsCount} items
            </span>
            <button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-semibold px-3 py-1 rounded-full transition shadow-sm">
              <ShoppingCart className="w-3 h-3 inline mr-1" /> Add
            </button>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default MiniPackageCard;