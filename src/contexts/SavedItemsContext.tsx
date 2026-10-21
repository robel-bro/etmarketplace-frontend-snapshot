import React, { createContext, useContext, useState, useEffect } from 'react';

interface SavedItem {
  id: number;
  title: string;
  price: number;
  image: string;
  stock: number;
}

interface SavedItemsContextType {
  savedItems: SavedItem[];
  addToSaved: (product: any) => void;
  removeFromSaved: (productId: number) => void;
  moveToCart: (productId: number, quantity?: number) => void;
  isSaved: (productId: number) => boolean;
}

const SavedItemsContext = createContext<SavedItemsContextType | undefined>(undefined);

export const SavedItemsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('savedItems');
    if (stored) {
      try {
        setSavedItems(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('savedItems', JSON.stringify(savedItems));
  }, [savedItems]);

  const addToSaved = (product: any) => {
    if (savedItems.some(item => item.id === product.id)) return;
    const newItem: SavedItem = {
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.images?.[0] || '/placeholder.jpg',
      stock: product.stock || 0,
    };
    setSavedItems(prev => [...prev, newItem]);
  };

  const removeFromSaved = (productId: number) => {
    setSavedItems(prev => prev.filter(item => item.id !== productId));
  };

  const moveToCart = (productId: number, quantity: number = 1) => {
    removeFromSaved(productId);
    // The actual addition to cart is handled in the component (calling addToCart)
  };

  const isSaved = (productId: number) => savedItems.some(item => item.id === productId);

  return (
    <SavedItemsContext.Provider value={{ savedItems, addToSaved, removeFromSaved, moveToCart, isSaved }}>
      {children}
    </SavedItemsContext.Provider>
  );
};

export const useSavedItems = () => {
  const context = useContext(SavedItemsContext);
  if (!context) throw new Error('useSavedItems must be used within SavedItemsProvider');
  return context;
};