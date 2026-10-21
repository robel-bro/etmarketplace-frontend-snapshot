// src/types/index.ts
export interface User {
  id: number;
  email: string;
  roles: string[];
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  children?: Category[];
}

export interface Product {
  id: number;
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
  status: 'draft' | 'active' | 'archived';
  featured: boolean;
  views_count: number;
  is_flash_sale: boolean;
  flash_sale_price: number;
  flash_sale_ends_at: string;
  is_super_deal: boolean;
  super_deal_price: number;
  super_deal_ends_at: string;
  is_trending: boolean;
  is_hot_deal: boolean;
  image_urls: string[];
  video_urls: string[];
  product_attributes: Record<string, string>;
  variants: Array<{
    attributes: Record<string, string>;
    price: number;
    stock: number;
    image?: string;
  }>;
  vendor: {
    id: number;
    business_name: string;
  };
  category: {
    id: number;
    name: string;
    path: string[];
  };
}

export interface CartItem {
  id: number;
  product_id: number;
  title: string;
  price: number;
  quantity: number;
  total: number;
  image?: string;
  variant?: Record<string, string>;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total_price: number;
  item_count: number;
}

export interface WishlistItem {
  id: number;
  product_id: number;
  title: string;
  price: number;
  image?: string;
}

// ─── Search result types (for mixed product + package results) ───

export interface SearchResultItem {
  type: 'product' | 'package';
  id: number;
  title: string;
  description?: string;
  price: number;
  effective_price?: number;
  original_price?: number;
  discount_type?: string;
  discount_value?: number;
  rating?: number;
  reviews_count?: number;
  sold_count?: number;
  free_shipping?: boolean;
  stock?: number;
  status?: string;
  featured?: boolean;
  sponsored?: boolean;
  views_count?: number;
  is_flash_sale?: boolean;
  flash_sale_price?: number;
  flash_sale_ends_at?: string;
  is_super_deal?: boolean;
  super_deal_price?: number;
  super_deal_ends_at?: string;
  items_count?: number;           // only for packages
  category?: {
    id: number;
    name: string;
  };
  vendor?: {
    id: number;
    business_name: string;
    membership_tier?: string;
    badge?: string;
    rating?: number;
    total_sales?: number;
    products_count?: number;
  };
  image_urls: string[];
  product_attributes?: Record<string, string>;   // only for products
  variants?: Array<{                          // only for products
    attributes: Record<string, string>;
    price: number;
    stock: number;
    image?: string;
  }>;
  seller_pays_shipping?: boolean;
  created_at?: string;
  bulk_enabled?: boolean;
  out_of_stock?: boolean;
  score?: number;                // internal ranking
}

export interface SearchMeta {
  current_page: number;
  next_page: number | null;
  total_count: number;
  per_page: number;
  dominant_category?: { id: number; name: string } | null;
  filters: SearchFilters;
  suggestion?: string | null;
  suggestion_product_id?: number | null;
  sponsored: SearchResultItem[];
  featured: SearchResultItem[];
}

export interface SearchFilters {
  brands?: string[];
  categories?: { id: number; name: string }[];
  price_range?: { min: number; max: number };
  attributes?: Record<string, string[]>;
  package_discount_types?: string[];
  ratings?: number[];
  delivery_options?: string[];
}

export interface SearchResponse {
  data: SearchResultItem[];
  meta: SearchMeta;
}

export interface SuggestionsResponse {
  products: { id: number; title: string; image_url?: string; price?: number }[];
  packages: { id: number; name: string; image_url?: string; price?: number }[];
  categories: { id: number; name: string; slug: string }[];
  brands: { name: string }[];
  popular_searches: { query: string }[];
}

// ─── Delivery Board Types ───────────────────────────────────

export interface ProductItem {
  type: 'product' | 'package';
  title: string;
  quantity: number;
  weight_kg: number;
  price: number;
  image_url?: string;
  variant_attributes?: Record<string, string>;
  package_items?: {
    product_id: number;
    title: string;
    quantity: number;
    variant_attributes?: Record<string, string>;
  }[];
}

export interface DeliveryRequest {
  id: number;
  pickup_address: string;
  delivery_address: string;
  required_vehicle_type: string;
  package_details: {
    weight_kg: number;
    volume_cm3?: number;
    chargeable_weight_kg?: number;
    refrigerated?: boolean;
    fragile?: boolean;
  };
  cod_amount: number | null;
  estimated_earnings: number;
  status: string;
  payment_method?: string;
  products: ProductItem[];
  service_level: number;
  delivery_label?: string;
  can_accept?: boolean;
  created_at?: string;
}

export interface Vehicle {
  id: number;
  vehicle_type: string;
  plate_number: string;
  max_weight_kg: number;
  status: 'available' | 'busy' | 'out_of_service';
}