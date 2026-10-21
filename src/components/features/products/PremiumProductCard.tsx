import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Building2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../../../hooks/useCart';
import { useWishlist } from '../../../hooks/useWishlist';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

interface PremiumProductCardProps {
  product: any; // Replace with your actual Product type – expected to include vendor object
}

const PremiumProductCard = ({ product }: PremiumProductCardProps) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const wishlisted = isInWishlist(product.id);

  // ✅ Use the discounted effective price (cheapest variant after discount)
  const displayPrice = product.effective_price || product.price || 0;

  // Discount badge – prefer product.discount (percentage), else compute
  const discount =
    product.discount > 0
      ? product.discount
      : product.original_price && product.price < product.original_price
      ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
      : 0;

  // ✅ Free delivery badge: true when buyer pays nothing
  const freeDelivery = product.free_delivery || false;
  const deliveryLabel = product.delivery_label || 'Free shipping';

  // Fallback values
  const rating = product.rating || 4.5;
  const reviewCount = product.reviews_count || 0;
  const orders = product.sold_count || 0;

  const vendor = product.vendor || {};
  const membershipTier = vendor.membership_tier || 'free';
  const tierBadge = (() => {
    switch (membershipTier) {
      case 'platinum': return { label: 'Platinum', color: 'bg-purple-600' };
      case 'gold': return { label: 'Gold', color: 'bg-yellow-500 text-black' };
      case 'silver': return { label: 'Silver', color: 'bg-gray-500' };
      default: return null;
    }
  })();
  const isBulkSupplier = vendor.is_bulk_supplier === true;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (wishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer group border border-gray-200"
    >
      {/* Product Image */}
      <div className="relative overflow-hidden bg-gray-100 aspect-square">
        <img
          src={product.images?.[0] || '/placeholder.jpg'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm z-10">
            -{discount}%
          </div>
        )}
        {/* Badges on top-right */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
          {tierBadge && (
            <span className={`${tierBadge.color} text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow`}>
              {tierBadge.label}
            </span>
          )}
          {isBulkSupplier && (
            <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
              <Building2 className="w-3 h-3" /> Company
            </span>
          )}
        </div>
        {/* Wishlist icon */}
        <button
          onClick={handleWishlist}
          className="absolute top-2 left-2 bg-white/80 rounded-full p-1.5 shadow-sm z-10 hover:bg-white transition"
        >
          {wishlisted ? (
            <HeartSolid className="w-4 h-4 text-red-500" />
          ) : (
            <HeartOutline className="w-4 h-4 text-gray-600" />
          )}
        </button>
        {/* Cart icon on hover */}
        <div className="absolute bottom-2 right-2 bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg z-10">
          <ShoppingCart
            className="w-5 h-5 text-gray-700 hover:text-primary-600"
            onClick={handleAddToCart}
          />
        </div>
      </div>

      {/* Product Info */}
      <div className="p-3">
        {/* Title */}
        <h3 className="text-sm text-gray-800 mb-2 line-clamp-2 h-10 group-hover:text-primary-600 transition-colors">
          {product.title}
        </h3>

        {/* Price – uses effective_price (after all discounts) */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl font-semibold text-primary-600">
            ETB {displayPrice.toLocaleString()}
          </span>
          {product.original_price && product.original_price > displayPrice && (
            <span className="text-sm text-gray-400 line-through">
              ETB {product.original_price}
            </span>
          )}
        </div>

        {/* Rating & Orders */}
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${
                    star <= Math.floor(rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="ml-1">({reviewCount})</span>
          </div>
          <span className="text-gray-500">{orders.toLocaleString()} sold</span>
        </div>

        {/* Vendor line */}
        {vendor.business_name && (
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span className="truncate max-w-[70%]">{vendor.business_name}</span>
            {vendor.rating && (
              <span className="flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                {Number(vendor.rating).toFixed(1)}
              </span>
            )}
          </div>
        )}

        {/* ✅ Free Delivery Badge (using free_delivery + delivery_label) */}
        {freeDelivery && (
          <div className="mt-2 inline-block">
            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
              {deliveryLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PremiumProductCard;