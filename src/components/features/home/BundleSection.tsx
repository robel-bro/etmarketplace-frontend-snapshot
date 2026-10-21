import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, Star, ChevronRight, Heart } from 'lucide-react';

interface BundlePackage {
  id: number;
  name: string;
  description: string;
  images: string[];
  price: number | string;
  originalPrice?: number | string;
  itemsCount?: number;
  vendor?: string | { id: number; business_name: string };
  isFlashSale?: boolean;
  flashSaleEndsAt?: string;
  isSuperDeal?: boolean;
  superDealEndsAt?: string;
  rating?: number;
  reviewsCount?: number;
  soldCount?: number;
}

interface BundleSectionProps {
  packages: BundlePackage[];
  isLoading?: boolean;
}

const BundleSection = ({ packages, isLoading }: BundleSectionProps) => {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <section className="mt-12 mb-8 w-full max-w-[1280px] mx-auto px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-100 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[400px] bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!packages || packages.length === 0) {
    return null;
  }

  const calculateDiscount = (price: number, originalPrice?: number) => {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  const toNumber = (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const getVendorName = (vendor: any): string => {
    if (!vendor) return '';
    if (typeof vendor === 'string') return vendor;
    return vendor.business_name || '';
  };

  return (
    <section className="mt-12 mb-8 w-full max-w-[1280px] mx-auto px-4">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8 h-[60px]">
        <div className="w-full max-w-[600px]">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 h-[36px] leading-[36px]">
            Bundle Packages
          </h2>
          <p className="text-sm text-gray-500 mt-1 h-[20px] leading-[20px]">
            Curated collections of premium products
          </p>
        </div>
        <Link
          to="/packages"
          className="hidden md:flex items-center gap-1 text-gray-900 hover:text-gray-600 text-sm font-medium transition-colors h-[36px] px-4"
        >
          View all
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {packages.slice(0, 4).map((pkg) => {
          const numericPrice = toNumber(pkg.price);
          const numericOriginalPrice = pkg.originalPrice ? toNumber(pkg.originalPrice) : undefined;
          const discount = calculateDiscount(numericPrice, numericOriginalPrice);
          const isHovered = hoveredId === pkg.id;
          const mainImage = pkg.images?.[0] || '';
          const hasMultipleImages = pkg.images && pkg.images.length > 1;
          const vendorName = getVendorName(pkg.vendor);

          return (
            <Link
              key={pkg.id}
              to={`/packages/${pkg.id}`}
              className="group relative bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden w-full h-full min-h-[480px]"
              onMouseEnter={() => setHoveredId(pkg.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Special Badges */}
              <div className="absolute top-3 left-3 z-10 flex gap-2 h-[28px]">
                {pkg.isFlashSale && (
                  <div className="bg-black text-white px-2.5 py-1 rounded text-xs font-medium h-[28px] flex items-center whitespace-nowrap">
                    Flash Sale
                  </div>
                )}
                {pkg.isSuperDeal && !pkg.isFlashSale && (
                  <div className="bg-black text-white px-2.5 py-1 rounded text-xs font-medium h-[28px] flex items-center whitespace-nowrap">
                    Super Deal
                  </div>
                )}
                {discount > 0 && (
                  <div className="bg-gray-900 text-white px-2.5 py-1 rounded text-xs font-medium h-[28px] flex items-center whitespace-nowrap">
                    -{discount}%
                  </div>
                )}
              </div>

              {/* Wishlist Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  // Add to wishlist logic
                }}
                className="absolute top-3 right-3 z-10 bg-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-gray-200 hover:border-gray-900 w-[36px] h-[36px] flex items-center justify-center"
              >
                <Heart className="w-4 h-4 text-gray-600" />
              </button>

              {/* Image Container */}
              <div className="relative w-full h-[240px] bg-gray-50 overflow-hidden">
                {mainImage ? (
                  <img
                    src={isHovered && hasMultipleImages ? pkg.images[1] : mainImage}
                    alt={pkg.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-gray-300" />
                  </div>
                )}

                {/* Image Counter */}
                {hasMultipleImages && (
                  <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-xs h-[24px] flex items-center min-w-[60px] justify-center">
                    {pkg.images.length} items
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5 w-full h-[240px] flex flex-col">
                {/* Vendor */}
                {vendorName && (
                  <div className="text-xs text-gray-500 mb-2 h-[16px] leading-[16px] truncate">
                    {vendorName}
                  </div>
                )}

                {/* Title */}
                <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2 line-clamp-2 h-[48px] overflow-hidden">
                  {pkg.name}
                </h3>

                {/* Description */}
                {pkg.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2 h-[40px] overflow-hidden">
                    {pkg.description}
                  </p>
                )}

                {/* Stats Row */}
                <div className="flex items-center gap-4 mb-4 text-xs text-gray-500 h-[20px]">
                  {pkg.itemsCount && (
                    <div className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" />
                      <span className="whitespace-nowrap">{pkg.itemsCount} items</span>
                    </div>
                  )}
                  {pkg.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-gray-900 text-gray-900" />
                      <span className="font-medium text-gray-900">{pkg.rating}</span>
                      {pkg.reviewsCount && (
                        <span className="text-gray-400">({pkg.reviewsCount})</span>
                      )}
                    </div>
                  )}
                  {pkg.soldCount && (
                    <div className="text-gray-400 whitespace-nowrap">
                      {pkg.soldCount.toLocaleString()} sold
                    </div>
                  )}
                </div>

                {/* Price and CTA */}
                <div className="flex items-end justify-between pt-4 border-t border-gray-100 mt-auto h-[60px]">
                  <div className="flex flex-col justify-end h-full">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl md:text-3xl font-semibold text-gray-900 leading-none">
                        ${numericPrice.toFixed(2)}
                      </span>
                      {numericOriginalPrice && numericOriginalPrice > numericPrice && (
                        <span className="text-sm text-gray-400 line-through leading-none">
                          ${numericOriginalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      // Add to cart logic
                    }}
                    className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors h-[40px] whitespace-nowrap"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to cart</span>
                  </button>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Mobile View All Button */}
      <div className="mt-6 text-center md:hidden h-[40px] flex items-center justify-center">
        <Link
          to="/packages"
          className="inline-flex items-center gap-1 text-gray-900 hover:text-gray-600 text-sm font-medium transition-colors h-[36px] px-4"
        >
          View all packages
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
};

export default BundleSection;
