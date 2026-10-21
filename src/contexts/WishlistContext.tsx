import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/axios';

interface WishlistItem {
  id: number;
  productId: number;
  title: string;
  description: string;
  price: number;
  effective_price: number;
  original_price: number;
  rating: number;
  reviews_count: number;
  sold_count: number;
  free_shipping: boolean;
  discount: number;
  stock: number;
  image_urls: string[];
  is_flash_sale: boolean;
  flash_sale_price: number;
  flash_sale_ends_at: string;
  is_super_deal: boolean;
  super_deal_price: number;
  super_deal_ends_at: string;
  category: { id: number; name: string } | null;
  vendor: { id: number; business_name: string } | null;
  product_attributes: Record<string, any>;
  variants: any[];
}

interface Wishlist {
  items: WishlistItem[];
}

interface WishlistContextType {
  wishlist: Wishlist;
  addToWishlist: (product: any) => Promise<void>;
  removeFromWishlist: (productId: number) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
  isLoading: boolean;
}

export const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

// Normalise backend item to camelCase
const normaliseItem = (item: any): WishlistItem => ({
  id: item.id,
  productId: item.product_id,
  title: item.title,
  description: item.description,
  price: item.price,
  effective_price: item.effective_price,
  original_price: item.original_price,
  rating: item.rating,
  reviews_count: item.reviews_count,
  sold_count: item.sold_count,
  free_shipping: item.free_shipping,
  discount: item.discount,
  stock: item.stock,
  image_urls: item.image_urls || [],
  is_flash_sale: item.is_flash_sale,
  flash_sale_price: item.flash_sale_price,
  flash_sale_ends_at: item.flash_sale_ends_at,
  is_super_deal: item.is_super_deal,
  super_deal_price: item.super_deal_price,
  super_deal_ends_at: item.super_deal_ends_at,
  category: item.category,
  vendor: item.vendor,
  product_attributes: item.product_attributes || {},
  variants: item.variants || [],
});

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<Wishlist>({ items: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Load wishlist
  useEffect(() => {
    const loadWishlist = async () => {
      if (user) {
        try {
          const res = await api.get('/wishlist');
          setWishlist({ items: (res.data.items || []).map(normaliseItem) });
        } catch {
          setWishlist({ items: [] });
        }
      } else {
        const stored = localStorage.getItem('guestWishlist');
        if (stored) {
          setWishlist(JSON.parse(stored));
        } else {
          setWishlist({ items: [] });
        }
      }
      setIsLoading(false);
    };
    loadWishlist();
  }, [user]);

  // Persist guest wishlist
  useEffect(() => {
    if (!user && wishlist) {
      localStorage.setItem('guestWishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, user]);

  const addToWishlist = async (product: any) => {
    if (user) {
      await api.post('/wishlist/add_item', { product_id: product.id });
      const res = await api.get('/wishlist');
      setWishlist({ items: (res.data.items || []).map(normaliseItem) });
    } else {
      setWishlist(prev => {
        if (prev.items.some(i => i.productId === product.id)) return prev;
        const newItem: WishlistItem = {
          id: Date.now(),
          productId: product.id,
          title: product.title,
          description: product.description || '',
          price: product.price,
          effective_price: product.effective_price || product.price,
          original_price: product.original_price,
          rating: product.rating || 0,
          reviews_count: product.reviews_count || 0,
          sold_count: product.sold_count || 0,
          free_shipping: product.free_shipping || false,
          discount: product.discount,
          stock: product.stock || 0,
          image_urls: product.image_urls || [],
          is_flash_sale: product.is_flash_sale || false,
          flash_sale_price: product.flash_sale_price,
          flash_sale_ends_at: product.flash_sale_ends_at,
          is_super_deal: product.is_super_deal || false,
          super_deal_price: product.super_deal_price,
          super_deal_ends_at: product.super_deal_ends_at,
          category: product.category || null,
          vendor: product.vendor || null,
          product_attributes: product.product_attributes || {},
          variants: product.variants || [],
        };
        return { items: [...prev.items, newItem] };
      });
    }
  };

  const removeFromWishlist = async (productId: number) => {
    if (user) {
      await api.delete(`/wishlist/remove_item/${productId}`);
      const res = await api.get('/wishlist');
      setWishlist({ items: (res.data.items || []).map(normaliseItem) });
    } else {
      setWishlist(prev => ({
        items: prev.items.filter(item => item.productId !== productId),
      }));
    }
  };

  const isInWishlist = (productId: number) => {
    return wishlist.items.some(item => item.productId === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, isLoading }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
};