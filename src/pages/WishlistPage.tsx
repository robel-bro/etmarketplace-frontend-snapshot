import { useWishlist } from '../hooks/useWishlist';
import { useCart } from '../hooks/useCart';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';

const formatPrice = (value: number) =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getItemImage = (item: any): string => {
  const img = item.image_urls?.[0] || item.image_url || '';
  return img || 'https://placehold.co/300x300?text=No+Image';
};

const WishlistPage = () => {
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (!wishlist || !wishlist.items || wishlist.items.length === 0) {
    return (
      <div className="bg-[#F5F5F5] py-20">
        <div className="max-w-md mx-auto bg-white border border-border-light rounded-[var(--radius-md)] shadow-card p-8 text-center">
          <Heart className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary mb-2">Your wishlist is empty</h1>
          <p className="text-text-secondary mb-6">Save your favorite items here.</p>
          <Link to="/all-products" className="btn-cta inline-flex items-center gap-2 px-6 py-3">
            Explore Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F5F5F5]">
      {/* Use max-width and centering without extra horizontal padding (Layout already handles it) */}
      <div className="max-w-7xl mx-auto py-4">
        <h1 className="text-product-title font-semibold text-text-primary mb-4">My Wishlist</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {wishlist.items.map((item: any) => {
            const imageUrl = getItemImage(item);
            const showBulkBadge = item.bulk_enabled;

            return (
              <div key={item.id} className="card-product flex flex-col p-3">
                <Link
                  to={`/product/${item.productId || item.product_id}`}
                  className="block aspect-square rounded-[var(--radius-sm)] overflow-hidden bg-surface-hover mb-2"
                >
                  <img
                    src={imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/300x300?text=No+Image';
                    }}
                  />
                </Link>
                <Link
                  to={`/product/${item.productId || item.product_id}`}
                  className="text-xs font-medium text-text-primary line-clamp-2 mb-1 hover:text-brand"
                >
                  {item.title}
                </Link>

                {/* Bulk badge */}
                {showBulkBadge && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                      WHOLESALE
                    </span>
                    {item.minimum_bulk_quantity > 1 && (
                      <span className="text-xs text-text-muted">
                        Min. {item.minimum_bulk_quantity} pcs
                      </span>
                    )}
                  </div>
                )}

                <p className="text-sm font-bold text-text-primary mb-2">
                  ETB {formatPrice(Number(item.effective_price || item.price))}
                </p>

                <div className="mt-auto flex items-center gap-2">
                  <button
                    onClick={() => {
                      addToCart(
                        { id: item.productId, title: item.title, price: item.effective_price || item.price, image_urls: [imageUrl] },
                        1
                      );
                      removeFromWishlist(item.productId);
                    }}
                    className="flex-1 btn-cta py-1.5 px-2 text-xs font-medium rounded-[var(--radius-sm)] flex items-center justify-center gap-1"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Move to Cart
                  </button>
                  <button
                    onClick={() => removeFromWishlist(item.productId)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;