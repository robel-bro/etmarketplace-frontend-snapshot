// src/hooks/useVendorFilter.ts
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from 'react-query';
import api from '../lib/axios';

export interface VendorFilterState {
  search: string;
  sort: string;
  minPrice: string;
  maxPrice: string;
  selectedCategories: string[];
  selectedRatings: number[];
  selectedDelivery: string[];
}

const defaultFilters: VendorFilterState = {
  search: '',
  sort: '',
  minPrice: '',
  maxPrice: '',
  selectedCategories: [],
  selectedRatings: [],
  selectedDelivery: [],
};

// Category parent→children map (built once)
let categoryMap: Record<string, string[]> = {};

const buildCategoryMap = (cats: any[]) => {
  const map: Record<string, string[]> = {};
  const rootNodes = cats.filter((c: any) => !c.parent_id);
  const getChildren = (parentId: number) => cats.filter((c: any) => c.parent_id === parentId);

  const walk = (node: any, parentName: string) => {
    const name = node.name;
    if (!map[parentName]) map[parentName] = [];
    map[parentName].push(name);
    getChildren(node.id).forEach((child: any) => walk(child, name));
  };

  rootNodes.forEach((root: any) => {
    map[root.name] = [root.name]; // include parent itself
    getChildren(root.id).forEach((child: any) => walk(child, root.name));
  });
  categoryMap = map;
};

export function useVendorFilter(
  vendorId: number | null,
  products: any[],
  packages: any[],
  deals: any[]
) {
  const [filters, setFilters] = useState<VendorFilterState>(defaultFilters);

  // Fetch filter metadata (categories, delivery options, etc.)
  const { data: filterMeta } = useQuery(
    ['vendorFilterOptions', vendorId],
    () => api.get(`/api/v1/vendors/${vendorId}/filter_options`).then(r => r.data),
    { enabled: !!vendorId }
  );

  // Fetch full category list (for parent→child expansion)
  const { data: categories } = useQuery('allCategories', () =>
    api.get('/categories').then(r => r.data)
  );
  useEffect(() => {
    if (categories) buildCategoryMap(categories);
  }, [categories]);

  // Expand selected categories to include all children
  const expandedCategories = useMemo(() => {
    const set = new Set<string>();
    filters.selectedCategories.forEach(cat => {
      set.add(cat);
      if (categoryMap[cat]) {
        categoryMap[cat].forEach(sub => set.add(sub));
      }
    });
    return set;
  }, [filters.selectedCategories]);

  const applyFilters = useCallback((list: any[]) => {
    if (!list || list.length === 0) return [];

    let filtered = [...list];

    // Search
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(item => item.title?.toLowerCase().includes(q));
    }

    // Category (using expanded set)
    if (expandedCategories.size > 0) {
      filtered = filtered.filter(item => {
        const catName = item.category?.name || '';
        return expandedCategories.has(catName);
      });
    }

    // Delivery – directly use backend's delivery_label
    if (filters.selectedDelivery.length > 0) {
      filtered = filtered.filter(item =>
        filters.selectedDelivery.includes(item.delivery_label)
      );
    }

    // Price range
    const min = Number(filters.minPrice) || 0;
    const max = Number(filters.maxPrice) || Infinity;
    filtered = filtered.filter(item => {
      const price = Number(item.effective_price || item.price);
      return price >= min && price <= max;
    });

    // Rating
    if (filters.selectedRatings.length > 0) {
      const minRating = Math.min(...filters.selectedRatings);
      filtered = filtered.filter(item => (item.rating || 0) >= minRating);
    }

    // Sort
    switch (filters.sort) {
      case 'price_asc':
        filtered.sort((a, b) => (a.effective_price || a.price) - (b.effective_price || b.price));
        break;
      case 'price_desc':
        filtered.sort((a, b) => (b.effective_price || b.price) - (a.effective_price || a.price));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => (b.id || 0) - (a.id || 0));
        break;
    }

    return filtered;
  }, [filters, expandedCategories]);

  const filteredProducts = useMemo(() => applyFilters(products), [products, applyFilters]);
  const filteredPackages = useMemo(() => applyFilters(packages), [packages, applyFilters]);
  const filteredDeals = useMemo(() => applyFilters(deals), [deals, applyFilters]);

  return {
    filters,
    setFilters,
    filterMeta,
    filteredProducts,
    filteredPackages,
    filteredDeals,
  };
}