// src/components/seller/ProductFormModal.tsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon, PhotoIcon, PlusIcon, SparklesIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { useQuery } from 'react-query';
import api from '../../lib/axios';
import VariantsBuilder from './VariantsBuilder';

const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow-lg z-50 flex items-center gap-2">
    <span className="text-sm">{message}</span>
    <button onClick={onClose} className="text-white hover:text-gray-300">
      <XMarkIcon className="w-4 h-4" />
    </button>
  </div>
);

interface AttributeDefinition {
  id: number;
  name: string;
  display_name: string;
  attr_type: string;
  is_filterable: boolean;
  is_variant: boolean;
  is_required: boolean;
  values: string[];
}

interface ProductFormModalProps {
  product?: any;
  onClose: () => void;
  onSave: (formData: FormData) => Promise<void> | void;
}

const ProductFormModal = ({ product, onClose, onSave }: ProductFormModalProps) => {
  const [form, setForm] = useState(
    product
      ? {
          title: product.title || '',
          description: product.description || '',
          images: (product.image_urls || []).map((url: string, index: number) => ({
            file: null as File | null,
            preview: url,
            attachmentId: product.image_ids?.[index],
          })),
          existingVideos: product.video_urls || [],
          existingVideoIds: product.video_ids || [],
          product_attributes: product.product_attributes || ({} as Record<string, string>),
          variants: product.variants || ([] as any[]),
          price: product.price ?? '',
          stock: product.stock ?? '',
          discount_type: product.discount_type || 'percent',
          discount_value: product.discount_value ?? '',
          seller_pays_shipping: product.seller_pays_shipping || false,
          shipping_subsidy_type: product.shipping_subsidy_type === 'fixed' ? 'full' : (product.shipping_subsidy_type || 'full'),
          shipping_subsidy_value: product.shipping_subsidy_value ?? '',
          videos: [] as File[],
          bulk_enabled: product.bulk_enabled === true || product.bulk_enabled === 'true' || false,
          minimum_bulk_quantity: product.minimum_bulk_quantity != null ? product.minimum_bulk_quantity : '',
          max_quantity_per_day: product.max_quantity_per_day != null ? product.max_quantity_per_day : '',
          weight_kg: product.weight_kg != null ? product.weight_kg : '',
          length_cm: product.length_cm != null ? product.length_cm : '',
          width_cm: product.width_cm != null ? product.width_cm : '',
          height_cm: product.height_cm != null ? product.height_cm : '',
        }
      : {
          title: '',
          description: '',
          images: [] as { file: File | null; preview: string; attachmentId?: number }[],
          existingVideos: [] as string[],
          existingVideoIds: [] as number[],
          product_attributes: {} as Record<string, string>,
          variants: [] as any[],
          price: '',
          stock: '',
          discount_type: 'percent',
          discount_value: '',
          seller_pays_shipping: false,
          shipping_subsidy_type: 'full',
          shipping_subsidy_value: '',
          videos: [] as File[],
          bulk_enabled: false,
          minimum_bulk_quantity: '',
          max_quantity_per_day: '',
          weight_kg: '',
          length_cm: '',
          width_cm: '',
          height_cm: '',
        }
  );

  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string } | null>(null);

  // Ref for image URLs cleanup on unmount
  const imagesRef = useRef(form.images);
  useEffect(() => {
    imagesRef.current = form.images;
  }, [form.images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => {
        if (img.file) URL.revokeObjectURL(img.preview);
      });
    };
  }, []);

  const showToast = (msg: string) => {
    setToast({ message: msg });
    setTimeout(() => setToast(null), 3000);
  };

  const sellerDiscount = useMemo(() => {
    if (!form.discount_value) return null;
    const val = parseFloat(form.discount_value);
    if (isNaN(val) || val <= 0) return null;
    if (form.discount_type === 'percent' && val > 100) return null;
    return form.discount_type === 'percent' ? `${val}% off` : `ETB ${val} off`;
  }, [form.discount_type, form.discount_value]);

  const { data: categories, isLoading: categoriesLoading } = useQuery(
    'categories',
    () => api.get('/categories').then((res) => res.data)
  );

  const categoryId = subCategory || mainCategory;

  const { data: filterData } = useQuery(
    ['filterOptions', categoryId],
    () => api.get('/filters', { params: { category: categoryId } }).then(res => res.data),
    { enabled: !!categoryId }
  );

  const allCategoryAttrs: AttributeDefinition[] = filterData?.attributes || [];
  const baseAttrs = allCategoryAttrs.filter(a => !a.is_variant);
  const variantAttrs = allCategoryAttrs.filter(a => a.is_variant);
  const requiredBaseAttrs = baseAttrs.filter(a => a.is_required || a.name === 'condition');
  const optionalBaseAttrs = baseAttrs.filter(a => !a.is_required && a.name !== 'condition' && !a.is_variant);
  const [extraAttrs, setExtraAttrs] = useState<string[]>([]);

  const hasVariants = variantAttrs.length > 0;
  const hasAnyVariants = hasVariants || (form.variants && form.variants.length > 0);

  const addOptionalAttr = (attrName: string) => {
    if (!extraAttrs.includes(attrName)) setExtraAttrs([...extraAttrs, attrName]);
  };
  const removeOptionalAttr = (attrName: string) => {
    setExtraAttrs(extraAttrs.filter(a => a !== attrName));
    const updated = { ...form.product_attributes };
    delete updated[attrName];
    setForm(prev => ({ ...prev, product_attributes: updated }));
  };

  useEffect(() => {
    if (product?.category && categories) {
      const cat = product.category;
      if (cat.parent_id) {
        setMainCategory(cat.parent_id.toString());
        setSubCategory(cat.id.toString());
      } else {
        setMainCategory(cat.id.toString());
        setSubCategory('');
      }
    }
  }, [product, categories]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const currentTotal = form.images.length;
    if (files.length + currentTotal > 6) {
      showToast('Maximum 6 images allowed.');
      return;
    }
    const newImages = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setForm({ ...form, images: [...form.images, ...newImages] });
  };

  const removeImage = (index: number) => {
    const img = form.images[index];
    if (img.file) URL.revokeObjectURL(img.preview);
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) });
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (form.existingVideos.length + form.videos.length >= 1) {
      showToast('Only one video is allowed.');
      return;
    }
    const file = files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      showToast('Video must be under 50MB.');
      return;
    }
    setForm({ ...form, videos: [file] });
  };

  const removeVideo = () => {
    setForm({ ...form, videos: [] });
  };

  const removeExistingVideo = (index: number) => {
    setForm(prev => ({
      ...prev,
      existingVideos: prev.existingVideos.filter((_, i) => i !== index),
      existingVideoIds: prev.existingVideoIds.filter((_, i) => i !== index),
    }));
  };

  const generateAIDescription = () => {
    setAiLoading(true);
    setTimeout(() => {
      const suggestions = [
        'This premium product is crafted with the finest materials, ensuring durability and style.',
        'Experience unmatched quality and comfort with this Ethiopian‑made masterpiece.',
        'Perfect for daily use, this item combines tradition with modern design.',
      ];
      const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
      setForm({ ...form, description: randomSuggestion });
      setAiLoading(false);
    }, 1000);
  };

  const handleAttrChange = (key: string, value: string) => {
    setForm(prev => ({
      ...prev,
      product_attributes: { ...prev.product_attributes, [key]: value },
    }));
  };

  const handleDiscountValueChange = (value: string) => {
    if (value.startsWith('-')) return;
    if (form.discount_type === 'percent') {
      const num = parseFloat(value);
      if (!isNaN(num) && num > 100) return;
    }
    setForm({ ...form, discount_value: value });
  };

  const handleDiscountValueBlur = () => {
    const v = parseFloat(form.discount_value);
    if (isNaN(v) || v <= 0) {
      setForm({ ...form, discount_value: '' });
      showToast('Discount value must be greater than 0.');
      return;
    }
    if (form.discount_type === 'percent' && v > 100) {
      setForm({ ...form, discount_value: '100' });
      showToast('Percentage discount cannot exceed 100%.');
    }
  };

  const handleShippingValueChange = (value: string) => {
    if (value.startsWith('-')) return;
    const num = parseFloat(value);
    if (!isNaN(num) && num > 100) return;
    setForm({ ...form, shipping_subsidy_value: value });
  };

  const handleShippingValueBlur = () => {
    const v = parseFloat(form.shipping_subsidy_value);
    if (isNaN(v) || v <= 0) {
      setForm({ ...form, shipping_subsidy_value: '' });
      showToast('Subsidy value must be greater than 0.');
      return;
    }
    if (v > 100) {
      setForm({ ...form, shipping_subsidy_value: '100' });
      showToast('Shipping subsidy percentage cannot exceed 100%.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const catId = subCategory || mainCategory;
    if (!catId) { showToast('Please select a category.'); return; }
    if (!form.title.trim()) { showToast('Title is required.'); return; }
    if (form.images.length === 0) { showToast('At least one product image is required.'); return; }

    // Required weight & dimensions for delivery
    if (!form.weight_kg || parseFloat(form.weight_kg) <= 0) { showToast('Weight is required.'); return; }
    if (!form.length_cm || parseFloat(form.length_cm) <= 0) { showToast('Length is required.'); return; }
    if (!form.width_cm || parseFloat(form.width_cm) <= 0) { showToast('Width is required.'); return; }
    if (!form.height_cm || parseFloat(form.height_cm) <= 0) { showToast('Height is required.'); return; }

    if (form.discount_value) {
      const val = parseFloat(form.discount_value);
      if (isNaN(val) || val <= 0) {
        showToast('Discount value must be a positive number.');
        return;
      }
      if (form.discount_type === 'percent' && val > 100) {
        showToast('Percentage discount cannot exceed 100%.');
        return;
      }
    }

    if (form.seller_pays_shipping && form.shipping_subsidy_type === 'percent') {
      if (!form.shipping_subsidy_value) {
        showToast('Please enter a shipping subsidy percentage.');
        return;
      }
      const subVal = parseFloat(form.shipping_subsidy_value);
      if (isNaN(subVal) || subVal <= 0) {
        showToast('Shipping subsidy must be a positive number.');
        return;
      }
      if (subVal > 100) {
        showToast('Shipping subsidy percentage cannot exceed 100%.');
        return;
      }
    }

    if (form.bulk_enabled) {
      if (!form.minimum_bulk_quantity || parseInt(form.minimum_bulk_quantity) < 1) {
        showToast('Minimum order quantity must be a positive number.');
        return;
      }
      if (form.max_quantity_per_day && parseInt(form.max_quantity_per_day) < 1) {
        showToast('Maximum quantity per day must be a positive number.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('product[title]', form.title);
      formData.append('product[description]', form.description);
      formData.append('product[category_id]', catId);

      if (!hasAnyVariants) {
        formData.append('product[price]', form.price);
      }

      if (!hasAnyVariants) {
        formData.append('product[stock]', form.stock);
      }

      if (form.discount_value && parseFloat(form.discount_value) > 0) {
        formData.append('product[discount_type]', form.discount_type);
        formData.append('product[discount_value]', form.discount_value);
      }

      const keepImageIds = form.images
        .filter(img => img.file === null && img.attachmentId != null)
        .map(img => img.attachmentId)
        .join(',');
      if (keepImageIds) formData.append('product[keep_image_ids]', keepImageIds);

      form.images.forEach(img => {
        if (img.file && img.file instanceof File) {
          formData.append('product[images][]', img.file);
        }
      });

      if (form.existingVideoIds.length > 0) {
        formData.append('product[keep_video_ids]', form.existingVideoIds.join(','));
      }

      if (form.videos.length === 1) {
        formData.append('product[videos][]', form.videos[0]);
      }

      formData.append('product[product_attributes]', JSON.stringify(form.product_attributes));

      if (form.variants.length > 0) {
        formData.append('product[variants]', JSON.stringify(form.variants));
      }

      if (form.seller_pays_shipping) {
        let finalType = form.shipping_subsidy_type;
        let finalValue = form.shipping_subsidy_value;

        if (finalType === 'percent' && parseFloat(finalValue) === 100) {
          finalType = 'full';
          finalValue = '';
        }

        formData.append('product[seller_pays_shipping]', 'true');
        formData.append('product[shipping_subsidy_type]', finalType);
        formData.append('product[shipping_subsidy_value]', finalType !== 'full' ? finalValue : '');
      } else {
        formData.append('product[seller_pays_shipping]', 'false');
      }

      formData.append('product[bulk_enabled]', form.bulk_enabled ? 'true' : 'false');
      formData.append('product[minimum_bulk_quantity]', form.minimum_bulk_quantity || '1');
      formData.append('product[max_quantity_per_day]', form.max_quantity_per_day || '');

      formData.append('product[weight_kg]', form.weight_kg);
      formData.append('product[length_cm]', form.length_cm);
      formData.append('product[width_cm]', form.width_cm);
      formData.append('product[height_cm]', form.height_cm);

      await onSave(formData);
    } catch (err: any) {
      const msg = err?.response?.data?.errors?.join(', ') ||
                  err?.response?.data?.error ||
                  err?.message ||
                  'Failed to save product. Please try again.';
      showToast(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (categoriesLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-6 rounded-[var(--radius-md)] text-sm text-text-muted">Loading categories...</div>
      </div>
    );
  }

  const mainCategories = categories?.filter((c: any) => !c.parent_id && !c.ancestry) || [];
  const subCategories = mainCategory
    ? categories?.filter((c: any) =>
        (c.parent_id && c.parent_id === parseInt(mainCategory)) ||
        (c.ancestry && (c.ancestry === mainCategory || c.ancestry.endsWith(`/${mainCategory}`)))
      ) || []
    : [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[var(--radius-md)] shadow-elevated max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center px-5 py-3 border-b border-border-light">
          <h2 className="text-base font-semibold text-text-primary">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-hover transition">
            <XMarkIcon className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              placeholder="Product name"
              required
            />
          </div>

          {/* Bulk / Wholesale */}
          <div className="border border-purple-200 rounded-[var(--radius-sm)] p-4 bg-purple-50/30 space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-purple-800">Bulk / Wholesale</h4>
              <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">Optional</span>
            </div>
            <p className="text-xs text-purple-700">
              Enable if you sell in large quantities. Set a minimum order quantity, and the maximum total units that can be sold per day.
              {hasAnyVariants ? ' Stock per variant is set below.' : ' Set stock here (leave blank for unlimited).'}
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.bulk_enabled}
                onChange={e => setForm({ ...form, bulk_enabled: e.target.checked })}
                className="rounded border-purple-400 text-purple-600 focus:ring-purple-500"
              />
              Enable bulk / wholesale for this product
            </label>
            {form.bulk_enabled && (
              <div className="space-y-3 ml-6">
                <div>
                  <label className="block text-xs font-medium text-purple-800 mb-1">Minimum Order Quantity (MOQ)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.minimum_bulk_quantity}
                    onChange={e => setForm({ ...form, minimum_bulk_quantity: e.target.value })}
                    placeholder="e.g. 24"
                    className="w-32 h-10 px-3 text-sm border border-purple-300 rounded-[var(--radius-sm)] bg-white text-purple-900 placeholder:text-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                {!hasAnyVariants && (
                  <div>
                    <label className="block text-xs font-medium text-purple-800 mb-1">Available Stock (leave blank for unlimited)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={e => setForm({ ...form, stock: e.target.value })}
                      placeholder="Unlimited"
                      className="w-48 h-10 px-3 text-sm border border-purple-300 rounded-[var(--radius-sm)] bg-white text-purple-900 placeholder:text-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-purple-800 mb-1">Maximum Quantity Per Day</label>
                  <p className="text-xs text-purple-500 mb-1">Limit the total number of units that can be sold each day. Leave blank for no daily limit.</p>
                  <input
                    type="number"
                    min="1"
                    value={form.max_quantity_per_day}
                    onChange={e => setForm({ ...form, max_quantity_per_day: e.target.value })}
                    placeholder="Unlimited"
                    className="w-48 h-10 px-3 text-sm border border-purple-300 rounded-[var(--radius-sm)] bg-white text-purple-900 placeholder:text-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Dimensions & Weight (required for delivery) */}
          <div className="border border-border-light rounded-[var(--radius-sm)] p-4 bg-surface-hover space-y-3">
            <h4 className="text-sm font-semibold text-text-primary">Dimensions & Weight *</h4>
            <p className="text-xs text-text-muted">Required for delivery calculation.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Weight (kg) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.weight_kg}
                  onChange={e => setForm({ ...form, weight_kg: e.target.value })}
                  placeholder="0.00"
                  required
                  className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Length (cm) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.length_cm}
                  onChange={e => setForm({ ...form, length_cm: e.target.value })}
                  placeholder="0.0"
                  required
                  className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Width (cm) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.width_cm}
                  onChange={e => setForm({ ...form, width_cm: e.target.value })}
                  placeholder="0.0"
                  required
                  className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Height (cm) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.height_cm}
                  onChange={e => setForm({ ...form, height_cm: e.target.value })}
                  placeholder="0.0"
                  required
                  className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Main Category *</label>
            <select
              value={mainCategory}
              onChange={e => { setMainCategory(e.target.value); setSubCategory(''); }}
              className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              required
            >
              <option value="">Select Main Category</option>
              {mainCategories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          {mainCategory && subCategories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Subcategory</label>
              <select
                value={subCategory}
                onChange={e => setSubCategory(e.target.value)}
                className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              >
                <option value="">None (use main category only)</option>
                {subCategories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-text-primary">Description</label>
              <button type="button" onClick={generateAIDescription} disabled={aiLoading} className="flex items-center gap-1 text-xs text-brand hover:text-brand-hover disabled:opacity-50 font-medium">
                <SparklesIcon className="w-3.5 h-3.5" />
                {aiLoading ? 'Thinking...' : 'AI Suggest'}
              </button>
            </div>
            <textarea
              rows={4}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand resize-none"
              placeholder="Describe your product"
              required
            />
          </div>

          {/* Attributes */}
          {requiredBaseAttrs.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Attributes</label>
              <div className="space-y-3">
                {requiredBaseAttrs.map(attr => (
                  <div key={attr.id}>
                    <label className="block text-xs text-text-muted mb-1">{attr.display_name} {attr.is_required && '*'}</label>
                    {attr.attr_type === 'list' || attr.attr_type === 'dropdown' ? (
                      <select value={form.product_attributes[attr.name] || ''} onChange={e => handleAttrChange(attr.name, e.target.value)} className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand">
                        <option value="">Select {attr.display_name}</option>
                        {(attr.values || []).map((val: string) => (<option key={val} value={val}>{val}</option>))}
                      </select>
                    ) : (
                      <input type="text" value={form.product_attributes[attr.name] || ''} onChange={e => handleAttrChange(attr.name, e.target.value)} placeholder={`Enter ${attr.display_name}`} className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand" />
                    )}
                  </div>
                ))}
                {extraAttrs.map(attrName => {
                  const attr = optionalBaseAttrs.find(a => a.name === attrName);
                  if (!attr) return null;
                  return (
                    <div key={attr.id} className="relative">
                      <label className="block text-xs text-text-muted mb-1">{attr.display_name}</label>
                      <div className="flex gap-2">
                        {attr.attr_type === 'list' || attr.attr_type === 'dropdown' ? (
                          <select value={form.product_attributes[attr.name] || ''} onChange={e => handleAttrChange(attr.name, e.target.value)} className="flex-1 h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand">
                            <option value="">Select {attr.display_name}</option>
                            {(attr.values || []).map((val: string) => (<option key={val} value={val}>{val}</option>))}
                          </select>
                        ) : (
                          <input type="text" value={form.product_attributes[attr.name] || ''} onChange={e => handleAttrChange(attr.name, e.target.value)} placeholder={`Enter ${attr.display_name}`} className="flex-1 h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand" />
                        )}
                        <button type="button" onClick={() => removeOptionalAttr(attr.name)} className="p-2 text-text-muted hover:text-red-500 transition">
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {optionalBaseAttrs.length > 0 && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      const remaining = optionalBaseAttrs.filter(a => !extraAttrs.includes(a.name));
                      if (remaining.length > 0) addOptionalAttr(remaining[0].name);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-brand font-medium hover:text-brand-hover"
                    disabled={extraAttrs.length >= optionalBaseAttrs.length}
                  >
                    <PlusIcon className="w-3.5 h-3.5" /> Add another attribute
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Variants */}
          {hasVariants && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Variants (include stock per variant)</label>
              <VariantsBuilder
                attributes={variantAttrs}
                variants={form.variants}
                setVariants={(newVariants) => setForm({ ...form, variants: newVariants })}
                hideStock={false}
              />
            </div>
          )}

          {/* Price (no variants) */}
          {!hasAnyVariants && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Price (ETB) *</label>
              <input
                type="number"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                placeholder="e.g. 12,000"
                required
              />
            </div>
          )}

          {/* Stock (non‑variant only) */}
          {!hasAnyVariants && !form.bulk_enabled && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Stock *</label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={e => setForm({ ...form, stock: e.target.value })}
                className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                placeholder="e.g. 50"
                required
              />
            </div>
          )}

          {/* Discount */}
          <div className="border border-border-light rounded-[var(--radius-sm)] p-4 bg-surface-hover space-y-3">
            <h4 className="text-sm font-semibold text-text-primary">Offer Discount (optional)</h4>
            <div className="flex gap-2">
              <select
                value={form.discount_type}
                onChange={e => setForm({ ...form, discount_type: e.target.value })}
                className="h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat Amount (ETB)</option>
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.discount_value}
                onChange={e => handleDiscountValueChange(e.target.value)}
                onBlur={handleDiscountValueBlur}
                placeholder="Value"
                className="flex-1 h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            {sellerDiscount && (
              <p className="text-blue-600 text-xs font-medium">Applied discount: {sellerDiscount}</p>
            )}
            {form.discount_value && parseFloat(form.discount_value) <= 0 && (
              <p className="text-red-500 text-xs">Discount must be a positive number.</p>
            )}
          </div>

          {/* Delivery Subsidy */}
          <div className="border border-border-light rounded-[var(--radius-sm)] p-4 bg-surface-hover space-y-3">
            <h4 className="text-sm font-semibold text-text-primary">Delivery Subsidy</h4>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.seller_pays_shipping}
                onChange={e => {
                  const checked = e.target.checked;
                  setForm({
                    ...form,
                    seller_pays_shipping: checked,
                    shipping_subsidy_type: checked ? form.shipping_subsidy_type : 'full',
                    shipping_subsidy_value: checked ? form.shipping_subsidy_value : '',
                  });
                }}
                className="rounded border-border-light text-brand focus:ring-brand"
              />
              I will pay delivery for this product
            </label>
            {form.seller_pays_shipping && (
              <div className="ml-6 space-y-2">
                <select
                  value={form.shipping_subsidy_type}
                  onChange={e => setForm({ ...form, shipping_subsidy_type: e.target.value })}
                  className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                >
                  <option value="full">Full delivery</option>
                  <option value="percent">Percentage of delivery</option>
                </select>
                {form.shipping_subsidy_type === 'percent' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={form.shipping_subsidy_value}
                      onChange={e => handleShippingValueChange(e.target.value)}
                      onBlur={handleShippingValueBlur}
                      placeholder="e.g. 50"
                      className="w-28 h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                    />
                    <span className="text-xs text-text-muted">%</span>
                  </div>
                )}
                {(form.shipping_subsidy_type === 'percent' && (!form.shipping_subsidy_value || parseFloat(form.shipping_subsidy_value) <= 0)) && (
                  <p className="text-red-500 text-xs">Subsidy percentage is required.</p>
                )}
              </div>
            )}
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Product Images (at least 1)
            </label>
            <div className="flex items-center gap-2 mb-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-brand-light hover:bg-brand/10 text-brand rounded-[var(--radius-sm)] border border-brand/20 text-sm font-medium transition">
                <PhotoIcon className="w-4 h-4" />
                Choose Images
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </label>
              <span className="text-xs text-text-muted">{form.images.length}/6 images</span>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {form.images.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img src={img.preview} alt="" className="w-full h-20 object-cover rounded-[var(--radius-sm)] border border-border-light" />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-white text-text-muted hover:bg-surface-hover p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-card">
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Videos */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Product Video (max 1, 50MB)
            </label>
            {form.existingVideos.map((url, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs bg-surface-hover px-2 py-1 rounded mb-2">
                <span>Video {idx + 1}</span>
                <button type="button" onClick={() => removeExistingVideo(idx)} className="text-red-500 hover:text-red-700">
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {form.videos.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs bg-surface-hover px-2 py-1 rounded mb-2">
                <span className="truncate">{file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)</span>
                <button type="button" onClick={removeVideo} className="text-red-500 hover:text-red-700">
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {form.existingVideos.length === 0 && form.videos.length === 0 && (
              <div className="flex items-center gap-2 mb-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-brand-light hover:bg-brand/10 text-brand rounded-[var(--radius-sm)] border border-brand/20 text-sm font-medium transition">
                  <VideoCameraIcon className="w-4 h-4" />
                  Choose Video
                  <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleVideoUpload} className="hidden" />
                </label>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary text-sm px-5 py-2">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-cta text-sm px-5 py-2">
              {submitting ? 'Saving...' : (product ? 'Update Product' : 'Add Product')}
            </button>
          </div>
        </form>
      </motion.div>
      {toast && <Toast message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ProductFormModal;