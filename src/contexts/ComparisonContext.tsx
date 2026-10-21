import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/axios';

interface CompareItem {
  productId: number;
  variant: Record<string, string>;   // ★ variant attributes
}

interface ComparisonContextType {
  items: CompareItem[];
  addItem: (id: number, variant?: Record<string, string>) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  isSelected: (id: number) => boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const ComparisonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CompareItem[]>([]);

  // Load comparisons
  useEffect(() => {
    const load = async () => {
      if (user) {
        try {
          const res = await api.get('/comparisons');
          // Backend returns array of product objects with variant_attributes
          const mapped: CompareItem[] = res.data.map((p: any) => ({
            productId: p.id,
            variant: p.variant_attributes || {},
          }));
          setItems(mapped);
        } catch {
          console.error('Failed to fetch comparisons');
        }
      } else {
        const stored = localStorage.getItem('compare');
        if (stored) {
          try { setItems(JSON.parse(stored)); } catch {}
        }
      }
    };
    load();
  }, [user]);

  // Persist guest compare
  useEffect(() => {
    if (!user) {
      localStorage.setItem('compare', JSON.stringify(items));
      window.dispatchEvent(new Event('compareUpdated'));
    }
  }, [items, user]);

  const addItem = async (id: number, variant?: Record<string, string>) => {
    if (items.length >= 6) {
      alert('You can compare up to 6 products at a time.');
      return;
    }
    if (items.some(i => i.productId === id && JSON.stringify(i.variant) === JSON.stringify(variant))) return;

    if (user) {
      try {
        const payload: any = { product_id: id };
        if (variant && Object.keys(variant).length > 0) payload.variant = variant;
        await api.post('/comparisons', payload);
        const res = await api.get('/comparisons');
        const mapped: CompareItem[] = res.data.map((p: any) => ({
          productId: p.id,
          variant: p.variant_attributes || {},
        }));
        setItems(mapped);
      } catch {
        alert('Failed to add product to comparison.');
      }
    } else {
      setItems(prev => [...prev, { productId: id, variant: variant || {} }]);
    }
  };

  const removeItem = async (id: number) => {
    if (user) {
      try {
        await api.delete(`/comparisons/${id}`);
        const res = await api.get('/comparisons');
        const mapped: CompareItem[] = res.data.map((p: any) => ({
          productId: p.id,
          variant: p.variant_attributes || {},
        }));
        setItems(mapped);
      } catch {
        console.error('Failed to remove comparison');
      }
    } else {
      setItems(prev => prev.filter(i => i.productId !== id));
    }
  };

  const isSelected = (id: number) => items.some(i => i.productId === id);

  return (
    <ComparisonContext.Provider value={{ items, addItem, removeItem, isSelected }}>
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (!context) throw new Error('useComparison must be used within ComparisonProvider');
  return context;
};