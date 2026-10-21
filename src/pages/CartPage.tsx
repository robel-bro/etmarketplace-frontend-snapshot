// src/pages/CartPage.tsx
import { useEffect, useState } from 'react';
import { useCart } from '../hooks/useCart';
import { useSavedItems } from '../contexts/SavedItemsContext';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, Heart, ArrowRight, ShoppingBag } from 'lucide-react';
import api from '../lib/axios';

const formatPrice = (value: number) =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getItemImage = (item: any): string => {
  const img = item.image || item.image_url || item.image_urls?.[0];
  return img || 'https://placehold.co/300x300?text=No+Image';
};

const CartPage = () => {
  const { cart, addToCart, updateQuantity, refreshCart } = useCart();
  const { savedItems, addToSaved, removeFromSaved } = useSavedItems();
  const { user } = useAuth();
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [removingItems, setRemovingItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (user) {
      refreshCart();
    }
  }, [user, refreshCart]);

  const handleRemove = async (itemId: number) => {
    // Prevent double‑clicks
    if (removingItems.has(itemId)) return;
    setRemovingItems((prev) => new Set(prev).add(itemId));

    try {
      const res = await api.delete(`/cart/remove_item/${itemId}`);
      if (res.data.notice) {
        setNoticeMessage(res.data.notice);
        setTimeout(() => setNoticeMessage(null), 5000);
      }
      await refreshCart();
    } catch (e: any) {
      if (e.response?.status === 404) {
        // Item already gone – just refresh
        await refreshCart();
      } else {
        alert(e.response?.data?.error || 'Failed to remove item');
      }
    } finally {
      setRemovingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="bg-[#F5F5F5] py-20">
        <div className="max-w-md mx-auto bg-white border border-border-light rounded-[var(--radius-md)] shadow-card p-8 text-center">
          <ShoppingBag className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary mb-2">Your cart is empty</h1>
          <p className="text-text-secondary mb-6">Looks like you haven't added anything yet.</p>
          <Link to="/all-products" className="btn-cta inline-flex items-center gap-2 px-6 py-3">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = cart.items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );
  const itemCount = cart.items.reduce((sum, item) => sum + Number(item.quantity), 0);

  const minimumBulkProgress = cart.minimumBulkProgress || {};

  return (
    <div className="bg-[#F5F5F5]">
      <div className="max-w-7xl mx-auto py-4">
        <div className="flex items-baseline justify-between mb-4">
          <h1 className="text-product-title font-semibold text-text-primary">My Cart</h1>
          <span className="text-sm text-text-muted">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
        </div>

        {noticeMessage && (
          <div className="bg-blue-50 border border-blue-300 text-blue-700 px-3 py-2 rounded text-sm mb-3">
            {noticeMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            {cart.items.map((item: any) => {
              const variantAttrs = item.variant || {};
              const hasVariants = Object.keys(variantAttrs).length > 0;

              const moqInfo = item.productId ? minimumBulkProgress[item.productId] : null;
              const isBulkItem = item.bulkEnabled && moqInfo;
              const moq = moqInfo ? moqInfo.minimumRequired : 0;
              const totalForProduct = moqInfo ? moqInfo.currentQuantity : 0;

              const minQty = 1;
              const maxStock = item.stock ? Number(item.stock) : Infinity;
              const canDecrement = item.quantity > 1;
              const canIncrement = maxStock <= 0 || item.quantity < maxStock;

              const isRemoving = removingItems.has(item.id);

              const handleDecrement = () => {
                if (!canDecrement) return;
                updateQuantity(item.id, item.quantity - 1);
              };

              const handleIncrement = () => {
                if (!canIncrement) return;
                updateQuantity(item.id, item.quantity + 1);
              };

              return (
                <div key={item.id} className="card-product flex flex-col sm:flex-row gap-3 p-3">
                  <Link
                    to={`/product/${item.product_id || item.productId || item.id}`}
                    className="w-full sm:w-20 h-20 flex-shrink-0 rounded-[var(--radius-sm)] overflow-hidden bg-surface-hover border border-border-light"
                  >
                    <img
                      src={getItemImage(item)}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/300x300?text=No+Image';
                      }}
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.product_id || item.productId || item.id}`}
                      className="text-sm font-medium text-text-primary line-clamp-2 hover:text-brand transition-colors"
                    >
                      {item.title}
                    </Link>

                    {item.bulkEnabled && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                          WHOLESALE
                        </span>
                        {moq > 1 && (
                          <span className="text-xs text-text-muted">
                            Min. {moq} pcs (total in cart: {totalForProduct})
                          </span>
                        )}
                      </div>
                    )}

                    {isBulkItem && !moqInfo?.met && (
                      <p className="text-xs text-yellow-700 mt-1">
                        ⚠️ Add {moqInfo.remaining} more to meet minimum order of {moq} at checkout.
                      </p>
                    )}

                    {hasVariants && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(variantAttrs).map(([key, value]) => (
                          <span
                            key={key}
                            className="inline-flex items-center px-2 py-0.5 text-xs rounded-md bg-gray-100 text-gray-700 border border-gray-200"
                          >
                            {key}: {value as string}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-text-muted mt-1">
                      {item.quantity} × ETB {formatPrice(Number(item.price))}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-border-light rounded-[var(--radius-sm)]">
                        <button
                          onClick={handleDecrement}
                          disabled={!canDecrement}
                          className="w-10 h-10 sm:w-7 sm:h-7 flex items-center justify-center hover:bg-surface-hover transition disabled:opacity-30 text-sm"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={handleIncrement}
                          disabled={!canIncrement}
                          className="w-10 h-10 sm:w-7 sm:h-7 flex items-center justify-center hover:bg-surface-hover transition disabled:opacity-30 text-sm"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            addToSaved(item);
                            handleRemove(item.id);
                          }}
                          disabled={isRemoving}
                          className={`text-xs font-medium flex items-center gap-1 p-1.5 sm:p-0 transition-colors ${
                            isRemoving ? 'text-gray-400 cursor-not-allowed' : 'text-brand hover:text-brand-hover'
                          }`}
                        >
                          <Heart className="w-3.5 h-3.5" />
                          Save
                        </button>
                        <button
                          onClick={() => handleRemove(item.id)}
                          disabled={isRemoving}
                          className={`text-xs font-medium flex items-center gap-1 p-1.5 sm:p-0 transition-colors ${
                            isRemoving ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 hover:text-red-600'
                          }`}
                        >
                          {isRemoving ? (
                            <span className="inline-block w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="sm:text-right flex-shrink-0">
                    <p className="text-base font-bold text-text-primary">
                      ETB {formatPrice(Number(item.price) * Number(item.quantity))}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="card-product p-4 sticky top-24">
              <h2 className="text-base font-semibold text-text-primary mb-3">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Subtotal ({itemCount} items)</span>
                  <span className="font-semibold text-text-primary">ETB {formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Shipping</span>
                  <span className="text-text-muted text-xs">Calculated at checkout</span>
                </div>
                <div className="border-t border-border-light pt-2 flex justify-between">
                  <span className="font-semibold text-text-primary">Estimated Total</span>
                  <span className="font-bold text-base text-text-primary">ETB {formatPrice(subtotal)}</span>
                </div>
              </div>

              {user ? (
                <Link
                  to="/checkout"
                  className="btn-cta w-full mt-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="btn-cta w-full mt-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  Login to Checkout
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              <div className="text-center mt-3">
                <Link
                  to="/all-products"
                  className="text-xs font-medium text-text-muted hover:text-brand transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>

        {savedItems && savedItems.length > 0 && (
          <div className="mt-6">
            <h2 className="text-product-title font-semibold text-text-primary mb-3">
              Saved for Later <span className="text-text-muted text-sm font-normal">({savedItems.length})</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {savedItems.map((item: any) => (
                <div key={item.id} className="card-product p-3 flex flex-col">
                  <Link
                    to={`/product/${item.product_id || item.productId || item.id}`}
                    className="block aspect-square rounded-[var(--radius-sm)] overflow-hidden bg-surface-hover mb-2"
                  >
                    <img
                      src={getItemImage(item)}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/300x300?text=No+Image';
                      }}
                    />
                  </Link>
                  <Link
                    to={`/product/${item.product_id || item.productId || item.id}`}
                    className="text-xs font-medium text-text-primary line-clamp-2 mb-1 hover:text-brand"
                  >
                    {item.title}
                  </Link>
                  {item.variant && Object.keys(item.variant).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1">
                      {Object.entries(item.variant).map(([k, v]) => (
                        <span
                          key={k}
                          className="inline-flex items-center px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-600"
                        >
                          {k}: {v as string}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-sm font-bold text-text-primary mb-2">
                    ETB {formatPrice(Number(item.price))}
                  </p>
                  <button
                    onClick={() => {
                      addToCart(item, 1);
                      removeFromSaved(item.id);
                    }}
                    className="mt-auto btn-cta py-1.5 px-3 text-xs font-medium rounded-[var(--radius-sm)] flex items-center justify-center gap-1"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Move to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;