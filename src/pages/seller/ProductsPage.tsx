// src/pages/seller/ProductsPage.tsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  ExclamationCircleIcon,
  EyeIcon,
  TagIcon,
  TruckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import ProductFormModal from '../../components/seller/ProductFormModal';
import DeleteConfirmModal from '../../components/seller/DeleteConfirmModal';
import SellerVerificationForm from '../../components/verification/SellerVerificationForm';
import * as XLSX from 'xlsx';
import api from '../../lib/axios';

const ProductsPage = () => {
  const { user, refreshUser, logout } = useAuth();
  const queryClient = useQueryClient();
  const [needsVerification, setNeedsVerification] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState<{ message: string } | null>(null);

  const showToast = (msg: string) => {
    setToast({ message: msg });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: raw, isLoading: productsLoading, error } = useQuery(
    'sellerProducts',
    () => api.get('/products?vendor=me').then(res => res.data),
    {
      enabled: !!user && user.seller_verified !== false,
      onError: (err) => {
        if (err.response?.status === 401) {
          logout();
        }
      }
    }
  );

  const products = Array.isArray(raw) ? raw : (raw?.data || []);

  useEffect(() => {
    if (user && user.seller_verified === false) {
      setNeedsVerification(true);
    }
  }, [user]);

  const handleVerified = () => {
    setNeedsVerification(false);
    refreshUser();
  };

  const createProduct = useMutation(
    (formData) => api.post('/products', formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sellerProducts');
        setShowAddModal(false);
        showToast('Product created successfully');
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.errors?.join(', ') ||
                    err?.response?.data?.error ||
                    err?.message ||
                    'Failed to save product.';
        showToast(msg);
      },
    }
  );

  const updateProduct = useMutation(
    ({ id, formData }) => api.put(`/products/${id}`, formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sellerProducts');
        setEditingProduct(null);
        showToast('Product updated successfully');
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.errors?.join(', ') ||
                    err?.response?.data?.error ||
                    err?.message ||
                    'Failed to update product.';
        showToast(msg);
      },
    }
  );

  const deleteProduct = useMutation(
    (id) => api.delete(`/products/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sellerProducts');
        setDeleteTarget(null);
        showToast('Product deleted');
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error ||
                    err?.message ||
                    'Failed to delete product.';
        showToast(msg);
      },
    }
  );

  const handleExport = () => {
    if (!products || products.length === 0) return;
    const exportData = products.map(p => ({
      ID: p.id,
      Title: p.title,
      Price: p.price,
      'Effective Price': p.effective_price,
      Stock: getStockDisplay(p),
      Status: p.status,
      Views: p.views_count || 0,
      Sold: p.sold_count || 0,
      Variants: p.variants_count || 0,
      Rating: p.rating,
      Reviews: p.reviews_count,
      Discount: p.discount ? `${p.discount}%` : '',
      'Delivery Label': p.delivery_label || '',
      'Bulk Enabled': p.bulk_enabled ? 'Yes' : 'No',
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'products.xlsx');
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const imported = XLSX.utils.sheet_to_json(sheet);
      console.log('Imported products:', imported);
      alert(`Imported ${imported.length} products (preview only). Check console.`);
    };
    reader.readAsArrayBuffer(file);
  };

  if (needsVerification) {
    return (
      <div className="max-w-3xl">
        <SellerVerificationForm onVerified={handleVerified} />
      </div>
    );
  }

  if (productsLoading) return <div className="text-center py-10 text-sm text-text-muted">Loading products...</div>;

  if (error) {
    return (
      <div className="text-center py-10 text-sm text-red-500">
        Failed to load products. Please try again later.
      </div>
    );
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleSave = (formData) => {
    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, formData });
    } else {
      createProduct.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    deleteProduct.mutate(id);
  };

  const formatPrice = (val: any) => {
    const num = Number(val);
    return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Stock display – uses has_variants flag for correct source
  const getStockDisplay = (product: any): string => {
    if (product.bulk_enabled) {
      if (product.stock == null || product.stock === undefined) return 'Unlimited';
      return product.stock.toString();
    }
    if (product.has_variants) {
      if (product.available_stock !== undefined && product.available_stock !== null) {
        if (typeof product.available_stock === 'number' && !isFinite(product.available_stock)) return 'Unlimited';
        return product.available_stock.toString();
      }
    }
    if (product.stock != null) return product.stock.toString();
    return '0';
  };

  const getImageUrl = (product: any) => {
    if (Array.isArray(product.image_urls) && product.image_urls.length > 0) {
      return product.image_urls[0];
    }
    return 'https://placehold.co/600x400?text=No+Image';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h1 className="text-product-title font-semibold text-text-primary">Products</h1>
        <div className="flex items-center gap-2">
          <label className="btn-secondary px-3 py-2 text-xs font-medium cursor-pointer inline-flex items-center gap-1.5">
            <DocumentArrowUpIcon className="w-4 h-4" />
            Import
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={(e) => e.target.files && handleImport(e.target.files[0])}
              className="hidden"
            />
          </label>
          <button
            onClick={handleExport}
            className="btn-secondary px-3 py-2 text-xs font-medium inline-flex items-center gap-1.5"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            Export
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddModal(true)}
            className="btn-cta px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <PlusIcon className="w-4 h-4" />
            Add Product
          </motion.button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-4 h-4 text-text-muted" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand w-full md:w-40"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        <AnimatePresence>
          {filteredProducts.map((product) => {
            const stockText = getStockDisplay(product);
            const isOutOfStock = product.out_of_stock;
            const rating = product.rating ? Number(product.rating) : 0;
            const reviewCount = product.reviews_count || 0;
            const soldCount = product.sold_count || 0;
            const viewsCount = product.views_count || 0;
            const variantCount = product.variants_count || 0;
            const discountPercent = product.discount ? Number(product.discount) : 0;
            const effectivePrice = product.effective_price || product.price;
            const originalPrice = product.original_price;
            const freeDelivery = product.free_delivery;
            const deliveryLabel = product.delivery_label;
            const isFlashSale = product.is_flash_sale;
            const isSuperDeal = product.is_super_deal;
            const isHotDeal = product.is_hot_deal;
            const isTrending = product.is_trending;
            const bulkEnabled = product.bulk_enabled;
            const remainingDaily = product.remaining_daily_quantity;
            const maxDaily = product.max_quantity_per_day;

            return (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Image – discount badge, out‑of‑stock, but no active indicator */}
                <div className="relative aspect-square bg-gray-100">
                  <img
                    src={getImageUrl(product)}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=No+Image'; }}
                  />
                  {discountPercent > 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded z-10">
                      -{discountPercent}%
                    </div>
                  )}

                  {isOutOfStock && (
                    <div className="absolute bottom-2 left-2 bg-white/90 text-gray-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-gray-300 flex items-center gap-1 z-10">
                      <ExclamationCircleIcon className="w-3 h-3" />
                      Out of stock
                    </div>
                  )}
                  {/* Edit / Delete overlay */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingProduct(product); }}
                      className="p-1.5 bg-white rounded-full shadow-card hover:bg-surface-hover"
                      title="Edit"
                    >
                      <PencilIcon className="w-4 h-4 text-text-secondary" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(product); }}
                      className="p-1.5 bg-white rounded-full shadow-card hover:bg-red-50"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Info – clean, no status text */}
                <div className="p-3 space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{product.title}</h3>

                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-gray-800">
                      ETB {formatPrice(effectivePrice)}
                    </span>
                    {originalPrice && originalPrice > effectivePrice && (
                      <span className="text-xs text-gray-400 line-through">
                        ETB {formatPrice(originalPrice)}
                      </span>
                    )}
                  </div>

                  {/* Stock */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 font-medium">Stock:</span>
                    <span className={`font-semibold ${stockText === 'Unlimited' ? 'text-green-600' : isOutOfStock ? 'text-red-600' : 'text-gray-800'}`}>
                      {stockText}
                    </span>
                    {variantCount > 0 && (
                      <span className="text-xs text-gray-500 ml-1">({variantCount} variant{variantCount > 1 ? 's' : ''})</span>
                    )}
                  </div>

                  {/* Delivery */}
                  {freeDelivery && (
                    <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <TruckIcon className="w-3.5 h-3.5" />
                      Free Delivery
                    </div>
                  )}
                  {!freeDelivery && deliveryLabel && deliveryLabel !== 'Paid Delivery' && (
                    <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                      <TruckIcon className="w-3.5 h-3.5" />
                      {deliveryLabel}
                    </div>
                  )}

                  {/* Bulk & daily limit */}
                  {bulkEnabled && (
                    <div className="text-xs text-indigo-600 font-medium">Bulk enabled</div>
                  )}
                  {maxDaily && (
                    <div className="text-xs text-gray-500">
                      Daily limit: {maxDaily} (remaining: {remainingDaily || 0})
                    </div>
                  )}

                  {/* Promotional indicators – very subtle text */}
                  {(isFlashSale || isSuperDeal || isHotDeal || isTrending) && (
                    <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] font-semibold">
                      {isFlashSale && <span className="text-orange-600">⚡ FLASH</span>}
                      {isSuperDeal && <span className="text-red-600">🔥 SUPER</span>}
                      {isHotDeal && <span className="text-amber-600">✨ HOT</span>}
                      {isTrending && <span className="text-purple-600">📈 TRENDING</span>}
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
                    {rating > 0 && (
                      <div className="flex items-center gap-0.5">
                        <span className="font-semibold text-gray-700">{rating.toFixed(1)}</span>
                        <svg className="w-3 h-3 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span>({reviewCount})</span>
                      </div>
                    )}
                    {soldCount > 0 && (
                      <span className="flex items-center gap-1">
                        <TagIcon className="w-3 h-3" />
                        {soldCount} sold
                      </span>
                    )}
                    {viewsCount > 0 && (
                      <span className="flex items-center gap-1">
                        <EyeIcon className="w-3 h-3" />
                        {viewsCount} views
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Modals */}
      {showAddModal && (
        <ProductFormModal
          onClose={() => setShowAddModal(false)}
          onSave={handleSave}
        />
      )}
      {editingProduct && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          title={`Delete "${deleteTarget.title}"?`}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow-lg z-50 flex items-center gap-2">
          <span className="text-sm">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-white hover:text-gray-300">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;