// src/contexts/CartContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/axios';

interface CartItem {
  id: number;
  productId?: number;
  packageId?: number;
  title: string;
  price: number;
  image: string;
  quantity: number;
  stock?: number;
  variant?: Record<string, string>;
}

interface BulkProgress {
  productId: number;
  productTitle: string;
  minimumRequired: number;
  currentQuantity: number;
  met: boolean;
  remaining: number;
}

interface Cart {
  items: CartItem[];
  item_count: number;
  total: number;
  minimumBulkProgress?: Record<number, BulkProgress>;
}

interface CartContextType {
  cart: Cart | null;
  addToCart: (product: any, quantity: number, variant?: Record<string, string>) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  refreshCart: () => Promise<void>;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const variantsMatch = (a?: Record<string, string>, b?: Record<string, string>): boolean => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every(key => a[key] === b[key]);
};

const GUEST_CART_KEY = 'guestCart';

const loadGuestCart = (): Cart | null => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.items)) {
      return {
        items: parsed.items,
        item_count: parsed.item_count || 0,
        total: parsed.total || 0,
      };
    }
  } catch {}
  return null;
};

const saveGuestCart = (cart: Cart) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  } catch {}
};

const clearGuestCart = () => {
  localStorage.removeItem(GUEST_CART_KEY);
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mergeInProgress, setMergeInProgress] = useState(false);

  // Helper to build Cart from API response
  const buildCartFromData = (data: any): Cart => ({
    items: data.items || [],
    item_count: data.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0,
    total: data.total || 0,
    minimumBulkProgress: data.minimumBulkProgress,
  });

  // 1. Initial load based on auth state
  useEffect(() => {
    const initCart = async () => {
      if (user) {
        try {
          const res = await api.get('/cart');
          setCart(buildCartFromData(res.data));
        } catch {
          setCart({ items: [], item_count: 0, total: 0 });
        }
      } else {
        const saved = loadGuestCart();
        setCart(saved || { items: [], item_count: 0, total: 0 });
      }
      setIsLoading(false);
    };
    initCart();
  }, [user]);

  // 2. Persist guest cart on every change
  useEffect(() => {
    if (!user && cart) {
      saveGuestCart(cart);
    }
  }, [cart, user]);

  // 3. Merge guest cart on login
  const mergeGuestCart = useCallback(async () => {
    if (!user) return;
    const guestCart = loadGuestCart();
    if (!guestCart || !guestCart.items.length) return;

    setMergeInProgress(true);
    try {
      for (const item of guestCart.items) {
        const payload: any = { quantity: item.quantity };
        if (item.packageId) {
          payload.package_id = item.packageId;
        } else if (item.productId) {
          payload.product_id = item.productId;
          if (item.variant && Object.keys(item.variant).length > 0) {
            payload.variant = item.variant;
          }
        } else {
          continue;
        }
        await api.post('/cart/add_item', payload).catch(() => {
          console.warn('Could not merge item', item.title);
        });
      }
    } finally {
      clearGuestCart();
      setMergeInProgress(false);
      try {
        const res = await api.get('/cart');
        setCart(buildCartFromData(res.data));
      } catch {}
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      mergeGuestCart();
    }
  }, [user, mergeGuestCart]);

  // 4. Add to cart
  const addToCart = async (product: any, quantity: number, variant?: Record<string, string>) => {
    if (product.bulk_enabled && product.minimum_bulk_quantity) {
      const moq = Number(product.minimum_bulk_quantity);
      if (quantity < moq) {
        alert(`Minimum order for this wholesale product is ${moq} units.`);
        return;
      }
    }

    const effectiveVariant = variant ?? product.variant;

    if (user) {
      const payload: any = { quantity };
      if (product.packageId) {
        payload.package_id = product.id;
      } else {
        payload.product_id = product.id;
        if (effectiveVariant && Object.keys(effectiveVariant).length > 0) {
          payload.variant = effectiveVariant;
        }
      }
      try {
        const res = await api.post('/cart/add_item', payload);
        setCart(buildCartFromData(res.data));
      } catch (e: any) {
        alert(e.response?.data?.error || 'Failed to add to cart');
      }
    } else {
      setCart(prev => {
        if (!prev) return { items: [], item_count: 0, total: 0 };
        const existingIndex = prev.items.findIndex(i => {
          if (product.packageId) return i.packageId === product.id;
          return i.productId === product.id && variantsMatch(i.variant, effectiveVariant);
        });

        let newItems;
        if (existingIndex !== -1) {
          newItems = prev.items.map((i, idx) =>
            idx === existingIndex ? { ...i, quantity: i.quantity + quantity } : i
          );
        } else {
          const newItem: CartItem = {
            id: Date.now(),
            productId: product.packageId ? undefined : product.id,
            packageId: product.packageId ? product.id : undefined,
            title: product.title,
            price: product.price,
            image: product.image_urls?.[0] || product.image || '/placeholder.jpg',
            quantity,
            stock: product.stock || 0,
            variant: effectiveVariant || {},
          };
          newItems = [...prev.items, newItem];
        }
        const item_count = newItems.reduce((sum, i) => sum + i.quantity, 0);
        const total = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        return { items: newItems, item_count, total };
      });
    }
  };

  const removeFromCart = async (itemId: number) => {
    if (user) {
      // Optimistic remove
      setCart(prev => {
        if (!prev) return prev;
        const newItems = prev.items.filter(i => i.id !== itemId);
        const item_count = newItems.reduce((sum, i) => sum + i.quantity, 0);
        const total = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        return { ...prev, items: newItems, item_count, total };
      });
      try {
        await api.delete(`/cart/remove_item/${itemId}`);
      } catch (e: any) {
        // Revert on failure
        const res = await api.get('/cart');
        setCart(buildCartFromData(res.data));
        alert(e.response?.data?.error || 'Failed to remove item');
      }
    } else {
      setCart(prev => {
        if (!prev) return prev;
        const newItems = prev.items.filter(i => i.id !== itemId);
        const item_count = newItems.reduce((sum, i) => sum + i.quantity, 0);
        const total = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        return { ...prev, items: newItems, item_count, total };
      });
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    const item = cart?.items.find(i => i.id === itemId);
    if (item && item.stock && item.stock > 0 && quantity > item.stock) {
      alert(`Only ${item.stock} available.`);
      return;
    }

    if (user) {
      try {
        const res = await api.patch('/cart/update_item', { item_id: itemId, quantity });
        setCart(buildCartFromData(res.data));
      } catch (e: any) {
        alert(e.response?.data?.error || 'Failed to update quantity');
      }
    } else {
      setCart(prev => {
        if (!prev) return prev;
        const newItems = prev.items.map(i =>
          i.id === itemId ? { ...i, quantity } : i
        );
        const item_count = newItems.reduce((sum, i) => sum + i.quantity, 0);
        const total = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        return { ...prev, items: newItems, item_count, total };
      });
    }
  };

  const refreshCart = async () => {
    if (!user) return;
    try {
      const res = await api.get('/cart');
      setCart(buildCartFromData(res.data));
    } catch {
      // keep current cart on failure
    }
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, refreshCart, isLoading }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

export { CartContext };