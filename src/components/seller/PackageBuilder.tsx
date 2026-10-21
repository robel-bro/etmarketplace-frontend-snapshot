// src/components/seller/PackageBuilder.tsx (hardened – weight/dimensions required for new products, subsidy aligned, features fix)
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from 'react-query';
import {
  XMarkIcon,
  PlusIcon,
  PhotoIcon,
  TrashIcon,
  VideoCameraIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import api from '../../lib/axios';

// Types
interface AttributeDefinition {
  id: number;
  name: string;
  display_name: string;
  attr_type: string;
  is_variant?: boolean;
  values: string[];
}

interface NewProduct {
  name: string;
  description: string;
  price: string;
  stock: string;
  weight_kg: string;
  length_cm: string;
  width_cm: string;
  height_cm: string;
  images: { file?: File; preview: string }[];
  attributes: Record<string, string>;
}

interface PackageBuilderProps {
  onClose: () => void;
  onSave: (packageData: FormData) => Promise<void>;
  initialData?: any;
}

const inputClass =
  'w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand';
const textareaClass =
  'w-full px-3 py-2 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand resize-none';

// ── Helpers ──
const getVariantKeys = (variants: any[]) => {
  if (!variants || !Array.isArray(variants)) return [];
  const keys = new Set<string>();
  variants.forEach(v => {
    if (v && v.attributes) Object.keys(v.attributes).forEach(k => keys.add(k));
  });
  return Array.from(keys);
};

const parseVariantStock = (v: any): number | null => {
  if (!v || v.unlimited_stock === true || v.stock === null || v.stock === undefined || v.stock === '') return null;
  const raw = v.stock;
  const parsed = typeof raw === 'number' ? raw : parseInt(raw, 10);
  return isNaN(parsed) ? null : parsed;
};

const hasSelectableVariants = (product: any): boolean => {
  if (!product?.variants || !Array.isArray(product.variants)) return false;
  return product.variants.some(
    (v: any) => v?.attributes && typeof v.attributes === 'object' && Object.keys(v.attributes).length > 0
  );
};

// ★ Helper to normalize features from backend (string or array) to array
const normalizeFeatures = (value: any): string[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

// ── VariantModal ──
const findMatchingVariant = (variants: any[], selection: Record<string, string>) => {
  if (!variants.length || !Object.keys(selection).length) return null;
  return variants.find((v: any) =>
    v && v.attributes && Object.entries(selection).every(([k, val]) => v.attributes?.[k] === val)
  ) || null;
};

const VariantModal = ({
  product,
  onSelect,
  onClose,
}: {
  product: any;
  onSelect: (attrs: Record<string, string>) => void;
  onClose: () => void;
}) => {
  const variants = (product?.variants || []).filter(
    (v: any) => v && v.attributes && typeof v.attributes === 'object'
  );
  const keys = getVariantKeys(variants);

  const [localVariant, setLocalVariant] = useState<Record<string, string>>({});
  const [localOrder, setLocalOrder] = useState<string[]>([]);

  useEffect(() => {
    if (keys.length === 0) onClose();
  }, [keys, onClose]);

  const allValuesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    keys.forEach(key => {
      map[key] = [...new Set(variants.map((v: any) => v.attributes?.[key] || ''))].filter(Boolean);
    });
    return map;
  }, [keys, variants]);

  const availableVariants = useMemo(() => {
    if (!variants.length) return [];
    return variants.filter((v: any) =>
      Object.entries(localVariant).every(
        ([k, val]) => !val || v.attributes?.[k] === val
      )
    );
  }, [variants, localVariant]);

  const allowedValuesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    keys.forEach(key => {
      map[key] = [...new Set(availableVariants.map((v: any) => v.attributes?.[key] || ''))].filter(Boolean);
    });
    return map;
  }, [keys, availableVariants]);

  const activeVariant = useMemo(
    () => findMatchingVariant(variants, localVariant),
    [variants, localVariant]
  );

  const isComplete = activeVariant !== null;

  const handleOptionSelect = (key: string, value: string) => {
    const current = localVariant[key];
    if (current === value) {
      const idx = localOrder.indexOf(key);
      if (idx !== -1) {
        const keysToRemove = localOrder.slice(idx);
        const updatedVariant = { ...localVariant };
        keysToRemove.forEach(k => delete updatedVariant[k]);
        setLocalVariant(updatedVariant);
        setLocalOrder(localOrder.slice(0, idx));
      }
    } else {
      const updatedVariant = { ...localVariant };
      if (current != null) {
        const idx = localOrder.indexOf(key);
        if (idx !== -1) {
          const keysToRemove = localOrder.slice(idx);
          keysToRemove.forEach(k => delete updatedVariant[k]);
          const newOrder = localOrder.slice(0, idx);
          setLocalOrder(newOrder);
        }
      }
      updatedVariant[key] = value;
      const newOrder = localOrder.filter(k => k !== key);
      newOrder.push(key);
      setLocalOrder(newOrder);

      for (const k of keys) {
        if (updatedVariant[k]) {
          const allowed = [...new Set(
            variants
              .filter((v: any) =>
                Object.entries(updatedVariant).every(
                  ([kk, vv]) => kk === k || v.attributes?.[kk] === vv
                )
              )
              .map((v: any) => v.attributes?.[k])
              .filter(Boolean)
          )];
          if (!allowed.includes(updatedVariant[k])) {
            delete updatedVariant[k];
            const idx = newOrder.indexOf(k);
            if (idx !== -1) newOrder.splice(idx, 1);
          }
        }
      }
      setLocalVariant(updatedVariant);
      setLocalOrder(newOrder);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-[var(--radius-md)] shadow-elevated p-5 max-w-sm w-full max-h-[85vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold">Select Variant for {product.title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-hover">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {keys.map(key => {
          const allValues = allValuesMap[key] || [];
          const allowed = allowedValuesMap[key] || [];
          return (
            <div key={key} className="mb-4">
              <p className="text-xs font-medium text-gray-700 mb-1 capitalize">{key}</p>
              <div className="flex flex-wrap gap-2">
                {allValues.map(val => {
                  const isSelected = localVariant[key] === val;
                  const isAvailable = allowed.includes(val);
                  return (
                    <button
                      key={val}
                      onClick={() => isAvailable && handleOptionSelect(key, val)}
                      disabled={!isAvailable}
                      className={`px-3 py-1 text-xs font-medium border rounded-full transition ${
                        !isAvailable ? 'opacity-30 cursor-not-allowed border-gray-200 text-gray-400' :
                        isSelected ? 'bg-blue-50 border-blue-400 text-blue-800' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {isComplete && activeVariant && (
          <div className="bg-gray-50 p-3 rounded mb-4 text-xs">
            <p className="font-semibold">Price: ETB {activeVariant.price}</p>
            <p>
              Stock:{' '}
              {activeVariant.unlimited_stock || activeVariant.stock === null
                ? 'Unlimited'
                : (parseVariantStock(activeVariant)?.toString() ?? (product.stock_display || '0'))}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
          <button
            onClick={() => isComplete && onSelect(activeVariant.attributes)}
            disabled={!isComplete}
            className="btn-cta text-xs px-4 py-1.5 disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const PackageBuilder = ({ onClose, onSave, initialData }: PackageBuilderProps) => {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<'existing' | 'new' | null>(null);
  const [selectedExistingProducts, setSelectedExistingProducts] = useState<number[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<number, Record<string, string>>>({});
  const [variantModalProduct, setVariantModalProduct] = useState<any>(null);
  const [newProducts, setNewProducts] = useState<NewProduct[]>([]);

  const [packageDetails, setPackageDetails] = useState({
    name: '',
    description: '',
    original_price: '',
    price: '',
    stock: '',
    status: 'active',
    features: [] as string[],
    newFeature: '',
    seller_pays_shipping: false,
    shipping_subsidy_type: 'full' as 'full' | 'percent',
    shipping_subsidy_value: '',
    _lastSum: '',
  });

  const [mainCategory, setMainCategory] = useState('');
  const [subCategoryIds, setSubCategoryIds] = useState<number[]>([]);

  const [packageImages, setPackageImages] = useState<{ file?: File; preview: string }[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [imageIds, setImageIds] = useState<number[]>([]);

  const [packageVideos, setPackageVideos] = useState<File[]>([]);
  const [existingVideoUrls, setExistingVideoUrls] = useState<string[]>([]);
  const [videoIds, setVideoIds] = useState<number[]>([]);

  const [submitting, setSubmitting] = useState(false);

  const { data: sellerProducts } = useQuery('sellerProductsForBuilder', () =>
    api.get('/products?vendor=me').then(res => {
      const body = res.data;
      return Array.isArray(body) ? body : body?.data || [];
    }),
    { staleTime: 0 }
  );

  const { data: categories } = useQuery('categories', () =>
    api.get('/categories').then(res => res.data)
  );

  const mainCategories = categories?.filter((c: any) => !c.parent_id && !c.ancestry) || [];
  const subCategories = mainCategory
    ? categories?.filter(
        (c: any) =>
          (c.parent_id && c.parent_id === parseInt(mainCategory)) ||
          (c.ancestry &&
            (c.ancestry === mainCategory || c.ancestry.endsWith(`/${mainCategory}`)))
      ) || []
    : [];

  const categoryId =
    subCategoryIds.length > 0 ? subCategoryIds[0] : mainCategory ? parseInt(mainCategory) : null;
  const { data: filterData } = useQuery(
    ['filterOptions', categoryId],
    () => api.get('/filters', { params: { category: categoryId } }).then(res => res.data),
    { enabled: !!categoryId }
  );
  const baseAttrs: AttributeDefinition[] =
    filterData?.attributes?.filter((a: any) => !a.is_variant) || [];

  const totalProductSum = useMemo(() => {
    let sum = 0;
    if (mode === 'existing' && sellerProducts) {
      sellerProducts.forEach((p: any) => {
        if (selectedExistingProducts.includes(p.id)) {
          const price = parseFloat(p.effective_price || p.price);
          if (!isNaN(price)) sum += price;
        }
      });
    } else if (mode === 'new') {
      newProducts.forEach(p => {
        const price = parseFloat(p.price);
        if (!isNaN(price)) sum += price;
      });
    }
    return sum;
  }, [mode, selectedExistingProducts, newProducts, sellerProducts]);

  // ★ Compute the maximum possible stock, treating unlimited as Infinity
  const stockAnalysis = useMemo(() => {
    if (mode !== 'existing' || !sellerProducts) {
      return { max: Number.POSITIVE_INFINITY, limitingProducts: [] as string[] };
    }
    const selected = sellerProducts.filter(p => selectedExistingProducts.includes(p.id));
    if (selected.length === 0) return { max: 0, limitingProducts: [] };

    const details = selected.map(p => {
      const variantAttrs = selectedVariants[p.id];
      let stock: number | null = null;
      let displayName = p.title;
      if (variantAttrs && p.variants && Array.isArray(p.variants)) {
        const variant = p.variants.find((v: any) =>
          v.attributes &&
          Object.entries(variantAttrs).every(([k, val]) => v.attributes[k] === val)
        );
        if (variant) {
          stock = parseVariantStock(variant);
          const variantDesc = Object.values(variantAttrs).join(', ');
          displayName = `${p.title} (${variantDesc})`;
        } else {
          stock = 0;
        }
      } else {
        const rawStock = p.available_stock;
        stock = rawStock === null || rawStock === undefined ? null : rawStock;
      }
      return { stock, displayName, productId: p.id };
    });

    const hasUnlimited = details.some(d => d.stock === null);
    const finiteStocks = details.filter(d => d.stock !== null).map(d => d.stock as number);
    const minStock = hasUnlimited
      ? (finiteStocks.length > 0 ? Math.min(...finiteStocks) : Number.POSITIVE_INFINITY)
      : (finiteStocks.length > 0 ? Math.min(...finiteStocks) : 0);

    const limitingProducts = details
      .filter(d => d.stock !== null && d.stock === minStock)
      .map(d => `${d.displayName} (${d.stock} left)`);

    return { max: minStock, limitingProducts };
  }, [mode, sellerProducts, selectedExistingProducts, selectedVariants]);

  const maxPossibleStock = stockAnalysis.max;
  const limitingProductsDetails = stockAnalysis.limitingProducts;

  useEffect(() => {
    if (mode === 'existing' && selectedExistingProducts.length >= 2) {
      const currentStock = parseInt(packageDetails.stock, 10) || 0;
      if (maxPossibleStock !== Number.POSITIVE_INFINITY && currentStock > maxPossibleStock) {
        setPackageDetails(prev => ({ ...prev, stock: maxPossibleStock.toString() }));
      }
    }
  }, [maxPossibleStock, mode, selectedExistingProducts]);

  useEffect(() => {
    if (!initialData && totalProductSum > 0) {
      setPackageDetails(prev => {
        const currentOrig = parseFloat(prev.original_price);
        if (!prev.original_price || (prev._lastSum && currentOrig === parseFloat(prev._lastSum))) {
          return {
            ...prev,
            original_price: totalProductSum.toString(),
            _lastSum: totalProductSum.toString(),
          };
        }
        return prev;
      });
    }
  }, [totalProductSum, initialData]);

  useEffect(() => {
    if (initialData) {
      setMode('existing');
      setStep(3);
      setPackageDetails(prev => ({
        ...prev,
        name: initialData.name || '',
        description: initialData.description || '',
        original_price: initialData.original_price ?? '',
        price: initialData.price ?? '',
        stock: initialData.stock ?? '',
        status: initialData.status || 'active',
        features: normalizeFeatures(initialData.features),   // ★ FIX: ensure array
        newFeature: '',
        seller_pays_shipping: initialData.seller_pays_shipping || false,
        shipping_subsidy_type: initialData.shipping_subsidy_type || 'full',
        shipping_subsidy_value: initialData.shipping_subsidy_value?.toString() || '',
        _lastSum: initialData.original_price ?? '',
      }));

      if (initialData.categories?.length) {
        const cat = initialData.categories[0];
        setMainCategory(cat.parent_id ? cat.parent_id.toString() : cat.id.toString());
        setSubCategoryIds(initialData.categories.map((c: any) => c.id));
      }

      if (initialData.products?.length) {
        const ids = initialData.products.map((p: any) => p.id);
        setSelectedExistingProducts(ids);
        const variantMap: Record<number, Record<string, string>> = {};
        initialData.products.forEach((p: any) => {
          if (p.variant_attributes && Object.keys(p.variant_attributes).length) {
            variantMap[p.id] = p.variant_attributes;
          }
        });
        setSelectedVariants(variantMap);
      }

      if (initialData.image_urls?.length) {
        setExistingImageUrls(initialData.image_urls);
        setPackageImages([]);
      }
      if (initialData.image_ids?.length) {
        setImageIds(initialData.image_ids);
      }
      if (initialData.video_urls?.length) {
        setExistingVideoUrls(initialData.video_urls);
      }
      if (initialData.video_ids?.length) {
        setVideoIds(initialData.video_ids);
      }
    }
  }, [initialData]);

  useEffect(() => { setSubCategoryIds([]); }, [mainCategory]);

  const toggleSubCategory = (catId: number) => {
    setSubCategoryIds(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const toggleExistingProduct = (productId: number) => {
    setSelectedExistingProducts(prev => {
      if (prev.includes(productId)) {
        setSelectedVariants(v => {
          const copy = { ...v };
          delete copy[productId];
          return copy;
        });
        return prev.filter(id => id !== productId);
      }
      return prev.length < 10 ? [...prev, productId] : prev;
    });
  };

  const handleExistingProductClick = (product: any) => {
    if (product.orderable === false) return;
    if (selectedExistingProducts.includes(product.id)) {
      toggleExistingProduct(product.id);
      return;
    }
    if (hasSelectableVariants(product)) {
      setVariantModalProduct(product);
    } else {
      toggleExistingProduct(product.id);
    }
  };

  const handleVariantConfirm = (attrs: Record<string, string>) => {
    if (!variantModalProduct) return;
    const productId = variantModalProduct.id;
    if (!selectedExistingProducts.includes(productId)) {
      setSelectedExistingProducts(prev => [...prev, productId]);
    }
    setSelectedVariants(prev => ({ ...prev, [productId]: attrs }));
    setVariantModalProduct(null);
  };

  const addNewProduct = () => {
    setNewProducts(prev => [
      ...prev,
      {
        name: '',
        description: '',
        price: '',
        stock: '',
        weight_kg: '',
        length_cm: '',
        width_cm: '',
        height_cm: '',
        images: [],
        attributes: {},
      },
    ]);
  };

  const updateNewProduct = (index: number, field: string, value: string) => {
    setNewProducts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeNewProduct = (index: number) => {
    newProducts[index].images.forEach(img => URL.revokeObjectURL(img.preview));
    setNewProducts(prev => prev.filter((_, i) => i !== index));
  };

  const handleProductImageUpload = (productIndex: number, files: FileList | null) => {
    if (!files) return;
    if (newProducts[productIndex].images.length + files.length > 4) {
      alert('Maximum 4 images per product.');
      return;
    }
    const newImages = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewProducts(prev => {
      const updated = [...prev];
      updated[productIndex].images = [
        ...updated[productIndex].images,
        ...newImages,
      ];
      return updated;
    });
  };

  const removeProductImage = (productIndex: number, imageIndex: number) => {
    setNewProducts(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[productIndex].images[imageIndex].preview);
      updated[productIndex].images = updated[productIndex].images.filter(
        (_, i) => i !== imageIndex
      );
      return updated;
    });
  };

  const updateProductAttribute = (
    productIndex: number,
    attrName: string,
    value: string
  ) => {
    setNewProducts(prev => {
      const updated = [...prev];
      updated[productIndex] = {
        ...updated[productIndex],
        attributes: { ...updated[productIndex].attributes, [attrName]: value },
      };
      return updated;
    });
  };

  // ★ FIXED: include existing images in limit check
  const handlePackageImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = packageImages.length + existingImageUrls.length;
    if (files.length + totalImages > 3) {
      alert('Maximum 3 package images allowed.');
      return;
    }
    const newImages = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setPackageImages(prev => [...prev, ...newImages]);
  };

  const removePackageImage = (index: number) => {
    URL.revokeObjectURL(packageImages[index].preview);
    setPackageImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
    setImageIds(prev => prev.filter((_, i) => i !== index));
  };

  const handlePackageVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 50 * 1024 * 1024;
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`${file.name} exceeds 50MB limit.`);
        return false;
      }
      return true;
    });
    if (packageVideos.length + existingVideoUrls.length + validFiles.length > 1) {
      alert('Maximum 1 video allowed.');
      return;
    }
    setPackageVideos(prev => [...prev, ...validFiles]);
  };

  const removePackageVideo = (index: number) => {
    setPackageVideos(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingVideo = (index: number) => {
    setExistingVideoUrls(prev => prev.filter((_, i) => i !== index));
    setVideoIds(prev => prev.filter((_, i) => i !== index));
  };

  const addFeature = () => {
    const feature = packageDetails.newFeature.trim();
    if (feature && !packageDetails.features.includes(feature)) {
      setPackageDetails(prev => ({
        ...prev,
        features: [...prev.features, feature],
        newFeature: '',
      }));
    }
  };

  const removeFeature = (index: number) => {
    setPackageDetails(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!packageDetails.name.trim()) { alert('Please enter a package name.'); return; }
    const origPrice = parseFloat(packageDetails.original_price);
    const sellPrice = parseFloat(packageDetails.price);
    if (isNaN(sellPrice) || sellPrice <= 0) { alert('Please enter a valid selling price.'); return; }
    if (!isNaN(origPrice) && origPrice < sellPrice) {
      alert('Original price must be higher than selling price.');
      return;
    }
    const stock = parseInt(packageDetails.stock, 10);
    if (isNaN(stock) || stock < 0) { alert('Please enter a valid stock.'); return; }
    if (!mainCategory) { alert('Please select a main category.'); return; }
    const finalCategoryIds = subCategoryIds.length > 0 ? subCategoryIds : [parseInt(mainCategory)];
    if (finalCategoryIds.length === 0) { alert('Please select at least one category.'); return; }

    if (mode === 'existing' && maxPossibleStock !== Number.POSITIVE_INFINITY && stock > maxPossibleStock) {
      alert(`Stock cannot exceed the maximum possible (${maxPossibleStock}). Adjusted.`);
      setPackageDetails(prev => ({ ...prev, stock: maxPossibleStock.toString() }));
      return;
    }

    let productsData: { product_id: number; variant_attributes: Record<string, string> }[] = [];

    if (mode === 'existing') {
      if (selectedExistingProducts.length < 2) { alert('Please select at least 2 products.'); return; }
      for (const productId of selectedExistingProducts) {
        const product = sellerProducts?.find((p: any) => p.id === productId);
        if (product && hasSelectableVariants(product) && !selectedVariants[productId]) {
          alert(`Please select a variant for "${product.title}".`);
          return;
        }
      }
      selectedExistingProducts.forEach(productId => {
        productsData.push({
          product_id: productId,
          variant_attributes: selectedVariants[productId] || {},
        });
      });
    } else if (mode === 'new') {
      if (newProducts.length < 2) { alert('Please add at least 2 products.'); return; }

      for (const prod of newProducts) {
        if (!prod.name.trim()) { alert('Please fill in product name for all new products.'); return; }
        const prodPrice = parseFloat(prod.price);
        if (isNaN(prodPrice) || prodPrice <= 0) { alert('Please enter a valid price for all new products.'); return; }
        const prodStock = parseInt(prod.stock, 10);
        if (isNaN(prodStock) || prodStock < 0) { alert('Please enter valid stock for all new products.'); return; }

        // ★ Required weight & dimensions for delivery
        const weight = parseFloat(prod.weight_kg);
        const length = parseFloat(prod.length_cm);
        const width = parseFloat(prod.width_cm);
        const height = parseFloat(prod.height_cm);
        if (isNaN(weight) || weight <= 0) {
          alert(`Please enter a valid weight for "${prod.name}".`);
          return;
        }
        if (isNaN(length) || length <= 0 || isNaN(width) || width <= 0 || isNaN(height) || height <= 0) {
          alert(`Please enter valid dimensions for "${prod.name}".`);
          return;
        }

        const formData = new FormData();
        formData.append('product[title]', prod.name);
        formData.append('product[description]', prod.description || '');
        formData.append('product[price]', prodPrice.toString());
        formData.append('product[stock]', prodStock.toString());
        formData.append('product[status]', '1');
        formData.append('product[product_attributes]', JSON.stringify(prod.attributes));
        formData.append('product[weight_kg]', weight.toString());
        formData.append('product[length_cm]', length.toString());
        formData.append('product[width_cm]', width.toString());
        formData.append('product[height_cm]', height.toString());
        prod.images.forEach(img => {
          if (img.file) formData.append('product[images][]', img.file);
        });

        try {
          const res = await api.post('/products', formData);
          productsData.push({
            product_id: res.data.id,
            variant_attributes: {},
          });
        } catch (err) {
          console.error('Failed to create product:', err);
          alert(`Failed to create product "${prod.name}". Please try again.`);
          return;
        }
      }
    } else {
      alert('Please choose a mode.');
      return;
    }

    const packageFormData = new FormData();
    packageFormData.append('package[name]', packageDetails.name);
    packageFormData.append('package[description]', packageDetails.description);
    packageFormData.append('package[price]', sellPrice.toString());
    packageFormData.append('package[stock]', stock.toString());
    packageFormData.append('package[status]', packageDetails.status);
    packageFormData.append('package[featured]', 'false');
    packageFormData.append('package[features]', JSON.stringify(packageDetails.features));

    if (!isNaN(origPrice) && origPrice > 0 && origPrice > sellPrice) {
      const pct = Math.round(((origPrice - sellPrice) / origPrice) * 100);
      packageFormData.append('package[discount_type]', 'percentage');
      packageFormData.append('package[discount_value]', pct.toString());
    } else {
      packageFormData.append('package[discount_type]', '');
      packageFormData.append('package[discount_value]', '');
    }
    if (!isNaN(origPrice) && origPrice > 0) {
      packageFormData.append('package[original_price]', origPrice.toString());
    }

    packageFormData.append('package[seller_pays_shipping]', packageDetails.seller_pays_shipping ? 'true' : 'false');
    if (packageDetails.seller_pays_shipping) {
      packageFormData.append('package[shipping_subsidy_type]', packageDetails.shipping_subsidy_type);
      if (packageDetails.shipping_subsidy_type === 'percent') {
        packageFormData.append('package[shipping_subsidy_value]', packageDetails.shipping_subsidy_value || '0');
      }
    }

    finalCategoryIds.forEach(id =>
      packageFormData.append('package[category_ids][]', id.toString())
    );
    packageFormData.append('package[products]', JSON.stringify(productsData));

    if (initialData) {
      if (imageIds.length > 0) {
        packageFormData.append('package[keep_image_ids]', imageIds.join(','));
      }
      if (videoIds.length > 0) {
        packageFormData.append('package[keep_video_ids]', videoIds.join(','));
      }
    }

    packageImages.forEach(img => {
      if (img.file) packageFormData.append('package[images][]', img.file);
    });
    packageVideos.forEach(file => {
      packageFormData.append('package[videos][]', file);
    });

    packageFormData.append('package[discount_start]', '');
    packageFormData.append('package[discount_end]', '');

    setSubmitting(true);
    try {
      await onSave(packageFormData);
    } catch (err) {
      // handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return mode !== null;
    if (step === 2) {
      if (mode === 'existing') {
        const allValid = selectedExistingProducts.every(id => {
          const product = sellerProducts?.find((p: any) => p.id === id);
          if (!product) return false;
          return !hasSelectableVariants(product) || !!selectedVariants[id];
        });
        return selectedExistingProducts.length >= 2 && allValid;
      }
      if (mode === 'new') return newProducts.length >= 2;
    }
    if (step === 3) {
      return (
        packageDetails.name.trim() &&
        parseFloat(packageDetails.price) > 0 &&
        parseInt(packageDetails.stock) >= 0 &&
        !!mainCategory
      );
    }
    return true;
  };

  const steps = [
    { number: 1, title: 'Choose Mode' },
    { number: 2, title: mode === 'existing' ? 'Select Products' : 'Create Products' },
    { number: 3, title: 'Package Details' },
    { number: 4, title: 'Preview & Publish' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[var(--radius-md)] shadow-elevated max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-border-light flex justify-between items-center">
          <h2 className="text-base font-semibold text-text-primary">
            {initialData ? 'Edit Package' : 'Package Builder'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-hover transition">
            <XMarkIcon className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="px-5 pt-4">
          <div className="flex justify-between">
            {steps.map(s => (
              <div key={s.number} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    s.number === step
                      ? 'bg-brand text-white'
                      : s.number < step
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-text-secondary'
                  }`}
                >
                  {s.number < step ? '✓' : s.number}
                </div>
                <span
                  className={`ml-2 text-sm ${
                    s.number === step ? 'font-semibold text-text-primary' : 'text-text-muted'
                  }`}
                >
                  {s.title}
                </span>
                {s.number < steps.length && <div className="w-12 h-0.5 mx-2 bg-border-light" />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            {/* Step 1 – Choose mode */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-2 gap-6"
              >
                <button
                  onClick={() => { setMode('existing'); setStep(2); }}
                  className="card-product p-8 flex flex-col items-center text-center border-2 border-transparent hover:border-brand transition"
                >
                  <div className="text-5xl mb-4">📦</div>
                  <h3 className="text-base font-semibold text-text-primary mb-2">From Existing Products</h3>
                  <p className="text-sm text-text-secondary">Bundle products you’ve already listed.</p>
                </button>
                <button
                  onClick={() => { setMode('new'); setStep(2); }}
                  className="card-product p-8 flex flex-col items-center text-center border-2 border-transparent hover:border-brand transition"
                >
                  <div className="text-5xl mb-4">✨</div>
                  <h3 className="text-base font-semibold text-text-primary mb-2">Create New Products</h3>
                  <p className="text-sm text-text-secondary">
                    Add new products with images and details right now.
                  </p>
                </button>
              </motion.div>
            )}

            {/* Step 2 – Existing products */}
            {step === 2 && mode === 'existing' && (
              <motion.div
                key="step2-existing"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-base font-semibold text-text-primary">
                  Select Products (minimum 2 – {selectedExistingProducts.length}/10)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
                  {sellerProducts?.map((product: any) => {
                    const selected = selectedExistingProducts.includes(product.id);
                    const variantAttrs = selectedVariants[product.id];
                    const displayPrice = product.effective_price || product.price || 0;
                    const canSelect = product.orderable !== false;

                    const showVariantBadge = hasSelectableVariants(product);
                    let stockDisplay: string = '0';

                    if (!showVariantBadge) {
                      stockDisplay = product.available_stock == null
                        ? 'Unlimited'
                        : product.available_stock.toString();
                    } else {
                      if (variantAttrs) {
                        const matched = product.variants?.find((v: any) =>
                          v.attributes &&
                          Object.entries(variantAttrs).every(([k, val]) => v.attributes[k] === val)
                        );
                        if (matched) {
                          stockDisplay = (matched.unlimited_stock || matched.stock === null)
                            ? 'Unlimited'
                            : (parseVariantStock(matched)?.toString() ?? (product.stock_display || '0'));
                        } else {
                          stockDisplay = 'Select variant for stock';
                        }
                      } else {
                        stockDisplay = 'Select variant for stock';
                      }
                    }

                    return (
                      <div
                        key={product.id}
                        onClick={() => canSelect && handleExistingProductClick(product)}
                        className={`card-product p-3 border-2 transition relative ${
                          selected ? 'border-brand shadow-elevated' : 'border-transparent hover:border-border-medium'
                        } ${!canSelect ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <img
                          src={product.image_urls?.[0] || '/placeholder.jpg'}
                          alt={product.title}
                          className="w-full h-24 object-cover rounded-[var(--radius-sm)] mb-2"
                        />
                        <p className="text-sm font-medium text-text-primary truncate">
                          {product.title}
                        </p>
                        <p className="text-xs text-text-muted">ETB {displayPrice}</p>
                        <p className="text-xs text-text-muted">
                          Stock: {stockDisplay}
                        </p>
                        {showVariantBadge && (
                          <div className="mt-1">
                            {variantAttrs ? (
                              <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                                {Object.values(variantAttrs).join(', ')}
                              </span>
                            ) : (
                              <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                                <Cog6ToothIcon className="w-3 h-3" /> Choose variant
                              </span>
                            )}
                          </div>
                        )}
                        {!canSelect && (
                          <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-[var(--radius-sm)]">
                            <span className="text-xs font-medium text-red-600 bg-white px-2 py-1 rounded shadow">
                              {product.unavailable_reason || 'Unavailable'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {selectedExistingProducts.length < 2 && (
                  <p className="text-red-500 text-sm mt-1">Please select at least 2 products.</p>
                )}
                {limitingProductsDetails.length > 0 && (
                  <div className="text-sm text-orange-600 mt-2 bg-orange-50 p-3 rounded">
                    📦 You can create up to <strong>{maxPossibleStock === Number.POSITIVE_INFINITY ? 'unlimited' : maxPossibleStock}</strong> packages because:
                    <ul className="list-disc ml-5 mt-1">
                      {limitingProductsDetails.map((detail, i) => (
                        <li key={i}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button onClick={() => setStep(1)} className="btn-secondary text-sm px-4 py-2">
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!canProceed()}
                    className="btn-cta text-sm px-4 py-2 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2 – New products */}
            {step === 2 && mode === 'new' && (
              <motion.div
                key="step2-new"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-base font-semibold text-text-primary">
                  Create Products (minimum 2 – {newProducts.length} added)
                </h3>
                <button
                  onClick={addNewProduct}
                  className="btn-cta inline-flex items-center gap-2 px-4 py-2 text-sm"
                >
                  <PlusIcon className="w-4 h-4" /> Add Product
                </button>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {newProducts.map((prod, idx) => (
                    <div key={idx} className="card-product p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-sm text-text-primary">Product {idx + 1}</h4>
                        <button
                          onClick={() => removeNewProduct(idx)}
                          className="text-red-500 p-1"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Product Name"
                          value={prod.name}
                          onChange={e => updateNewProduct(idx, 'name', e.target.value)}
                          className={inputClass + ' col-span-2'}
                        />
                        <textarea
                          placeholder="Description"
                          rows={2}
                          value={prod.description}
                          onChange={e => updateNewProduct(idx, 'description', e.target.value)}
                          className={textareaClass + ' col-span-2'}
                        />
                        <input
                          type="number"
                          placeholder="Price (ETB)"
                          value={prod.price}
                          onChange={e => updateNewProduct(idx, 'price', e.target.value)}
                          className={inputClass}
                        />
                        <input
                          type="number"
                          placeholder="Stock"
                          value={prod.stock}
                          onChange={e => updateNewProduct(idx, 'stock', e.target.value)}
                          className={inputClass}
                        />
                      </div>

                      {/* ★ Weight & Dimensions (required for delivery) */}
                      <div className="mt-3">
                        <p className="text-sm font-medium text-text-primary mb-1">
                          Weight & Dimensions (required)
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Weight (kg)"
                            value={prod.weight_kg}
                            onChange={e => updateNewProduct(idx, 'weight_kg', e.target.value)}
                            className={inputClass}
                          />
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Length (cm)"
                            value={prod.length_cm}
                            onChange={e => updateNewProduct(idx, 'length_cm', e.target.value)}
                            className={inputClass}
                          />
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Width (cm)"
                            value={prod.width_cm}
                            onChange={e => updateNewProduct(idx, 'width_cm', e.target.value)}
                            className={inputClass}
                          />
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Height (cm)"
                            value={prod.height_cm}
                            onChange={e => updateNewProduct(idx, 'height_cm', e.target.value)}
                            className={inputClass}
                          />
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="text-sm font-medium text-text-primary mb-1">
                          Product Images (up to 4)
                        </p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {prod.images.map((img, imgIdx) => (
                            <div key={imgIdx} className="relative group">
                              <img
                                src={img.preview}
                                alt=""
                                className="w-16 h-16 object-cover rounded-[var(--radius-sm)]"
                              />
                              <button
                                onClick={() => removeProductImage(idx, imgIdx)}
                                className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100"
                              >
                                <XMarkIcon className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {prod.images.length < 4 && (
                            <label className="cursor-pointer bg-surface-hover hover:bg-gray-100 w-16 h-16 flex flex-col items-center justify-center border border-dashed border-border-light rounded-[var(--radius-sm)] text-xs text-text-muted">
                              <PhotoIcon className="w-4 h-4 mb-1" />
                              Add
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={e => handleProductImageUpload(idx, e.target.files)}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {newProducts.length < 2 && (
                  <p className="text-red-500 text-sm mt-1">Please add at least 2 products.</p>
                )}
                <div className="flex justify-end gap-2">
                  <button onClick={() => setStep(1)} className="btn-secondary text-sm px-4 py-2">
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!canProceed()}
                    className="btn-cta text-sm px-4 py-2 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3 – Package details */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-base font-semibold text-text-primary">Package Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Package Name
                    </label>
                    <input
                      type="text"
                      value={packageDetails.name}
                      onChange={e =>
                        setPackageDetails({ ...packageDetails, name: e.target.value })
                      }
                      className={inputClass}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Package Description
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Describe your package, key benefits, etc."
                      value={packageDetails.description}
                      onChange={e =>
                        setPackageDetails({ ...packageDetails, description: e.target.value })
                      }
                      className={textareaClass}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Original Price (ETB)
                      <span className="text-xs text-text-muted ml-1">(auto‑calculated from products)</span>
                    </label>
                    <input
                      type="number"
                      value={packageDetails.original_price}
                      onChange={e =>
                        setPackageDetails({ ...packageDetails, original_price: e.target.value })
                      }
                      className={inputClass}
                      placeholder={`Sum: ${totalProductSum}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Selling Price (ETB)
                      <span className="text-xs text-text-muted ml-1">(discounted price)</span>
                    </label>
                    <input
                      type="number"
                      value={packageDetails.price}
                      onChange={e =>
                        setPackageDetails({ ...packageDetails, price: e.target.value })
                      }
                      className={inputClass}
                      placeholder="e.g. 19,999"
                      required
                    />
                  </div>
                </div>

                {/* Stock – with reason */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Stock * <span className="text-xs text-text-muted">
                      (max. {maxPossibleStock === Number.POSITIVE_INFINITY ? 'unlimited' : maxPossibleStock} packages possible)
                    </span>
                  </label>
                  <input
                    type="number"
                    value={packageDetails.stock}
                    onChange={e => {
                      let val = parseInt(e.target.value, 10);
                      if (isNaN(val)) val = 0;
                      if (maxPossibleStock !== Number.POSITIVE_INFINITY && val > maxPossibleStock) {
                        val = maxPossibleStock;
                        alert(`Maximum ${maxPossibleStock} packages possible. Stock adjusted.`);
                      }
                      setPackageDetails({ ...packageDetails, stock: val.toString() });
                    }}
                    className={inputClass}
                    min="0"
                    max={maxPossibleStock === Number.POSITIVE_INFINITY ? undefined : maxPossibleStock}
                    required
                  />
                  {limitingProductsDetails.length > 0 && (
                    <div className="text-xs text-orange-600 mt-1 bg-orange-50 p-2 rounded">
                      📦 Maximum {maxPossibleStock === Number.POSITIVE_INFINITY ? 'unlimited' : maxPossibleStock} packages possible because:
                      <ul className="list-disc ml-4 mt-0.5">
                        {limitingProductsDetails.map((detail, i) => (
                          <li key={i}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Delivery Subsidy */}
                <div className="border border-border-light rounded-[var(--radius-sm)] p-4 bg-surface-hover space-y-3">
                  <h4 className="text-sm font-semibold text-text-primary">Delivery Subsidy</h4>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={packageDetails.seller_pays_shipping}
                      onChange={e =>
                        setPackageDetails({
                          ...packageDetails,
                          seller_pays_shipping: e.target.checked,
                        })
                      }
                      className="rounded border-border-light text-brand focus:ring-brand"
                    />
                    I will pay delivery for this package
                  </label>
                  {packageDetails.seller_pays_shipping && (
                    <div className="ml-6 space-y-2">
                      <select
                        value={packageDetails.shipping_subsidy_type}
                        onChange={e =>
                          setPackageDetails({
                            ...packageDetails,
                            shipping_subsidy_type: e.target.value as 'full' | 'percent',
                          })
                        }
                        className={inputClass}
                      >
                        <option value="full">Full delivery</option>
                        <option value="percent">Percentage of delivery</option>
                      </select>
                      {packageDetails.shipping_subsidy_type === 'percent' && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={packageDetails.shipping_subsidy_value}
                            onChange={e =>
                              setPackageDetails({
                                ...packageDetails,
                                shipping_subsidy_value: e.target.value,
                              })
                            }
                            placeholder="e.g. 50"
                            className={inputClass + ' w-24'}
                          />
                          <span className="text-xs text-text-muted">%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Main Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={mainCategory}
                    onChange={e => setMainCategory(e.target.value)}
                    className={inputClass}
                    required
                  >
                    <option value="">Select Main Category</option>
                    {mainCategories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {mainCategory && subCategories.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Subcategories (optional, select all that apply)
                    </label>
                    <div className="max-h-40 overflow-y-auto border border-border-light rounded-[var(--radius-sm)] p-3 bg-white">
                      {subCategories.map((cat: any) => (
                        <label
                          key={cat.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-surface-hover p-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={subCategoryIds.includes(cat.id)}
                            onChange={() => toggleSubCategory(cat.id)}
                            className="rounded border-border-light text-brand focus:ring-brand"
                          />
                          <span className="text-sm text-text-secondary">{cat.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Package Features */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Package Highlights (trust badges)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {packageDetails.features.map((f, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 bg-green-50 text-green-800 text-xs px-2 py-1 rounded-full"
                      >
                        {f}
                        <button
                          type="button"
                          onClick={() => removeFeature(i)}
                          className="text-green-600 hover:text-red-500"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={packageDetails.newFeature}
                      onChange={e =>
                        setPackageDetails({ ...packageDetails, newFeature: e.target.value })
                      }
                      onKeyDown={e =>
                        e.key === 'Enter' && (e.preventDefault(), addFeature())
                      }
                      placeholder="e.g. 1 year warranty, Free returns"
                      className={inputClass + ' flex-1'}
                    />
                    <button
                      type="button"
                      onClick={addFeature}
                      className="btn-secondary text-xs px-3 py-1"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Package Media Section */}
                <div className="border border-border-light rounded-[var(--radius-sm)] p-4 bg-surface-hover">
                  <h4 className="text-sm font-semibold text-text-primary mb-1">
                    Package Media (optional)
                  </h4>
                  <p className="text-xs text-text-secondary mb-3">
                    Add images and a video to showcase your package.
                  </p>

                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Images (up to 3)
                  </label>
                  {existingImageUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {existingImageUrls.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={url}
                            alt=""
                            className="w-full h-20 object-cover rounded-[var(--radius-sm)] border border-border-light"
                          />
                          <button
                            onClick={() => removeExistingImage(idx)}
                            className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <label className="cursor-pointer bg-surface-hover hover:bg-gray-100 px-4 py-2 rounded-[var(--radius-sm)] border border-border-light flex items-center gap-2 text-sm">
                      <PhotoIcon className="w-4 h-4 text-text-secondary" /> Choose Images
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePackageImageUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-xs text-text-muted">
                      {packageImages.length + existingImageUrls.length}/3
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {packageImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img.preview}
                          alt=""
                          className="w-full h-20 object-cover rounded-[var(--radius-sm)] border border-border-light"
                        />
                        <button
                          onClick={() => removePackageImage(idx)}
                          className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Video (up to 1, 50MB max)
                    </label>
                    {existingVideoUrls.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {existingVideoUrls.map((url, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs bg-gray-100 px-2 py-1 rounded"
                          >
                            <span>Video {idx + 1}</span>
                            <span className="text-gray-500">(existing)</span>
                            <button
                              type="button"
                              onClick={() => removeExistingVideo(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded border border-blue-200 text-sm font-medium transition">
                        <VideoCameraIcon className="w-4 h-4" />
                        Choose Video
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          onChange={handlePackageVideoUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-xs text-gray-500">
                        {packageVideos.length + existingVideoUrls.length}/1
                      </span>
                    </div>
                    {packageVideos.length > 0 && (
                      <div className="space-y-1">
                        {packageVideos.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs bg-gray-100 px-2 py-1 rounded"
                          >
                            <span className="truncate">
                              {file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)
                            </span>
                            <button
                              type="button"
                              onClick={() => removePackageVideo(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setStep(2)} className="btn-secondary text-sm px-4 py-2">
                    Back
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    disabled={!canProceed()}
                    className="btn-cta text-sm px-4 py-2 disabled:opacity-50"
                  >
                    Preview
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4 – Preview & Publish */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-base font-semibold text-text-primary">Preview</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="card-product p-5">
                    <div className="grid grid-cols-2 gap-2">
                      {(mode === 'existing'
                        ? sellerProducts
                            ?.filter((p: any) => selectedExistingProducts.includes(p.id))
                            .flatMap((p: any) => p.image_urls?.slice(0, 1) || [])
                            .slice(0, 4)
                        : newProducts
                            .flatMap(p => p.images.slice(0, 1))
                            .map(img => img.preview)
                            .slice(0, 4)
                      ).map((src: string, i: number) => (
                        <div key={i} className="overflow-hidden rounded-[var(--radius-sm)]">
                          <img src={src} className="w-full h-24 object-cover" />
                        </div>
                      ))}
                    </div>
                    <h4 className="text-base font-semibold text-text-primary mt-3">
                      {packageDetails.name || 'Package Name'}
                    </h4>
                    <p className="text-sm text-text-secondary">{packageDetails.description}</p>
                    {packageDetails.features.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {packageDetails.features.map((f, i) => (
                          <span
                            key={i}
                            className="bg-green-50 text-green-800 text-[10px] px-2 py-0.5 rounded-full"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-xl font-bold text-brand">
                        ETB {parseFloat(packageDetails.price).toLocaleString()}
                      </span>
                      {(() => {
                        const orig = parseFloat(packageDetails.original_price);
                        const sell = parseFloat(packageDetails.price);
                        if (!isNaN(orig) && !isNaN(sell) && orig > sell) {
                          const pct = Math.round(((orig - sell) / orig) * 100);
                          return (
                            <>
                              <span className="text-sm line-through text-text-muted">
                                ETB {orig.toLocaleString()}
                              </span>
                              <span className="badge-discount text-xs px-2 py-0.5">-{pct}%</span>
                            </>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <p className="text-xs text-text-muted">
                      Stock: {packageDetails.stock || 'Unlimited'}
                    </p>

                    {packageDetails.seller_pays_shipping && (
                      <p className="text-brand text-xs font-medium mt-1">
                        Seller covers delivery:{' '}
                        {packageDetails.shipping_subsidy_type === 'full'
                          ? 'Full delivery cost'
                          : `${packageDetails.shipping_subsidy_value}% of delivery`}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-text-primary">
                      Products (
                      {mode === 'existing'
                        ? selectedExistingProducts.length
                        : newProducts.length}
                      )
                    </h4>
                    {mode === 'existing' &&
                      selectedExistingProducts.map(pid => {
                        const prod = sellerProducts?.find((p: any) => p.id === pid);
                        const variantAttrs = selectedVariants[pid];
                        const productDisplayPrice = prod?.effective_price || prod?.price || 0;
                        return (
                          <div
                            key={pid}
                            className="flex items-center gap-3 bg-surface-hover p-3 rounded-[var(--radius-sm)]"
                          >
                            <img
                              src={prod?.image_urls?.[0] || '/placeholder.jpg'}
                              className="w-10 h-10 object-cover rounded"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-text-primary">{prod?.title}</span>
                              {variantAttrs && Object.keys(variantAttrs).length > 0 && (
                                <div className="text-xs text-purple-700 mt-0.5">
                                  {Object.entries(variantAttrs).map(([k,v]) => `${k}: ${v}`).join(', ')}
                                </div>
                              )}
                            </div>
                            <span className="text-sm text-text-secondary">
                              ETB {productDisplayPrice.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    {mode === 'new' &&
                      newProducts.map((prod, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 bg-surface-hover p-3 rounded-[var(--radius-sm)]"
                        >
                          {prod.images[0] && (
                            <img
                              src={prod.images[0].preview}
                              className="w-10 h-10 object-cover rounded"
                            />
                          )}
                          <span className="text-sm font-medium text-text-primary">
                            {prod.name || 'New Product'}
                          </span>
                          <span className="ml-auto text-sm text-text-secondary">
                            ETB {parseFloat(prod.price).toLocaleString()}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-border-light">
                  <button onClick={() => setStep(3)} className="btn-secondary text-sm px-4 py-2">
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="btn-cta text-sm px-6 py-2"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : initialData ? 'Update Package' : 'Publish Package'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Variant selection modal */}
        <AnimatePresence>
          {variantModalProduct && (
            <VariantModal
              product={variantModalProduct}
              onSelect={handleVariantConfirm}
              onClose={() => setVariantModalProduct(null)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default PackageBuilder;