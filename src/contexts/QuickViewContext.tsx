import React, { createContext, useContext, useState } from 'react';
import QuickViewModal from '../components/features/products/QuickViewModal';

interface QuickViewContextType {
  openQuickView: (productId: number) => void;
  closeQuickView: () => void;
  quickViewProductId: number | null;
  isQuickViewOpen: boolean;
}

const QuickViewContext = createContext<QuickViewContextType | undefined>(undefined);

export const QuickViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [productId, setProductId] = useState<number | null>(null);

  const openQuickView = (id: number) => setProductId(id);
  const closeQuickView = () => setProductId(null);

  return (
    <QuickViewContext.Provider value={{
      openQuickView,
      closeQuickView,
      quickViewProductId: productId,
      isQuickViewOpen: productId !== null,
    }}>
      {children}
      <QuickViewModal
        productId={productId}
        isOpen={productId !== null}
        onClose={closeQuickView}
      />
    </QuickViewContext.Provider>
  );
};

export const useQuickView = () => {
  const context = useContext(QuickViewContext);
  if (!context) throw new Error('useQuickView must be used within QuickViewProvider');
  return context;
};